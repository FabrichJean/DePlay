<script setup lang="ts">
import { STATUS_META } from '~/constants/status'
import type { ProjectStatus } from '~/types/project'

const props = defineProps<{
  status: ProjectStatus
}>()

const meta = computed(() => STATUS_META[props.status])
</script>

<template>
  <span class="badge" :style="{ '--c': meta.color }">
    <span class="badge-dot" />
    {{ meta.label }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--c);
  background: color-mix(in srgb, var(--c) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 35%, transparent);
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--c);
}
</style>
