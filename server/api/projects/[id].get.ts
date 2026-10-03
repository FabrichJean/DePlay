export default defineEventHandler(async (event) => {
  requireUser(event)

  const id = getRouterParam(event, 'id')
  const row = id ? await prisma.project.findUnique({ where: { id } }) : null

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  return toProject(row)
})
