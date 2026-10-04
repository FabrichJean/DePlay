import type { FrameworkPreset, RepositoryOption } from '../../../types/website'
import { githubToken } from '../../utils/github-token'
import { relativeLabel } from '../../utils/project-mapper'

interface GithubRepo {
  full_name: string
  default_branch: string
  private: boolean
  updated_at: string
}

interface RepositoryList {
  connected: boolean
  /** Le jeton peut lire les dépôts privés (scope « repo ») */
  privateAccess: boolean
  repositories: RepositoryOption[]
}

// Dépôts GitHub du compte connecté, via le jeton OAuth conservé par Clerk
export default defineEventHandler(async (event): Promise<RepositoryList> => {
  const { userId } = requireUser(event)

  const token = await githubToken(event, userId)
  if (!token) return { connected: false, privateAccess: false, repositories: [] }

  const response = await githubFetch(
    token,
    '/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member',
  )
  if (!response) return { connected: false, privateAccess: false, repositories: [] }

  // GitHub indique les permissions réelles du jeton : sans « repo », les dépôts privés n'apparaissent pas
  const scopes = response.headers.get('x-oauth-scopes') ?? ''
  const privateAccess = scopes.split(',').map((scope) => scope.trim()).includes('repo')

  const repos = (await response.json()) as GithubRepo[]

  // Un appel par dépôt pour lire son package.json : on les fait en parallèle
  const repositories = await Promise.all(
    repos.map(async (repo): Promise<RepositoryOption> => ({
      fullName: repo.full_name,
      private: repo.private,
      defaultBranch: repo.default_branch,
      detectedPreset: await detectPreset(token, repo.full_name, repo.default_branch),
      updatedLabel: `Updated ${relativeLabel(new Date(repo.updated_at))}`,
    })),
  )

  return { connected: true, privateAccess, repositories }
})

// Appel à l'API GitHub. Renvoie null si le jeton n'est plus valide
async function githubFetch(token: string, path: string, accept = 'application/vnd.github+json'): Promise<Response | null> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: accept,
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (response.status === 401) return null
  if (response.status === 404) return null
  if (!response.ok) {
    throw createError({ statusCode: 502, statusMessage: `GitHub returned ${response.status}` })
  }
  return response
}

// Déduit le framework à partir du package.json à la racine de la branche par défaut
async function detectPreset(token: string, fullName: string, branch: string): Promise<FrameworkPreset> {
  const response = await githubFetch(
    token,
    `/repos/${fullName}/contents/package.json?ref=${encodeURIComponent(branch)}`,
    'application/vnd.github.raw',
  )

  // Pas de package.json : site HTML/CSS/JS pur
  if (!response) return 'static'

  let pkg: { dependencies?: Record<string, string>, devDependencies?: Record<string, string> }
  try {
    pkg = JSON.parse(await response.text())
  } catch {
    return 'static'
  }

  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  if (deps.next) return 'next'
  if (deps.nuxt) return 'nuxt'
  if (deps.vite) return 'vite'
  // Projet Node sans framework reconnu : on garde le preset Vite (même commandes de build)
  return 'vite'
}
