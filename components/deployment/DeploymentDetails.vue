<script setup lang="ts">
import type { Deployment } from '~/types/deployment'

withDefaults(
  defineProps<{
    deployment: Deployment
    /** Mise en page centrée sur une colonne, sans la colonne latérale */
    compact?: boolean
  }>(),
  { compact: false },
)
</script>

<template>
  <div class="page" :class="{ 'is-compact': compact }">
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

    <aside v-if="!compact" class="page-side">
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

/* Page projet : une colonne centrée et compacte */
.page.is-compact {
  margin: 0 auto;
  max-width: 750px;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
}

.page.is-compact .page-main {
  gap: 16px;
}

.page.is-compact .metrics {
  gap: 12px;
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
