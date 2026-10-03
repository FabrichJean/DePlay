<script setup lang="ts">
import type { IconName } from '~/constants/icons'
import type { AppInfo } from '~/types/deployment'

const props = defineProps<{
  info: AppInfo
}>()

interface Row {
  icon: IconName
  label: string
  value: string
}

// Lignes construites une seule fois par changement de `info`
const rows = computed<Row[]>(() => [
  { icon: 'box', label: 'Name', value: props.info.name },
  { icon: 'layers', label: 'Framework', value: props.info.framework },
  { icon: 'cpu', label: 'Runtime', value: props.info.runtime },
  { icon: 'hash', label: 'Port', value: String(props.info.port) },
  { icon: 'memory', label: 'Memory', value: props.info.memory },
  { icon: 'cpu', label: 'CPU', value: props.info.cpu },
  { icon: 'calendar', label: 'Created', value: props.info.created },
])
</script>

<template>
  <AppCard>
    <h2 class="card-title">Application Information</h2>

    <dl class="info-list">
      <div v-for="row in rows" :key="row.label" class="info-row">
        <dt>
          <AppIcon :name="row.icon" :size="15" />
          {{ row.label }}
        </dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>
  </AppCard>
</template>

<style scoped>
.card-title {
  margin-bottom: 18px;
}

.info-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
}

dt {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
}

dt :deep(svg) {
  color: var(--subtle);
}

dd {
  margin: 0;
  text-align: right;
  font-weight: 500;
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
