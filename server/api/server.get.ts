import { execFile } from 'node:child_process'
import { cpus, freemem, loadavg, totalmem, uptime } from 'node:os'

// Santé du VPS : charge, mémoire, disque et worker. Aucune adresse IP ni nom d'hôte n'est renvoyé
function run(command: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    // systemctl is-active sort en erreur quand le service est arrêté, mais écrit quand même son état
    execFile(command, args, { timeout: 5000 }, (error, stdout) => {
      resolve(stdout || (error ? null : ''))
    })
  })
}

// Disque : taille et espace utilisé de la partition qui contient Deplay
async function diskUsage(): Promise<{ totalBytes: number, usedBytes: number } | null> {
  const output = await run('df', ['-P', '-B1', process.cwd()])
  if (!output) return null

  const line = output.trim().split('\n').at(-1)
  const columns = line?.split(/\s+/)
  if (!columns || columns.length < 4) return null

  return { totalBytes: Number(columns[1]), usedBytes: Number(columns[2]) }
}

export default defineEventHandler(async (event) => {
  currentUserId(event)

  const [disk, worker, services] = await Promise.all([
    diskUsage(),
    run('systemctl', ['is-active', 'deplay-worker']),
    listServiceContainers(),
  ])

  const load = loadavg()
  const cores = cpus().length

  return {
    cpu: {
      cores,
      load1: Number(load[0].toFixed(2)),
      load5: Number(load[1].toFixed(2)),
      load15: Number(load[2].toFixed(2)),
      // Charge sur 1 minute, en pourcentage des cœurs
      percent: Math.min(100, Math.round((load[0] / cores) * 100)),
    },
    memory: {
      totalBytes: totalmem(),
      usedBytes: totalmem() - freemem(),
    },
    disk,
    worker: worker === null ? 'unknown' : worker.trim(),
    services: {
      running: (services ?? []).filter((item) => item.state === 'running').length,
      total: (services ?? []).length,
    },
    uptimeSeconds: Math.round(uptime()),
    appUptimeSeconds: Math.round(process.uptime()),
  }
})
