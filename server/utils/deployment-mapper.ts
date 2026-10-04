import type { Deployment as DeploymentRow } from '@prisma/client'
import type { Deployment } from '../../types/deployment'

// Transforme une ligne de la base dans le format attendu par la page de déploiement
export function toDeployment(row: DeploymentRow): Deployment {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    runtime: row.runtime,
    environment: row.environment,
    url: row.url,
    branch: row.branch,
    commit: row.commit,
    status: row.status as Deployment['status'],
    deployedAt: row.deployedAt,
    duration: row.duration,
    steps: JSON.parse(row.steps),
    logs: JSON.parse(row.logs),
    info: JSON.parse(row.info),
    server: JSON.parse(row.server),
    metrics: JSON.parse(row.metrics),
    build: JSON.parse(row.build || '{}'),
  }
}
