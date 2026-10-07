import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

// Mêmes valeurs que constants/presets.ts côté application
export const PRESETS = {
  nuxt: { label: 'Nuxt', installCommand: 'npm install', buildCommand: 'npx nuxt generate', outputDirectory: '.output/public', ignore: ['/.nuxt', '/.output'] },
  next: { label: 'Next.js', installCommand: 'npm install', buildCommand: 'npm run build', outputDirectory: 'out', ignore: ['/.next', '/out'] },
  vite: { label: 'Vite', installCommand: 'npm install', buildCommand: 'npm run build', outputDirectory: 'dist', ignore: ['/dist'] },
  static: { label: 'Static HTML', installCommand: '', buildCommand: '', outputDirectory: '.', ignore: [] },
}

export const NAME_PATTERN = /^[a-z0-9-]{3,40}$/

async function readPackage(dir) {
  try {
    return JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
  } catch {
    return null
  }
}

export async function detectProject(dir) {
  const pkg = await readPackage(dir)
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }

  let preset = 'static'
  if (deps.nuxt) preset = 'nuxt'
  else if (deps.next) preset = 'next'
  else if (deps.vite) preset = 'vite'

  return { preset, name: suggestName(pkg?.name || basename(dir)) }
}

// Nom de projet valide pour Deplay : 3–40 caractères [a-z0-9-]
export function suggestName(raw) {
  let name = String(raw)
    .toLowerCase()
    .replace(/^@[^/]+\//, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
    .replace(/-$/, '')
  if (name.length < 3) name = `${name || 'site'}-site`.slice(0, 40)
  return name
}
