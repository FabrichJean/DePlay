import { envVariablesError, normalizeEnvVariables } from '../../../../utils/env-variables'
// Remplace les variables d'environnement d'un projet (appliquées au prochain déploiement)
export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const id = getRouterParam(event, 'id')
  const project = id ? await prisma.project.findUnique({ where: { id } }) : null
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  assertOwner(project, userId)

  const body = await readBody<{ variables?: unknown }>(event)
  const variables = normalizeEnvVariables(body?.variables)
  const error = envVariablesError(variables)
  if (error) {
    throw createError({ statusCode: 400, statusMessage: error, data: { errors: { env: error } } })
  }

  await prisma.project.update({ where: { id: project.id }, data: { envVars: JSON.stringify(variables) } })
  return { variables }
})
