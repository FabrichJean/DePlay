<script setup lang="ts">
import type { ProjectsResponse, Project } from '~/types/project'
import type { DeploymentSummary } from '~/types/deployment'
import limitsConfig from '~/config/limits.json'

const { isLoaded, isSignedIn } = useAuth()
const { user } = useUser()

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
const TRAFFIC_DAYS = 14

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

const firstName = computed(() => user.value?.firstName ?? '')
const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
})
const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

const liveCount = computed(() => projects.value.filter((item) => item.status === 'live').length)
const buildingCount = computed(() => projects.value.filter((item) => item.status === 'building').length)
const attentionProjects = computed(() => projects.value.filter((item) => item.status === 'attention'))
const failedDeployments = computed(() => deployments.value.filter((item) => item.status === 'failed').slice(0, 5))

const runningServices = computed(() => services.value.filter((item) => item.state === 'running').length)
const stoppedServices = computed(() => services.value.filter((item) => item.state !== 'running'))
const attentionTotal = computed(() => failedDeployments.value.length + stoppedServices.value.length + attentionProjects.value.length)

// Visites par jour, additionnées sur tous les projets (sparkline = visites des 14 derniers jours)
const traffic = computed(() => {
  const totals = new Array(TRAFFIC_DAYS).fill(0)
  for (const project of projects.value) {
    project.sparkline.forEach((value, index) => {
      if (index < TRAFFIC_DAYS) totals[index] += value
    })
  }
  return totals
})
const trafficTotal = computed(() => traffic.value.reduce((sum, value) => sum + value, 0))

// Dates des 14 derniers jours, la plus ancienne en premier
const dayLabels = computed(() => {
  const labels: string[] = []
  for (let offset = TRAFFIC_DAYS - 1; offset >= 0; offset--) {
    const date = new Date()
    date.setDate(date.getDate() - offset)
    labels.push(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))
  }
  return labels
})

// Géométrie du graphique : 600 × 220, axe Y gradué selon le plus grand total
const CHART = { width: 600, height: 220, top: 16, bottom: 28 }
const chart = computed(() => {
  const max = Math.max(...traffic.value, 4)
  const ceiling = Math.ceil(max / 4) * 4
  const plotHeight = CHART.height - CHART.top - CHART.bottom
  const step = CHART.width / (TRAFFIC_DAYS - 1)
  const points = traffic.value.map((value, index) => ({
    x: index * step,
    y: CHART.top + plotHeight - (value / ceiling) * plotHeight,
  }))
  const line = points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  const area = `${line} L${CHART.width},${CHART.height - CHART.bottom} L0,${CHART.height - CHART.bottom} Z`
  const ticks = [0, 1, 2, 3, 4].map((step) => {
    const value = (ceiling / 4) * step
    return { value, y: CHART.top + plotHeight - (value / ceiling) * plotHeight }
  })
  const peak = points.reduce((best, point, index) => (traffic.value[index] > traffic.value[best.index] ? { ...point, index } : best), { ...points[0], index: 0 })
  return { line, area, ticks, points, peak, plotHeight }
})

const storagePercent = computed(() => usage.value?.usedPercent ?? 0)
const storageLabel = computed(() => usage.value?.items[0]?.value ?? '—')

const STATUS_ROWS = computed(() => [
  { key: 'live', label: 'Live', count: liveCount.value, color: '#22c78a' },
  { key: 'building', label: 'Building', count: buildingCount.value, color: '#3b82f6' },
  { key: 'attention', label: 'Attention', count: attentionProjects.value.length, color: '#f59e0b' },
])

function deploymentTone(status: string): { label: string, color: string } {
  if (status === 'deployed') return { label: 'Deployed', color: '#22c78a' }
  if (status === 'failed') return { label: 'Failed', color: '#f87171' }
  return { label: 'Building', color: '#3b82f6' }
}
</script>

