<script setup lang="ts">
import type { Project } from '~/types/project'
import type { Deployment } from '~/types/deployment'

// Page de détail d'un projet : le dernier déploiement, présenté avec le même détail
const route = useRoute()
const id = String(route.params.id)

const { data: project } = await useFetch<Project>(`/api/projects/${id}`, { key: `project:${id}` })

if (!project.value) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
}

const { data: deployment } = await useFetch<Deployment>(`/api/projects/${id}/deployment`, {
  key: `project-deployment:${id}`,
})

useHead({
  title: () => `${project.value?.name ?? 'Project'} · Deplay`,
})

// Le nom affiché est celui du projet ; le reste (logs, métriques) vient du dernier déploiement
const details = computed<Deployment | null>(() =>
  deployment.value && project.value ? { ...deployment.value, name: project.value.name } : null,
)

const redeploying = ref(false)
const actionError = ref('')
const busy = computed(() => redeploying.value || deployment.value?.status === 'building')

async function refreshData() {
  await refreshNuxtData([`project:${id}`, `project-deployment:${id}`])
}

// Pendant un build, on recharge les données toutes les 3 secondes pour suivre les étapes et les logs
let timer: ReturnType<typeof setInterval> | undefined

function stopPolling() {
  if (timer) clearInterval(timer)
  timer = undefined
}

function startPolling() {
  stopPolling()
  timer = setInterval(async () => {
    await refreshData()
    if (deployment.value?.status !== 'building') stopPolling()
  }, 3000)
}

async function redeploy() {
  actionError.value = ''
  redeploying.value = true
  try {
    await $fetch(`/api/projects/${id}/redeploy`, { method: 'POST' })
    await refreshData()
    startPolling()
  } catch (error) {
    const body = (error as { data?: { statusMessage?: string } }).data
    actionError.value = body?.statusMessage ?? 'Could not start the deployment. Please try again.'
  } finally {
    redeploying.value = false
  }
}

onMounted(() => {
  if (deployment.value?.status === 'building') startPolling()
})

onBeforeUnmount(stopPolling)
</script>

<template>
  <div v-if="details" class="project-page">
    <div class="actions-bar">
      <p v-if="actionError" class="error">{{ actionError }}</p>
      <button class="btn btn-primary" type="button" :disabled="busy" @click="redeploy">
        <AppIcon name="refresh" :size="14" />
        {{ redeploying ? 'Starting…' : 'Redeploy' }}
      </button>
    </div>

    <DeploymentDetails :deployment="details" compact />
  </div>

  <section v-else-if="project" class="empty card">
    <h1>{{ project.name }}</h1>
    <p class="muted">No deployment yet. Start one to see its logs and metrics here.</p>
    <p v-if="actionError" class="error">{{ actionError }}</p>
    <div class="empty-actions">
      <button class="btn btn-primary" type="button" :disabled="busy" @click="redeploy">
        <AppIcon name="refresh" :size="14" />
        {{ redeploying ? 'Starting…' : 'Deploy' }}
      </button>
      <NuxtLink to="/" class="btn">Back to projects</NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.project-page {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.actions-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.actions-bar .btn {
  height: 36px;
  padding: 0 14px;
  font-size: 13px;
}

.empty {
  max-width: 520px;
  margin: 40px auto 0;
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.empty-actions {
  display: flex;
  gap: 10px;
}

.empty-actions .btn {
  height: 36px;
  padding: 0 14px;
  font-size: 13px;
}

h1 {
  font-size: 22px;
  font-weight: 700;
}

.muted {
  color: var(--muted);
}

.error {
  font-size: 13px;
  color: #f87171;
}

.btn:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
