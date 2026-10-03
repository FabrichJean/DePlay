// Worker de build local.
// Lit les déploiements en attente dans la base, prépare le code, lance install/build,
// puis publie le résultat sur localhost. Lancer avec : npm run worker
//
// Isolation : avec BUILD_ISOLATION=docker (défaut), clone/install/build tournent dans un conteneur jetable.
// Avec BUILD_ISOLATION=none, les commandes s'exécutent directement sur cette machine : code de confiance uniquement.
import { PrismaClient } from '@prisma/client'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { chown, cp, mkdir, mkdtemp, readdir, realpath, rename, rm, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createServer as createNetServer, connect } from 'node:net'
import { extname, join, resolve, sep } from 'node:path'

const STORAGE_DIR = process.env.NUXT_PROJECTS_STORAGE_DIR
if (!STORAGE_DIR) {
  console.error('NUXT_PROJECTS_STORAGE_DIR is required (set it in .env)')
  process.exit(1)
}

const BUILDS_DIR = resolve(process.env.DEPLOY_WORK_DIR ?? './storage/builds')
// Optionnel : ne traiter qu'un seul déploiement (utile pour les tests)
const ONLY_DEPLOYMENT = process.env.WORKER_ONLY_DEPLOYMENT_ID
const COMMAND_TIMEOUT_MS = 10 * 60 * 1000
const POLL_MS = 3000

const ISOLATION = process.env.BUILD_ISOLATION ?? 'docker'
if (!['docker', 'none'].includes(ISOLATION)) {
  console.error('BUILD_ISOLATION must be "docker" or "none"')
  process.exit(1)
}
const BUILD_IMAGE = process.env.BUILD_IMAGE ?? 'node:22-slim'
const CLONE_IMAGE = process.env.CLONE_IMAGE ?? 'alpine/git'
const BUILD_MEMORY = process.env.BUILD_MEMORY ?? '2g'
const BUILD_CPUS = process.env.BUILD_CPUS ?? '2'
const BUILD_PIDS = process.env.BUILD_PIDS ?? '512'
// Utilisateur du conteneur : jamais root, même si le worker l'est
const SANDBOX_UID = process.getuid && process.getuid() !== 0 ? process.getuid() : 10001
const SANDBOX_GID = process.getgid && process.getgid() !== 0 ? process.getgid() : 10001

const prisma = new PrismaClient()
// deploymentId -> fonction d'arrêt du serveur publié
const running = new Map()

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
}

const clock = () => new Date().toLocaleTimeString('en-GB', { hour12: false })
const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

function formatDuration(ms) {
  const totalSeconds = Math.round(ms / 1000)
  return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`
}

function deployedLabel() {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${date} • ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`
}

// Accumule les lignes de log et les écrit par lot, pour ne pas solliciter la base à chaque ligne
class BuildLog {
  constructor(deploymentId) {
    this.id = deploymentId
    this.queue = []
    this.timer = setInterval(() => this.flush().catch(() => {}), 1000)
  }

  line(message, tone = 'default') {
    this.queue.push({ time: clock(), message: message.slice(0, 300), tone })
  }

  async flush() {
    if (!this.queue.length) return
    const batch = this.queue.splice(0)
    const row = await prisma.deployment.findUnique({ where: { id: this.id }, select: { logs: true } })
    await prisma.deployment.update({
      where: { id: this.id },
      data: { logs: JSON.stringify([...JSON.parse(row.logs), ...batch]) },
    })
  }

  async close() {
    clearInterval(this.timer)
    await this.flush()
  }
}

async function updateSteps(deploymentId, mutate) {
  const row = await prisma.deployment.findUnique({ where: { id: deploymentId }, select: { steps: true } })
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: { steps: JSON.stringify(mutate(JSON.parse(row.steps))) },
  })
}

const setStep = (steps, key, status, duration) =>
  steps.map((step) => (step.key === key ? { ...step, status, duration: duration ?? step.duration } : step))

// Environnement minimal pour le code du projet : aucun secret du worker (DATABASE_URL, clés Clerk, CMS…)
function buildEnv() {
  return {
    PATH: process.env.PATH ?? '/usr/bin:/bin',
    HOME: process.env.HOME ?? '',
    LANG: process.env.LANG ?? 'en_US.UTF-8',
    CI: '1',
    GIT_TERMINAL_PROMPT: '0',
  }
}

