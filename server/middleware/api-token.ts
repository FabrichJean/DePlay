// Authentification de la CLI : « Authorization: Bearer dpl_… ». Un jeton inconnu est refusé tout de suite,
// pour ne pas retomber silencieusement sur une requête anonyme.
export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/')) return

  const header = getHeader(event, 'authorization')
  if (!header?.startsWith(`Bearer ${TOKEN_PREFIX}`)) return

  const row = await prisma.apiToken.findUnique({ where: { tokenHash: hashToken(header.slice(7).trim()) } })
  if (!row) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or revoked API token' })
  }

  event.context.apiToken = { id: row.id, userId: row.userId, name: row.name }
  await prisma.apiToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
})
