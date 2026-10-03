import type { ProjectStatus } from '~/types/project'

// Libellé et couleur de chaque statut, partagés par les badges, sparklines et aperçus
export const STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
  live: { label: 'Live', color: '#22c78a' },
  building: { label: 'Building', color: '#3b82f6' },
  attention: { label: 'Attention', color: '#f59e0b' },
}
