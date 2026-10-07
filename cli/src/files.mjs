import { lstat, readdir, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { zipSync } from 'fflate'

// Limites du serveur (server/utils/upload-archive.ts)
export const MAX_BYTES = 200 * 1024 * 1024
export const MAX_FILES = 5000

// Jamais envoyés : dépendances, historique Git, lien Deplay, secrets locaux
const ALWAYS_IGNORED = ['node_modules', '.git', '.deplay', '.DS_Store', 'Thumbs.db', '.env', '.env.*', '!.env.example']

// Transforme une ligne de type .gitignore (sous-ensemble) en test sur un chemin relatif « a/b/c »
function compile(line) {
  let pattern = line.trim()
  if (!pattern || pattern.startsWith('#')) return null
  const negate = pattern.startsWith('!')
  if (negate) pattern = pattern.slice(1)
  const anchored = pattern.startsWith('/')
  pattern = pattern.replace(/^\/+|\/+$/g, '')
  if (!pattern) return null

  const source = pattern
    .split('/')
    .map((part) => (part === '**' ? '.*' : part.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]')))
    .join('/')
  const regex = anchored || pattern.includes('/')
    ? new RegExp(`^${source}(/.*)?$`)
    : new RegExp(`(^|/)${source}(/.*)?$`)
  return { negate, test: (path) => regex.test(path) }
}

export async function loadIgnore(dir, extra = []) {
  let custom = []
  try {
    custom = (await readFile(join(dir, '.deplayignore'), 'utf8')).split(/\r?\n/)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const rules = [...ALWAYS_IGNORED, ...extra, ...custom].map(compile).filter(Boolean)

  // La dernière règle qui correspond l'emporte, comme dans .gitignore
  return (path) => {
    let ignored = false
    for (const rule of rules) if (rule.test(path)) ignored = !rule.negate
    return ignored
  }
}

export async function collectFiles(dir, isIgnored) {
  const files = []
  let totalBytes = 0
  let skippedLinks = 0

  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const absolute = join(current, entry.name)
      const path = relative(dir, absolute).split(sep).join('/')
      if (isIgnored(path)) continue

      const info = await lstat(absolute)
      if (info.isSymbolicLink()) {
        skippedLinks++ // le serveur les supprime de toute façon
        continue
      }
      if (info.isDirectory()) {
        await walk(absolute)
      } else if (info.isFile()) {
        files.push({ path, absolute, size: info.size })
        totalBytes += info.size
        if (files.length > MAX_FILES) throw new Error(`More than ${MAX_FILES} files to upload. Add exclusions to .deplayignore.`)
        if (totalBytes > MAX_BYTES) throw new Error('More than 200 MB to upload. Add exclusions to .deplayignore.')
      }
    }
  }

  await walk(dir)
  files.sort((a, b) => a.path.localeCompare(b.path))
  return { files, totalBytes, skippedLinks }
}

export async function zipFiles(files) {
  const entries = {}
  for (const file of files) {
    entries[file.path] = [new Uint8Array(await readFile(file.absolute)), { level: 6 }]
  }
  return zipSync(entries)
}
