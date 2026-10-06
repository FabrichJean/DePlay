<script setup lang="ts">
import type { Deployment } from '~/types/deployment'
import type { Project } from '~/types/project'

defineProps<{
  deployment: Pick<
    Deployment,
    'name' | 'description' | 'type' | 'runtime' | 'environment' | 'url' | 'branch' | 'commit' | 'deployedAt' | 'status'
  >
  /** Projet propriétaire : permet le menu Visit / Redeploy / Delete */
  project?: Project
}>()
</script>

<template>
  <header class="header">
    <NuxtLink to="/websites" class="back-link">
      <AppIcon name="arrowLeft" :size="16" />
      Back to projects
    </NuxtLink>

    <div class="title-row">
      <div class="app-icon">
        <AppIcon name="box" :size="26" />
      </div>
      <div class="title-block">
        <h1>{{ deployment.name }}</h1>
        <p class="meta">
          {{ deployment.type }}
          <span>•</span>
          {{ deployment.runtime }}
          <span>•</span>
          {{ deployment.environment }}
        </p>
      </div>
    </div>

    <p class="description">{{ deployment.description }}</p>

    <div class="chips">
      <a class="chip" :href="absoluteUrl(deployment.url)" target="_blank" rel="noopener">
        <AppIcon name="link" :size="14" />
        {{ deployment.url }}
      </a>
      <span class="chip">
        <AppIcon name="gitBranch" :size="14" />
        {{ deployment.branch }}
      </span>
      <span class="chip">
        <AppIcon name="commit" :size="14" />
        {{ deployment.commit }}
      </span>
    </div>

    <div class="hero-side">
      <div class="status">
        <StatusBadge v-if="deployment.status === 'deployed'" label="Deployed" icon="check" />
        <StatusBadge v-else-if="deployment.status === 'building'" label="Building" tone="neutral" pulse />
        <StatusBadge v-else label="Failed" tone="neutral" />
        <time class="status-date">{{ deployment.deployedAt }}</time>
      </div>

      <div class="actions">
        <a
          class="btn"
          :href="absoluteUrl(deployment.url)"
          target="_blank"
          rel="noopener"
        >
          Visit App
          <AppIcon name="externalLink" :size="14" />
        </a>
        <ProjectMenu v-if="project" :project="project" :show-manage="false" />
        <button v-else class="icon-btn" type="button" aria-label="More actions">
          <AppIcon name="more" :size="18" />
        </button>
      </div>
    </div>

  </header>
</template>

<style scoped>
.header {
  position: relative;
  min-height: 190px;
  padding-right: 240px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
  margin-bottom: 22px;
  transition: color 0.15s;
}

.back-link:hover {
  color: var(--text);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 18px;
}

.app-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: var(--radius);
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--primary);
}

h1 {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.meta {
  margin-top: 4px;
  color: var(--muted);
  font-size: 14px;
}

.meta span {
  margin: 0 6px;
  color: var(--subtle);
}

.description {
  margin-top: 16px;
  color: var(--muted);
  font-size: 15px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted);
  font-size: 13px;
}

a.chip:hover {
  color: var(--text);
}

.hero-side {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
}

.status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.status-date {
  font-size: 12px;
  color: var(--muted);
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}


@media (max-width: 1180px) {
  .header {
    padding-right: 0;
    min-height: 0;
  }

  .hero-side {
    position: static;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-top: 18px;
  }

  .status {
    align-items: flex-start;
  }

  .actions {
    margin-top: 0;
  }

}
</style>
