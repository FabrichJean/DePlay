import type { Project as ProjectRow } from '@prisma/client'
import type { Project, ProjectKind, ProjectStatus } from '../../types/project'
import type { ProjectActivity } from './project-activity'

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

// « 2h ago », « 3d ago » pour les dates récentes, sinon « Jan 27 »
export function relativeLabel(date: Date): string {
  const elapsed = Date.now() - date.getTime()
  if (elapsed < MINUTE_MS) return 'just now'
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m ago`
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`
  if (elapsed < 7 * DAY_MS) return `${Math.floor(elapsed / DAY_MS)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Transforme une ligne de la base dans le format attendu par l'interface.
// L'activité (déploiements, dernier passage) vient des déploiements réels, pas des colonnes figées.
export function toProject(row: ProjectRow, activity?: ProjectActivity): Project {
  // La date affichée est la dernière activité : modification du projet ou nouveau déploiement
  const lastActivity = activity?.lastAt && activity.lastAt > row.updatedAt ? activity.lastAt : row.updatedAt

  return {
    id: row.id,
    name: row.name,
    url: row.url,
    description: row.description,
    kind: row.kind as ProjectKind,
    status: row.status as ProjectStatus,
    source: row.source === 'upload' ? 'upload' : 'git',
    // Un upload n'a pas de branche ; un dépôt affiche la branche du dernier déploiement
    branch: row.source === 'upload' ? '' : activity?.lastBranch || row.branch,
    updatedAt: lastActivity.toISOString(),
    updatedLabel: relativeLabel(lastActivity),
    stats: {
      deployments: activity?.deployments ?? 0,
      // Pas encore de mesure de trafic : on n'affiche pas de faux chiffres
      requests: '—',
      errors: '—',
    },
    sparkline: activity?.sparkline ?? [],
  }
}
