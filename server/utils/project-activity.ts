const DAY_MS = 24 * 60 * 60 * 1000
const SPARKLINE_DAYS = 14

export interface ProjectActivity {
  /** Nombre total de déploiements du projet */
  deployments: number
  /** Date du dernier déploiement */
  lastAt: Date | null
  /** Branche du dernier déploiement */
  lastBranch: string
  /** Déploiements par jour, sur les 14 derniers jours (le plus ancien d'abord) */
  sparkline: number[]
}

// Activité réelle des projets, calculée à partir des déploiements
export async function projectActivity(projectIds: string[]): Promise<Map<string, ProjectActivity>> {
  const result = new Map<string, ProjectActivity>()
  for (const id of projectIds) {
    result.set(id, { deployments: 0, lastAt: null, lastBranch: '', sparkline: new Array(SPARKLINE_DAYS).fill(0) })
  }
  if (!projectIds.length) return result

  const since = new Date(Date.now() - SPARKLINE_DAYS * DAY_MS)
  since.setHours(0, 0, 0, 0)

  const rows = await prisma.deployment.findMany({
    where: { projectId: { in: projectIds } },
    select: { projectId: true, createdAt: true, branch: true },
  })

  for (const row of rows) {
    if (!row.projectId) continue
    const activity = result.get(row.projectId)
    if (!activity) continue

    activity.deployments++
    if (!activity.lastAt || row.createdAt > activity.lastAt) {
      activity.lastAt = row.createdAt
      activity.lastBranch = row.branch
    }

    const day = Math.floor((row.createdAt.getTime() - since.getTime()) / DAY_MS)
    if (day >= 0 && day < SPARKLINE_DAYS) activity.sparkline[day]++
  }

  return result
}
