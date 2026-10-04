<script setup lang="ts">
import type { Deployment } from '~/types/deployment'

const props = defineProps<{
  deployment: Deployment
}>()
</script>

<template>
  <KeyValueGrid
    :rows="[
      { label: 'Environment', value: deployment.environment },
      { label: 'Runtime', value: deployment.info.runtime ?? deployment.runtime },
      { label: 'Framework', value: deployment.info.framework },
      { label: 'Port', value: deployment.info.port, mono: true },
      { label: 'Memory', value: deployment.info.memory },
      { label: 'CPU', value: deployment.info.cpu },
      { label: 'Server status', value: deployment.server.status },
      { label: 'Server IP', value: deployment.server.ip, mono: true },
      { label: 'Provider', value: deployment.server.provider },
      { label: 'Location', value: deployment.server.location },
    ]"
  />
</template>
