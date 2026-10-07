<script setup lang="ts">
import type { ProjectsResponse, Project } from '~/types/project'
import type { DeploymentSummary } from '~/types/deployment'

const { isLoaded, isSignedIn } = useAuth()
const { user } = useUser()

useHead({
  title: () => (isSignedIn.value ? 'Overview · Deplay' : 'Deplay'),
})

interface ServiceItem {
  id: string
  name: string
  state: string
}

interface ServicesResponse {
  available: boolean
  services: ServiceItem[]
}

const REFRESH_MS = 30_000

const projects = ref<Project[]>([])
const deployments = ref<DeploymentSummary[]>([])
const services = ref<ServiceItem[]>([])
const loaded = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

async function load() {
  if (!isSignedIn.value) return
  // Trois sources indépendantes : une panne de l'une n'empêche pas d'afficher les autres
  const [projectsResult, deploymentsResult, servicesResult] = await Promise.allSettled([
    $fetch<ProjectsResponse>('/api/projects'),
    $fetch<{ deployments: DeploymentSummary[] }>('/api/deployments'),
    $fetch<ServicesResponse>('/api/services'),
  ])
  if (projectsResult.status === 'fulfilled') projects.value = projectsResult.value.projects
  if (deploymentsResult.status === 'fulfilled') deployments.value = deploymentsResult.value.deployments
  if (servicesResult.status === 'fulfilled') services.value = servicesResult.value.services
  loaded.value = true
}

watch(isSignedIn, (signedIn) => {
  if (signedIn) load()
})

// Visiteur non connecté : en production la landing est sur un autre domaine, la plateforme renvoie vers la connexion.
// En développement, le serveur sert la landing sur « / » (server/middleware/landing.ts) : on la recharge.
const RELOAD_KEY = 'deplay:landing-reload'
watch(
  () => isLoaded.value && !isSignedIn.value,
  (signedOut) => {
    if (!signedOut || !import.meta.client) return
    if (!import.meta.dev) {
      navigateTo('/sign-in', { replace: true })
      return
    }
    let last = 0
    try { last = Number(sessionStorage.getItem(RELOAD_KEY) || 0) } catch {}
    if (Date.now() - last < 10_000) {
      navigateTo('/sign-in', { replace: true })
      return
    }
    try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())) } catch {}
    window.location.replace('/')
  },
  { immediate: true },
)

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

// Sites et web services, séparés comme dans leurs pages
const websites = computed(() => projects.value.filter((item) => item.type === 'website'))
const webServices = computed(() => projects.value.filter((item) => item.type === 'webservice'))
const liveWebsites = computed(() => websites.value.filter((item) => item.status === 'live').length)
const runningServices = computed(() => services.value.filter((item) => item.state === 'running').length)

const attentionProjects = computed(() => projects.value.filter((item) => item.status === 'attention'))
const failedDeployments = computed(() => deployments.value.filter((item) => item.status === 'failed').slice(0, 5))
const stoppedServices = computed(() => services.value.filter((item) => item.state !== 'running'))
const attentionTotal = computed(() => failedDeployments.value.length + stoppedServices.value.length + attentionProjects.value.length)
</script>

