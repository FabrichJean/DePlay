import type { IconName } from '../constants/icons'

export type ProjectKind = 'none' | 'react' | 'bolt'
export type ProjectStatus = 'live' | 'building' | 'attention'

export interface ProjectStats {
  deployments: number
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
  percent: number
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
