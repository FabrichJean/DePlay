import type { EnvVariable } from '../../../../utils/env-variables'
// Variables d'environnement d'un projet : visibles uniquement par son propriétaire
export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const id = getRouterParam(event, 'id')
  const project = id ? await prisma.project.findUnique({ where: { id } }) : null
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  assertOwner(project, userId)

  return { variables: JSON.parse(project.envVars || '[]') as EnvVariable[] }
})
