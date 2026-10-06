<script setup lang="ts">
useHead({ title: 'Services · Deplay' })

interface ServiceItem {
  id: string
  name: string
  url: string
  runtime: string
  port: number | null
  startCommand: string
  state: 'running' | 'exited' | 'created' | 'missing' | 'unknown' | string
  memory: string | null
  memoryLimit: string
  lastStatus: string | null
  lastAt: string | null
}

interface ServicesResponse {
  available: boolean
  limits: { maxServices: number, memory: string, cpus: string }
  services: ServiceItem[]
}

const REFRESH_MS = 15_000
const data = ref<ServicesResponse | null>(null)
const error = ref('')
let timer: ReturnType<typeof setInterval> | undefined

async function load() {
  try {
    data.value = await $fetch<ServicesResponse>('/api/services')
    error.value = ''
  } catch {
    error.value = 'Could not load services.'
  }
}

onMounted(() => {
  load()
  timer = setInterval(load, REFRESH_MS)
})
onBeforeUnmount(() => clearInterval(timer))

// Libellé et ton de chaque état du conteneur
function stateMeta(state: string): { label: string, tone: 'success' | 'neutral' } {
  if (state === 'running') return { label: 'Running', tone: 'success' }
  if (state === 'missing') return { label: 'Not started', tone: 'neutral' }
  if (state === 'unknown') return { label: 'Unknown', tone: 'neutral' }
  return { label: 'Stopped', tone: 'neutral' }
}

const UNITS: Record<string, number> = { B: 1, KB: 1e3, KIB: 1024, MB: 1e6, MIB: 1024 ** 2, GB: 1e9, GIB: 1024 ** 3 }

// « 45.2MiB / 1GiB » → 0 à 100 : la part utilisée de la limite
function usedPercent(usage: string | null, limit: string): number | null {
  if (!usage) return null
  const parse = (text: string) => {
    const match = text.trim().match(/^([\d.]+)\s*([A-Za-z]+)$/)
    if (!match) return null
    return Number(match[1]) * (UNITS[match[2].toUpperCase()] ?? NaN)
  }
  const used = parse(usage.split('/')[0] ?? '')
  const max = parse(limit)
  if (!used || !max || Number.isNaN(used) || Number.isNaN(max)) return null
  return Math.min(100, Math.round((used / max) * 100))
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : '—'
}
</script>

<template>
  <div class="page">
    <header class="head">
      <h1>Services</h1>
      <p class="subtitle">
        Your web services, refreshed every 15 seconds.
        <template v-if="data">{{ data.services.length }} / {{ data.limits.maxServices }} used · {{ data.limits.memory }} memory, {{ data.limits.cpus }} CPU each.</template>
      </p>
    </header>

    <p v-if="error" class="banner">{{ error }}</p>
    <p v-else-if="data && !data.available" class="banner">
      Podman is not reachable from the app. States below may be missing.
    </p>

    <section v-if="data && data.services.length" class="list">
      <article v-for="service in data.services" :key="service.id" class="card service">
        <div class="service-head">
          <div>
            <NuxtLink :to="`/projects/${service.id}`" class="name">{{ service.name }}</NuxtLink>
            <p class="muted">{{ service.runtime }} · port {{ service.port ?? '—' }}</p>
          </div>
          <StatusBadge
            :label="stateMeta(service.state).label"
            :tone="stateMeta(service.state).tone"
            :pulse="service.state === 'running'"
          />
        </div>

        <dl class="facts">
          <div>
            <dt>Memory</dt>
            <dd>{{ service.memory ?? '—' }}<span class="muted"> / {{ service.memoryLimit }}</span></dd>
            <div
              v-if="usedPercent(service.memory, service.memoryLimit) !== null"
              class="bar"
              role="progressbar"
              :aria-valuenow="usedPercent(service.memory, service.memoryLimit) ?? 0"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span :style="{ width: `${usedPercent(service.memory, service.memoryLimit)}%` }" />
            </div>
          </div>
          <div>
            <dt>Last deployment</dt>
            <dd>{{ service.lastStatus ?? '—' }} · {{ formatDate(service.lastAt) }}</dd>
          </div>
          <div>
            <dt>Command</dt>
            <dd class="mono">{{ service.startCommand || '—' }}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>
              <a v-if="service.url" :href="service.url" target="_blank" rel="noopener">{{ service.url }}</a>
              <span v-else class="muted">Not published yet</span>
            </dd>
          </div>
        </dl>

        <footer class="actions">
          <NuxtLink :to="`/logs?project=${service.id}`" class="btn btn-small">View logs</NuxtLink>
        </footer>
      </article>
    </section>

    <section v-else-if="data" class="card empty">
      <p>No web service yet. Create one from the New project menu.</p>
    </section>
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

.subtitle,
.muted {
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
}

.banner {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  font-size: 13px;
}

.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.card {
  padding: 18px 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.empty {
  color: var(--muted);
  font-size: 14px;
}

.service-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.name {
  font-weight: 600;
  font-size: 15px;
}

.facts {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
}

.facts dt {
  font-size: 12px;
  color: var(--muted);
}

.facts dd {
  font-size: 13px;
  margin-top: 2px;
  word-break: break-all;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.bar {
  height: 6px;
  margin-top: 6px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  background: var(--primary);
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.btn-small {
  height: 34px;
  padding: 0 12px;
  font-size: 13px;
}

@media (max-width: 640px) {
  .list {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
