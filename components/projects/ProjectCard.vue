<script setup lang="ts">
import { STATUS_META } from '~/constants/status'
import type { Project } from '~/types/project'

const props = defineProps<{
  project: Project
}>()

const color = computed(() => STATUS_META[props.project.status].color)
</script>

<template>
  <article class="card">
    <header class="head">
      <div class="identity">
        <ProjectLogo :kind="project.kind" />
        <div class="titles">
          <h3 class="name">{{ project.name }}</h3>
          <p class="url">{{ project.url || 'Not deployed yet' }}</p>
        </div>
      </div>

      <div class="head-actions">
        <ProjectStatusBadge :status="project.status" />
        <ProjectMenu :project="project" />
      </div>
    </header>

    <div class="body">
      <ProjectPreview :status="project.status" />

      <div class="summary">
        <p class="description">{{ project.description }}</p>

        <dl class="stats">
          <div>
            <dt>Deployments</dt>
            <dd>{{ project.stats.deployments }}</dd>
          </div>
          <div>
            <dt>Requests</dt>
            <dd>{{ project.stats.requests }}</dd>
          </div>
          <div>
            <dt>Errors</dt>
            <dd>{{ project.stats.errors }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <ProjectSparkline :points="project.sparkline" :color="color" />

    <footer class="foot">
      <div class="meta">
        <AppIcon name="github" :size="16" />
        <span class="branch">
          <AppIcon name="gitBranch" :size="13" />
          {{ project.branch }}
        </span>
      </div>

      <div class="meta">
        <span>Updated {{ project.updatedLabel }}</span>
        <button class="go" type="button" :aria-label="`Open ${project.name}`">
          <AppIcon name="arrowRight" :size="14" />
        </button>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: border-color 0.15s;
}

.card:hover {
  border-color: #2a3a48;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.titles {
  min-width: 0;
}

.name {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.url {
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.icon-btn.small {
  width: 30px;
  height: 30px;
  border: 0;
  background: none;
}

.body {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.description {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 14px 0 0;
}

.stats dt {
  font-size: 11px;
  color: var(--muted);
}

.stats dd {
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 600;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--muted);
}

.meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.branch {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.go {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border);
  color: var(--muted);
  transition: color 0.15s, border-color 0.15s;
}

.go:hover {
  color: var(--primary);
  border-color: var(--primary-border);
}

@media (max-width: 720px) {
  .body {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
