import { envExampleNames } from '../../../utils/env-variables'
// Noms des variables du fichier .env.example à la racine d'un dépôt (valeurs jamais lues ni renvoyées)
export default defineEventHandler(async (event) => {
  const { userId } = requireUser(event)

  const query = getQuery<{ repo?: string, branch?: string }>(event)
  if (!query.repo || !/^[\w.-]+\/[\w.-]+$/.test(query.repo)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid repository' })
  }
  const branch = query.branch?.trim() || 'HEAD'

  const token = await githubToken(event, userId)
  const response = await fetch(
    `https://api.github.com/repos/${query.repo}/contents/.env.example?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Accept: 'application/vnd.github.raw',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  )
  if (response.status === 404) return { names: [] }
  if (!response.ok) return { names: [] }

  return { names: envExampleNames(await response.text()) }
})
