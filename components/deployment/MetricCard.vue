<script setup lang="ts">
import type { IconName } from '~/constants/icons'

const props = defineProps<{
  label: string
  value: string
  delta: string
  icon: IconName
  points: number[]
}>()

const WIDTH = 100
const HEIGHT = 40

// Chemin SVG du sparkline, recalculé uniquement quand les points changent
const sparkline = computed(() => {
  const { points } = props
  if (points.length < 2) return { line: '', area: '' }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = WIDTH / (points.length - 1)

  const coords = points.map((point, i) => {
    const x = (i * step).toFixed(2)
    const y = (HEIGHT - 4 - ((point - min) / range) * (HEIGHT - 8)).toFixed(2)
    return `${x},${y}`
  })

  const line = `M${coords.join(' L')}`
  return { line, area: `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z` }
})
</script>

<template>
  <AppCard class="metric">
    <div class="metric-head">
      <span class="metric-label">{{ label }}</span>
      <AppIcon :name="icon" :size="16" class="metric-icon" />
    </div>

    <div class="metric-body">
      <div>
        <p class="metric-value">{{ value }}</p>
        <p class="metric-delta">
          <AppIcon name="arrowUp" :size="12" />
          {{ delta }}
        </p>
      </div>

      <svg class="sparkline" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="none" aria-hidden="true">
        <path :d="sparkline.area" class="spark-area" />
        <path :d="sparkline.line" class="spark-line" vector-effect="non-scaling-stroke" />
      </svg>
    </div>
  </AppCard>
</template>

<style scoped>
.metric {
  padding: 18px 20px;
}

.metric-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--muted);
  font-size: 13px;
}

.metric-icon {
  color: var(--subtle);
}

.metric-body {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-top: 10px;
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.metric-delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--primary);
}

.sparkline {
  width: 110px;
  height: 40px;
  flex-shrink: 0;
  overflow: visible;
}

.spark-line {
  fill: none;
  stroke: var(--primary);
  stroke-width: 1.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.spark-area {
  fill: var(--primary-soft);
}
</style>
