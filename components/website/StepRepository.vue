<script setup lang="ts">
import { PRESETS } from '~/constants/presets'
import type { ProjectSource, RepositoryOption, WebsiteProjectInput } from '~/types/website'

const props = defineProps<{
  form: WebsiteProjectInput
  error?: string
}>()

const files = defineModel<File[]>('files', { default: () => [] })

const query = ref('')
const dragging = ref(false)
const skipped = ref(0)

const SOURCES: { value: ProjectSource; label: string; description: string }[] = [
  { value: 'git', label: 'Git repository', description: 'Build from a connected repository' },
  { value: 'upload', label: 'Upload files', description: 'Drop a folder or files, no Git needed' },
]

// Dépôts réels du compte GitHub connecté à Clerk
const { data: github, status: githubStatus } = useFetch<{ connected: boolean, privateAccess: boolean, repositories: RepositoryOption[] }>(
  '/api/github/repositories',
  { key: 'github-repositories', lazy: true, default: () => ({ connected: false, privateAccess: false, repositories: [] }) },
)

const allRepositories = computed(() => github.value?.repositories ?? [])
const loadingRepositories = computed(() => githubStatus.value === 'pending')

const visibleRepositories = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? allRepositories.value.filter((repo) => repo.fullName.toLowerCase().includes(q)) : allRepositories.value
})

const totalSize = computed(() => files.value.reduce((sum, file) => sum + file.size, 0))

const presetLabel = (value: string) => PRESETS.find((preset) => preset.value === value)?.label ?? value

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Nom suggéré : dossier racine du dépôt ou du dossier déposé, sinon nom du fichier
function suggestName(source: string) {
  if (props.form.name) return
  const base = source.split('/')[0].replace(/\.[a-z0-9]+$/i, '')
  props.form.name = base.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 40)
}

// Choisir un dépôt pré-remplit la branche, le framework détecté et un nom de projet
function select(repo: RepositoryOption) {
  props.form.source = 'git'
  props.form.repository = repo.fullName
  props.form.branch = repo.defaultBranch
  props.form.preset = repo.detectedPreset
  suggestName(repo.fullName.split('/')[1] ?? '')
}

function setSource(source: ProjectSource) {
  props.form.source = source
}

// Dépendances, historiques et caches : inutiles pour le build, et souvent trop lourds
const IGNORED_SEGMENTS = new Set(['node_modules', '.git', '.nuxt', '.output', '.cache', 'coverage', '.DS_Store'])

function isIgnored(file: File): boolean {
  return (file.webkitRelativePath || file.name).split('/').some((part) => IGNORED_SEGMENTS.has(part))
}

function addFiles(list: FileList | File[] | null | undefined) {
  if (!list || !list.length) return
  const all = Array.from(list)
  const incoming = all.filter((file) => !isIgnored(file))
  skipped.value += all.length - incoming.length
  if (!incoming.length) return

  files.value = [...files.value, ...incoming]
  props.form.source = 'upload'
  suggestName(incoming[0].webkitRelativePath || incoming[0].name)
}

function onDrop(event: DragEvent) {
  dragging.value = false
  addFiles(event.dataTransfer?.files)
}

function onPick(event: Event) {
  const input = event.target as HTMLInputElement
  addFiles(input.files)
  input.value = ''
}

function clearFiles() {
  files.value = []
}
</script>

