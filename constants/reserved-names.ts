// Noms de projet interdits : ils serviraient de sous-domaine (ex. <nom>.fabrich.site)
// et entreraient en conflit avec l'application ou les services existants.
export const RESERVED_NAMES = [
  'deplay',
  'app',
  'www',
  'mail',
  'api',
  'ftp',
  'admin',
  'static',
  'assets',
  'epta',
] as const

export function isReservedName(name: string): boolean {
  return (RESERVED_NAMES as readonly string[]).includes(name)
}
