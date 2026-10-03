<script setup lang="ts">
const props = defineProps<{
  points: number[]
  color: string
}>()

const paths = computed(() => sparklinePaths(props.points))
</script>

<template>
  <svg class="sparkline" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" :style="{ '--c': color }">
    <path :d="paths.area" class="area" />
    <path :d="paths.line" class="line" vector-effect="non-scaling-stroke" />
  </svg>
</template>

<style scoped>
.sparkline {
  display: block;
  width: 100%;
  height: 40px;
}

.line {
  fill: none;
  stroke: var(--c);
  stroke-width: 1.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.area {
  fill: color-mix(in srgb, var(--c) 14%, transparent);
}
</style>
