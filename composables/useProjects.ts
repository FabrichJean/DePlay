import type { ProjectsResponse } from '~/types/project'

export function useProjects() {
  return useFetch<ProjectsResponse>('/api/projects', {
    key: 'projects',
  })
}