<template>
  <div v-if="isSignedIn" class="page">
    <section class="hero">
      <div class="hero-text">
        <p class="date">{{ today }}</p>
        <h1>{{ greeting }}<template v-if="firstName">, <span class="accent">{{ firstName }}</span></template></h1>
        <p class="subtitle">Here is what is happening with your projects today.</p>
      </div>
      <div class="hero-actions">
        <NuxtLink to="/new/website" class="btn btn-primary">New website</NuxtLink>
        <NuxtLink to="/new/website?type=webservice" class="btn">New web service</NuxtLink>
      </div>
    </section>

    <section class="kpis">
      <article class="kpi">
        <div class="kpi-head">
          <span class="kpi-icon"><AppIcon name="box" :size="18" /></span>
          <span class="kpi-label">Live projects</span>
        </div>
        <p class="kpi-value">{{ liveCount }}<span class="kpi-of"> / {{ projects.length }}</span></p>
        <p class="kpi-note">{{ buildingCount }} building · {{ attentionProjects.length }} need attention</p>
      </article>

      <article class="kpi">
        <div class="kpi-head">
          <span class="kpi-icon"><AppIcon name="server" :size="18" /></span>
          <span class="kpi-label">Web services</span>
        </div>
        <p class="kpi-value">{{ runningServices }}<span class="kpi-of"> / {{ services.length }}</span></p>
        <p class="kpi-note">{{ limitsConfig.maxWebServicesPerUser }} allowed per account</p>
      </article>

      <article class="kpi">
        <div class="kpi-head">
          <span class="kpi-icon"><AppIcon name="activity" :size="18" /></span>
          <span class="kpi-label">Visits, 14 days</span>
        </div>
        <p class="kpi-value">{{ trafficTotal }}</p>
        <p class="kpi-note">Across all your sites</p>
      </article>

      <article class="kpi">
        <div class="kpi-head">
          <span class="kpi-icon"><AppIcon name="cpu" :size="18" /></span>
          <span class="kpi-label">Storage</span>
        </div>
        <p class="kpi-value">{{ storagePercent }}%</p>
        <div class="bar" role="progressbar" :aria-valuenow="storagePercent" aria-valuemin="0" aria-valuemax="100">
          <span :style="{ width: `${storagePercent}%` }" />
        </div>
        <p class="kpi-note">{{ storageLabel }}</p>
      </article>
    </section>

    <div class="columns">
      <section class="card traffic">
        <header class="card-head">
          <h2><AppIcon name="chart" :size="16" /> Traffic</h2>
          <span class="muted">Last 14 days</span>
        </header>

        <div v-if="trafficTotal > 0" class="chart-wrap">
          <svg
            :viewBox="`0 0 ${CHART.width} ${CHART.height}`"
            class="chart"
            role="img"
            aria-label="Visits per day over the last 14 days"
          >
            <g v-for="tick in chart.ticks" :key="tick.value">
              <line :x1="0" :x2="CHART.width" :y1="tick.y" :y2="tick.y" class="grid" />
              <text :x="-6" :y="tick.y + 4" class="axis" text-anchor="end">{{ Math.round(tick.value) }}</text>
            </g>
            <path :d="chart.area" class="area" />
            <path :d="chart.line" class="line" />
            <circle :cx="chart.peak.x" :cy="chart.peak.y" r="4" class="peak" />
            <g v-for="(label, index) in dayLabels" :key="label">
              <text
                v-if="index % 3 === 0 || index === dayLabels.length - 1"
                :x="index * (CHART.width / (TRAFFIC_DAYS - 1))"
                :y="CHART.height - 6"
                class="axis"
                :text-anchor="index === 0 ? 'start' : index === dayLabels.length - 1 ? 'end' : 'middle'"
              >{{ label }}</text>
            </g>
          </svg>
        </div>
        <p v-else class="empty">No visits yet. Publish a site to see its traffic here.</p>
      </section>

      <section class="card attention">
        <header class="card-head">
          <h2><AppIcon name="alert" :size="16" /> Needs attention</h2>
          <span v-if="attentionTotal" class="pill-danger">{{ attentionTotal }} {{ attentionTotal === 1 ? 'issue' : 'issues' }}</span>
        </header>
        <ul v-if="attentionTotal" class="rows">
          <li v-for="item in failedDeployments" :key="`d-${item.id}`">
            <NuxtLink :to="`/deployments/${item.id}`" class="row">
              <span class="dot" style="background: #f87171" />
              <span>Failed build for <strong>{{ item.projectName }}</strong></span>
              <span class="muted">{{ item.createdLabel }}</span>
            </NuxtLink>
          </li>
          <li v-for="item in stoppedServices" :key="`s-${item.id}`">
            <NuxtLink :to="`/logs?project=${item.id}`" class="row">
              <span class="dot" style="background: #f59e0b" />
              <span><strong>{{ item.name }}</strong> is not running</span>
              <span class="muted">View logs</span>
            </NuxtLink>
          </li>
          <li v-for="item in attentionProjects" :key="`p-${item.id}`">
            <NuxtLink :to="`/projects/${item.id}`" class="row">
              <span class="dot" style="background: #f59e0b" />
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
          <h2><AppIcon name="rocket" :size="16" /> Recent deployments</h2>
          <NuxtLink to="/deployments" class="link">See all</NuxtLink>
        </header>
        <ul v-if="deployments.length" class="rows">
          <li v-for="item in deployments.slice(0, 5)" :key="item.id">
            <NuxtLink :to="item.projectId ? `/projects/${item.projectId}` : `/deployments/${item.id}`" class="row">
              <span class="row-main">
                <strong>{{ item.projectName }}</strong>
                <span class="muted">{{ item.branch || 'upload' }} · {{ item.createdLabel }}</span>
              </span>
              <span class="pill" :style="{ color: deploymentTone(item.status).color, borderColor: deploymentTone(item.status).color }">
                {{ deploymentTone(item.status).label }}
              </span>
            </NuxtLink>
          </li>
        </ul>
        <p v-else class="empty">{{ loaded ? 'No deployments yet.' : 'Loading…' }}</p>
      </section>

      <section class="card">
        <header class="card-head">
          <h2><AppIcon name="layers" :size="16" /> Projects by status</h2>
          <NuxtLink to="/projects" class="link">Open projects</NuxtLink>
        </header>
        <ul class="statuses">
          <li v-for="row in STATUS_ROWS" :key="row.key">
            <span class="status-name"><span class="dot" :style="{ background: row.color }" /> {{ row.label }}</span>
            <span class="status-track">
              <span
                class="status-fill"
                :style="{ width: projects.length ? `${(row.count / projects.length) * 100}%` : '0%', background: row.color }"
              />
            </span>
            <span class="status-count">{{ row.count }}</span>
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
  gap: 16px;
}

