import type { Project as ProjectRow } from '@prisma/client'
import type { WorkspaceUsage } from '../../types/project'
import type { ProjectActivity } from './project-activity'

const MB = 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * MB) return `${(bytes / MB).toFixed(1)} MB`
  return `${(bytes / (1024 * MB)).toFixed(2)} GB`
}

function formatCount(value: number): string {
  if (value < 1000) return String(value)
  if (value < 1_000_000) return `${(value / 1000).toFixed(1)}k`
  return `${(value / 1_000_000).toFixed(1)}M`
}

// Usage réel du compte : stockage (sur le quota), puis trafic et visites des 14 derniers jours
export function buildWorkspaceUsage(
  rows: ProjectRow[],
  activity: Map<string, ProjectActivity>,
  quotaBytes: number,
): WorkspaceUsage {
  const storage = rows.reduce((sum, row) => sum + row.sourceBytes + row.outputBytes, 0)
  const requests = [...activity.values()].reduce((sum, item) => sum + item.requests, 0)
  const visits = [...activity.values()].reduce((sum, item) => sum + item.visits, 0)
  const bytes = [...activity.values()].reduce((sum, item) => sum + item.bytes, 0)
  const storagePercent = Math.min(100, Math.round((storage / quotaBytes) * 100))

  return {
    usedPercent: storagePercent,
    period: 'Last 14 days',
    items: [
      {
        label: 'Storage',
        value: `${formatBytes(storage)} / ${formatBytes(quotaBytes)}`,
        percent: storagePercent,
        icon: 'box',
      },
      { label: 'Requests', value: formatCount(requests), percent: null, icon: 'globe' },
      { label: 'Data sent', value: formatBytes(bytes), percent: null, icon: 'activity' },
      { label: 'Visits', value: formatCount(visits), percent: null, icon: 'eye' },
    ],
  }
}
