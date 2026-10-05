import { open, stat } from 'node:fs/promises'
import { join } from 'node:path'

// Journaux d'accès nginx des sites publiés : /www/wwwlogs/deplay-<nom>.log (format « combined »)
const LOG_DIR = process.env.SITE_LOG_DIR || '/www/wwwlogs/sites'
const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_DAYS = 14
// Premier passage : on ne lit pas plus que ça d'un coup (un journal peut être très gros)
const MAX_INITIAL_BYTES = 32 * 1024 * 1024
// Ligne nginx : capture la date, la méthode, le chemin et le code HTTP
const LINE = /\[([^\]]+)\] "(\S+) (\S+)[^"]*" (\d{3}) (\d+|-)/

interface Bucket {
  requests: number
  visits: number
  errors: number
  /** Octets envoyés aux visiteurs */
  bytes: number
}

interface LogState {
  /** Position lue dans le fichier, toujours après un saut de ligne */
  offset: number
  /** Compteurs par jour UTC (numéro de jour depuis l'époque) */
  days: Map<number, Bucket>
}

export interface SiteTraffic {
  /** Requêtes sur les 14 derniers jours */
  requests: number
  /** Visites (pages HTML) sur les 14 derniers jours */
  visits: number
  /** Réponses 5xx sur les 14 derniers jours */
  errors: number
  /** Octets envoyés sur les 14 derniers jours */
  bytes: number
  /** Requêtes par jour, du plus ancien au plus récent */
  daily: number[]
  /** Visites par jour, du plus ancien au plus récent */
  dailyVisits: number[]
}

const states = new Map<string, LogState>()
// Une seule lecture à la fois par site : sinon deux appels simultanés compteraient les mêmes lignes deux fois
const queues = new Map<string, Promise<unknown>>()

// Trafic d'un site publié, mis à jour depuis son journal
export function siteTraffic(name: string): Promise<SiteTraffic> {
  const previous = queues.get(name) ?? Promise.resolve()
  const next = previous.then(() => refresh(name))
  queues.set(name, next.catch(() => {}))
  return next.then(summarize).catch((error) => {
    // Erreur inattendue (droits, disque) : on le signale au lieu d'afficher 0 en silence
    console.warn(`[traffic] cannot read logs for ${name}: ${(error as Error).message}`)
    return summarize(emptyState())
  })
}

function emptyState(): LogState {
  return { offset: 0, days: new Map() }
}

async function refresh(name: string): Promise<LogState> {
  const path = join(LOG_DIR, `deplay-${name}.log`)
  // Fichier absent = site pas encore visité ; toute autre erreur (droits) remonte
  const info = await stat(path).catch((error: NodeJS.ErrnoException) => (error.code === 'ENOENT' ? null : Promise.reject(error)))
  let state = states.get(name) ?? emptyState()

  if (info) {
    // Journal remplacé ou tronqué (rotation) : on repart de zéro
    if (info.size < state.offset) state = emptyState()
    if (state.offset === 0 && info.size > MAX_INITIAL_BYTES) state.offset = info.size - MAX_INITIAL_BYTES

    if (info.size > state.offset) {
      const length = info.size - state.offset
      const handle = await open(path, 'r')
      try {
        const buffer = Buffer.alloc(length)
        await handle.read(buffer, 0, length, state.offset)
        // La dernière ligne peut être en cours d'écriture : on la lira au prochain passage
        const end = buffer.lastIndexOf(0x0a) + 1
        if (end > 0) {
          for (const line of buffer.subarray(0, end).toString('utf8').split('\n')) tally(state, line)
          state.offset += end
        }
      } finally {
        await handle.close()
      }
    }
  }

  pruneDays(state)
  states.set(name, state)
  return state
}

// Ligne nginx : 129.222.109.253 - - [04/Oct/2026:17:04:45 +0200] "GET /x HTTP/2.0" 200 395 ...
function tally(state: LogState, line: string) {
  const match = LINE.exec(line)
  if (!match) return
  const [, date, method, path, code, sent] = match
  const status = Number(code)

  // « 04/Oct/2026:17:04:45 +0200 » → « 04 Oct 2026 17:04:45 +0200 », lisible par Date
  const time = Date.parse(date.replace(/\//g, ' ').replace(':', ' '))
  if (Number.isNaN(time)) return

  const day = Math.floor(time / DAY_MS)
  const bucket = state.days.get(day) ?? { requests: 0, visits: 0, errors: 0, bytes: 0 }
  bucket.requests++
  bucket.bytes += sent === '-' ? 0 : Number(sent)
  if (isVisit(method, path, status)) bucket.visits++
  if (status >= 500) bucket.errors++
  state.days.set(day, bucket)
}

// Une visite : une page (GET réussi ou resté en cache) et non un fichier (script, style, image, favicon)
function isVisit(method: string, path: string, status: number): boolean {
  if (method !== 'GET' || (status !== 200 && status !== 304)) return false
  const pathname = path.split('?')[0]
  const last = pathname.split('/').pop() ?? ''
  return pathname.endsWith('/') || last === '' || !last.includes('.') || /\.html?$/i.test(last)
}

function pruneDays(state: LogState) {
  const oldest = today() - WINDOW_DAYS + 1
  for (const day of state.days.keys()) {
    if (day < oldest) state.days.delete(day)
  }
}

function today(): number {
  return Math.floor(Date.now() / DAY_MS)
}

function summarize(state: LogState): SiteTraffic {
  const first = today() - WINDOW_DAYS + 1
  const daily: number[] = []
  const dailyVisits: number[] = []
  let requests = 0
  let visits = 0
  let errors = 0
  let bytes = 0

  for (let index = 0; index < WINDOW_DAYS; index++) {
    const bucket = state.days.get(first + index)
    daily.push(bucket?.requests ?? 0)
    dailyVisits.push(bucket?.visits ?? 0)
    requests += bucket?.requests ?? 0
    visits += bucket?.visits ?? 0
    errors += bucket?.errors ?? 0
    bytes += bucket?.bytes ?? 0
  }

  return { requests, visits, errors, bytes, daily, dailyVisits }
}
