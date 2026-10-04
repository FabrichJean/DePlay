import type { DeploymentSummary } from '~/types/deployment'

export function useDeployments() {
  return useFetch<{ deployments: DeploymentSummary[] }>('/api/deployments', {
    key: 'deployments',
  })
}
