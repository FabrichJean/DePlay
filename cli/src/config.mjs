import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const DEFAULT_API = 'https://deplay.fabrich.site'

function configPath() {
  const base = process.env.XDG_CONFIG_HOME || join(homedir(), '.config')
  return join(base, 'deplay', 'config.json')
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw new Error(`Cannot read ${path}: ${error.message}`)
  }
}

// Jeton et URL de l'API : les variables d'environnement passent avant le fichier (utile en CI)
export async function loadConfig() {
  const saved = (await readJson(configPath())) ?? {}
  return {
    token: process.env.DEPLAY_TOKEN || saved.token || null,
    api: (process.env.DEPLAY_API_URL || saved.api || DEFAULT_API).replace(/\/+$/, ''),
    path: configPath(),
  }
}

export async function saveConfig(config) {
  const path = configPath()
  await mkdir(dirname(path), { recursive: true, mode: 0o700 })
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 })
  await chmod(path, 0o600)
  return path
}

export async function clearConfig() {
  await rm(configPath(), { force: true })
}

// Lien entre un dossier local et un projet Deplay : <dossier>/.deplay/project.json
export function linkPath(dir) {
  return join(dir, '.deplay', 'project.json')
}

export async function readLink(dir) {
  return readJson(linkPath(dir))
}

export async function writeLink(dir, link) {
  const path = linkPath(dir)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(link, null, 2)}\n`)
  await writeFile(join(dirname(path), 'README.txt'), 'This folder links the directory to a Deplay project (no secret inside).\nCommit it if you deploy from CI.\n')
}
