<script setup lang="ts">
import type { IconName } from '~/constants/icons'

interface MenuItem {
  label: string
  description: string
  icon: IconName
  to?: string
}

const items: MenuItem[] = [
  { label: 'Website', description: 'Deploy a static or server-rendered site from Git.', icon: 'globe', to: '/new/website' },
  { label: 'Web Service', description: 'Run a long-lived API or background process.', icon: 'server', to: '/new/website?type=webservice' },
  { label: 'File Storage', description: 'Store and serve files for your applications.', icon: 'box' },
]

const root = ref<HTMLElement | null>(null)
const open = ref(false)

// Ferme le menu au clic extérieur ou à la touche Échap
function onPointerDown(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="new-project">
    <button
      class="btn btn-primary new-btn"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <AppIcon name="plus" :size="16" />
      New Project
      <AppIcon name="chevronDown" :size="16" class="chevron" :class="{ 'is-flipped': open }" />
    </button>

    <div v-if="open" class="menu" role="menu">
      <template v-for="item in items" :key="item.label">
        <NuxtLink
          v-if="item.to"
          :to="item.to"
          class="menu-item"
          role="menuitem"
          @click="open = false"
        >
          <span class="menu-icon"><AppIcon :name="item.icon" :size="18" /></span>
          <span class="menu-text">
            <span class="menu-label">{{ item.label }}</span>
            <span class="menu-desc">{{ item.description }}</span>
          </span>
        </NuxtLink>

        <div v-else class="menu-item is-disabled" role="menuitem" aria-disabled="true">
          <span class="menu-icon"><AppIcon :name="item.icon" :size="18" /></span>
          <span class="menu-text">
            <span class="menu-label">
              {{ item.label }}
              <span class="soon">Soon</span>
            </span>
            <span class="menu-desc">{{ item.description }}</span>
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.new-project {
  position: relative;
  flex-shrink: 0;
}

.new-btn {
  height: 42px;
  padding: 0 14px 0 16px;
}

.chevron {
  margin-left: 4px;
  opacity: 0.8;
  transition: transform 0.2s;
}

.chevron.is-flipped {
  transform: rotate(180deg);
}

.menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 50;
  width: 300px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
}

.menu-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.menu-item:not(.is-disabled):hover {
  background: var(--card-hover);
}

.menu-item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  background: var(--primary-soft);
  color: var(--primary);
}

.menu-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.menu-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.menu-desc {
  font-size: 12px;
  color: var(--muted);
}

.soon {
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  color: var(--muted);
  border: 1px solid var(--border);
}

@media (max-width: 560px) {
  .menu {
    width: min(300px, calc(100vw - 32px));
  }
}
</style>
