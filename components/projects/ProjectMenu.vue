<script setup lang="ts">
import type { Project } from '~/types/project'

const props = withDefaults(
  defineProps<{
    project: Project
    /** Masqué sur la page du projet, où « Manage » ne mènerait nulle part */
    showManage?: boolean
  }>(),
  { showManage: true },
)

const route = useRoute()
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLElement | null>(null)
const menu = ref<HTMLElement | null>(null)
// Position du menu à l'écran : il est rendu dans <body>, hors des blocs de la page
const position = ref({ top: 0, right: 0 })

function place() {
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect) return
  position.value = { top: rect.bottom + 6, right: window.innerWidth - rect.right }
}
const open = ref(false)
const confirming = ref(false)
const deleting = ref(false)
const deleteError = ref('')

const siteUrl = computed(() => (props.project.url ? absoluteUrl(props.project.url) : ''))

function toggle() {
  open.value = !open.value
  confirming.value = false
  if (open.value) place()
}

function close() {
  open.value = false
  confirming.value = false
  deleteError.value = ''
}

// Ferme le menu au clic extérieur ou à la touche Échap
function onPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (root.value?.contains(target) || menu.value?.contains(target)) return
  close()
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
    // Recharge la liste et, si on est sur la page du projet, son déploiement (statut, logs)
    await refreshNuxtData(['projects', `project:${props.project.id}`, `project-deployment:${props.project.id}`])
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
    // Depuis la page du projet supprimé, on revient à la liste
    if (route.path.startsWith('/projects/')) {
      await navigateTo('/')
      return
    }
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
  window.addEventListener('resize', place)
  window.addEventListener('scroll', place, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', place)
  window.removeEventListener('scroll', place, true)
})
</script>

<template>
  <div ref="root" class="project-menu">
    <button
      ref="trigger"
      type="button"
      class="icon-btn small"
      aria-label="More actions"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="toggle"
    >
      <AppIcon name="more" :size="16" />
    </button>

    <Teleport to="body">
    <div
      v-if="open"
      ref="menu"
      class="project-menu-popup"
      role="menu"
      :style="{ top: `${position.top}px`, right: `${position.right}px` }"
    >
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

        <NuxtLink v-if="showManage" :to="`/projects/${project.id}`" class="item" role="menuitem" @click="close">
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
    </Teleport>
  </div>
</template>

<style scoped>
.project-menu {
  position: relative;
  z-index: 60;
}

.icon-btn.small {
  width: 30px;
  height: 30px;
  border: 0;
  background: none;
}

.project-menu-popup {
  position: fixed;
  z-index: 1000;
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
