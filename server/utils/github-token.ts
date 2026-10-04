import { clerkClient } from '@clerk/nuxt/server'
import type { H3Event } from 'h3'

// Jeton OAuth GitHub de l'utilisateur, conservé par Clerk. Null si le compte n'est pas connecté à GitHub
export async function githubToken(event: H3Event, userId: string): Promise<string | null> {
  const tokens = await clerkClient(event).users.getUserOauthAccessToken(userId, 'github')
  return tokens.data[0]?.token ?? null
}
