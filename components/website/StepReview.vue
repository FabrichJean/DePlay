<script setup lang="ts">
import { PRESETS } from '~/constants/presets'
import type { WebsiteProjectInput } from '~/types/website'

const props = defineProps<{
  form: WebsiteProjectInput
}>()

const emit = defineEmits<{
  edit: [step: number]
}>()

interface Row {
  label: string
  value: string
  step: number
}

const rows = computed<Row[]>(() => {
  const preset = PRESETS.find((item) => item.value === props.form.preset)
  return [
    props.form.source === 'upload'
      ? { label: 'Source', value: 'Uploaded files', step: 0 }
      : { label: 'Repository', value: props.form.repository, step: 0 },
    ...(props.form.source === 'upload' ? [] : [{ label: 'Branch', value: props.form.branch, step: 0 }]),
    { label: 'Project name', value: props.form.name, step: 1 },
    { label: 'Framework', value: preset?.label ?? props.form.preset, step: 1 },
    { label: 'Root directory', value: props.form.rootDirectory, step: 1 },
    { label: 'Install command', value: props.form.installCommand || '—', step: 1 },
    { label: 'Build command', value: props.form.buildCommand || '—', step: 1 },
    { label: 'Environment variables', value: props.form.env.length ? `${props.form.env.length} defined` : 'None', step: 2 },
    { label: 'Output directory', value: props.form.outputDirectory, step: 1 },
  ]
})
</script>

<template>
  <div class="step-body">
    <header class="step-head">
      <h2>Review and deploy</h2>
      <p class="muted">Check the settings below. You can go back to change anything.</p>
    </header>

    <dl class="summary">
      <div v-for="row in rows" :key="row.label" class="row">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
        <button type="button" class="edit" @click="emit('edit', row.step)">Edit</button>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.step-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.step-head h2 {
  font-size: 18px;
  font-weight: 600;
}

.muted {
  color: var(--muted);
  font-size: 13px;
}

.summary {
  margin: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.row {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg);
}

.row + .row {
  border-top: 1px solid var(--border);
}

dt {
  font-size: 13px;
  color: var(--muted);
}

dd {
  margin: 0;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.edit {
  font-size: 13px;
  color: var(--primary);
}

.edit:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .row dt {
    grid-column: 1 / -1;
  }
}
</style>
