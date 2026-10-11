<script setup lang="ts">
import type { IconName } from '~/constants/icons'
import type { Deployment, LogLine } from '~/types/deployment'

const props = defineProps<{
  deployment?: Deployment
  lines: LogLine[]
  duration: string
  live?: boolean
}>()

interface Tab {
  key: string
  label: string
  icon: IconName
}

const tabs: Tab[] = [
  { key: 'logs', label: 'Logs', icon: 'terminal' },
  { key: 'build', label: 'Build Info', icon: 'wrench' },
  { key: 'environment', label: 'Environment', icon: 'layers' },
  { key: 'details', label: 'Details', icon: 'info' },
]

const activeTab = ref<Tab['key']>('logs')

const terminal = ref<HTMLElement | null>(null)

// Suit les nouvelles lignes : le terminal descend tout seul pendant le build
watch(
  () => props.lines.length,
  async () => {
    await nextTick()
    terminal.value?.scrollTo({ top: terminal.value.scrollHeight })
  },
)

const plainText = computed(() =>
  props.lines.map((line) => `[${line.time}] ${line.message}`).join('\n'),
)

// Après une copie réussie, l'icône devient une coche pendant un instant
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copyLogs() {
  try {
    await navigator.clipboard.writeText(plainText.value)
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copied.value = false }, 1500)
  } catch {
    // Presse-papiers indisponible (contexte non sécurisé) : on ignore silencieusement
  }
}
onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>

<template>
  <AppCard class="logs-card">
    <div class="logs-header">
      <nav class="tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="tab"
          :class="{ 'is-active': activeTab === tab.key }"
          :aria-selected="activeTab === tab.key"
          @click="activeTab = tab.key"
        >
          <AppIcon :name="tab.icon" :size="14" />
          {{ tab.label }}
        </button>
      </nav>

      <div class="logs-actions">
        <StatusBadge v-if="live" label="Live" pulse tone="success" />
        <button class="icon-btn" :class="{ 'is-copied': copied }" type="button" :aria-label="copied ? 'Logs copied' : 'Copy logs'" @click="copyLogs">
          <AppIcon :name="copied ? 'check' : 'copy'" :size="16" />
        </button>
      </div>
    </div>

    <div ref="terminal" class="terminal" role="tabpanel">
      <template v-if="activeTab === 'logs'">
        <div
          v-for="(line, index) in lines"
          :key="index"
          class="log-line"
          :class="`tone-${line.tone}`"
        >
          <span class="log-time">[{{ line.time }}]</span>
          <span class="log-message">{{ line.message }}</span>
        </div>
      </template>

      <div v-else-if="deployment" class="panel">
        <BuildInfoPanel v-if="activeTab === 'build'" :deployment="deployment" />
        <EnvironmentPanel v-else-if="activeTab === 'environment'" :deployment="deployment" />
        <DetailsPanel v-else-if="activeTab === 'details'" :deployment="deployment" />
      </div>
      <p v-else class="terminal-empty">No data available for this tab yet.</p>
    </div>

    <footer class="logs-footer">
      <span class="prompt">&gt;</span>
      Deployment finished in {{ duration }}
    </footer>
  </AppCard>
</template>

<style scoped>
.icon-btn.is-copied {
  color: #22c78a;
  border-color: rgba(34, 199, 138, 0.4);
}

.logs-card {
  width: 100%;
  min-width: 0;
  padding: 0;
  overflow: hidden;
}

.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
  transition: color 0.15s, background 0.15s;
}

.tab:hover {
  color: var(--text);
}

.tab.is-active {
  color: var(--primary);
  background: var(--primary-soft);
}

.logs-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.terminal {
  width: 100%;
  min-width: 0;
  /* La largeur ne dépend que du conteneur, jamais du contenu des logs ou de l'onglet actif */
  contain: inline-size;
  height: 320px;
  padding: 18px 20px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.9;
  background: #080c10;
  overflow-y: auto;
  overflow-x: auto;
}

.log-line {
  display: flex;
  gap: 14px;
  white-space: pre;
}

.log-time {
  color: var(--subtle);
  flex-shrink: 0;
}

.tone-default {
  color: #d6dee6;
}

.tone-muted {
  color: var(--muted);
}

.tone-success {
  color: var(--primary);
}

.panel {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--text);
}

.terminal-empty {
  color: var(--subtle);
  font-family: var(--font-sans);
}

.logs-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--primary);
}

.prompt {
  color: var(--muted);
}
</style>
