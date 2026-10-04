import type { Project as ProjectRow } from '@prisma/client'
import type { Project, ProjectKind, ProjectStatus } from '../../types/project'

const DAY_MS = 24 * 60 * 60 * 1000

// « 2h ago », « 3d ago » pour les dates récentes, sinon « Jan 27 »
export function relativeLabel(date: Date): string {
  const elapsed = Date.now() - date.getTime()
  if (elapsed < DAY_MS) return `${Math.max(1, Math.floor(elapsed / (60 * 60 * 1000)))}h ago`
  if (elapsed < 7 * DAY_MS) return `${Math.floor(elapsed / DAY_MS)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Transforme une ligne de la base dans le format attendu par l'interface
export function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    description: row.description,
    kind: row.kind as ProjectKind,
    status: row.status as ProjectStatus,
    branch: row.branch,
    updatedAt: row.updatedAt.toISOString(),
    updatedLabel: relativeLabel(row.updatedAt),
    stats: {
      deployments: row.deployments,
      requests: row.requests,
      errors: row.errorRate,
    },
    sparkline: row.sparkline ? row.sparkline.split(',').map(Number) : [],
  }
}
