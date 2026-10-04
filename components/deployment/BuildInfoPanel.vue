<script setup lang="ts">
import type { Deployment } from '~/types/deployment'
import { PRESETS } from '~/constants/presets'

const props = defineProps<{
  deployment: Deployment
}>()

const presetLabel = computed(() => PRESETS.find((p) => p.value === props.deployment.build.preset)?.label ?? props.deployment.build.preset)
const source = computed(() => {
  const build = props.deployment.build
  if (!build.source) return undefined
  return build.source === 'git' ? `Git · ${build.repository ?? ''}` : `Upload · ${build.fileCount ?? 0} file(s)`
})
</script>

<template>
  <KeyValueGrid
    :rows="[
      { label: 'Source', value: source },
      { label: 'Branch', value: deployment.branch },
      { label: 'Commit', value: deployment.commit || undefined, mono: true },
      { label: 'Framework', value: presetLabel },
      { label: 'Root directory', value: deployment.build.rootDirectory, mono: true },
      { label: 'Install command', value: deployment.build.installCommand, mono: true },
      { label: 'Build command', value: deployment.build.buildCommand, mono: true },
      { label: 'Output directory', value: deployment.build.outputDirectory, mono: true },
    ]"
  />
</template>
