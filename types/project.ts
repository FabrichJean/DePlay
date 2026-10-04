import type { IconName } from '../constants/icons'

export type ProjectKind = 'none' | 'react' | 'bolt'
export type ProjectStatus = 'live' | 'building' | 'attention'

export interface ProjectStats {
  deployments: number
  visits: string
  requests: string
  errors: string
}

export interface Project {
  id: string
  name: string
  url: string
  description: string
  kind: ProjectKind
  status: ProjectStatus
  /** Capture d'écran du site publié (vide si aucune) */
  thumbnailUrl: string | null
  /** Origine du code : dépôt Git ou fichiers déposés */
  source: 'git' | 'upload'
  /** Branche du dernier déploiement (vide pour un upload) */
  branch: string
  /** Date ISO, utilisée pour le tri */
  updatedAt: string
  /** Libellé affiché, ex. « 2h ago » */
  updatedLabel: string
  stats: ProjectStats
  sparkline: number[]
}

export interface UsageItem {
  label: string
  value: string
  /** Part du quota utilisé ; null si l'élément n'a pas de limite (la barre n'est pas affichée) */
  percent: number | null
  icon: IconName
}

export interface WorkspaceUsage {
  usedPercent: number
  period: string
  items: UsageItem[]
}

export interface ProjectsResponse {
  projects: Project[]
  usage: WorkspaceUsage
}
