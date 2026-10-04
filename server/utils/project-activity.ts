import { siteTraffic } from './site-traffic'

const SPARKLINE_DAYS = 14

export interface ProjectActivity {
  /** Nombre total de déploiements du projet */
  deployments: number
  /** Date du dernier déploiement */
  lastAt: Date | null
  /** Branche du dernier déploiement */
  lastBranch: string
  /** Requêtes sur les 14 derniers jours, d'après le journal nginx du site */
  requests: number
  /** Réponses 5xx sur les 14 derniers jours */
  errors: number
  /** Requêtes par jour, du plus ancien au plus récent */
  dailyRequests: number[]
}

// Activité réelle des projets : déploiements en base, trafic dans les journaux des sites
export async function projectActivity(projects: { id: string, name: string }[]): Promise<Map<string, ProjectActivity>> {
  const result = new Map<string, ProjectActivity>()
  for (const project of projects) {
    result.set(project.id, {
      deployments: 0,
      lastAt: null,
      lastBranch: '',
      requests: 0,
      errors: 0,
      dailyRequests: new Array(SPARKLINE_DAYS).fill(0),
    })
  }
  if (!projects.length) return result

  const rows = await prisma.deployment.findMany({
    where: { projectId: { in: projects.map((project) => project.id) } },
    select: { projectId: true, createdAt: true, branch: true },
  })

  for (const row of rows) {
    const activity = row.projectId ? result.get(row.projectId) : undefined
    if (!activity) continue

    activity.deployments++
    if (!activity.lastAt || row.createdAt > activity.lastAt) {
      activity.lastAt = row.createdAt
      activity.lastBranch = row.branch
    }
  }

  const traffic = await Promise.all(projects.map((project) => siteTraffic(project.name)))
  projects.forEach((project, index) => {
    const activity = result.get(project.id)
    if (!activity) return
    activity.requests = traffic[index].requests
    activity.errors = traffic[index].errors
    activity.dailyRequests = traffic[index].daily
  })

  return result
}
