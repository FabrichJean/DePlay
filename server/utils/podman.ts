import { spawn } from 'node:child_process'

// Podman rootless de l'utilisateur deplay : les mêmes conteneurs que ceux que lance le worker
const PODMAN = process.env.PODMAN_BIN || '/usr/bin/podman'
export const SERVICE_PREFIX = 'deplay-svc-'

export interface PodmanResult {
  code: number
  stdout: string
  stderr: string
}

export function serviceName(projectId: string): string {
  return `${SERVICE_PREFIX}${projectId}`
}

// Lance podman sans shell. Renvoie code -1 si le binaire est absent (poste de développement) ou en cas de délai dépassé
export function podman(args: string[], timeoutMs = 10_000): Promise<PodmanResult> {
  return new Promise((resolve) => {
    const child = spawn(PODMAN, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        HOME: process.env.DEPLAY_HOME || '/home/deplay',
        XDG_RUNTIME_DIR: `/run/user/${process.getuid?.() ?? 997}`,
      },
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })

    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
    child.on('error', (error) => {
      clearTimeout(timer)
      resolve({ code: -1, stdout, stderr: error.message })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code: code ?? -1, stdout, stderr })
    })
  })
}

export interface ContainerState {
  name: string
  /** running, exited, created… tel que renvoyé par podman */
  state: string
}

// État de tous les conteneurs de web services (y compris arrêtés)
export async function listServiceContainers(): Promise<ContainerState[] | null> {
  const result = await podman(['ps', '-a', '--filter', `name=${SERVICE_PREFIX}`, '--format', '{{.Names}}|{{.State}}'])
  if (result.code !== 0) return null

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, state] = line.split('|')
      return { name, state: state || 'unknown' }
    })
}

// Mémoire utilisée par les conteneurs en marche, ex. « 45.2MB / 1GiB »
export async function serviceMemory(names: string[]): Promise<Map<string, string>> {
  const memory = new Map<string, string>()
  if (!names.length) return memory

  const result = await podman(['stats', '--no-stream', '--format', '{{.Name}}|{{.MemUsage}}', ...names])
  if (result.code !== 0) return memory

  for (const line of result.stdout.split('\n')) {
    const [name, usage] = line.trim().split('|')
    if (name && usage) memory.set(name, usage)
  }
  return memory
}
