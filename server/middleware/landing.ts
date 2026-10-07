import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { H3Event } from 'h3'

// En production, le site public est servi par nginx sur deplay.fabrich.site (deploy/nginx/deplay-landing.conf)
// et l'application vit sur ondeplay.fabrich.site : ce middleware ne sert donc que le développement local.
//
// Site public statique (public/landing-hero-concept) servi sous des adresses propres :
// « / » (page d'accueil, visiteurs non connectés seulement), « /runtimes » et « /docs »
// (toujours accessibles). La balise <base> fait pointer les chemins relatifs de chaque page
// (site.css, les liens entre pages) vers /landing-hero-concept/, où vivent les vrais fichiers.
const SITE_DIR = resolve(process.cwd(), 'public/landing-hero-concept')
const BASE_TAG = '<base href="/landing-hero-concept/">'

// route → fichier, et si la page reste visible une fois connecté
const ROUTES: Record<string, { file: string, public: boolean }> = {
  '/': { file: 'index.html', public: false },
  '/runtimes': { file: 'runtimes.html', public: true },
  '/docs': { file: 'docs.html', public: true },
}

const cache = new Map<string, string>()

async function pageHtml(file: string): Promise<string> {
  // En développement, on relit le fichier à chaque fois pour voir les modifications
  if (cache.has(file) && !import.meta.dev) return cache.get(file) as string
  const html = await readFile(resolve(SITE_DIR, file), 'utf8')
  const withBase = html.replace(/<head>/i, `<head>\n  ${BASE_TAG}`)
  cache.set(file, withBase)
  return withBase
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
  if (!import.meta.dev || event.method !== 'GET') return

  const route = ROUTES[event.path.split('?')[0]]
  if (!route) return
  if (!route.public && isSignedIn(event)) return

  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return pageHtml(route.file)
})
