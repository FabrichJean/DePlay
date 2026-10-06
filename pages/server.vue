<script setup lang="ts">
useHead({ title: 'Server · Deplay' })

interface ServerResponse {
  cpu: { cores: number, load1: number, load5: number, load15: number, percent: number }
  memory: { totalBytes: number, usedBytes: number }
  disk: { totalBytes: number, usedBytes: number } | null
  worker: string
  services: { running: number, total: number }
  uptimeSeconds: number
  appUptimeSeconds: number
}

const REFRESH_MS = 10_000
const data = ref<ServerResponse | null>(null)
const error = ref('')
let timer: ReturnType<typeof setInterval> | undefined

async function load() {
  try {
    data.value = await $fetch<ServerResponse>('/api/server')
    error.value = ''
  } catch {
    error.value = 'Could not load server status.'
  }
}

onMounted(() => {
  load()
  timer = setInterval(load, REFRESH_MS)
})
onBeforeUnmount(() => clearInterval(timer))

function percent(used: number, total: number): number {
  return total ? Math.min(100, Math.round((used / total) * 100)) : 0
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(0)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days) return `${days}d ${hours}h`
  if (hours) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
</script>

<template>
  <div class="page">
    <header class="head">
      <h1>Server</h1>
      <p class="subtitle">Health of the machine that runs Deplay. Refreshed every 10 seconds.</p>
    </header>

    <p v-if="error" class="banner">{{ error }}</p>

    <template v-if="data">
      <section class="grid">
        <article class="card">
          <h2>CPU</h2>
          <p class="big">{{ data.cpu.percent }}%</p>
          <div class="bar" role="progressbar" :aria-valuenow="data.cpu.percent" aria-valuemin="0" aria-valuemax="100">
            <span :style="{ width: `${data.cpu.percent}%` }" />
          </div>
          <p class="muted">Load {{ data.cpu.load1 }} · {{ data.cpu.load5 }} · {{ data.cpu.load15 }} on {{ data.cpu.cores }} cores</p>
        </article>

        <article class="card">
          <h2>Memory</h2>
          <p class="big">{{ percent(data.memory.usedBytes, data.memory.totalBytes) }}%</p>
          <div class="bar" role="progressbar" :aria-valuenow="percent(data.memory.usedBytes, data.memory.totalBytes)" aria-valuemin="0" aria-valuemax="100">
            <span :style="{ width: `${percent(data.memory.usedBytes, data.memory.totalBytes)}%` }" />
          </div>
          <p class="muted">{{ formatBytes(data.memory.usedBytes) }} of {{ formatBytes(data.memory.totalBytes) }}</p>
        </article>

        <article class="card">
          <h2>Disk</h2>
          <template v-if="data.disk">
            <p class="big">{{ percent(data.disk.usedBytes, data.disk.totalBytes) }}%</p>
            <div class="bar" role="progressbar" :aria-valuenow="percent(data.disk.usedBytes, data.disk.totalBytes)" aria-valuemin="0" aria-valuemax="100">
              <span :style="{ width: `${percent(data.disk.usedBytes, data.disk.totalBytes)}%` }" />
            </div>
            <p class="muted">{{ formatBytes(data.disk.usedBytes) }} of {{ formatBytes(data.disk.totalBytes) }}</p>
          </template>
          <p v-else class="muted">Unavailable</p>
        </article>

        <article class="card">
          <h2>Worker</h2>
          <p class="big" :class="data.worker === 'active' ? 'ok' : 'warn'">{{ data.worker }}</p>
          <p class="muted">Builds and web services run through this process.</p>
        </article>

        <article class="card">
          <h2>Web services</h2>
          <p class="big">{{ data.services.running }} / {{ data.services.total }}</p>
          <p class="muted">Running containers out of all services.</p>
        </article>

        <article class="card">
          <h2>Uptime</h2>
          <p class="big">{{ formatUptime(data.uptimeSeconds) }}</p>
          <p class="muted">Deplay app up for {{ formatUptime(data.appUptimeSeconds) }}</p>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

h1 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

h2 {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}

.subtitle,
.muted {
  margin-top: 4px;
  color: var(--muted);
  font-size: 13px;
}

.banner {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 16px;
}

.card {
  padding: 18px 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.big {
  margin: 8px 0;
  font-size: 26px;
  font-weight: 700;
}

.ok {
  color: #22c78a;
}

.warn {
  color: #f59e0b;
}

.bar {
  height: 6px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  background: var(--primary);
}
</style>