// Supprime les liens symboliques d'un dossier source : un dépôt ou un upload ne doit pas pointer ailleurs
async function removeSymlinks(dir, log) {
  let removed = 0
  const walk = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isSymbolicLink()) {
        await rm(path, { force: true })
        removed++
      } else if (entry.isDirectory()) {
        await walk(path)
      }
    }
  }
  await walk(dir)
  if (removed) log.line(`Removed ${removed} symbolic link${removed > 1 ? 's' : ''} for security`, 'muted')
}

// Donne le dossier au utilisateur du conteneur (utile quand le worker tourne en root)
async function chownTree(dir) {
  if (process.getuid?.() !== 0) return
  await chown(dir, SANDBOX_UID, SANDBOX_GID)
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await chownTree(path)
    else await chown(path, SANDBOX_UID, SANDBOX_GID).catch(() => {})
  }
}

// Commande docker : seul workDir est monté, sans secret, avec des limites de ressources
function dockerArgs({ image, name, workDir, cwd, command, args }) {
  const inside = cwd === workDir ? '/work' : `/work/${cwd.slice(workDir.length + 1)}`
  return [
    'run', '--rm', '--name', name,
    '--user', `${SANDBOX_UID}:${SANDBOX_GID}`,
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges',
    '--read-only', '--tmpfs', '/tmp:rw,exec,nosuid,size=1g',
    '--memory', BUILD_MEMORY, '--memory-swap', BUILD_MEMORY,
    '--cpus', BUILD_CPUS, '--pids-limit', BUILD_PIDS,
    '-v', `${workDir}:/work`, '-w', inside,
    '-e', 'HOME=/tmp', '-e', 'CI=1', '-e', 'GIT_TERMINAL_PROMPT=0', '-e', 'LANG=C.UTF-8',
    '--entrypoint', command, image, ...args,
  ]
}

// Lance une commande et renvoie une erreur si elle échoue ou dépasse le délai.
// `sandbox` ({ image, workDir }) l'exécute dans un conteneur quand l'isolation est active.
function run(command, args, { cwd, log, sandbox }) {
  return new Promise((done, fail) => {
    const isolated = sandbox && ISOLATION === 'docker'
    const name = `deplay-build-${randomBytes(6).toString('hex')}`
    // GIT_TERMINAL_PROMPT=0 : git échoue au lieu d'attendre un identifiant sur un dépôt inconnu
    const child = isolated
      ? spawn('docker', dockerArgs({ image: sandbox.image, name, workDir: sandbox.workDir, cwd, command, args }), { env: buildEnv() })
      : spawn(command, args, { cwd, env: buildEnv() })

    const timer = setTimeout(() => {
      if (isolated) spawn('docker', ['kill', name], { stdio: 'ignore' })
      child.kill('SIGKILL')
      fail(new Error(`timed out after ${COMMAND_TIMEOUT_MS / 60000} minutes`))
    }, COMMAND_TIMEOUT_MS)

    const forward = (tone) => (chunk) =>
      chunk
        .toString()
        .split('\n')
        .filter(Boolean)
        .forEach((line) => log.line(line, tone))

    child.stdout.on('data', forward('default'))
    child.stderr.on('data', forward('muted'))
    child.on('error', (error) => {
      clearTimeout(timer)
      fail(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) done()
      else fail(new Error(`"${[command, ...args].join(' ')}" exited with code ${code}`))
    })
  })
}

// Vrai si le port est libre : on tente de le réserver le temps de la vérification
function portIsFree(port) {
  return new Promise((done) => {
    const probe = createNetServer()
    probe.once('error', () => done(false))
    probe.listen(port, '127.0.0.1', () => probe.close(() => done(true)))
  })
}

function freePort() {
  return new Promise((done, fail) => {
    const probe = createNetServer()
    probe.on('error', fail)
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => done(port))
    })
  })
}

// Attend que le port réponde, pour ne renvoyer l'URL qu'une fois le site accessible
function waitForPort(port, timeoutMs = 15000) {
  const started = Date.now()
  return new Promise((done, fail) => {
    const attempt = () => {
      const socket = connect(port, '127.0.0.1')
      socket.once('connect', () => {
        socket.end()
        done()
      })
      socket.once('error', () => {
        socket.destroy()
        if (Date.now() - started > timeoutMs) fail(new Error(`port ${port} did not open in time`))
        else setTimeout(attempt, 250)
      })
    }
    attempt()
  })
}

