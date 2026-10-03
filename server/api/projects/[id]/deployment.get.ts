// Dernier déploiement d'un projet, affiché sur la page de détail du projet
export default defineEventHandler(async (event) => {
  requireUser(event)

  const id = getRouterParam(event, 'id')
  const row = id
    ? await prisma.deployment.findFirst({ where: { projectId: id }, orderBy: { createdAt: 'desc' } })
    : null

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'No deployment for this project' })
  }

  return toDeployment(row)
})
