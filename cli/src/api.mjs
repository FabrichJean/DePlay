export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export function createClient({ api, token }) {
  async function request(method, path, body) {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    let payload
    if (body instanceof FormData) payload = body
    else if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      payload = JSON.stringify(body)
    }

    let response
    try {
      response = await fetch(`${api}${path}`, { method, headers, body: payload })
    } catch (error) {
      throw new Error(`Cannot reach ${api} (${error.cause?.code || error.message})`)
    }

    const text = await response.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      // réponse non JSON (page d'erreur du proxy, etc.)
    }

    if (!response.ok) {
      const errors = data?.data?.errors
      const detail = errors ? Object.values(errors).join(' ') : ''
      const message = detail || data?.statusMessage || data?.message || `HTTP ${response.status}`
      throw new ApiError(message, response.status, errors)
    }
    return data
  }

  return {
    whoami: () => request('GET', '/api/cli/whoami'),
    createWebsite: (form) => request('POST', '/api/projects/website', form),
    uploadFiles: (projectId, form) => request('POST', `/api/projects/${encodeURIComponent(projectId)}/upload`, form),
    project: (projectId) => request('GET', `/api/projects/${encodeURIComponent(projectId)}`),
    latestDeployment: (projectId) => request('GET', `/api/projects/${encodeURIComponent(projectId)}/deployment`),
  }
}
