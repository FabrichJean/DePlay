import { zipSync, type Zippable } from 'fflate'

// Taille maximale d'une image après optimisation (côté le plus long, en pixels)
const MAX_IMAGE_SIDE = 2000
const IMAGE_QUALITY = 0.8

const COMPRESSIBLE = /\.(html?|css|m?jsx?|tsx?|json|md|txt|svg|xml|map)$/i
const REENCODABLE = /\.(jpe?g|webp)$/i
const RESIZABLE = /\.png$/i

const mimeFor = (name: string) => (/\.png$/i.test(name) ? 'image/png' : /\.webp$/i.test(name) ? 'image/webp' : 'image/jpeg')

// Réencode ou redimensionne une image en gardant son format : le nom et l'extension ne changent pas,
// donc les références du code restent valides. Renvoie les octets d'origine si le résultat n'est pas plus petit.
async function optimizeImage(file: File): Promise<Uint8Array> {
  const original = new Uint8Array(await file.arrayBuffer())

  if (typeof createImageBitmap === 'undefined' || typeof OffscreenCanvas === 'undefined') return original

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    // Un PNG est redimensionné seulement s'il est trop grand : il reste sans perte sinon
    if (scale === 1 && RESIZABLE.test(file.name)) {
      bitmap.close()
      return original
    }

    const canvas = new OffscreenCanvas(width, height)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const type = mimeFor(file.name)
    const blob = await canvas.convertToBlob({ type, quality: IMAGE_QUALITY })
    // Certains navigateurs ne savent pas encoder tous les formats : on ne garde que le format demandé
    if (blob.type !== type) return original
    const optimized = new Uint8Array(await blob.arrayBuffer())

    return optimized.byteLength < original.byteLength ? optimized : original
  } catch {
    // Format non décodable par le navigateur : on envoie le fichier tel quel
    return original
  }
}

export interface PackProgress {
  done: number
  total: number
}

// Regroupe le projet dans une archive zip : texte compressé, médias stockés (déjà compressés).
export async function packProject(files: File[], onProgress?: (progress: PackProgress) => void): Promise<Blob> {
  const entries: Zippable = {}

  for (const [index, file] of files.entries()) {
    const name = file.webkitRelativePath || file.name

    if (REENCODABLE.test(name) || RESIZABLE.test(name)) {
      const data = await optimizeImage(file)
      entries[name] = [data, { level: 0 }]
    } else if (COMPRESSIBLE.test(name)) {
      entries[name] = [new Uint8Array(await file.arrayBuffer()), { level: 6 }]
    } else {
      // Vidéos, polices, archives : la compression ne gagnerait presque rien
      entries[name] = [new Uint8Array(await file.arrayBuffer()), { level: 0 }]
    }

    onProgress?.({ done: index + 1, total: files.length })
  }

  return new Blob([zipSync(entries)], { type: 'application/zip' })
}
