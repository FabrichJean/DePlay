<script setup lang="ts">
import type { ProjectsResponse, Project } from '~/types/project'
import type { DeploymentSummary } from '~/types/deployment'
import limitsConfig from '~/config/limits.json'

const { isLoaded, isSignedIn } = useAuth()

useHead({
  title: () => (isSignedIn.value ? 'Dashboard · Deplay' : 'Deplay'),
})

interface ServiceItem {
  id: string
  name: string
  state: string
  memory: string | null
  memoryLimit: string
}

interface ServicesResponse {
  available: boolean
  services: ServiceItem[]
}

const REFRESH_MS = 30_000
const { user } = useUser()

const projects = ref<Project[]>([])
const usage = ref<ProjectsResponse['usage'] | null>(null)
const deployments = ref<DeploymentSummary[]>([])
const services = ref<ServiceItem[]>([])
const loaded = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

async function load() {
  // Sans session, pas de données à charger : la page d'accueil s'affiche à la place
  if (!isSignedIn.value) return
  // Trois sources indépendantes : une panne de l'une n'empêche pas d'afficher les autres
  const [projectsResult, deploymentsResult, servicesResult] = await Promise.allSettled([
    $fetch<ProjectsResponse>('/api/projects'),
    $fetch<{ deployments: DeploymentSummary[] }>('/api/deployments'),
    $fetch<ServicesResponse>('/api/services'),
  ])
  if (projectsResult.status === 'fulfilled') {
    projects.value = projectsResult.value.projects
    usage.value = projectsResult.value.usage
  }
  if (deploymentsResult.status === 'fulfilled') deployments.value = deploymentsResult.value.deployments
  if (servicesResult.status === 'fulfilled') services.value = servicesResult.value.services
  loaded.value = true
}

// La session Clerk peut arriver après le montage : on charge dès qu'elle est connue
watch(isSignedIn, (signedIn) => {
  if (signedIn) load()
})

onMounted(() => {
  load()
  timer = setInterval(load, REFRESH_MS)
})
onBeforeUnmount(() => clearInterval(timer))

const greeting = computed(() => {
  const hour = new Date().getHours()
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const name = user.value?.firstName
  return name ? `${part}, ${name}` : part
})

const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

const failedRecently = computed(() => deployments.value.filter((item) => item.status === 'failed').slice(0, 5))
const liveCount = computed(() => projects.value.filter((item) => item.status === 'live').length)
const buildingCount = computed(() => projects.value.filter((item) => item.status === 'building').length)
const attentionProjects = computed(() => projects.value.filter((item) => item.status === 'attention'))

const runningServices = computed(() => services.value.filter((item) => item.state === 'running').length)
const stoppedServices = computed(() => services.value.filter((item) => item.state !== 'running'))

// Trafic : visites par jour, additionnées sur tous les projets (14 jours)
const traffic = computed(() => {
  const days = 14
  const totals = new Array(days).fill(0)
  for (const project of projects.value) {
    project.sparkline.forEach((value, index) => {
      if (index < days) totals[index] += value
    })
  }
  return totals
})
const trafficTotal = computed(() => traffic.value.reduce((sum, value) => sum + value, 0))
const trafficPaths = computed(() => sparklinePaths(traffic.value, 100, 40))

const storagePercent = computed(() => usage.value?.usedPercent ?? 0)

const STATUS_LABEL: Record<string, string> = { live: 'Live', building: 'Building', attention: 'Attention' }
const statusCounts = computed(() => ({
  live: liveCount.value,
  building: buildingCount.value,
  attention: attentionProjects.value.length,
}))

function statusTone(status: string): 'success' | 'neutral' {
  return status === 'deployed' ? 'success' : 'neutral'
}
</script>

