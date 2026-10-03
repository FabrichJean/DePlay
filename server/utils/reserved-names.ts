import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Lit config/reserved-names.txt à chaque vérification : modifier le fichier suffit, sans redémarrer
export async function reservedNames(): Promise<string[]> {
  const content = await readFile(resolve(process.cwd(), 'config/reserved-names.txt'), 'utf8').catch(() => '')

  return content
    .split('\n')
    .map((line) => line.replace(/#.*/, '').trim())
    .flatMap((line) => line.split(/\s+/))
    .filter(Boolean)
}

export async function isReservedName(name: string): Promise<boolean> {
  return (await reservedNames()).includes(name)
}
