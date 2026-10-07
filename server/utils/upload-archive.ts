import type { StoredFile } from './project-storage'
import { unzipSync } from 'fflate'

export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024
const MAX_FILES = 5000

export interface ExtractedArchive {
  files: StoredFile[]
  fileCount: number
  totalBytes: number
}

// Décompresse l'archive. Le contrôle se fait avant la décompression, à partir du répertoire central du zip,
// pour qu'une archive piégée (« zip bomb ») ne sature pas la mémoire.
export function extractArchive(data: Buffer): ExtractedArchive {
  let count = 0
  let totalBytes = 0
  let entries: Record<string, Uint8Array>

  try {
    entries = unzipSync(new Uint8Array(data), {
      filter(file) {
        if (file.name.endsWith('/')) return false // dossiers : rien à écrire
        count++
        totalBytes += file.originalSize
        if (count > MAX_FILES) throw createError({ statusCode: 413, statusMessage: 'Too many files in the archive' })
        if (totalBytes > MAX_UPLOAD_BYTES) {
          throw createError({ statusCode: 413, statusMessage: 'Uncompressed upload exceeds 200 MB' })
        }
        return true
      },
    })
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode) throw error
    throw createError({ statusCode: 400, statusMessage: 'Invalid archive' })
  }

  const names = Object.keys(entries)
  return {
    files: names.map((name) => ({ path: name, data: Buffer.from(entries[name]) })),
    fileCount: names.length,
    totalBytes,
  }
}
