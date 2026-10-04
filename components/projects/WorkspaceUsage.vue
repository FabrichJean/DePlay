<script setup lang="ts">
import type { WorkspaceUsage } from '~/types/project'

const props = defineProps<{
  usage: WorkspaceUsage
}>()

// Anneau SVG : circonférence d'un cercle de rayon 52
const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const dashOffset = computed(() => CIRCUMFERENCE * (1 - props.usage.usedPercent / 100))
</script>

<template>
  <AppCard class="usage">
    <header class="head">
      <h2 class="title">
        <AppIcon name="activity" :size="16" />
        Workspace Usage
      </h2>
      <span class="period">{{ usage.period }}</span>
    </header>

    <div class="gauge">
      <svg viewBox="0 0 120 120" width="150" height="150" aria-hidden="true">
        <circle cx="60" cy="60" :r="RADIUS" class="track" />
        <circle
          cx="60"
          cy="60"
          :r="RADIUS"
          class="arc"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="dashOffset"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div class="gauge-label">
        <span class="gauge-value">{{ usage.usedPercent }}%</span>
        <span class="gauge-caption">Used</span>
      </div>
    </div>

    <ul class="items">
      <li v-for="item in usage.items" :key="item.label" class="item">
        <span class="item-icon">
          <AppIcon :name="item.icon" :size="16" />
        </span>
        <div class="item-body">
          <div class="item-row">
            <span class="label">{{ item.label }}</span>
            <span class="value">{{ item.value }}</span>
          </div>
          <div v-if="item.percent !== null" class="bar" role="progressbar" :aria-valuenow="item.percent" aria-valuemin="0" aria-valuemax="100">
            <span class="bar-fill" :style="{ width: `${item.percent}%` }" />
          </div>
        </div>
      </li>
    </ul>
  </AppCard>
</template>

<style scoped>
.usage {
  padding: 20px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.title svg {
  color: var(--primary);
}

.period {
  font-size: 12px;
  color: var(--muted);
}

.gauge {
  position: relative;
  display: grid;
  place-items: center;
  margin: 8px 0 22px;
}

.track {
  fill: none;
  stroke: var(--border);
  stroke-width: 10;
}

.arc {
  fill: none;
  stroke: var(--primary);
  stroke-width: 10;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.6s ease;
}

.gauge-label {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gauge-value {
  font-size: 22px;
  font-weight: 700;
}

.gauge-caption {
  font-size: 12px;
  color: var(--muted);
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: var(--card-hover);
  border: 1px solid var(--border);
  color: var(--muted);
}

.item-body {
  flex: 1;
  min-width: 0;
}

.item-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}

.label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.value {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.bar {
  margin-top: 6px;
  height: 4px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--primary);
}
</style>
