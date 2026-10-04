import type { Project as ProjectRow } from '@prisma/client'
import type { FrameworkPreset } from '../../types/website'

const PRESET_LABELS: Record<FrameworkPreset, string> = {
  nuxt: 'Nuxt',
  next: 'Next.js',
  vite: 'Vite',
  static: 'Static HTML',
}

interface InitialDeploymentOptions {
  source: 'git' | 'upload'
  repository: string
  fileCount: number
  /** Jeton GitHub de l'utilisateur, pour les dépôts privés */
  cloneToken?: string | null
}

function timestamp(): string {
  return new Date().toLocaleTimeString('en-GB', { hour12: false })
}

// Premier déploiement d'un projet : en file d'attente, en attendant le worker de build
export function initialDeploymentData(project: ProjectRow, options: InitialDeploymentOptions) {
  const now = timestamp()
  const origin =
    options.source === 'git'
      ? `Cloning repository ${options.repository}...`
      : `Received ${options.fileCount} uploaded file${options.fileCount > 1 ? 's' : ''}.`

  const logs = [
    { time: now, message: 'Deployment queued.', tone: 'default' },
    { time: now, message: origin, tone: 'default' },
    { time: now, message: 'Waiting for a build worker...', tone: 'muted' },
  ]

  const steps = [
    { key: 'build', label: 'Build', duration: '—', status: 'running' },
    { key: 'test', label: 'Test', duration: '—', status: 'pending' },
    { key: 'deploy', label: 'Deploy', duration: '—', status: 'pending' },
    { key: 'live', label: 'Live', duration: '—', status: 'pending' },
  ]

  return {
    projectId: project.id,
    name: project.name,
    description: project.description,
    type: 'Web Application',
    runtime: 'Node.js',
    environment: 'Production',
    url: '',
    branch: project.branch,
    commit: '',
    status: 'building',
    cloneToken: options.cloneToken ?? null,
    deployedAt: 'In progress',
    duration: '—',
    steps: JSON.stringify(steps),
    logs: JSON.stringify(logs),
    info: JSON.stringify({
      name: project.name,
      framework: PRESET_LABELS[project.preset as FrameworkPreset] ?? project.preset,
      runtime: 'Node.js',
      port: 3000,
      memory: '—',
      cpu: '—',
      created: project.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }),
    server: JSON.stringify({ status: 'offline', ip: '—', provider: '—', location: '—', flag: '' }),
    metrics: '[]',
    build: JSON.stringify({
      source: options.source,
      repository: project.repository,
      branch: project.branch,
      preset: project.preset,
      rootDirectory: project.rootDirectory,
      installCommand: project.installCommand,
      buildCommand: project.buildCommand,
      outputDirectory: project.outputDirectory,
      fileCount: options.fileCount,
    }),
  }
}
