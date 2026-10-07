<script setup lang="ts">
import type { IconName } from '~/constants/icons'

interface NavItem {
  label: string
  icon: IconName
  to: string
}

const navigation: NavItem[] = [
  { label: 'Overview', icon: 'grid', to: '/' },
  { label: 'Websites', icon: 'globe', to: '/websites' },
  { label: 'Web services', icon: 'layers', to: '/webservices' },
  { label: 'Deployments', icon: 'box', to: '/deployments' },
  { label: 'Usage', icon: 'activity', to: '/usage' },
  { label: 'Logs', icon: 'file', to: '/logs' },
  { label: 'Settings', icon: 'settings', to: '/settings' },
]

const user = {
  name: 'Fabrich Vohanson',
  role: 'Developer',
  initials: 'FV',
}
</script>

<template>
  <aside class="sidebar">
    <NuxtLink to="/" class="brand">
      <div class="brand-logo" aria-hidden="true">
        <svg width="28" height="28" viewBox="12 26 103 108" fill="none"><defs><linearGradient id="dpl-side" x1="20" y1="20" x2="115" y2="135" gradientUnits="userSpaceOnUse"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#06B6D4"/></linearGradient></defs><path d="M28 35C24.7 33.1 20.5 35.5 20.5 39.3V61.1C20.5 63.5 21.8 65.7 23.9 66.9L67.4 92.1C70.7 94 74.8 91.6 74.8 87.8V66C74.8 63.6 73.6 61.4 71.5 60.2L28 35Z" fill="url(#dpl-side)"/><path d="M28 125C24.7 126.9 20.5 124.5 20.5 120.7V98.9C20.5 96.5 21.8 94.3 23.9 93.1L67.4 67.9C70.7 66 74.8 68.4 74.8 72.2V94C74.8 96.4 73.6 98.6 71.5 99.8L28 125Z" fill="url(#dpl-side)" opacity="0.92"/><path d="M67.4 92.1L103.2 71.4C106.5 69.5 106.5 64.7 103.2 62.8L67.4 42.1C64.1 40.2 60 42.6 60 46.4V87.8C60 91.6 64.1 94 67.4 92.1Z" fill="url(#dpl-side)"/></svg>
      </div>
      <div>
        <p class="brand-name">Deplay</p>
        <p class="brand-tag">Ship your ideas</p>
      </div>
    </NuxtLink>

    <nav class="nav" aria-label="Main">
      <NuxtLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        class="nav-link"
        exact-active-class="is-active"
      >
        <AppIcon :name="item.icon" :size="18" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <SidebarPromo />

    <div class="user">
      <div class="avatar" aria-hidden="true">{{ user.initials }}</div>
      <div class="user-info">
        <p class="user-name">{{ user.name }}</p>
        <p class="user-role">{{ user.role }}</p>
      </div>
      <AppIcon name="arrowUp" :size="16" class="user-chevron" />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 26px 18px 22px;
  background: var(--sidebar);
  border-right: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
  margin-bottom: 34px;
}

.brand-logo {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
}

.brand-name {
  font-size: 16px;
  font-weight: 700;
}

.brand-tag {
  font-size: 12px;
  color: var(--muted);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 14px;
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-weight: 500;
  transition: color 0.15s, background 0.15s;
}

.nav-link:hover {
  color: var(--text);
  background: var(--card);
}

.nav-link.is-active {
  color: var(--primary);
  background: var(--primary-soft);
}

.user {
  margin-top: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px 0;
  border-top: 1px solid var(--border);
}

.avatar {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e3a5f, #0f1d33);
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  white-space: nowrap;
}

.user-role {
  font-size: 12px;
  color: var(--muted);
}

.user-chevron {
  color: var(--muted);
  transform: rotate(180deg);
}

@media (max-width: 900px) {
  .sidebar {
    position: static;
    height: auto;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 16px;
  }

  .brand {
    margin-bottom: 0;
  }

  .nav {
    flex-direction: row;
    overflow-x: auto;
    width: 100%;
  }

  .nav-link {
    white-space: nowrap;
  }

  .user,
  .sidebar > :deep(.promo) {
    display: none;
  }
}
</style>