h1 {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-top: 6px;
}

h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

h2 svg {
  color: var(--primary);
}

.accent {
  color: var(--primary);
}

.date {
  font-size: 13px;
  color: var(--muted);
}

.subtitle,
.muted {
  color: var(--muted);
  font-size: 13px;
}

/* Bandeau : photo de montagnes bleues, assombrie pour garder le texte lisible */
.hero {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  min-height: 170px;
  padding: 26px 28px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(10, 15, 20, 0.92) 0%, rgba(10, 15, 20, 0.55) 55%, rgba(10, 15, 20, 0.25) 100%),
    url('/images/dashboard-hero.jpg') center 40% / cover no-repeat;
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

.kpi-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kpi-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary);
}

.kpi-label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.kpi-value {
  margin-top: 4px;
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
  align-items: center;
  gap: 12px;
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

.chart-wrap {
  padding-left: 20px;
}

.chart {
  display: block;
  width: 100%;
  height: 240px;
  overflow: visible;
}

.grid {
  stroke: var(--border);
  stroke-width: 1;
}

.axis {
  fill: var(--subtle);
  font-size: 11px;
}

.line {
  fill: none;
  stroke: var(--primary);
  stroke-width: 2.2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.area {
  fill: color-mix(in srgb, var(--primary) 18%, transparent);
}

.peak {
  fill: var(--primary);
  stroke: var(--card);
  stroke-width: 2;
}

.pill,
.pill-danger {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--border);
  color: var(--muted);
}

.pill-danger {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.4);
  background: rgba(248, 113, 113, 0.1);
}

.rows,
.statuses {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  border-bottom: 1px solid var(--border);
}

.rows li:last-child .row {
  border-bottom: 0;
}

.row:hover {
  background: var(--card-hover);
}

.row .muted {
  margin-left: auto;
  font-size: 12px;
}

.row-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
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

.statuses li {
  display: grid;
  grid-template-columns: 110px 1fr 32px;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  font-size: 13px;
}

.status-name {
  display: flex;
  align-items: center;
  gap: 8px;
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

  h1 {
    font-size: 24px;
  }
}
</style>
