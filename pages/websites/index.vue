<script setup lang="ts">
import type { ProjectStatus } from '~/types/project'
import { STATUS_META } from '~/constants/status'

const { isLoaded, isSignedIn } = useAuth()
const { data } = await useProjects()

useHead({
  title: () => (isSignedIn.value ? 'Websites · Deplay' : 'Deplay'),
})

type Filter = 'all' | ProjectStatus
type SortKey = 'last-updated' | 'name'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'building', label: 'Building' },
  { key: 'attention', label: 'Attention' },
]

const query = ref('')
const filter = ref<Filter>('all')
const sort = ref<SortKey>('last-updated')
const view = ref<'grid' | 'list'>('grid')

// Seuls les sites statiques : les web services ont leur propre page
const projects = computed(() => (data.value?.projects ?? []).filter((project) => project.type === 'website'))

// Compteurs par statut, calculés en une seule passe
const counts = computed(() => {
  const result: Record<Filter, number> = { all: projects.value.length, live: 0, building: 0, attention: 0 }
  for (const project of projects.value) result[project.status]++
  return result
})

// Recherche, filtre et tri enchaînés sur la liste déjà chargée
const visibleProjects = computed(() => {
  const q = query.value.trim().toLowerCase()

  const matching = projects.value.filter((project) => {
    const matchesFilter = filter.value === 'all' || project.status === filter.value
    const matchesQuery =
      !q || project.name.toLowerCase().includes(q) || project.url.toLowerCase().includes(q)
    return matchesFilter && matchesQuery
  })

  return [...matching].sort((a, b) =>
    sort.value === 'name'
      ? a.name.localeCompare(b.name)
      : b.updatedAt.localeCompare(a.updatedAt),
  )
})
</script>

<template>
  <div v-if="isSignedIn" class="page">
    <header class="page-head">
      <div>
        <h1>Websites</h1>
        <p class="subtitle">Static sites published from your repositories or uploaded files.</p>
      </div>

      <NuxtLink to="/new/website" class="btn btn-primary">New website</NuxtLink>
    </header>

    <div class="toolbar">
      <label class="search">
        <AppIcon name="search" :size="18" />
        <input v-model="query" type="search" placeholder="Search websites..." />
      </label>

      <div class="filters" role="group" aria-label="Filter by status">
        <button
          v-for="item in FILTERS"
          :key="item.key"
          type="button"
          class="chip"
          :class="{ 'is-active': filter === item.key }"
          :aria-pressed="filter === item.key"
          @click="filter = item.key"
        >
          <span
            v-if="item.key !== 'all'"
            class="chip-dot"
            :style="{ background: STATUS_META[item.key].color }"
          />
          {{ item.label }}
          <span class="chip-count">{{ counts[item.key] }}</span>
        </button>
      </div>

      <div class="toolbar-end">
        <label class="select">
          <select v-model="sort" aria-label="Sort websites">
            <option value="last-updated">Last updated</option>
            <option value="name">Name</option>
          </select>
          <AppIcon name="chevronDown" :size="14" />
        </label>

        <div class="view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            class="icon-btn"
            :class="{ 'is-active': view === 'grid' }"
            aria-label="Grid view"
            @click="view = 'grid'"
          >
            <AppIcon name="grid" :size="18" />
          </button>
          <button
            type="button"
            class="icon-btn"
            :class="{ 'is-active': view === 'list' }"
            aria-label="List view"
            @click="view = 'list'"
          >
            <AppIcon name="list" :size="18" />
          </button>
        </div>
      </div>
    </div>

    <div class="layout">
      <aside class="side">
        <section class="status-card">
          <span class="status-dot" />
          <div class="status-text">
            <p class="status-title">All systems operational</p>
            <p class="status-caption">Your infrastructure is running smoothly.</p>
          </div>
          <AppIcon name="arrowRight" :size="16" class="status-arrow" />
        </section>
      </aside>

      <section class="main">
        <ul class="list" :class="`is-${view}`">
          <li v-for="project in visibleProjects" :key="project.id">
            <ProjectCard v-if="view === 'grid'" :project="project" />
            <ProjectRow v-else :project="project" />
          </li>
        </ul>

        <p v-if="!visibleProjects.length" class="empty">
          No websites match your filters.
        </p>
      </section>
    </div>
  </div>

  <LandingHero v-else-if="isLoaded" />
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

h1 {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.subtitle {
  margin-top: 4px;
  color: var(--muted);
}

.new-btn {
  height: 42px;
  padding: 0 14px 0 16px;
  flex-shrink: 0;
}

.new-chevron {
  margin-left: 4px;
  opacity: 0.8;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.search {
  flex: 1 1 260px;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--muted);
}

.search:focus-within {
  border-color: var(--primary-border);
}

.search input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: 0;
  color: var(--text);
}

.search input::placeholder {
  color: var(--subtle);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}

.chip:hover {
  color: var(--text);
}

.chip.is-active {
  color: var(--primary);
  background: var(--primary-soft);
  border-color: var(--primary-border);
}

.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.chip-count {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  font-size: 11px;
  background: var(--card-hover);
  color: var(--muted);
}

.chip.is-active .chip-count {
  background: var(--primary);
  color: #ffffff;
}

.toolbar-end {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.select {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 40px;
  color: var(--muted);
}

.select select {
  appearance: none;
  height: 40px;
  padding: 0 34px 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

.select svg {
  position: absolute;
  right: 12px;
  pointer-events: none;
}

.view-toggle {
  display: flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
}

.view-toggle .icon-btn {
  width: 34px;
  height: 34px;
  border: 0;
  background: none;
}

.view-toggle .icon-btn.is-active {
  background: var(--primary-soft);
  color: var(--primary);
}

.layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 94px;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--card);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c78a;
  box-shadow: 0 0 0 4px rgba(34, 199, 138, 0.15);
  flex-shrink: 0;
}

.status-text {
  flex: 1;
  min-width: 0;
}

.status-title {
  font-size: 13px;
  font-weight: 600;
  color: #22c78a;
}

.status-caption {
  font-size: 12px;
  color: var(--muted);
}

.status-arrow {
  color: var(--muted);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 16px;
}

.list.is-grid {
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
}

.empty {
  padding: 48px 0;
  text-align: center;
  color: var(--muted);
}

@media (max-width: 1280px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .side {
    position: static;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}

@media (max-width: 720px) {
  .side {
    grid-template-columns: minmax(0, 1fr);
  }

  .list.is-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .toolbar-end {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }
}
</style>
