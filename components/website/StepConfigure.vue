<script setup lang="ts">
import { PRESETS } from '~/constants/presets'
import runtimesConfig from '~/config/runtimes.json'
import type { WebsiteProjectInput } from '~/types/website'

defineProps<{
  form: WebsiteProjectInput
  errors: Partial<Record<keyof WebsiteProjectInput, string>>
}>()

const RUNTIMES = runtimesConfig as Record<string, { label: string, startPlaceholder: string }>
</script>

<template>
  <div class="step-body">
    <header class="step-head">
      <h2>Configure project</h2>
      <p class="muted">Deplay pre-filled these from your repository. Adjust anything that differs.</p>
    </header>

    <label class="field">
      <span class="label">Project name</span>
      <input v-model="form.name" type="text" placeholder="my-website" autocomplete="off" />
      <span v-if="errors.name" class="error">{{ errors.name }}</span>
      <span v-else class="hint">Lowercase letters, digits and dashes, 3 to 40 characters.</span>
    </label>

    <template v-if="form.type === 'webservice'">
      <div class="service-note">
        <p>A web service runs your code as a process on a port. Deplay gives it a port and a public address.</p>
      </div>
      <fieldset class="presets">
        <legend class="label">Runtime</legend>
        <div class="preset-grid">
          <label
            v-for="(runtime, key) in RUNTIMES"
            :key="key"
            class="preset"
            :class="{ 'is-selected': form.runtime === key }"
          >
            <input v-model="form.runtime" type="radio" name="runtime" :value="key" class="sr-only" />
            <span class="preset-label">{{ runtime.label }}</span>
            <span class="muted">{{ runtime.startPlaceholder }}</span>
          </label>
        </div>
      </fieldset>
      <label class="field">
        <span class="label">Start command</span>
        <input v-model="form.startCommand" type="text" :placeholder="RUNTIMES[form.runtime]?.startPlaceholder" />
        <span v-if="errors.startCommand" class="error">{{ errors.startCommand }}</span>
        <span v-else class="hint">The command that starts your server. It must listen on the PORT environment variable.</span>
      </label>
    </template>

    <fieldset v-if="form.type === 'website'" class="presets">
      <legend class="label">Framework preset</legend>
      <div class="preset-grid">
        <label
          v-for="preset in PRESETS"
          :key="preset.value"
          class="preset"
          :class="{ 'is-selected': form.preset === preset.value }"
        >
          <input v-model="form.preset" type="radio" name="preset" :value="preset.value" class="sr-only" />
          <span class="preset-label">{{ preset.label }}</span>
          <span class="muted">{{ preset.description }}</span>
        </label>
      </div>
    </fieldset>

    <div class="grid">
      <label class="field">
        <span class="label">Root directory</span>
        <input v-model="form.rootDirectory" type="text" />
      </label>

      <label class="field">
        <span class="label">Install command</span>
        <input v-model="form.installCommand" type="text" placeholder="npm install" />
      </label>

      <label class="field">
        <span class="label">Build command</span>
        <input v-model="form.buildCommand" type="text" :placeholder="form.type === 'webservice' ? 'Leave empty if none' : 'npm run build'" />
      </label>

      <label v-if="form.type === 'website'" class="field">
        <span class="label">Output directory</span>
        <input v-model="form.outputDirectory" type="text" />
      </label>
    </div>
  </div>
</template>

<style scoped>
.step-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-head h2 {
  font-size: 18px;
  font-weight: 600;
}

.muted {
  color: var(--muted);
  font-size: 13px;
}

.hint {
  font-size: 12px;
  color: var(--subtle);
}

.error {
  font-size: 12px;
  color: #f87171;
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field input {
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font: inherit;
  outline: 0;
}

.field input:focus {
  border-color: var(--primary-border);
}

.service-note p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.presets {
  border: 0;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.preset {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.preset:hover {
  background: var(--card-hover);
}

.preset.is-selected {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.preset-label {
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 18px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .preset-grid,
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