// Sert un dossier statique ; les routes sans extension retombent sur index.html (SPA)
async function serveFile(root, req, res) {
  const pathname = decodeURIComponent((req.url ?? '/').split('?')[0])
  let file = resolve(root, `.${pathname}`)

  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403).end()
    return
  }

  // Un lien symbolique ne doit jamais faire sortir le site de son dossier publié
  const rootReal = await realpath(root).catch(() => root)
  const fileReal = await realpath(file).catch(() => null)
  if (fileReal && fileReal !== rootReal && !fileReal.startsWith(rootReal + sep)) {
    res.writeHead(404).end('Not found')
    return
  }

  let info = await stat(file).catch(() => null)
  if (info?.isDirectory()) {
    file = join(file, 'index.html')
    info = await stat(file).catch(() => null)
  }
  if (!info && !extname(pathname)) {
    file = join(root, 'index.html')
    info = await stat(file).catch(() => null)
  }
  if (!info) {
    res.writeHead(404).end('Not found')
    return
  }

  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}

// Publie le dossier de sortie : serveur Nitro (Nuxt) s'il existe, sinon fichiers statiques
async function publish(deploymentId, outDir, log, preferredPort) {
  // Garde le même port si possible, pour que l'URL d'un site survive à un redémarrage
  const port = preferredPort && (await portIsFree(preferredPort)) ? preferredPort : await freePort()
  const nitroEntry = join(outDir, 'server', 'index.mjs')
  const isServer = await stat(nitroEntry).then(
    () => true,
    () => false,
  )

  let stop
  if (isServer) {
    log.line(`Starting server on port ${port}`)
    const child = spawn(process.execPath, [nitroEntry], {
      cwd: outDir,
      env: { ...buildEnv(), PORT: String(port), HOST: '127.0.0.1' },
      stdio: 'ignore',
    })
    stop = async () => child.kill()
  } else {
    log.line(`Serving static files from ${outDir} on port ${port}`)
    const server = createServer((req, res) => serveFile(outDir, req, res).catch(() => res.writeHead(500).end()))
    await new Promise((done) => server.listen(port, '127.0.0.1', done))
    stop = () => new Promise((done) => server.close(done))
  }

  running.set(deploymentId, { stop, dir: outDir })
  await waitForPort(port)
  return `http://localhost:${port}`
}

// Un dossier uploadé arrive avec son nom en racine (« mada/index.html ») : on remonte son contenu,
// pour que index.html, package.json et les commandes se trouvent à la racine du projet
async function flattenSingleFolder(dir) {
  for (;;) {
    const entries = await readdir(dir, { withFileTypes: true })
    if (entries.length !== 1 || !entries[0].isDirectory()) return

    const inner = join(dir, entries[0].name)
    const staging = `${inner}.staging`
    await rename(inner, staging)
    for (const entry of await readdir(staging)) {
      await rename(join(staging, entry), join(dir, entry))
    }
    await rm(staging, { recursive: true, force: true })
  }
}

// Redéploiement : arrête l'ancien site du projet et renvoie son port, pour que le nouveau le reprenne
async function releasePreviousPort(projectId, currentId, log) {
  if (!projectId) return undefined

  const previous = await prisma.deployment.findFirst({
    where: { projectId, id: { not: currentId }, url: { not: '' } },
    orderBy: { createdAt: 'desc' },
  })
  if (!previous) return undefined

  let port
  try {
    port = Number(new URL(previous.url).port)
  } catch {
    return undefined
  }

  const server = running.get(previous.id)
  if (server) {
    await server.stop()
    running.delete(previous.id)
    log.line(`Stopped previous site to keep port ${port}`)
  }

  // Laisse au système le temps de libérer le port
  for (let attempt = 0; attempt < 20 && !(await portIsFree(port)); attempt++) await sleep(250)
  return port
}

// Dossier de build complet (créé par mkdtemp) qui contient un dossier publié, ex. « builds/app-x1y2/dist »
function buildRootOf(dir) {
  const root = resolve(dir)
  if (!root.startsWith(BUILDS_DIR + sep)) return ''
  return join(BUILDS_DIR, root.slice(BUILDS_DIR.length + 1).split(sep)[0])
}

