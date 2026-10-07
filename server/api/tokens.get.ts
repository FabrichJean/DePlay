// Jetons CLI de l'utilisateur (sans le jeton lui-même, qui n'est jamais stocké en clair)
export default defineEventHandler(async (event) => {
  const { userId } = requireSessionUser(event)

  const rows = await prisma.apiToken.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  }))
})
