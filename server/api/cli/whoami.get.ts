// Vérification du jeton par la CLI (deplay login / whoami)
export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)
  const [projects, used] = await Promise.all([
    prisma.project.count({ where: { ownerId: userId } }),
    storageUsed(userId),
  ])

  return {
    userId,
    token: event.context.apiToken?.name ?? null,
    projects,
    storage: { used, quota: limits.storageQuotaBytes },
  }
})
