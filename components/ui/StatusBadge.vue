<script setup lang="ts">
import type { IconName } from '~/constants/icons'

withDefaults(
  defineProps<{
    label: string
    tone?: 'success' | 'neutral'
    icon?: IconName
    pulse?: boolean
  }>(),
  { tone: 'success', icon: undefined, pulse: false },
)
</script>

<template>
  <span class="badge" :class="`badge-${tone}`">
    <AppIcon v-if="icon" :name="icon" :size="12" />
    <span v-else class="dot" :class="{ 'dot-pulse': pulse }" />
    {{ label }}
  </span>
</template>
