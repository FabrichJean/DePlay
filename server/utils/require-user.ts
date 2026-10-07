import type { H3Event } from 'h3'

// Renvoie l'utilisateur de la requête (session Clerk ou jeton CLI), ou une 401 si personne n'est connecté
export function requireUser(event: H3Event) {
  const token = event.context.apiToken
  if (token) return { userId: token.userId }

  return requireSessionUser(event)
}

// Session Clerk uniquement : un jeton CLI ne peut pas gérer les jetons
export function requireSessionUser(event: H3Event) {
  const auth = event.context.auth?.()

  if (!auth?.userId) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  }

  return auth
}
