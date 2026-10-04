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

// 1 234 → « 1.2k » ; les petits nombres restent exacts
function formatCount(value: number): string {
  if (value < 1000) return String(value)
  if (value < 1_000_000) return `${(value / 1000).toFixed(1)}k`
  return `${(value / 1_000_000).toFixed(1)}M`
}

// Part des réponses 5xx sur l'ensemble des requêtes
function errorRate(activity?: ProjectActivity): string {
  if (!activity?.requests) return '0%'
  const percent = (activity.errors / activity.requests) * 100
  return `${percent < 10 ? percent.toFixed(1) : Math.round(percent)}%`
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
    // L'adresse change à chaque capture : le paramètre v force le navigateur à recharger l'image
    thumbnailUrl: row.thumbnailAt ? `/api/projects/${row.id}/thumbnail?v=${row.thumbnailAt.getTime()}` : null,
    // Un upload n'a pas de branche ; un dépôt affiche la branche du dernier déploiement
    branch: row.source === 'upload' ? '' : activity?.lastBranch || row.branch,
    updatedAt: lastActivity.toISOString(),
    updatedLabel: relativeLabel(lastActivity),
    stats: {
      deployments: activity?.deployments ?? 0,
      visits: formatCount(activity?.visits ?? 0),
      requests: formatCount(activity?.requests ?? 0),
      errors: errorRate(activity),
    },
    // La courbe suit les visites : c'est ce qui se rapproche le plus de l'audience
    sparkline: activity?.dailyVisits ?? [],
  }
}
