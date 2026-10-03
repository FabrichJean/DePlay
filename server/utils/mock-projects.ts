import type { WorkspaceUsage } from '../../types/project'

// Usage du workspace : pas encore branché sur la facturation, donnée de démonstration
export const workspaceUsage: WorkspaceUsage = {
  usedPercent: 72,
  period: 'Last 30 days',
  items: [
    { label: 'Deployment Storage', value: '2.87 MB / 10 GB', percent: 29, icon: 'box' },
    { label: 'CDN Requests', value: '90 / 1M', percent: 2, icon: 'globe' },
    { label: 'Fast Data Transfer', value: '2.07 MB / 100 GB', percent: 2, icon: 'activity' },
    { label: 'Fast Origin Transfer', value: '0 / 10 GB', percent: 0, icon: 'server' },
  ],
}
