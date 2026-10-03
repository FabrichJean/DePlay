export default defineEventHandler(async (event) => {
  requireUser(event)

  const id = getRouterParam(event, 'id')
  const row = id ? await prisma.deployment.findUnique({ where: { id } }) : null

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Deployment not found' })
  }

  return toDeployment(row)
})
