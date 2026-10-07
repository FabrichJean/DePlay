// Révoque un jeton CLI
export default defineEventHandler(async (event) => {
  const { userId } = requireSessionUser(event)

  const id = getRouterParam(event, 'id')
  const row = id ? await prisma.apiToken.findUnique({ where: { id } }) : null
  if (!row || row.userId !== userId) {
    throw createError({ statusCode: 404, statusMessage: 'Token not found' })
  }

  await prisma.apiToken.delete({ where: { id: row.id } })
  setResponseStatus(event, 204)
  return null
})