// Après un redéploiement réussi : supprime les anciens builds du projet, qui ne sont plus servis
async function removePreviousBuilds(projectId, currentId, currentRoot, log) {
  if (!projectId) return

  const previous = await prisma.deployment.findMany({
    where: { projectId, id: { not: currentId } },
    select: { id: true, buildDir: true, logs: true },
  })

  for (const row of previous) {
    const root = buildRootOf(row.buildDir || buildDirFromLogs(row.logs))
    if (!root || root === currentRoot) continue

    await rm(root, { recursive: true, force: true })
    await prisma.deployment.update({ where: { id: row.id }, data: { buildDir: '' } })
    log.line(`Removed previous build ${root}`)
  }
}

// Construit un déploiement et le publie, ou le marque comme échoué
async function build(deployment) {
  const started = Date.now()
  const log = new BuildLog(deployment.id)

  try {
    const project = deployment.projectId
      ? await prisma.project.findUnique({ where: { id: deployment.projectId } })
      : null
    if (!project) throw new Error('deployment is not linked to a project')

    await mkdir(BUILDS_DIR, { recursive: true })
    const workDir = await mkdtemp(join(BUILDS_DIR, `${project.name}-`))
    log.line(`Working directory: ${workDir}`)

    // 1. Préparer le code
    if (project.source === 'upload') {
      log.line('Copying uploaded files')
      await cp(join(STORAGE_DIR, project.name), workDir, { recursive: true })
      await flattenSingleFolder(workDir)
    } else {
      if (!/^[\w.-]+\/[\w.-]+$/.test(project.repository)) throw new Error(`invalid repository "${project.repository}"`)
      log.line(`Cloning ${project.repository} (${project.branch})`)
      await chownTree(workDir)
      await run('git', ['clone', '--depth', '1', '--branch', project.branch, `https://github.com/${project.repository}.git`, '.'], {
        cwd: workDir,
        log,
        sandbox: { image: CLONE_IMAGE, workDir },
      })
    }

    await removeSymlinks(workDir, log)

    // 2. Installer et construire, dans le dossier racine du projet
    const appDir = resolve(workDir, project.rootDirectory || '.')
    if (appDir !== workDir && !appDir.startsWith(workDir + sep)) throw new Error('root directory is outside the project')

    const sandbox = { image: BUILD_IMAGE, workDir }
    if (ISOLATION === 'docker') {
      await chownTree(workDir)
      log.line(`Isolation: Docker (${BUILD_IMAGE}, ${BUILD_MEMORY} RAM, ${BUILD_CPUS} CPU)`, 'muted')
    } else {
      log.line('Isolation: none (commands run on the host)', 'muted')
    }
    if (project.installCommand) {
      log.line(`$ ${project.installCommand}`)
      await run('sh', ['-c', project.installCommand], { cwd: appDir, log, sandbox })
    }
    if (project.buildCommand) {
      log.line(`$ ${project.buildCommand}`)
      await run('sh', ['-c', project.buildCommand], { cwd: appDir, log, sandbox })
    }
    await updateSteps(deployment.id, (steps) => setStep(setStep(steps, 'build', 'done', formatDuration(Date.now() - started)), 'test', 'done', '—'))

    // 3. Publier
    await updateSteps(deployment.id, (steps) => setStep(steps, 'deploy', 'running'))
    const outDir = resolve(appDir, project.outputDirectory || '.')
    if (outDir !== workDir && !outDir.startsWith(workDir + sep)) throw new Error('output directory is outside the project')
    if (!(await stat(outDir).catch(() => null))?.isDirectory()) {
      throw new Error(`output directory "${project.outputDirectory}" not found`)
    }

    const previousPort = await releasePreviousPort(deployment.projectId, deployment.id, log)
    const url = await publish(deployment.id, outDir, log, previousPort)
    log.line(`Live at ${url}`, 'success')
    await removePreviousBuilds(deployment.projectId, deployment.id, workDir, log)

    // 4. Terminé
    const duration = formatDuration(Date.now() - started)
    await updateSteps(deployment.id, (steps) => setStep(setStep(steps, 'deploy', 'done', duration), 'live', 'done', duration))
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: 'deployed', url, buildDir: outDir, duration, deployedAt: deployedLabel() },
    })
    await prisma.project.update({ where: { id: project.id }, data: { status: 'live', url } })
  } catch (error) {
    log.line(`Build failed: ${error.message}`, 'default')
    await updateSteps(deployment.id, (steps) =>
      steps.map((step) => (step.status === 'running' ? { ...step, status: 'failed' } : step)),
    )
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: 'failed', duration: formatDuration(Date.now() - started), deployedAt: deployedLabel() },
    })
    if (deployment.projectId) {
      await prisma.project.update({ where: { id: deployment.projectId }, data: { status: 'attention' } })
    }
  } finally {
    await log.close()
  }
}

