import type { H3Event } from 'h3'

// Renvoie l'utilisateur Clerk de la requête, ou une 401 si personne n'est connecté
export function requireUser(event: H3Event) {
  const auth = event.context.auth?.()

  if (!auth?.userId) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  }

  return auth
}
