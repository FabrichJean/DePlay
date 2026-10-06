import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { H3Event } from 'h3'

// Landing statique (public/landing, template « Site Immersif ») servie sur « / » pour les visiteurs
// non connectés : l'adresse reste « / ». La balise <base> fait pointer ses chemins relatifs
// (styles, scripts, images) vers /landing/ ; le moteur gère lui-même les ancres (#…) sans changer d'adresse.
const LANDING_FILE = resolve(process.cwd(), 'public/landing/index.html')
const BASE_TAG = '<base href="/landing/">'

let cached: string | null = null

async function landingHtml(): Promise<string> {
  // En développement, on relit le fichier à chaque fois pour voir les modifications
  if (cached && !import.meta.dev) return cached
  const html = await readFile(LANDING_FILE, 'utf8')
  cached = html.replace(/<head>/i, `<head>\n  ${BASE_TAG}`)
  return cached
}

// Connecté si le middleware Clerk a déjà tourné et trouvé une session ; sinon, d'après le cookie
// __client_uat que Clerk pose dans le navigateur (absent ou « 0 » = déconnecté)
function isSignedIn(event: H3Event): boolean {
  const auth = typeof event.context.auth === 'function' ? event.context.auth() : null
  if (auth?.userId) return true

  const cookies = parseCookies(event)
  return Object.entries(cookies).some(([name, value]) => name.startsWith('__client_uat') && value !== '0' && value !== '')
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' || event.path.split('?')[0] !== '/') return
  if (isSignedIn(event)) return

  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return landingHtml()
})
