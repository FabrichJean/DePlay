export type FrameworkPreset = 'nuxt' | 'next' | 'vite' | 'static'

export interface WebsiteProjectInput {
  name: string
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
  defaultBranch: string
  detectedPreset: FrameworkPreset
  updatedLabel: string
}

export interface CreatedProject {
  id: string
  name: string
}
