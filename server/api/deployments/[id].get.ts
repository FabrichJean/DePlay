export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const id = getRouterParam(event, 'id')
  const row = id ? await prisma.deployment.findUnique({ where: { id } }) : null

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Deployment not found' })
  }

  // Le déploiement n'est visible que si son projet appartient à l'utilisateur
  const project = row.projectId ? await prisma.project.findUnique({ where: { id: row.projectId } }) : null
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Deployment not found' })
  }
  assertOwner(project, userId)

  return toDeployment(row)
})
