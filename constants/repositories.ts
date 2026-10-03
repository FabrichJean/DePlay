import type { RepositoryOption } from '~/types/website'

// Dépôts accessibles au compte. À remplacer par la liste renvoyée par l'intégration GitHub.
export const REPOSITORIES: RepositoryOption[] = [
  { fullName: 'FabrichJean/model-scraper', defaultBranch: 'main', detectedPreset: 'vite', updatedLabel: 'Updated 1d ago' },
  { fullName: 'FabrichJean/epta-view', defaultBranch: 'main', detectedPreset: 'vite', updatedLabel: 'Updated Apr 18' },
  { fullName: 'FabrichJean/land', defaultBranch: 'main', detectedPreset: 'static', updatedLabel: 'Updated Jan 27' },
  { fullName: 'FabrichJean/Sagebiz', defaultBranch: 'main', detectedPreset: 'next', updatedLabel: 'Updated 11/24/25' },
]
