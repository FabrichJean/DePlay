<script setup lang="ts">
import type { Deployment } from '~/types/deployment'

const props = defineProps<{
  deployment: Deployment
}>()
</script>

<template>
  <KeyValueGrid
    :rows="[
      { label: 'Deployment ID', value: deployment.id, mono: true },
      { label: 'Status', value: deployment.status },
      { label: 'URL', value: deployment.url, mono: true },
      { label: 'Deployed at', value: deployment.deployedAt },
      { label: 'Duration', value: deployment.duration },
      { label: 'Created', value: deployment.info.created },
      { label: 'Type', value: deployment.type },
      { label: 'Project', value: deployment.name },
    ]"
  />
</template>
