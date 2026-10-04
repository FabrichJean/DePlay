import type { DeploymentSummary } from '../../types/deployment'

// Tous les déploiements des projets de l'utilisateur, les plus récents d'abord
export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    select: { id: true, name: true },
  })
  const names = new Map(projects.map((project) => [project.id, project.name]))

  const rows = await prisma.deployment.findMany({
    where: { projectId: { in: [...names.keys()] } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const items: DeploymentSummary[] = rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    projectName: (row.projectId && names.get(row.projectId)) || row.name,
    status: row.status as DeploymentSummary['status'],
    branch: row.branch,
    url: row.url,
    duration: row.duration,
    deployedLabel: row.deployedAt,
    createdLabel: relativeLabel(row.createdAt),
  }))

  return { deployments: items }
})
