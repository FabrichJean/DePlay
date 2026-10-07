import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ApiError, createClient } from './api.mjs'
import { readLink, writeLink } from './config.mjs'
import { NAME_PATTERN, PRESETS, detectProject } from './detect.mjs'
import { collectFiles, loadIgnore, zipFiles } from './files.mjs'
import { ask, c, confirm, formatBytes, interactive, log, ok, step, warn } from './ui.mjs'

const POLL_MS = 2000
const FOLLOW_TIMEOUT_MS = 15 * 60 * 1000

export async function deploy(target, flags, config) {
  if (!config.token) throw new Error('Not logged in. Run `deplay login --token <token>` first.')

  const dir = resolve(target || '.')
  const info = await stat(dir).catch(() => null)
  if (!info?.isDirectory()) throw new Error(`${dir} is not a directory.`)

  const client = createClient(config)
  const link = flags.new ? null : await readLink(dir)
  const plan = link ? await planUpdate(client, link) : await planCreate(dir, flags)

  log()
  log(`${c.bold(plan.name)} ${c.dim(`· ${PRESETS[plan.preset].label} · ${link ? 'new version' : 'new project'}`)}`)

  const isIgnored = await loadIgnore(dir, PRESETS[plan.preset].ignore)
  const { files, totalBytes, skippedLinks } = await collectFiles(dir, isIgnored)
  if (files.length === 0) throw new Error('No files to upload in this folder.')
  if (plan.preset === 'static' && !files.some((file) => file.path === 'index.html')) {
    warn('No index.html at the root of the folder: the site may not have a home page.')
  }
  if (skippedLinks) warn(`${skippedLinks} symbolic link${skippedLinks > 1 ? 's' : ''} skipped.`)

  step(`Packing ${files.length} file${files.length > 1 ? 's' : ''} (${formatBytes(totalBytes)})`)
  const archive = await zipFiles(files)

  const form = new FormData()
  if (!link) form.append('config', JSON.stringify(plan.config))
  form.append('archive', new Blob([archive], { type: 'application/zip' }), 'project.zip')

  step(`Uploading ${formatBytes(archive.byteLength)}`)
  let projectId
  if (link) {
    await client.uploadFiles(link.projectId, form)
    projectId = link.projectId
  } else {
    const created = await client.createWebsite(form)
    projectId = created.id
    await writeLink(dir, { projectId, name: created.name, preset: plan.preset, api: config.api })
    ok(`Project ${c.bold(created.name)} created and linked ${c.dim('(.deplay/project.json)')}`)
  }

  const dashboard = `${config.api}/projects/${projectId}`
  if (flags['no-wait']) {
    ok(`Deployment queued. Follow it on ${c.cyan(dashboard)}`)
    return
  }

  log(c.dim('Following the build — Ctrl+C stops following, the deployment keeps going.'))
  log()
  await follow(client, projectId, dashboard)
}

async function planUpdate(client, link) {
  try {
    const project = await client.project(link.projectId)
    if (project.source !== 'upload' || project.type !== 'website') {
      throw new Error(`${project.name} is not an uploaded website; the CLI can only update those.`)
    }
    return { name: project.name, preset: PRESETS[link.preset] ? link.preset : 'static' }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new Error(`The linked project (${link.name}) no longer exists. Run again with --new to create a new one.`)
    }
    throw error
  }
}

async function planCreate(dir, flags) {
  const detected = await detectProject(dir)

  const preset = flags.preset || detected.preset
  if (!PRESETS[preset]) throw new Error(`Unknown preset "${preset}". Use one of: ${Object.keys(PRESETS).join(', ')}.`)

  let name = flags.name || detected.name
  if (interactive && !flags.yes && !flags.name) name = await ask('Project name', name)
  if (!NAME_PATTERN.test(name)) throw new Error(`Invalid name "${name}": use 3–40 lowercase letters, digits or dashes.`)

  const defaults = PRESETS[preset]
  const config = {
    name,
    type: 'website',
    source: 'upload',
    preset,
    rootDirectory: './',
    installCommand: flags['install-command'] ?? defaults.installCommand,
    buildCommand: flags['build-command'] ?? defaults.buildCommand,
    outputDirectory: flags['output-dir'] ?? defaults.outputDirectory,
    env: [],
  }

  if (interactive && !flags.yes) {
    log()
    log(`${c.dim('Framework')}   ${defaults.label}${flags.preset ? '' : c.dim(' (detected)')}`)
    log(`${c.dim('Install')}     ${config.installCommand || c.dim('—')}`)
    log(`${c.dim('Build')}       ${config.buildCommand || c.dim('—')}`)
    log(`${c.dim('Output')}      ${config.outputDirectory}`)
    log(`${c.dim('Address')}     https://${name}.fabrich.site`)
    log()
    if (!(await confirm('Create this project and deploy?'))) throw new Error('Cancelled.')
  }

  return { name, preset, config }
}

async function follow(client, projectId, dashboard) {
  const started = Date.now()
  let printed = 0

  while (Date.now() - started < FOLLOW_TIMEOUT_MS) {
    const deployment = await client.latestDeployment(projectId)
    const lines = deployment.logs ?? []
    for (const line of lines.slice(printed)) {
      const text = line.tone === 'success' ? c.green(line.message) : line.tone === 'muted' ? c.dim(line.message) : line.message
      log(`${c.dim(line.time ?? '')}  ${text}`)
    }
    printed = Math.max(printed, lines.length)

    if (deployment.status === 'deployed') {
      log()
      ok(`Live at ${c.bold(c.cyan(deployment.url))}`)
      log()
      return
    }
    if (deployment.status === 'failed') {
      throw new Error(`Deployment failed. Details: ${dashboard}`)
    }
    await new Promise((done) => setTimeout(done, POLL_MS))
  }

  warn(`Still building after 15 minutes. Follow it on ${dashboard}`)
}
