<script setup lang="ts">
import type { ProjectKind } from '~/types/project'

defineProps<{
  kind: ProjectKind
}>()
</script>

<template>
  <span class="logo" aria-hidden="true">
    <!-- Triangle en pointillés : projet sans framework détecté -->
    <svg v-if="kind === 'none'" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2.5" stroke-linejoin="round">
      <path d="M12 3 22 20H2Z" />
    </svg>

    <svg v-else-if="kind === 'react'" viewBox="-11.5 -10.23 23 20.46" width="30" height="30">
      <circle r="2.05" fill="#61dafb" />
      <g fill="none" stroke="#61dafb" stroke-width="1">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>

    <svg v-else viewBox="0 0 32 32" width="28" height="28">
      <path d="M18 2 6 18h8l-2 12 12-16h-8z" fill="url(#project-bolt)" />
      <defs>
        <linearGradient id="project-bolt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#facc15" />
          <stop offset="1" stop-color="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  </span>
</template>

<style scoped>
.logo {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background: var(--card-hover);
  border: 1px solid var(--border);
  color: var(--muted);
}
</style>
