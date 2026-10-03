// Supprime un projet, ses déploiements et ses fichiers stockés
export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const id = getRouterParam(event, 'id')
  const row = id ? await prisma.project.findUnique({ where: { id } }) : null

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  assertOwner(row, userId)

  await prisma.deployment.deleteMany({ where: { projectId: row.id } })
  await prisma.project.delete({ where: { id: row.id } })
  await removeProjectFiles(row.name)

  setResponseStatus(event, 204)
  return null
})
