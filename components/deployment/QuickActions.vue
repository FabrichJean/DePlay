<script setup lang="ts">
const emit = defineEmits<{
  redeploy: []
  viewLogs: []
  manageEnvironment: []
}>()
</script>

<template>
  <AppCard>
    <h2 class="card-title">Quick Actions</h2>

    <div class="actions">
      <button class="btn btn-primary btn-block" type="button" @click="emit('redeploy')">
        <AppIcon name="refresh" :size="16" />
        Redeploy
      </button>
      <button class="btn btn-block" type="button" @click="emit('viewLogs')">
        <AppIcon name="file" :size="16" />
        View Logs
      </button>
      <button class="btn btn-block" type="button" @click="emit('manageEnvironment')">
        <AppIcon name="settings" :size="16" />
        Manage Environment
      </button>
    </div>
  </AppCard>
</template>

<style scoped>
.card-title {
  margin-bottom: 18px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
