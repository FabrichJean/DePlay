import type { H3Event } from 'h3'

// Identifiant Clerk de l'utilisateur connecté (401 sinon)
export function currentUserId(event: H3Event): string {
  return requireUser(event).userId as string
}

// Un projet qui n'appartient pas à l'utilisateur est traité comme inexistant : on ne révèle pas qu'il existe
export function assertOwner(project: { ownerId: string | null }, userId: string): void {
  if (project.ownerId !== userId) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
}
