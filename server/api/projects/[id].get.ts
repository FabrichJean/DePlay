export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const id = getRouterParam(event, 'id')
  const row = id ? await prisma.project.findUnique({ where: { id } }) : null

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  assertOwner(row, userId)

  return toProject(row)
})
