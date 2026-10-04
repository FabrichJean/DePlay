// Worker de build.
// Lit les déploiements en attente dans la base, prépare le code, lance install/build dans un conteneur jetable,
// puis copie le dossier statique publié dans DEPLOY_SITES_DIR (servi par le bloc nginx *.fabrich.site).
// Plusieurs builds tournent en parallèle, dans les limites de config/limits.json.
// Lancer avec : npm run worker
//
// Isolation : avec BUILD_ISOLATION=docker (défaut), clone/install/build tournent dans un conteneur jetable.
// Avec BUILD_ISOLATION=none, les commandes s'exécutent directement sur cette machine : code de confiance uniquement.
import { PrismaClient } from '@prisma/client'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { chown, cp, mkdir, mkdtemp, readdir, realpath, rename, rm, stat } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'

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

// Limites partagées avec l'application (config/limits.json)
const LIMITS = JSON.parse(readFileSync(new URL('../config/limits.json', import.meta.url), 'utf8'))
const MAX_CONCURRENT_BUILDS = Number(process.env.MAX_CONCURRENT_BUILDS ?? LIMITS.maxConcurrentBuilds)
const MAX_BUILDS_PER_USER = Number(process.env.MAX_BUILDS_PER_USER ?? LIMITS.maxBuildsPerUser)
const STORAGE_QUOTA_BYTES = LIMITS.storageQuotaBytes

// Isolation des commandes du projet (clone, install, build)
const ISOLATION = process.env.BUILD_ISOLATION ?? 'docker'
const BUILD_IMAGE = process.env.BUILD_IMAGE ?? 'docker.io/library/node:22-slim'
const CLONE_IMAGE = process.env.CLONE_IMAGE ?? 'docker.io/alpine/git'
// Ressources par build : 1 CPU et 1 Go, pour qu'on puisse en lancer plusieurs
const BUILD_MEMORY = process.env.BUILD_MEMORY ?? '1g'
const BUILD_CPUS = process.env.BUILD_CPUS ?? '1'
// L'installation des dépendances est gourmande en CPU : elle a plus de cœurs que le build
const INSTALL_CPUS = process.env.INSTALL_CPUS ?? '2'
// Cache npm par compte (jamais partagé entre comptes)
const BUILD_CACHE_DIR = resolve(process.env.BUILD_CACHE_DIR ?? './storage/cache')
const BUILD_PIDS = process.env.BUILD_PIDS ?? '512'

// Sites statiques : dossier servi par nginx (un seul bloc *.fabrich.site, voir deploy/nginx/deplay-sites.conf)
const SITE_DOMAIN = process.env.SITE_DOMAIN ?? 'fabrich.site'
const SITES_DIR = resolve(process.env.DEPLOY_SITES_DIR ?? '/www/wwwroot/deplay-sites')

// Captures d'écran des sites (une image par projet), lues par l'application
const THUMBNAILS_DIR = resolve(process.env.THUMBNAILS_DIR ?? './storage/thumbnails')
const THUMBNAIL_IMAGE = process.env.THUMBNAIL_IMAGE ?? 'mcr.microsoft.com/playwright:v1.49.0-jammy'

const SANDBOX_UID = process.getuid && process.getuid() !== 0 ? process.getuid() : 10001
const SANDBOX_GID = process.getgid && process.getgid() !== 0 ? process.getgid() : 10001

const prisma = new PrismaClient()

// Sites publiés : arrêt (rien pour un site statique) et nettoyage du dossier servi
const running = new Map()

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

