<script setup lang="ts">
import type { IconName } from '~/constants/icons'

interface NavItem {
  label: string
  icon: IconName
  to: string
}

const navigation: NavItem[] = [
  { label: 'Dashboard', icon: 'grid', to: '/' },
  { label: 'Websites', icon: 'globe', to: '/websites' },
  { label: 'Deployments', icon: 'box', to: '/deployments' },
  { label: 'Web services', icon: 'layers', to: '/webservices' },
  { label: 'Logs', icon: 'file', to: '/logs' },
  { label: 'Server', icon: 'server', to: '/server' },
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
    <div class="brand">
      <div class="brand-logo" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="30" height="30">
          <path d="M16 4 28 26H4Z" fill="var(--primary)" />
          <path d="M16 14 22 26H10Z" fill="#0b1e3f" />
        </svg>
      </div>
      <div>
        <p class="brand-name">Deplay</p>
        <p class="brand-tag">Ship your ideas</p>
      </div>
    </div>

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
  border-radius: 10px;
  background: var(--primary-soft);
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
