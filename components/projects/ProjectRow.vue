<script setup lang="ts">
import type { Project } from '~/types/project'

defineProps<{
  project: Project
}>()
</script>

<template>
  <article class="row">
    <ProjectLogo :kind="project.kind" />

    <div class="identity">
      <p class="name">{{ project.name }}</p>
      <p class="url">{{ project.url }}</p>
    </div>

    <ProjectStatusBadge :status="project.status" />

    <dl class="inline-stats">
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

    <span class="updated">Updated {{ project.updatedLabel }}</span>
  </article>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1.2fr) auto minmax(0, 1.4fr) auto;
  align-items: center;
  gap: 18px;
  padding: 16px 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.row:hover {
  border-color: #2a3a48;
}

.identity {
  min-width: 0;
}

.name {
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

.inline-stats {
  display: flex;
  gap: 24px;
  margin: 0;
}

.inline-stats dt {
  font-size: 11px;
  color: var(--muted);
}

.inline-stats dd {
  margin: 2px 0 0;
  font-weight: 600;
}

.updated {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

@media (max-width: 900px) {
  .row {
    grid-template-columns: 44px minmax(0, 1fr) auto;
  }

  .inline-stats,
  .updated {
    grid-column: 2 / -1;
  }
}
</style>
