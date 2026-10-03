<script setup lang="ts">
import type { Project } from '~/types/project'

const props = defineProps<{
  project: Project
}>()

const root = ref<HTMLElement | null>(null)
const open = ref(false)
const confirming = ref(false)
const deleting = ref(false)
const deleteError = ref('')

const siteUrl = computed(() => (props.project.url ? absoluteUrl(props.project.url) : ''))

function close() {
  open.value = false
  confirming.value = false
  deleteError.value = ''
}

// Ferme le menu au clic extérieur ou à la touche Échap
function onPointerDown(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

const redeploying = ref(false)
const redeployError = ref('')

async function redeploy() {
  redeployError.value = ''
  redeploying.value = true
  try {
    await $fetch(`/api/projects/${props.project.id}/redeploy`, { method: 'POST' })
    close()
    await refreshNuxtData('projects')
  } catch (error) {
    const body = (error as { data?: { statusMessage?: string } }).data
    redeployError.value = body?.statusMessage ?? 'Could not start the deployment.'
  } finally {
    redeploying.value = false
  }
}

async function remove() {
  deleting.value = true
  deleteError.value = ''
  try {
    await $fetch(`/api/projects/${props.project.id}`, { method: 'DELETE' })
    close()
    // Recharge la liste des projets pour retirer la carte
    await refreshNuxtData('projects')
  } catch {
    deleteError.value = 'Could not delete the project. Please try again.'
  } finally {
    deleting.value = false
  }
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
  <div ref="root" class="project-menu">
    <button
      type="button"
      class="icon-btn small"
      aria-label="More actions"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open; confirming = false"
    >
      <AppIcon name="more" :size="16" />
    </button>

    <div v-if="open" class="menu" role="menu">
      <template v-if="!confirming">
        <a
          v-if="siteUrl"
          :href="siteUrl"
          target="_blank"
          rel="noopener"
          class="item"
          role="menuitem"
          @click="close"
        >
          <AppIcon name="externalLink" :size="15" />
          Visit
        </a>
        <span v-else class="item is-disabled" role="menuitem" aria-disabled="true">
          <AppIcon name="externalLink" :size="15" />
          Visit
        </span>

        <NuxtLink :to="`/projects/${project.id}`" class="item" role="menuitem" @click="close">
          <AppIcon name="settings" :size="15" />
          Manage
        </NuxtLink>

        <button type="button" class="item" role="menuitem" :disabled="redeploying" @click="redeploy">
          <AppIcon name="refresh" :size="15" />
          {{ redeploying ? 'Starting…' : 'Redeploy' }}
        </button>
        <p v-if="redeployError" class="confirm-error menu-error">{{ redeployError }}</p>

        <div class="divider" />

        <button type="button" class="item is-danger" role="menuitem" @click="confirming = true">
          <AppIcon name="trash" :size="15" />
          Delete
        </button>
      </template>

      <!-- Confirmation avant suppression : l'action est irréversible -->
      <div v-else class="confirm" role="alertdialog" aria-label="Confirm delete">
        <p class="confirm-text">Delete <strong>{{ project.name }}</strong> and all its deployments? This cannot be undone.</p>
        <p v-if="deleteError" class="confirm-error">{{ deleteError }}</p>
        <div class="confirm-actions">
          <button type="button" class="btn btn-small" :disabled="deleting" @click="confirming = false">Cancel</button>
          <button type="button" class="btn btn-small btn-danger" :disabled="deleting" @click="remove">
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-menu {
  position: relative;
}

.icon-btn.small {
  width: 30px;
  height: 30px;
  border: 0;
  background: none;
}

.menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 40;
  min-width: 200px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 34px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text);
  text-align: left;
  transition: background 0.15s;
}

.item:not(.is-disabled):hover {
  background: var(--card-hover);
}

.item svg {
  color: var(--muted);
}

.item.is-disabled {
  color: var(--subtle);
  cursor: not-allowed;
}

.item.is-danger {
  color: #f87171;
}

.item.is-danger svg {
  color: #f87171;
}

.divider {
  height: 1px;
  margin: 4px 2px;
  background: var(--border);
}

.confirm {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  font-size: 13px;
}

.confirm-text {
  color: var(--muted);
  line-height: 1.5;
}

.confirm-text strong {
  color: var(--text);
}

.confirm-error {
  font-size: 12px;
  color: #f87171;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-small {
  height: 30px;
  padding: 0 12px;
  font-size: 12px;
}

.btn-danger {
  background: #dc2626;
  border-color: #dc2626;
  color: #ffffff;
  font-weight: 600;
}

.btn-danger:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}

.btn:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
