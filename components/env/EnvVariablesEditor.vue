<script setup lang="ts">
import { MAX_ENV_VARIABLES, type EnvVariable } from '~/utils/env-variables'

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
