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
</script>

<template>
  <DeploymentDetails v-if="details" :deployment="details" compact />

  <section v-else-if="project" class="empty card">
    <h1>{{ project.name }}</h1>
    <p class="muted">No deployment yet. Deploy this project to see its logs and metrics here.</p>
    <NuxtLink to="/" class="btn">Back to projects</NuxtLink>
  </section>
</template>

<style scoped>
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

h1 {
  font-size: 22px;
  font-weight: 700;
}

.muted {
  color: var(--muted);
}
</style>
