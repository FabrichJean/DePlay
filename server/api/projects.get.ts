export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const rows = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: 'desc' },
  })

  const activity = await projectActivity(rows.map((row) => ({ id: row.id, name: row.name })))

  return {
    projects: rows.map((row) => toProject(row, activity.get(row.id))),
    usage: workspaceUsage,
  }
})