<template>
  <div v-if="isSignedIn" class="page">
    <section class="hero">
      <div>
        <p class="eyebrow">{{ today }}</p>
        <h1>{{ greeting }}</h1>
        <p class="subtitle">
          {{ projects.length }} project{{ projects.length === 1 ? '' : 's' }} ·
          {{ runningServices }} of {{ services.length }} web service{{ services.length === 1 ? '' : 's' }} running
        </p>
      </div>
      <div class="hero-actions">
        <NuxtLink to="/new/website" class="btn btn-primary">New website</NuxtLink>
        <NuxtLink to="/new/website?type=webservice" class="btn">New web service</NuxtLink>
      </div>
    </section>

    <section class="kpis">
      <article class="kpi">
        <span class="kpi-label">Live projects</span>
        <p class="kpi-value">{{ liveCount }}<span class="kpi-of"> / {{ projects.length }}</span></p>
        <p class="kpi-note">{{ buildingCount }} building · {{ attentionProjects.length }} need attention</p>
      </article>

      <article class="kpi">
        <span class="kpi-label">Web services</span>
        <p class="kpi-value">{{ runningServices }}<span class="kpi-of"> / {{ services.length }}</span></p>
        <p class="kpi-note">
          {{ services.length ? `${limitsConfig.maxWebServicesPerUser} allowed per account` : 'None yet' }}
        </p>
      </article>

      <article class="kpi">
        <span class="kpi-label">Visits, 14 days</span>
        <p class="kpi-value">{{ trafficTotal }}</p>
        <p class="kpi-note">Across all your sites</p>
      </article>

      <article class="kpi">
        <span class="kpi-label">Storage</span>
        <p class="kpi-value">{{ storagePercent }}%</p>
        <div class="bar" role="progressbar" :aria-valuenow="storagePercent" aria-valuemin="0" aria-valuemax="100">
          <span :style="{ width: `${storagePercent}%` }" />
        </div>
        <p class="kpi-note">{{ usage?.items[0]?.value ?? '—' }}</p>
      </article>
    </section>

    <div class="columns">
      <section class="card traffic">
        <header class="card-head">
          <h2>Traffic</h2>
          <span class="muted">Last 14 days</span>
        </header>
        <svg
          v-if="trafficTotal > 0"
          class="chart"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          role="img"
          aria-label="Visits per day over the last 14 days"
        >
          <path :d="trafficPaths.area" class="area" />
          <path :d="trafficPaths.line" class="line" vector-effect="non-scaling-stroke" />
        </svg>
        <p v-else class="empty">No visits yet. Publish a site to see its traffic here.</p>
      </section>

      <section class="card attention">
        <header class="card-head">
          <h2>Needs attention</h2>
          <span class="muted">{{ failedRecently.length + stoppedServices.length + attentionProjects.length }}</span>
        </header>
        <ul v-if="failedRecently.length || stoppedServices.length || attentionProjects.length" class="alerts">
          <li v-for="item in failedRecently" :key="`d-${item.id}`">
            <NuxtLink :to="`/deployments/${item.id}`" class="alert">
              <span class="dot dot-danger" />
              <span>Failed build for <strong>{{ item.projectName }}</strong></span>
              <span class="muted">{{ item.createdLabel }}</span>
            </NuxtLink>
          </li>
          <li v-for="item in stoppedServices" :key="`s-${item.id}`">
            <NuxtLink :to="`/logs?project=${item.id}`" class="alert">
              <span class="dot dot-warn" />
              <span><strong>{{ item.name }}</strong> is {{ item.state === 'running' ? 'running' : 'not running' }}</span>
              <span class="muted">View logs</span>
            </NuxtLink>
          </li>
          <li v-for="item in attentionProjects" :key="`p-${item.id}`">
            <NuxtLink :to="`/projects/${item.id}`" class="alert">
              <span class="dot dot-warn" />
              <span><strong>{{ item.name }}</strong> needs attention</span>
              <span class="muted">Open</span>
            </NuxtLink>
          </li>
        </ul>
        <p v-else class="empty">All clear. Nothing needs your attention.</p>
      </section>
    </div>

    <div class="columns">
      <section class="card">
        <header class="card-head">
          <h2>Recent deployments</h2>
          <NuxtLink to="/deployments" class="link">See all</NuxtLink>
        </header>
        <ul v-if="deployments.length" class="rows">
          <li v-for="item in deployments.slice(0, 6)" :key="item.id">
            <NuxtLink :to="item.projectId ? `/projects/${item.projectId}` : `/deployments/${item.id}`" class="row">
              <span class="row-main">
                <strong>{{ item.projectName }}</strong>
                <span class="muted">{{ item.branch || 'upload' }} · {{ item.createdLabel }}</span>
              </span>
              <StatusBadge
                :label="item.status === 'deployed' ? 'Deployed' : item.status === 'failed' ? 'Failed' : 'Building'"
                :tone="statusTone(item.status)"
                :pulse="item.status === 'building'"
              />
            </NuxtLink>
          </li>
        </ul>
        <p v-else class="empty">{{ loaded ? 'No deployments yet.' : 'Loading…' }}</p>
      </section>

      <section class="card">
        <header class="card-head">
          <h2>Projects by status</h2>
          <NuxtLink to="/projects" class="link">Open projects</NuxtLink>
        </header>
        <ul class="statuses">
          <li v-for="(count, key) in statusCounts" :key="key">
            <span class="status-name">{{ STATUS_LABEL[key] }}</span>
            <span class="status-track">
              <span
                class="status-fill"
                :class="`is-${key}`"
                :style="{ width: projects.length ? `${(count / projects.length) * 100}%` : '0%' }"
              />
            </span>
            <span class="status-count">{{ count }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>

  <LandingHero v-else-if="isLoaded" />
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

h1 {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

h2 {
  font-size: 15px;
  font-weight: 600;
}

.eyebrow {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--primary);
  margin-bottom: 6px;
}

.subtitle,
.muted {
  margin-top: 4px;
  color: var(--muted);
  font-size: 13px;
}

/* Bandeau d'accueil : léger dégradé dans les couleurs de la marque */
.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 26px 28px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background:
    radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 60%),
    var(--card);
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--card);
}

.kpi-label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.kpi-of {
  font-size: 15px;
  font-weight: 500;
  color: var(--muted);
}

.kpi-note {
  font-size: 12px;
  color: var(--muted);
}

.columns {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 14px;
}

.card {
  padding: 18px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--card);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 14px;
}

.link {
  font-size: 13px;
  color: var(--primary);
}

.empty {
  color: var(--muted);
  font-size: 13px;
  padding: 24px 0;
  text-align: center;
}

.chart {
  display: block;
  width: 100%;
  height: 180px;
}

.line {
  fill: none;
  stroke: var(--primary);
  stroke-width: 1.8;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.area {
  fill: color-mix(in srgb, var(--primary) 16%, transparent);
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

.alerts,
.rows,
.statuses {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert,
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.alert:hover,
.row:hover {
  background: var(--card-hover);
}

.alert .muted {
  margin-left: auto;
  font-size: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
}

.dot-danger {
  background: #f87171;
}

.dot-warn {
  background: #f59e0b;
}

.row {
  justify-content: space-between;
}

.row-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.statuses li {
  display: grid;
  grid-template-columns: 80px 1fr 32px;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 13px;
}

.status-track {
  height: 8px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.status-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
}

.status-fill.is-live {
  background: #22c78a;
}

.status-fill.is-building {
  background: #3b82f6;
}

.status-fill.is-attention {
  background: #f59e0b;
}

.status-count {
  text-align: right;
  font-weight: 600;
}

@media (max-width: 960px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .columns {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 520px) {
  .kpis {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
