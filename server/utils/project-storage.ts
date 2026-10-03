import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve, sep } from 'node:path'

export interface StoredFile {
  /** Chemin relatif dans le projet, ex. « site/index.html » */
  path: string
  data: Buffer
}

// Dossier racine de tous les projets, défini par NUXT_PROJECTS_STORAGE_DIR
export function projectStorageRoot(): string {
  const dir = useRuntimeConfig().projectsStorageDir
  if (!dir) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_PROJECTS_STORAGE_DIR is not configured' })
  }
  return resolve(dir)
}

export function projectDir(name: string): string {
  return join(projectStorageRoot(), name)
}

// Écrit les fichiers dans le dossier du projet, en refusant tout chemin qui sortirait de ce dossier
export async function writeProjectFiles(name: string, files: StoredFile[]): Promise<string> {
  const root = projectDir(name)

  for (const file of files) {
    const segments = file.path.split(/[\\/]/)
    if (isAbsolute(file.path) || segments.includes('..')) {
      throw createError({ statusCode: 400, statusMessage: `Invalid file path: ${file.path}` })
    }

    const target = resolve(root, file.path)
    if (!target.startsWith(root + sep)) {
      throw createError({ statusCode: 400, statusMessage: `Invalid file path: ${file.path}` })
    }

    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, file.data)
  }

  return root
}

// Supprime le dossier d'un projet, utilisé pour annuler une création en cas d'échec
export async function removeProjectFiles(name: string): Promise<void> {
  await rm(projectDir(name), { recursive: true, force: true })
}
