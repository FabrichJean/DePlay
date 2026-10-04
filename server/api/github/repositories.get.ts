import { clerkClient } from '@clerk/nuxt/server'
import type { FrameworkPreset, RepositoryOption } from '../../../types/website'
import { relativeLabel } from '../../utils/project-mapper'

interface GithubRepo {
  full_name: string
  default_branch: string
  private: boolean
  updated_at: string
}

// Dépôts GitHub du compte connecté, via le jeton OAuth conservé par Clerk
export default defineEventHandler(async (event): Promise<{ connected: boolean, repositories: RepositoryOption[] }> => {
  const { userId } = requireUser(event)

  const tokens = await clerkClient(event).users.getUserOauthAccessToken(userId, 'github')
  const token = tokens.data[0]?.token
  if (!token) return { connected: false, repositories: [] }

  const repos = await githubGet<GithubRepo[]>(
    token,
    '/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member',
  )
  if (!repos) return { connected: false, repositories: [] }

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

  return { connected: true, repositories }
})

// Appel à l'API GitHub. Renvoie null si le jeton n'est plus valide ou si la ressource n'existe pas
async function githubGet<T>(token: string, path: string, accept = 'application/vnd.github+json'): Promise<T | null> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: accept,
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (response.status === 401 || response.status === 404) return null
  if (!response.ok) {
    throw createError({ statusCode: 502, statusMessage: `GitHub returned ${response.status}` })
  }

  return (accept.includes('raw') ? await response.text() : await response.json()) as T
}

// Déduit le framework à partir du package.json à la racine de la branche par défaut
async function detectPreset(token: string, fullName: string, branch: string): Promise<FrameworkPreset> {
  const raw = await githubGet<string>(
    token,
    `/repos/${fullName}/contents/package.json?ref=${encodeURIComponent(branch)}`,
    'application/vnd.github.raw',
  )

  // Pas de package.json : site HTML/CSS/JS pur
  if (raw === null) return 'static'

  let pkg: { dependencies?: Record<string, string>, devDependencies?: Record<string, string> }
  try {
    pkg = JSON.parse(raw)
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
