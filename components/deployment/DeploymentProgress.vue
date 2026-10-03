<script setup lang="ts">
import type { DeploymentStep } from '~/types/deployment'

defineProps<{
  steps: DeploymentStep[]
}>()
</script>

<template>
  <AppCard>
    <h2 class="card-title">Deployment Progress</h2>

    <ol class="steps">
      <li v-for="step in steps" :key="step.key" class="step" :class="`is-${step.status}`">
        <span class="step-circle">
          <AppIcon v-if="step.status === 'done'" name="check" :size="16" />
        </span>
        <span class="step-label">{{ step.label }}</span>
        <span class="step-duration">{{ step.duration }}</span>
      </li>
    </ol>
  </AppCard>
</template>

<style scoped>
.card-title {
  margin-bottom: 26px;
}

.steps {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Ligne de connexion entre le centre du 1er et du dernier cercle */
.steps::before {
  content: '';
  position: absolute;
  top: 17px;
  left: 12.5%;
  right: 12.5%;
  height: 2px;
  background: var(--primary);
}

.step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.step-circle {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary);
  color: #ffffff;
  box-shadow: 0 0 0 6px var(--card);
}

.step.is-pending .step-circle {
  background: var(--card-hover);
  border: 2px solid var(--border);
}

.step-label {
  font-weight: 600;
  margin-top: 6px;
}

.step-duration {
  font-size: 12px;
  color: var(--muted);
}

@media (max-width: 560px) {
  .steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 22px;
  }

  .steps::before {
    display: none;
  }
}
</style>
