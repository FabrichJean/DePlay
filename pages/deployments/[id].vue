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
  <div v-if="deployment" class="page">
    <div class="page-main">
      <DeploymentHeader :deployment="deployment" />

      <DeploymentProgress :steps="deployment.steps" />

      <DeploymentLogs :deployment="deployment" :lines="deployment.logs" :duration="deployment.duration" live />

      <div class="metrics">
        <MetricCard
          v-for="metric in deployment.metrics"
          :key="metric.key"
          :label="metric.label"
          :value="metric.value"
          :delta="metric.delta"
          :icon="metric.icon"
          :points="metric.points"
        />
      </div>
    </div>

    <aside class="page-side">
      <ApplicationInfo :info="deployment.info" />
      <ServerCard :server="deployment.server" />
      <QuickActions />
    </aside>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
}

.page-main,
.page-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/* Aligne la colonne droite sous la zone héros, comme sur la maquette */
.page-side {
  margin-top: 140px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

@media (max-width: 1180px) {
  .page {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-side {
    margin-top: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-side > :last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .metrics,
  .page-side {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
