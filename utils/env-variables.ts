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

// Noms des variables déclarées dans un fichier .env.example (valeurs ignorées)
export function envExampleNames(text: string): string[] {
  const names = new Set<string>()
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line)
    if (match && !RESERVED_KEYS.has(match[1])) names.add(match[1])
  }
  return [...names]
}

// Lit un fichier .env (NOM=valeur, guillemets, export, commentaires) avec les valeurs
export function parseDotenv(text: string): EnvVariable[] {
  const result: EnvVariable[] = []
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('export ')) line = line.slice(7).trim()

    const equal = line.indexOf('=')
    if (equal <= 0) continue
    const key = line.slice(0, equal).trim()
    let value = line.slice(equal + 1).trim()

    const quoted = value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.endsWith(value[0])
    if (quoted) {
      value = value.slice(1, -1)
      if (raw.includes('"')) value = value.replace(/\\n/g, '\n').replace(/\\"/g, '"')
    } else {
      // Commentaire en fin de ligne : « VALEUR # commentaire »
      value = value.replace(/\s+#.*$/, '')
    }
    result.push({ key, value })
  }
  return result
}

// Ajoute ou remplace les variables importées, sans toucher aux autres ; la dernière valeur l'emporte
export function mergeVariables(current: EnvVariable[], incoming: EnvVariable[]): EnvVariable[] {
  const merged = current.map((item) => ({ ...item }))
  for (const { key, value } of incoming) {
    const existing = merged.find((item) => item.key === key)
    if (existing) existing.value = value
    else merged.push({ key, value })
  }
  return merged
}