<template>
  <div class="step-body">
    <div class="segmented" role="tablist" aria-label="Source">
      <button
        v-for="source in SOURCES"
        :key="source.value"
        type="button"
        role="tab"
        class="seg"
        :class="{ 'is-active': form.source === source.value }"
        :aria-selected="form.source === source.value"
        @click="setSource(source.value)"
      >
        {{ source.label }}
      </button>
    </div>

    <!-- Mode Git -->
    <template v-if="form.source === 'git'">
      <label class="search">
        <AppIcon name="search" :size="16" />
        <input v-model="query" type="search" placeholder="Search repositories..." />
      </label>

      <p v-if="github?.connected && !github?.privateAccess && !loadingRepositories" class="muted hint">
        Private repositories are missing: reconnect GitHub and allow the repository (repo) permission.
      </p>
      <p v-if="loadingRepositories" class="muted empty">Loading your repositories…</p>
      <p v-else-if="!github?.connected" class="muted empty">
        No GitHub repository access. Sign in with GitHub and allow repository access to import code here.
      </p>

      <ul v-else class="repos" role="listbox" aria-label="Repositories">
        <li v-for="repo in visibleRepositories" :key="repo.fullName">
          <button
            type="button"
            class="repo"
            role="option"
            :aria-selected="form.repository === repo.fullName"
            :class="{ 'is-selected': form.repository === repo.fullName }"
            @click="select(repo)"
          >
            <span class="repo-main">
              <AppIcon name="github" :size="16" />
              <span class="repo-name">{{ repo.fullName }}</span>
              <AppIcon v-if="repo.private" name="lock" :size="13" class="repo-lock" aria-label="Private repository" />
            </span>
            <span class="repo-meta">
              <span class="tag">{{ presetLabel(repo.detectedPreset) }}</span>
              <span class="muted">{{ repo.updatedLabel }}</span>
            </span>
          </button>
        </li>
        <li v-if="!visibleRepositories.length" class="muted empty">No repository matches "{{ query }}".</li>
      </ul>

      <label class="field">
        <span class="label">Branch</span>
        <input v-model="form.branch" type="text" placeholder="main" />
      </label>
    </template>

    <!-- Mode upload -->
    <template v-else>
      <label
        class="dropzone"
        :class="{ 'is-dragging': dragging }"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <span class="drop-icon"><AppIcon name="box" :size="20" /></span>
        <span class="drop-title">Drop your project here</span>
        <span class="muted">or pick files below</span>
        <span class="picks">
          <span class="pick">
            Choose files
            <input type="file" multiple class="sr-only" @change="onPick" />
          </span>
          <span class="pick">
            Choose folder
            <input type="file" multiple webkitdirectory class="sr-only" @change="onPick" />
          </span>
        </span>
      </label>

      <div v-if="files.length" class="summary-bar">
        <span>
          <strong>{{ files.length }}</strong> file{{ files.length > 1 ? 's' : '' }}
          · {{ formatSize(totalSize) }}
        </span>
        <button type="button" class="clear" @click="clearFiles">Clear</button>
      </div>
    </template>

    <p v-if="skipped" class="muted">{{ skipped }} file{{ skipped > 1 ? 's' : '' }} skipped (node_modules, .git, build caches).</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.step-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.muted {
  color: var(--muted);
  font-size: 12px;
}

.error {
  font-size: 12px;
  color: #f87171;
}

.segmented {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
}

.seg {
  height: 34px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  transition: background 0.15s, color 0.15s;
}

.seg.is-active {
  background: var(--card-hover);
  color: var(--text);
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
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
  font: inherit;
  font-size: 13px;
}

.repos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
}

.repo {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg);
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
}

.repo:hover {
  background: var(--card-hover);
}

.repo.is-selected {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.repo-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-weight: 600;
  font-size: 13px;
}

.repo-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repo-lock {
  flex-shrink: 0;
  color: var(--muted);
}

.repo-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.tag {
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 11px;
}

.empty {
  padding: 12px 0;
  text-align: center;
}

.hint {
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 8px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 260px;
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
}

.field input {
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 13px;
  outline: 0;
}

.field input:focus {
  border-color: var(--primary-border);
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 26px 16px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  text-align: center;
  cursor: default;
  transition: border-color 0.15s, background 0.15s;
}

.dropzone.is-dragging {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.drop-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--primary-soft);
  color: var(--primary);
  margin-bottom: 4px;
}

.drop-title {
  font-weight: 600;
  font-size: 14px;
}

.picks {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.pick {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.pick:hover {
  background: var(--card-hover);
}

.sr-only {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg);
  border: 1px solid var(--border);
  font-size: 13px;
}

.clear {
  font-size: 12px;
  color: var(--muted);
}

.clear:hover {
  color: #f87171;
}
</style>
