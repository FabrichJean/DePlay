<script setup lang="ts">
import type { WebsiteProjectInput } from '~/types/website'
import { envExampleNames } from '~/utils/env-variables'

const props = defineProps<{
  form: WebsiteProjectInput
  /** Fichiers déposés (mode upload), pour y chercher un .env.example */
  files?: File[]
  error?: string
}>()

const detected = ref<string[]>([])
let lastSource = ''

// Ajoute les noms trouvés sans valeur, sans toucher aux variables déjà saisies
function addMissing(names: string[]) {
  const known = new Set(props.form.env.map((item) => item.key))
  for (const key of names) {
    if (!known.has(key)) props.form.env.push({ key, value: '' })
  }
  detected.value = names
}

// Lit le .env.example du dépôt (Git) ou des fichiers déposés (upload), une seule fois par source
async function detect() {
  const source =
    props.form.source === 'upload'
      ? `upload:${props.files?.length ?? 0}`
      : `git:${props.form.repository}:${props.form.branch}`
  if (source === lastSource) return
  lastSource = source

  if (props.form.source === 'upload') {
    const file = props.files?.find((item) => {
      const parts = (item.webkitRelativePath || item.name).split('/')
      return parts.length <= 2 && parts[parts.length - 1] === '.env.example'
    })
    if (file) addMissing(envExampleNames(await file.text()))
    return
  }

  if (!props.form.repository) return
  const { names } = await $fetch<{ names: string[] }>('/api/github/env-example', {
    query: { repo: props.form.repository, branch: props.form.branch },
  }).catch(() => ({ names: [] as string[] }))
  addMissing(names)
}

onMounted(detect)
watch(() => [props.form.source, props.form.repository, props.form.branch, props.files?.length], detect)
</script>

<template>
  <div class="env">
    <p v-if="detected.length" class="detected">
      {{ detected.length }} variable{{ detected.length > 1 ? 's' : '' }} found in .env.example. Add their values below.
    </p>
    <EnvVariablesEditor v-model="props.form.env" :error="error" />
  </div>
</template>

<style scoped>
.env {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.intro {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.warning {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: rgba(234, 179, 8, 0.08);
  border: 1px solid rgba(234, 179, 8, 0.25);
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.detected {
  color: var(--primary);
  font-size: 13px;
}
</style>