// Authentification git pour un dépôt privé : l'en-tête est passé par l'environnement, jamais dans la ligne de commande
function gitAuthEnv(token) {
  const basic = Buffer.from(`x-access-token:${token}`).toString('base64')
  return {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}`,
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
function dockerArgs({ image, name, workDir, cwd, command, args, passEnv = [], cpus = BUILD_CPUS, memory = BUILD_MEMORY, cacheDir }) {
  const inside = cwd === workDir ? '/work' : `/work/${cwd.slice(workDir.length + 1)}`
  return [
    'run', '--rm', '--name', name,
    '--user', `${SANDBOX_UID}:${SANDBOX_GID}`,
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges',
    '--read-only', '--tmpfs', '/tmp:rw,exec,nosuid,size=1g',
    '--memory', memory, '--memory-swap', memory,
    '--cpus', cpus, '--pids-limit', BUILD_PIDS,
    '-v', `${workDir}:/work`, '-w', inside,
    ...(cacheDir ? ['-v', `${cacheDir}:/npm-cache`, '-e', 'npm_config_cache=/npm-cache'] : []),
    '-e', 'HOME=/tmp', '-e', 'CI=1', '-e', 'GIT_TERMINAL_PROMPT=0', '-e', 'LANG=C.UTF-8',
    ...passEnv.flatMap((key) => ['-e', key]),
    '--entrypoint', command, image, ...args,
  ]
}

// Lance une commande et renvoie une erreur si elle échoue ou dépasse le délai.
// `sandbox` ({ image, workDir }) l'exécute dans un conteneur quand l'isolation est active.
function run(command, args, { cwd, log, sandbox, env = {} }) {
  return new Promise((done, fail) => {
    const isolated = sandbox && ISOLATION === 'docker'
    const name = `deplay-build-${randomBytes(6).toString('hex')}`
    // GIT_TERMINAL_PROMPT=0 : git échoue au lieu d'attendre un identifiant sur un dépôt inconnu
    const child = isolated
      ? spawn('docker', dockerArgs({ image: sandbox.image, name, workDir: sandbox.workDir, cwd, command, args, passEnv: Object.keys(env), cpus: sandbox.cpus, memory: sandbox.memory, cacheDir: sandbox.cacheDir }), { env: { ...buildEnv(), ...env } })
      : spawn(command, args, { cwd, env: { ...buildEnv(), ...env } })

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

// Publie un site statique : copie du dossier de sortie dans SITES_DIR/<nom>, servi par nginx
async function publishStatic(deploymentId, outDir, log, name) {
  const target = join(SITES_DIR, name)
  await rm(target, { recursive: true, force: true })
  await cp(outDir, target, { recursive: true })
  await run('chmod', ['-R', 'u+rwX,go+rX', target], { cwd: SITES_DIR, log })
  log.line(`Published static site at https://${name}.${SITE_DOMAIN}`, 'success')

  running.set(deploymentId, {
    stop: async () => {},
    dir: outDir,
    cleanup: async () => rm(target, { recursive: true, force: true }),
  })
  return `https://${name}.${SITE_DOMAIN}`
}

// Capture d'écran du site publié. Un échec n'annule pas le déploiement : le site reste en ligne sans image.
async function captureThumbnail(projectId, url, log) {
  await mkdir(THUMBNAILS_DIR, { recursive: true })
  const script = new URL('./capture-thumbnail.mjs', import.meta.url).pathname
  const name = `deplay-thumb-${randomBytes(6).toString('hex')}`
  const args =
    ISOLATION === 'docker'
      ? [
          'run', '--rm', '--name', name,
          '--user', `${SANDBOX_UID}:${SANDBOX_GID}`,
          '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
          '--memory', '1g', '--cpus', '1', '--pids-limit', '256', '--shm-size', '512m',
          '--tmpfs', '/tmp:rw,exec,nosuid,size=512m',
          '-e', 'HOME=/tmp',
          '-v', `${THUMBNAILS_DIR}:/out`, '-v', `${script}:/work/capture-thumbnail.mjs:ro`,
          '--entrypoint', 'node', THUMBNAIL_IMAGE, '/work/capture-thumbnail.mjs', url, `/out/${projectId}.jpg`,
        ]
      : null
  try {
    if (!args) throw new Error('thumbnails need BUILD_ISOLATION=docker')
    await new Promise((done, fail) => {
      const child = spawn('docker', args, { env: buildEnv() })
      const timer = setTimeout(() => {
        spawn('docker', ['kill', name], { stdio: 'ignore' })
        child.kill('SIGKILL')
      }, 120000)
      child.on('error', fail)
      child.on('close', (code) => {
        clearTimeout(timer)
        code === 0 ? done() : fail(new Error(`capture exited with ${code}`))
      })
    })
    await prisma.project.update({ where: { id: projectId }, data: { thumbnailAt: new Date() } })
    log.line('Captured a preview image', 'muted')
  } catch (error) {
    log.line(`Preview image not captured: ${error.message}`, 'muted')
  }
}

// Dossier de cache npm d'un compte, créé à la demande
async function accountCacheDir(ownerKey) {
  const safe = ownerKey.replace(/[^A-Za-z0-9_-]/g, '_')
  const dir = join(BUILD_CACHE_DIR, safe, 'npm')
  await mkdir(dir, { recursive: true })
  if (process.getuid?.() === 0) await chown(dir, SANDBOX_UID, SANDBOX_GID)
  return dir
}

// Taille totale d'un dossier, en octets
async function dirSize(dir) {
  let total = 0
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) total += await dirSize(path)
    else if (entry.isFile()) total += (await stat(path)).size
  }
  return total
}

