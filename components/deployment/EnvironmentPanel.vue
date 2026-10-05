<script setup lang="ts">
import type { Deployment } from '~/types/deployment'
import { envVariablesError, type EnvVariable } from '~/utils/env-variables'

const props = defineProps<{
  deployment: Deployment
}>()

const projectId = computed(() => props.deployment.projectId)

// Variables du projet, modifiables ici ; sans projet (supprimé), seule l'information reste affichée
const { data } = useFetch<{ variables: EnvVariable[] }>(() => `/api/projects/${projectId.value}/env`, {
  key: computed(() => `project-env:${projectId.value}`),
  immediate: !!projectId.value,
  watch: [projectId],
})

const draft = ref<EnvVariable[]>([])
watch(
  () => data.value?.variables,
  (variables) => {
    draft.value = structuredClone(variables ?? [])
  },
  { immediate: true },
)

const dirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(data.value?.variables ?? []))
const saving = ref(false)
const error = ref('')

// Enregistre, puis relance un déploiement si demandé : la page du projet suit le build comme pour « Redeploy »
async function save(redeploy: boolean) {
  error.value = ''
  const invalid = envVariablesError(draft.value)
  if (invalid) {
    error.value = invalid
    return
  }

  saving.value = true
  try {
    data.value = await $fetch<{ variables: EnvVariable[] }>(`/api/projects/${projectId.value}/env`, {
      method: 'PUT',
      body: { variables: draft.value },
    })
    if (redeploy) {
      await $fetch(`/api/projects/${projectId.value}/redeploy`, { method: 'POST' })
      await refreshNuxtData([`project:${projectId.value}`, `project-deployment:${projectId.value}`])
    }
  } catch (cause) {
    const body = (cause as { data?: { statusMessage?: string } }).data
    error.value = body?.statusMessage ?? (cause as Error).message ?? 'Could not save the variables.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="env-panel">
    <template v-if="projectId">
      <p class="hint">
        Changes apply to the next deployment. Values are written into the built files.
      </p>
      <EnvVariablesEditor v-model="draft" :error="error" />
      <div class="actions">
        <button type="button" class="btn" :disabled="!dirty || saving" @click="save(false)">Save</button>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="save(true)">
          {{ saving ? 'Saving…' : 'Save and redeploy' }}
        </button>
      </div>
    </template>

    <KeyValueGrid
      :rows="[
        { label: 'Environment', value: deployment.environment },
        { label: 'Runtime', value: deployment.info.runtime ?? deployment.runtime },
        { label: 'Framework', value: deployment.info.framework },
        { label: 'Port', value: deployment.info.port, mono: true },
        { label: 'Memory', value: deployment.info.memory },
        { label: 'CPU', value: deployment.info.cpu },
        { label: 'Server status', value: deployment.server.status },
        { label: 'Server IP', value: deployment.server.ip, mono: true },
        { label: 'Provider', value: deployment.server.provider },
        { label: 'Location', value: deployment.server.location },
      ]"
    />
  </div>
</template>

<style scoped>
.env-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hint {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.actions .btn {
  height: 34px;
  padding: 0 14px;
  font-size: 13px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
