export default defineEventHandler(async () => {
  const rows = await prisma.project.findMany({ orderBy: { updatedAt: 'desc' } })

  return {
    projects: rows.map(toProject),
    usage: workspaceUsage,
  }
})
