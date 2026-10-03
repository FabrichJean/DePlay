// Dernier déploiement d'un projet, affiché sur la page de détail du projet
export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const id = getRouterParam(event, 'id')
  const project = id ? await prisma.project.findUnique({ where: { id } }) : null

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'No deployment for this project' })
  }
  assertOwner(project, userId)

  const row = await prisma.deployment.findFirst({ where: { projectId: project.id }, orderBy: { createdAt: 'desc' } })

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'No deployment for this project' })
  }

  return toDeployment(row)
})
