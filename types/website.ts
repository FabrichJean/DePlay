export type FrameworkPreset = 'nuxt' | 'next' | 'vite' | 'static'

/** Origine du code : dépôt Git connecté ou fichiers déposés directement */
export type ProjectSource = 'git' | 'upload'

export interface WebsiteProjectInput {
  name: string
  source: ProjectSource
  /** Variables disponibles pendant l'installation et le build */
  env: { key: string, value: string }[]
  repository: string
  branch: string
  preset: FrameworkPreset
  rootDirectory: string
  installCommand: string
  buildCommand: string
  outputDirectory: string
}

export interface RepositoryOption {
  fullName: string
  /** Dépôt privé : affiché avec un cadenas */
  private: boolean
  defaultBranch: string
  detectedPreset: FrameworkPreset
  updatedLabel: string
}

export interface CreatedProject {
  id: string
  name: string
  fileCount?: number
}