// Les déploiements créés avant buildDir n'ont que leur journal : on retrouve le dossier dans les logs
function buildDirFromLogs(logsJson) {
  const prefix = 'Serving static files from '
  const entry = JSON.parse(logsJson || '[]').find((item) => item.message.startsWith(prefix))
  return entry?.message.slice(prefix.length).replace(/ on port \d+$/, '') || ''
}

// Au démarrage : republie les sites déjà déployés depuis leur dossier de build, sans reconstruire
async function restoreDeployments() {
  const rows = await prisma.deployment.findMany({ where: { status: 'deployed' }, orderBy: { createdAt: 'desc' } })
  const restoredProjects = new Set()

  for (const row of rows) {
    // Un redéploiement remplace le précédent : on ne republie que le plus récent de chaque projet
    if (row.projectId) {
      if (restoredProjects.has(row.projectId)) continue
      restoredProjects.add(row.projectId)
    }

    const dir = row.buildDir || buildDirFromLogs(row.logs)
    const log = new BuildLog(row.id)

    try {
      const isDirectory = dir ? (await stat(dir).catch(() => null))?.isDirectory() : false
      if (!isDirectory) throw new Error('build output is gone')

      const previousPort = row.url ? Number(new URL(row.url).port) : undefined
      const url = await publish(row.id, dir, log, previousPort)
      log.line(`Restored after worker restart at ${url}`, 'success')

      await prisma.deployment.update({ where: { id: row.id }, data: { url, buildDir: dir } })
      if (row.projectId) await prisma.project.update({ where: { id: row.projectId }, data: { url, status: 'live' } })
      console.log(`Restored ${row.name} at ${url}`)
    } catch (error) {
      log.line(`Could not restore the site: ${error.message}. Redeploy to publish it again.`, 'default')
      await prisma.deployment.update({ where: { id: row.id }, data: { status: 'failed' } })
      if (row.projectId) await prisma.project.update({ where: { id: row.projectId }, data: { status: 'attention' } })
      console.warn(`Could not restore ${row.name}: ${error.message}`)
    } finally {
      await log.close()
    }
  }
}

// Arrête les sites dont le déploiement a été supprimé (ex. projet supprimé depuis l'API)
async function reconcileRunning() {
  for (const [deploymentId, { stop, dir }] of [...running.entries()]) {
    const exists = await prisma.deployment.findUnique({ where: { id: deploymentId }, select: { id: true } })
    if (exists) continue

    await stop()
    running.delete(deploymentId)
    await rm(dir, { recursive: true, force: true })
    console.log(`[${clock()}] Stopped site for deleted deployment ${deploymentId}`)
  }
}

async function main() {
  await mkdir(BUILDS_DIR, { recursive: true })
  console.log(`Build worker started. Storage: ${STORAGE_DIR} · Builds: ${BUILDS_DIR}`)
  await restoreDeployments()

  for (;;) {
    await reconcileRunning()

    const next = await prisma.deployment.findFirst({
      where: { status: 'building', ...(ONLY_DEPLOYMENT ? { id: ONLY_DEPLOYMENT } : {}) },
      orderBy: { createdAt: 'asc' },
    })

    if (!next) {
      await sleep(POLL_MS)
      continue
    }

    console.log(`[${clock()}] Building ${next.name} (${next.id})`)
    await build(next)
    console.log(`[${clock()}] Finished ${next.name}`)
  }
}

async function shutdown() {
  for (const { stop } of running.values()) await stop()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

main().catch(async (error) => {
  console.error(error)
  await shutdown()
})
