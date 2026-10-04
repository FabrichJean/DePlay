import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface Limits {
  /** Espace total par compte (sources uploadées + sites publiés), en octets */
  storageQuotaBytes: number
  /** Builds exécutés en même temps sur le serveur */
  maxConcurrentBuilds: number
  /** Builds en même temps pour un même compte */
  maxBuildsPerUser: number
}

// config/limits.json : lu par l'application et par le worker, source unique
export const limits = JSON.parse(readFileSync(resolve(process.cwd(), 'config/limits.json'), 'utf8')) as Limits
