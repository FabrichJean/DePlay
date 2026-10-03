<script setup lang="ts">
import { ICONS, type IconName } from '~/constants/icons'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
  }>(),
  { size: 18 },
)
</script>

<template>
  <!-- Markup statique et interne (constants/icons.ts), donc v-html est sûr ici -->
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="ICONS[props.name]"
  />
</template>