<template>
  <div v-if="isSignedIn" class="page">
    <header class="hero">
      <div>
        <p class="date">{{ today }}</p>
        <h1>{{ greeting }}<template v-if="firstName">, <span class="accent">{{ firstName }}</span></template></h1>
        <p class="subtitle">
          {{ attentionTotal ? `${attentionTotal} thing${attentionTotal === 1 ? '' : 's'} to review` : 'Nothing needs your attention.' }}
        </p>
      </div>
      <div class="hero-actions">
        <NuxtLink to="/new/website" class="btn btn-primary">New website</NuxtLink>
        <NuxtLink to="/new/website?type=webservice" class="btn">New web service</NuxtLink>
      </div>
    </header>

    <!-- Trois espaces de travail : un bloc par type, avec son accès direct -->
    <section class="areas">
      <NuxtLink to="/websites" class="area">
        <span class="area-label">Websites</span>
        <span class="area-value">{{ liveWebsites }}<small> / {{ websites.length }}</small></span>
        <span class="area-note">live</span>
      </NuxtLink>
      <NuxtLink to="/webservices" class="area">
        <span class="area-label">Web services</span>
        <span class="area-value">{{ runningServices }}<small> / {{ webServices.length }}</small></span>
        <span class="area-note">running</span>
      </NuxtLink>
      <NuxtLink to="/deployments" class="area">
        <span class="area-label">Deployments</span>
        <span class="area-value">{{ deployments.length }}</span>
        <span class="area-note">{{ failedDeployments.length }} failed recently</span>
      </NuxtLink>
      <NuxtLink to="/usage" class="area">
        <span class="area-label">Usage</span>
        <span class="area-value">{{ projects.length }}</span>
        <span class="area-note">projects · see storage and visits</span>
      </NuxtLink>
    </section>

    <div class="split">
      <section class="section">
        <header class="section-head">
          <h2>Needs attention</h2>
          <span v-if="attentionTotal" class="count-danger">{{ attentionTotal }}</span>
        </header>
        <ul v-if="attentionTotal" class="list">
          <li v-for="item in failedDeployments" :key="`d-${item.id}`">
            <NuxtLink :to="`/deployments/${item.id}`" class="item">
              <span class="dot" style="background: #f87171" />
              <span class="item-text">Failed build for <strong>{{ item.projectName }}</strong></span>
              <span class="muted">{{ item.createdLabel }}</span>
            </NuxtLink>
          </li>
          <li v-for="item in stoppedServices" :key="`s-${item.id}`">
            <NuxtLink :to="`/logs?project=${item.id}`" class="item">
              <span class="dot" style="background: #f59e0b" />
              <span class="item-text"><strong>{{ item.name }}</strong> is not running</span>
              <span class="muted">Logs</span>
            </NuxtLink>
          </li>
          <li v-for="item in attentionProjects" :key="`p-${item.id}`">
            <NuxtLink :to="`/projects/${item.id}`" class="item">
              <span class="dot" style="background: #f59e0b" />
              <span class="item-text"><strong>{{ item.name }}</strong> needs attention</span>
              <span class="muted">Open</span>
            </NuxtLink>
          </li>
        </ul>
        <p v-else class="empty">All clear.</p>
      </section>

      <section class="section">
        <header class="section-head">
          <h2>Recent deployments</h2>
          <NuxtLink to="/deployments" class="link">See all</NuxtLink>
        </header>
        <ul v-if="deployments.length" class="list">
          <li v-for="item in deployments.slice(0, 5)" :key="item.id">
            <NuxtLink :to="item.projectId ? `/projects/${item.projectId}` : `/deployments/${item.id}`" class="item">
              <span class="item-text">
                <strong>{{ item.projectName }}</strong>
                <span class="muted"> · {{ item.branch || 'upload' }}</span>
              </span>
              <span class="muted">{{ item.createdLabel }}</span>
            </NuxtLink>
          </li>
        </ul>
        <p v-else class="empty">{{ loaded ? 'No deployments yet.' : 'Loading…' }}</p>
      </section>
    </div>
  </div>

</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 56px;
  max-width: 1040px;
  margin: 0 auto;
  padding: 8px 0 48px;
}

h1 {
  margin-top: 8px;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
}

h2 {
  font-size: 15px;
  font-weight: 600;
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

/* Trois espaces de travail : colonnes séparées par des filets, chacune cliquable */
.areas {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 26px 24px;
  transition: background 0.15s;
}

.area + .area {
  border-left: 1px solid var(--border);
}

.area:hover {
  background: var(--card-hover);
}

.area-label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.area-value {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.area-value small {
  font-size: 16px;
  font-weight: 500;
  color: var(--muted);
}

.area-note {
  font-size: 12px;
  color: var(--muted);
}

.split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 56px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.link {
  font-size: 13px;
  color: var(--primary);
}

.count-danger {
  font-size: 12px;
  font-weight: 600;
  color: #f87171;
}

.empty {
  color: var(--muted);
  font-size: 13px;
  padding: 16px 0;
}

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
}

.list li + li {
  border-top: 1px solid var(--border);
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 4px;
  font-size: 14px;
  transition: background 0.15s;
}

.item:hover {
  background: var(--card-hover);
}

.item-text {
  flex: 1;
  min-width: 0;
}

.item > .muted {
  font-size: 12px;
  white-space: nowrap;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
}

@media (max-width: 960px) {
  .areas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .area:nth-child(3) {
    border-left: 0;
  }

  .area:nth-child(n + 3) {
    border-top: 1px solid var(--border);
  }

  .split {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
  }
}

@media (max-width: 520px) {
  h1 {
    font-size: 26px;
  }

  .area-value {
    font-size: 28px;
  }

  .item > .muted:not(:last-child) {
    display: none;
  }
}
</style>
