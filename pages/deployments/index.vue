<script setup lang="ts">
import type { DeploymentSummary } from '~/types/deployment'

useHead({ title: 'Deployments · Deplay' })

const { data } = await useDeployments()

type Filter = 'all' | DeploymentSummary['status']
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'deployed', label: 'Deployed' },
  { key: 'building', label: 'Building' },
  { key: 'failed', label: 'Failed' },
]

const filter = ref<Filter>('all')
const deployments = computed<DeploymentSummary[]>(() => data.value?.deployments ?? [])

const counts = computed(() => {
  const result: Record<Filter, number> = { all: deployments.value.length, deployed: 0, building: 0, failed: 0 }
  for (const item of deployments.value) result[item.status]++
  return result
})

const visible = computed(() =>
  filter.value === 'all' ? deployments.value : deployments.value.filter((item) => item.status === filter.value),
)
</script>

<template>
  <div class="page">
    <header class="head">
      <h1>Deployments</h1>
      <p class="subtitle">Every deployment across your projects, most recent first.</p>
    </header>

    <div class="filters" role="group" aria-label="Filter by status">
      <button
        v-for="item in FILTERS"
        :key="item.key"
        type="button"
        class="chip"
        :class="{ 'is-active': filter === item.key }"
        :aria-pressed="filter === item.key"
        @click="filter = item.key"
      >
        {{ item.label }}
        <span class="count">{{ counts[item.key] }}</span>
      </button>
    </div>

    <section class="list card">
      <NuxtLink
        v-for="item in visible"
        :key="item.id"
        :to="`/deployments/${item.id}`"
        class="row"
      >
        <div class="main">
          <p class="name">{{ item.projectName }}</p>
          <p class="meta">
            <span class="mono">{{ item.branch || '—' }}</span>
            <span class="sep">·</span>
            <span>{{ item.url ? item.url.replace(/^https?:\/\//, '') : 'Not published yet' }}</span>
          </p>
        </div>

        <StatusBadge
          v-if="item.status === 'deployed'"
          label="Deployed"
          icon="check"
        />
        <StatusBadge v-else-if="item.status === 'building'" label="Building" tone="neutral" pulse />
        <StatusBadge v-else label="Failed" tone="neutral" />

        <div class="when">
          <span>{{ item.createdLabel }}</span>
          <span class="muted">{{ item.duration && item.duration !== '—' ? item.duration : '' }}</span>
        </div>
      </NuxtLink>

      <p v-if="!visible.length" class="empty">
        {{ deployments.length ? 'No deployment with this status.' : 'No deployment yet. Create a project to get started.' }}
      </p>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.subtitle,
.muted,
.meta {
  color: var(--muted);
  font-size: 13px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
}

.chip.is-active {
  color: var(--primary);
  background: var(--primary-soft);
  border-color: var(--primary-border);
}

.count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--card-hover);
  font-size: 11px;
  text-align: center;
}

.list {
  padding: 0;
  overflow: hidden;
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 18px;
  padding: 16px 20px;
  transition: background 0.15s;
}

.row + .row {
  border-top: 1px solid var(--border);
}

.row:hover {
  background: var(--card-hover);
}

.name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.mono {
  font-family: var(--font-mono);
}

.sep {
  color: var(--subtle);
}

.when {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;
  white-space: nowrap;
}

.empty {
  padding: 40px 0;
  text-align: center;
  color: var(--muted);
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .when {
    grid-column: 1 / -1;
    align-items: flex-start;
  }
}
</style>