// Espace utilisé par le compte, hors ce projet : sources uploadées + sites publiés
async function storageUsedByOthers(ownerId, projectId) {
  if (!ownerId) return 0
  const others = await prisma.project.findMany({
    where: { ownerId, id: { not: projectId } },
    select: { sourceBytes: true, outputBytes: true },
  })
  return others.reduce((sum, row) => sum + row.sourceBytes + row.outputBytes, 0)
}

// Supprime les dossiers de sites dont le projet n'existe plus
async function cleanupOrphanSites() {
  const entries = await readdir(SITES_DIR, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[a-z0-9-]{3,40}$/.test(entry.name)) continue
    const exists = await prisma.project.findUnique({ where: { name: entry.name }, select: { id: true } })
    if (exists) continue
    await rm(join(SITES_DIR, entry.name), { recursive: true, force: true })
    console.log(`[${clock()}] Removed site of deleted project ${entry.name}`)
  }
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
  const cloneToken = deployment.cloneToken ?? null

  try {
    // Le jeton ne doit pas rester en base : on l'efface dès qu'il est lu
    if (cloneToken) await prisma.deployment.update({ where: { id: deployment.id }, data: { cloneToken: null } })

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
        env: cloneToken ? gitAuthEnv(cloneToken) : {},
      })
    }

    await removeSymlinks(workDir, log)

    // 2. Installer et construire, dans le dossier racine du projet
    const appDir = resolve(workDir, project.rootDirectory || '.')
    if (appDir !== workDir && !appDir.startsWith(workDir + sep)) throw new Error('root directory is outside the project')

    const cacheDir = ISOLATION === 'docker' ? await accountCacheDir(project.ownerId ?? `project-${project.id}`) : undefined
    const installSandbox = { image: BUILD_IMAGE, workDir, cpus: INSTALL_CPUS, memory: BUILD_MEMORY, cacheDir }
    const buildSandbox = { image: BUILD_IMAGE, workDir, cpus: BUILD_CPUS, memory: BUILD_MEMORY, cacheDir }
    if (ISOLATION === 'docker') {
      await chownTree(workDir)
      log.line(`Isolation: Docker (${BUILD_IMAGE}, ${BUILD_MEMORY} RAM, ${BUILD_CPUS} CPU for build, ${INSTALL_CPUS} for install)`, 'muted')
    } else {
      log.line('Isolation: none (commands run on the host)', 'muted')
    }

    // Avec un fichier de verrouillage, npm ci est plus rapide et reproductible ; npm install en repli
    let installCommand = project.installCommand
    if (/^npm (install|i)\b/.test(installCommand) && (await stat(join(appDir, 'package-lock.json')).catch(() => null))) {
      installCommand = `${installCommand.replace(/^npm (install|i)\b/, 'npm ci')} || ${installCommand}`
    }
    if (installCommand) {
      log.line(`$ ${installCommand}`)
      await run('sh', ['-c', installCommand], { cwd: appDir, log, sandbox: installSandbox })
    }
    if (project.buildCommand) {
      log.line(`$ ${project.buildCommand}`)
      await run('sh', ['-c', project.buildCommand], { cwd: appDir, log, sandbox: buildSandbox })
    }
    await updateSteps(deployment.id, (steps) => setStep(setStep(steps, 'build', 'done', formatDuration(Date.now() - started)), 'test', 'done', '—'))

    // 3. Publier
    await updateSteps(deployment.id, (steps) => setStep(steps, 'deploy', 'running'))
    const outDir = resolve(appDir, project.outputDirectory || '.')
    if (outDir !== workDir && !outDir.startsWith(workDir + sep)) throw new Error('output directory is outside the project')
    if (!(await stat(outDir).catch(() => null))?.isDirectory()) {
      throw new Error(`output directory "${project.outputDirectory}" not found`)
    }

    // Seuls les sites statiques sont acceptés : un serveur Node n'est pas exécuté sur le serveur
    if ((await stat(join(outDir, 'server', 'index.mjs')).catch(() => null))) {
      throw new Error('server output is not supported: build a static site (e.g. nuxt generate, next export)')
    }

    // Quota du compte : ce site ne doit pas dépasser l'espace restant
    const outputBytes = await dirSize(outDir)
    const used = await storageUsedByOthers(project.ownerId, project.id)
    if (used + project.sourceBytes + outputBytes > STORAGE_QUOTA_BYTES) {
      const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`
      throw new Error(
        `storage limit reached: the site is ${mb(outputBytes)} and the account has ` +
          `${mb(Math.max(0, STORAGE_QUOTA_BYTES - used - project.sourceBytes))} left`,
      )
    }

    const url = await publishStatic(deployment.id, outDir, log, project.name)
    log.line(`Live at ${url}`, 'success')
    await prisma.project.update({ where: { id: project.id }, data: { outputBytes } })
    await captureThumbnail(project.id, url, log)
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

      const url = await publishStatic(row.id, dir, log, row.name)
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
  for (const [deploymentId, { stop, dir, cleanup }] of [...running.entries()]) {
    const exists = await prisma.deployment.findUnique({ where: { id: deploymentId }, select: { id: true } })
    if (exists) continue

    await stop()
    if (cleanup) await cleanup()
    running.delete(deploymentId)
    await rm(dir, { recursive: true, force: true })
    console.log(`[${clock()}] Stopped site for deleted deployment ${deploymentId}`)
  }
}

// Builds en cours : identifiant du déploiement -> compte propriétaire (ou projet, si anonyme)
const activeBuilds = new Map()

// Prend les builds en attente tant qu'il reste de la place, dans les limites par serveur et par compte
async function startBuilds() {
  if (activeBuilds.size >= MAX_CONCURRENT_BUILDS) return

  const candidates = await prisma.deployment.findMany({
    where: { status: 'building', claimedAt: null, ...(ONLY_DEPLOYMENT ? { id: ONLY_DEPLOYMENT } : {}) },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })
  if (!candidates.length) return

  const projects = await prisma.project.findMany({
    where: { id: { in: candidates.map((row) => row.projectId).filter(Boolean) } },
    select: { id: true, ownerId: true },
  })
  const ownerOf = new Map(projects.map((project) => [project.id, project.ownerId ?? `project:${project.id}`]))

  for (const deployment of candidates) {
    if (activeBuilds.size >= MAX_CONCURRENT_BUILDS) break

    const owner = ownerOf.get(deployment.projectId) ?? `deployment:${deployment.id}`
    const ownerBuilds = [...activeBuilds.values()].filter((value) => value === owner).length
    if (ownerBuilds >= MAX_BUILDS_PER_USER) continue

    // Verrou atomique : seul le worker qui fait passer claimedAt de vide à rempli obtient ce build
    const claim = await prisma.deployment.updateMany({
      where: { id: deployment.id, claimedAt: null },
      data: { claimedAt: new Date() },
    })
    if (claim.count !== 1) continue

    activeBuilds.set(deployment.id, owner)
    console.log(`[${clock()}] Building ${deployment.name} (${deployment.id})`)
    build(deployment)
      .catch((error) => console.error(`[${clock()}] Build crashed for ${deployment.name}:`, error))
      .finally(() => {
        activeBuilds.delete(deployment.id)
        console.log(`[${clock()}] Finished ${deployment.name}`)
      })
  }
}

// Capture les projets déjà en ligne qui n'ont pas encore d'image, puis s'arrête (node worker/build-worker.mjs --thumbnails)
async function backfillThumbnails() {
  const projects = await prisma.project.findMany({
    where: { status: 'live', thumbnailAt: null },
    select: { id: true, name: true },
  })
  console.log(`Capturing ${projects.length} live site(s) without an image`)
  const log = { line: (message) => console.log(`  ${message}`) }
  for (const project of projects) {
    console.log(`[${clock()}] ${project.name}`)
    await captureThumbnail(project.id, `https://${project.name}.${SITE_DOMAIN}`, log)
  }
  await prisma.$disconnect()
}

async function main() {
  if (process.argv.includes('--thumbnails')) return backfillThumbnails()
  await mkdir(BUILDS_DIR, { recursive: true })
  await mkdir(SITES_DIR, { recursive: true })
  console.log(`Build worker started. Storage: ${STORAGE_DIR} · Builds: ${BUILDS_DIR} · Sites: ${SITES_DIR}`)
  console.log(`Limits: ${MAX_CONCURRENT_BUILDS} builds at once, ${MAX_BUILDS_PER_USER} per account`)

  // Un build interrompu par un arrêt du worker est remis en file : il repart du clone
  await prisma.deployment.updateMany({
    where: { status: 'building', claimedAt: { not: null } },
    data: { claimedAt: null },
  })
  await restoreDeployments()

  for (;;) {
    await reconcileRunning()
    await cleanupOrphanSites().catch((error) => console.warn(`[${clock()}] site cleanup failed: ${error.message}`))
    await startBuilds().catch((error) => console.error(`[${clock()}] queue error: ${error.message}`))
    await sleep(POLL_MS)
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
