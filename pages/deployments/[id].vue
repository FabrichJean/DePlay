<script setup lang="ts">
// Page de détail d'un déploiement, servie sur /deployments/:id
const route = useRoute()

const { data: deployment } = await useDeployment(String(route.params.id))

if (!deployment.value) {
  throw createError({ statusCode: 404, statusMessage: 'Deployment not found', fatal: true })
}

useHead({
  title: () => (deployment.value ? `${deployment.value.name} · Deplay` : 'Deplay'),
})
</script>

<template>
  <DeploymentDetails v-if="deployment" :deployment="deployment" />
</template>
