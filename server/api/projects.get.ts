export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const rows = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: 'desc' },
  })

  return {
    projects: rows.map(toProject),
    usage: workspaceUsage,
  }
})
