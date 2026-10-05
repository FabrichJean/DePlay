// Variables d'environnement d'un site : validées dans le navigateur et côté serveur (même règle)
export interface EnvVariable {
  key: string
  value: string
}

export const MAX_ENV_VARIABLES = 50
export const MAX_ENV_VALUE_LENGTH = 4096
const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/
// Noms que le worker réserve au système : un projet ne peut pas les remplacer
const RESERVED_KEYS = new Set(['PATH', 'HOME', 'LANG', 'CI', 'HOSTNAME', 'NODE_OPTIONS', 'LD_PRELOAD', 'LD_LIBRARY_PATH'])

// Premier message d'erreur, ou null si la liste est valide
export function envVariablesError(variables: EnvVariable[]): string | null {
  if (variables.length > MAX_ENV_VARIABLES) return `Up to ${MAX_ENV_VARIABLES} variables.`
  const seen = new Set<string>()
  for (const { key, value } of variables) {
    if (!key) return 'Every variable needs a name.'
    if (!KEY_PATTERN.test(key)) return `"${key}": use letters, digits and underscores, not starting with a digit.`
    if (RESERVED_KEYS.has(key) || key.startsWith('npm_config_') || key.startsWith('GIT_')) return `"${key}" is reserved.`
    if (seen.has(key)) return `"${key}" is defined twice.`
    if (value.length > MAX_ENV_VALUE_LENGTH) return `"${key}": value is too long.`
    seen.add(key)
  }
  return null
}

// Ne garde que les champs attendus, sans espaces parasites sur le nom
export function normalizeEnvVariables(input: unknown): EnvVariable[] {
  if (!Array.isArray(input)) return []
  return input.map((item) => ({
    key: String((item as EnvVariable)?.key ?? '').trim(),
    value: String((item as EnvVariable)?.value ?? ''),
  }))
}
