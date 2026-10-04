// Espace utilisé par un compte : sources uploadées + dernier site publié, de tous ses projets
export async function storageUsed(ownerId: string | null, excludeProjectId?: string): Promise<number> {
  if (!ownerId) return 0
  const projects = await prisma.project.findMany({
    where: { ownerId, ...(excludeProjectId ? { id: { not: excludeProjectId } } : {}) },
    select: { sourceBytes: true, outputBytes: true },
  })
  return projects.reduce((sum, project) => sum + project.sourceBytes + project.outputBytes, 0)
}

export function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}
