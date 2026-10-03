<script setup lang="ts">
import type { ServerInfo } from '~/types/deployment'

defineProps<{
  server: ServerInfo
}>()
</script>

<template>
  <AppCard>
    <div class="server-head">
      <h2 class="card-title">Server</h2>
      <StatusBadge
        :label="server.status === 'online' ? 'Online' : 'Offline'"
        :tone="server.status === 'online' ? 'success' : 'neutral'"
      />
    </div>

    <dl class="server-list">
      <div class="server-row">
        <dt><AppIcon name="globe" :size="15" /> IP Address</dt>
        <dd>{{ server.ip }}</dd>
      </div>
      <div class="server-row">
        <dt><AppIcon name="server" :size="15" /> Provider</dt>
        <dd>{{ server.provider }}</dd>
      </div>
      <div class="server-row">
        <dt><AppIcon name="mapPin" :size="15" /> Location</dt>
        <dd>
          <span class="flag" aria-hidden="true">{{ server.flag }}</span>
          {{ server.location }}
        </dd>
      </div>
    </dl>
  </AppCard>
</template>

<style scoped>
.server-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.server-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.server-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
}

dt {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
}

dt :deep(svg) {
  color: var(--subtle);
}

dd {
  margin: 0;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.flag {
  font-size: 15px;
  line-height: 1;
}
</style>
