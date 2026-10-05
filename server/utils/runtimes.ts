import runtimes from '../../config/runtimes.json'

// Runtimes autorisés pour les web services : seule une image de cette liste peut être utilisée
export type RuntimeName = keyof typeof runtimes

export const RUNTIME_NAMES = Object.keys(runtimes) as RuntimeName[]

export function isRuntime(value: unknown): value is RuntimeName {
  return typeof value === 'string' && (RUNTIME_NAMES as string[]).includes(value)
}
