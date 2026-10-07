const MAX_TOKENS = 10

// Crée un jeton CLI. Le jeton en clair est renvoyé une seule fois.
export default defineEventHandler(async (event) => {
  const { userId } = requireSessionUser(event)

  const body = await readBody<{ name?: string }>(event)
  const name = body?.name?.trim() ?? ''
  if (!name || name.length > 40) {
    throw createError({ statusCode: 400, statusMessage: 'Name the token (1–40 characters).' })
  }

  const count = await prisma.apiToken.count({ where: { userId } })
  if (count >= MAX_TOKENS) {
    throw createError({ statusCode: 409, statusMessage: `Limit of ${MAX_TOKENS} tokens reached. Revoke one first.` })
  }

  const { token, hash, prefix } = generateToken()
  const row = await prisma.apiToken.create({ data: { userId, name, tokenHash: hash, prefix } })

  setResponseStatus(event, 201)
  return { id: row.id, name: row.name, prefix: row.prefix, createdAt: row.createdAt.toISOString(), lastUsedAt: null, token }
})
