export type FrameworkPreset = 'nuxt' | 'next' | 'vite' | 'static'

/** Origine du code : dépôt Git connecté ou fichiers déposés directement */
export type ProjectSource = 'git' | 'upload'

/** Site statique (website) ou processus qui écoute sur un port (webservice) */
export type ProjectType = 'website' | 'webservice'

export interface WebsiteProjectInput {
  name: string
  type: ProjectType
  source: ProjectSource
  /** Commande qui démarre le web service (vide pour un site) */
  startCommand: string
  /** Runtime du web service (clé de config/runtimes.json) */
  runtime: string
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
