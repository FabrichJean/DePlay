import { createHash, randomBytes } from 'node:crypto'

export const TOKEN_PREFIX = 'dpl_'

declare module 'h3' {
  interface H3EventContext {
    /** Renseigné par server/middleware/api-token.ts quand la requête porte un jeton CLI valide */
    apiToken?: { id: string, userId: string, name: string }
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateToken(): { token: string, hash: string, prefix: string } {
  const token = TOKEN_PREFIX + randomBytes(24).toString('base64url')
  return { token, hash: hashToken(token), prefix: token.slice(0, 10) }
}
