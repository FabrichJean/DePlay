import type { IconName } from '../constants/icons'

export type StepStatus = 'done' | 'running' | 'pending'

export interface DeploymentStep {
  key: string
  label: string
  duration: string
  status: StepStatus
}

export type LogTone = 'default' | 'muted' | 'success'

export interface LogLine {
  time: string
  message: string
  tone: LogTone
}

export interface Metric {
  key: string
  label: string
  value: string
  delta: string
  icon: IconName
  points: number[]
}

export interface AppInfo {
  name: string
  framework: string
  runtime: string
  port: number
  memory: string
  cpu: string
  created: string
}

export interface ServerInfo {
  status: 'online' | 'offline'
  ip: string
  provider: string
  location: string
  flag: string
}

export interface BuildInfo {
  source: 'git' | 'upload'
  repository: string
  branch: string
  preset: string
  rootDirectory: string
  installCommand: string
  buildCommand: string
  outputDirectory: string
  fileCount: number
}

export interface Deployment {
  id: string
  name: string
  description: string
  type: string
  runtime: string
  environment: string
  url: string
  branch: string
  commit: string
  status: 'deployed' | 'failed' | 'building'
  deployedAt: string
  duration: string
  steps: DeploymentStep[]
  logs: LogLine[]
  info: AppInfo
  server: ServerInfo
  metrics: Metric[]
  /** Configuration de build ; vide pour les déploiements créés avant ce champ */
  build: Partial<BuildInfo>
}
