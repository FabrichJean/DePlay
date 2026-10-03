import type { Deployment } from '~/types/deployment'

export function useDeployment(id: string) {
  return useFetch<Deployment>(`/api/deployments/${id}`, {
    key: `deployment:${id}`,
  })
}
