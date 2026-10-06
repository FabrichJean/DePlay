<script setup lang="ts">
import type { ProjectsResponse } from '~/types/project'

useHead({ title: 'Logs · Deplay' })

interface BuildLine {
  time: string
  message: string
  tone: 'default' | 'muted' | 'success'
}

interface LogsResponse {
  project: { id: string, name: string, type: 'website' | 'webservice' }
  build: { deploymentId: string, status: string, createdAt: string, lines: BuildLine[] } | null
  runtime: { available: boolean, state: string, lines: string[] } | null
}

const REFRESH_MS = 5_000
const route = useRoute()
const { data: projectsData } = await useProjects()
const projects = computed(() => (projectsData.value as ProjectsResponse | null)?.projects ?? [])

const selectedId = ref(typeof route.query.project === 'string' ? route.query.project : '')
const logs = ref<LogsResponse | null>(null)
const error = ref('')
let timer: ReturnType<typeof setInterval> | undefined

async function load() {
  if (!selectedId.value) return
  try {
    logs.value = await $fetch<LogsResponse>(`/api/projects/${selectedId.value}/logs`)
    error.value = ''
  } catch {
    error.value = 'Could not load logs.'
  }
}

// Choisir un projet recharge ses journaux tout de suite
watch(selectedId, load)

onMounted(() => {
  if (!selectedId.value && projects.value.length) selectedId.value = projects.value[0].id
  timer = setInterval(load, REFRESH_MS)
  load()
})
onBeforeUnmount(() => clearInterval(timer))

const runtimeLines = computed(() => logs.value?.runtime?.lines ?? [])

function formatDate(value: string): string {
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div class="page">
    <header class="head">
      <h1>Logs</h1>
      <p class="subtitle">Last build and, for web services, the running process. Refreshed every 5 seconds.</p>
    </header>

    <label class="picker">
      <span class="label">Project</span>
      <select v-model="selectedId">
        <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
      </select>
    </label>

    <p v-if="error" class="banner">{{ error }}</p>

    <section v-if="logs" class="card">
      <header class="card-head">
        <h2>Last build</h2>
        <span v-if="logs.build" class="muted">{{ logs.build.status }} · {{ formatDate(logs.build.createdAt) }}</span>
      </header>
      <div class="terminal">
        <p v-if="!logs.build" class="empty">No build yet.</p>
        <template v-else>
          <p v-for="(line, index) in logs.build.lines" :key="index" class="line" :class="`tone-${line.tone}`">
            <span class="time">[{{ line.time }}]</span> {{ line.message }}
          </p>
          <p v-if="!logs.build.lines.length" class="empty">The build did not write any output.</p>
        </template>
      </div>
    </section>

    <section v-if="logs?.runtime" class="card">
      <header class="card-head">
        <h2>Runtime</h2>
        <span class="muted">{{ logs.runtime.state }}</span>
      </header>
      <div class="terminal">
        <p v-if="!logs.runtime.available" class="empty">Podman is not reachable from the app.</p>
        <p v-else-if="!runtimeLines.length" class="empty">No output yet.</p>
        <pre v-else>{{ runtimeLines.join('\n') }}</pre>
      </div>
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

h2 {
  font-size: 15px;
  font-weight: 600;
}

.subtitle,
.muted {
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
}

.picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 360px;
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}

select {
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font: inherit;
}

.banner {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  font-size: 13px;
}

.card {
  padding: 18px 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}

.terminal {
  max-height: 420px;
  overflow: auto;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg);
  border: 1px solid var(--border);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.6;
}

.line {
  white-space: pre-wrap;
  word-break: break-word;
}

.time {
  color: var(--subtle);
}

.tone-muted {
  color: var(--muted);
}

.tone-success {
  color: #22c78a;
}

.empty {
  color: var(--muted);
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
