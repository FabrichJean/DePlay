<script setup lang="ts">
import { MAX_ENV_VARIABLES, mergeVariables, parseDotenv, type EnvVariable } from '~/utils/env-variables'

// Liste éditable de variables : le parent fournit le tableau (v-model) et l'erreur éventuelle
const variables = defineModel<EnvVariable[]>({ required: true })
defineProps<{
  error?: string
}>()

// Valeurs masquées par défaut ; on peut les afficher ligne par ligne
const revealed = reactive<Record<number, boolean>>({})

function add() {
  variables.value.push({ key: '', value: '' })
}

function remove(index: number) {
  variables.value.splice(index, 1)
  delete revealed[index]
}

// Import d'un fichier .env ou d'un texte collé : les valeurs importées remplacent celles de même nom
const fileInput = ref<HTMLInputElement | null>(null)
const pasting = ref(false)
const pasted = ref('')
const importMessage = ref('')

function importText(text: string) {
  const incoming = parseDotenv(text)
  variables.value = mergeVariables(variables.value, incoming)
  importMessage.value = incoming.length
    ? `${incoming.length} variable${incoming.length > 1 ? 's' : ''} imported.`
    : 'No variable found in this text.'
}

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) importText(await file.text())
  input.value = ''
}

function applyPaste() {
  importText(pasted.value)
  pasted.value = ''
  pasting.value = false
}
</script>

<template>
  <div class="env">
    <ul v-if="variables.length" class="rows">
      <li v-for="(variable, index) in variables" :key="index" class="row">
        <input
          v-model="variable.key"
          class="key"
          type="text"
          placeholder="NAME"
          autocomplete="off"
          spellcheck="false"
          aria-label="Variable name"
        />
        <div class="value">
          <input
            v-model="variable.value"
            :type="revealed[index] ? 'text' : 'password'"
            placeholder="value"
            autocomplete="off"
            spellcheck="false"
            aria-label="Variable value"
          />
          <button type="button" class="icon" :aria-label="revealed[index] ? 'Hide value' : 'Show value'" @click="revealed[index] = !revealed[index]">
            {{ revealed[index] ? 'Hide' : 'Show' }}
          </button>
        </div>
        <button type="button" class="icon danger" aria-label="Remove variable" @click="remove(index)">
          <AppIcon name="trash" :size="14" />
        </button>
      </li>
    </ul>
    <p v-else class="muted">No variables yet.</p>

    <div class="import">
      <button type="button" class="btn" @click="fileInput?.click()">
        <AppIcon name="file" :size="14" />
        Import .env file
      </button>
      <button type="button" class="btn" @click="pasting = !pasting">Paste .env content</button>
      <input ref="fileInput" type="file" hidden @change="onFile" />
    </div>

    <div v-if="pasting" class="paste">
      <textarea
        v-model="pasted"
        rows="6"
        placeholder="API_URL=https://api.example.com&#10;VITE_FLAG=1"
        spellcheck="false"
        autocomplete="off"
        aria-label="Content of a .env file"
      />
      <button type="button" class="btn btn-primary" :disabled="!pasted.trim()" @click="applyPaste">Import</button>
    </div>
    <p v-if="importMessage" class="muted">{{ importMessage }}</p>

    <button
      type="button"
      class="btn add"
      :disabled="variables.length >= MAX_ENV_VARIABLES"
      @click="add"
    >
      <AppIcon name="plus" :size="14" />
      Add variable
    </button>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.env {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.muted {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) auto;
  gap: 8px;
  align-items: center;
}

input {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
}

.value {
  position: relative;
  display: flex;
  align-items: center;
}

.value input {
  padding-right: 56px;
}

.icon {
  height: 36px;
  min-width: 36px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 12px;
}

.value .icon {
  position: absolute;
  right: 4px;
  height: 28px;
  min-width: 0;
  border: none;
  background: transparent;
}

.icon.danger:hover {
  color: #f87171;
}

.import {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.import .btn,
.paste .btn {
  height: 34px;
  padding: 0 12px;
  font-size: 13px;
}

.paste {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.paste textarea {
  width: 100%;
  padding: 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  resize: vertical;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.add {
  align-self: flex-start;
  height: 34px;
  padding: 0 12px;
  font-size: 13px;
}

.error {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  font-size: 13px;
}

@media (max-width: 560px) {
  .row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .value {
    grid-column: 1 / -1;
    order: 3;
  }
}
</style>
