<script setup lang="ts">
import { PRESETS } from '~/constants/presets'
import type { CreatedProject, WebsiteProjectInput } from '~/types/website'

useHead({ title: 'New website · Deplay' })

const NAME_PATTERN = /^[a-z0-9-]{3,40}$/

const STEPS = [
  { key: 'repository', label: 'Import repository' },
  { key: 'configure', label: 'Configure' },
  { key: 'review', label: 'Review & deploy' },
]

const form = reactive<WebsiteProjectInput>({
  name: '',
  repository: '',
  branch: 'main',
  preset: 'nuxt',
  rootDirectory: './',
  installCommand: PRESETS[0].installCommand,
  buildCommand: PRESETS[0].buildCommand,
  outputDirectory: PRESETS[0].outputDirectory,
})

const current = ref(0)
const errors = ref<Partial<Record<keyof WebsiteProjectInput, string>>>({})
const submitting = ref(false)
const submitError = ref('')
const created = ref<CreatedProject | null>(null)

// Changer de framework remplit les commandes par défaut
watch(
  () => form.preset,
  (preset) => {
    const defaults = PRESETS.find((item) => item.value === preset)
    if (!defaults) return
    form.installCommand = defaults.installCommand
    form.buildCommand = defaults.buildCommand
    form.outputDirectory = defaults.outputDirectory
  },
)

// Contrôle uniquement les champs de l'étape demandée
function validateStep(step: number): boolean {
  const result: typeof errors.value = {}

  if (step === 0) {
    if (!form.repository) result.repository = 'Choose a repository to import.'
    if (!form.branch.trim()) result.branch = 'Branch is required.'
  }

  if (step === 1) {
    if (!NAME_PATTERN.test(form.name)) result.name = 'Use 3–40 lowercase letters, digits or dashes.'
    if (!form.rootDirectory.trim()) result.rootDirectory = 'Root directory is required.'
    if (!form.outputDirectory.trim()) result.outputDirectory = 'Output directory is required.'
  }

  errors.value = result
  return Object.keys(result).length === 0
}

function next() {
  if (!validateStep(current.value)) return
  current.value = Math.min(current.value + 1, STEPS.length - 1)
}

function back() {
  errors.value = {}
  current.value = Math.max(current.value - 1, 0)
}

// On ne peut revenir que vers une étape déjà atteinte
function goTo(step: number) {
  if (step > current.value) return
  errors.value = {}
  current.value = step
}

async function submit() {
  submitError.value = ''
  // Revalide tout le parcours avant l'envoi, au cas où une étape a été modifiée
  for (let step = 0; step < STEPS.length - 1; step++) {
    if (!validateStep(step)) {
      current.value = step
      return
    }
  }

  submitting.value = true
  try {
    created.value = await $fetch<CreatedProject>('/api/projects/website', {
      method: 'POST',
      body: { ...form },
    })
  } catch {
    submitError.value = 'Could not create the project. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <NuxtLink to="/" class="back-link">
      <AppIcon name="arrowLeft" :size="16" />
      Back to projects
    </NuxtLink>

    <header class="head">
      <span class="head-icon"><AppIcon name="globe" :size="22" /></span>
      <div>
        <h1>Create a website</h1>
        <p class="subtitle">Connect a Git repository and Deplay will build and deploy it.</p>
      </div>
    </header>

    <section v-if="created" class="card success">
      <span class="success-icon"><AppIcon name="check" :size="22" /></span>
      <h2>Project “{{ created.name }}” created</h2>
      <p class="muted">The first build will start shortly.</p>
      <NuxtLink to="/" class="btn btn-primary">Go to projects</NuxtLink>
    </section>

    <template v-else>
      <WizardStepper :steps="STEPS" :current="current" @go="goTo" />

      <section class="card panel">
        <StepRepository v-if="current === 0" :form="form" :error="errors.repository || errors.branch" />
        <StepConfigure v-else-if="current === 1" :form="form" :errors="errors" />
        <StepReview v-else :form="form" @edit="goTo" />
      </section>

      <p v-if="submitError" class="banner">{{ submitError }}</p>

      <footer class="actions">
        <NuxtLink v-if="current === 0" to="/" class="btn">Cancel</NuxtLink>
        <button v-else type="button" class="btn" @click="back">Back</button>

        <button
          v-if="current < STEPS.length - 1"
          type="button"
          class="btn btn-primary"
          @click="next"
        >
          Continue
        </button>
        <button
          v-else
          type="button"
          class="btn btn-primary"
          :disabled="submitting"
          @click="submit"
        >
          {{ submitting ? 'Deploying…' : 'Deploy' }}
        </button>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.page {
  max-width: 880px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  color: var(--muted);
  font-size: 13px;
}

.back-link:hover {
  color: var(--text);
}

.head {
  display: flex;
  align-items: center;
  gap: 16px;
}

.head-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  background: var(--primary-soft);
  color: var(--primary);
}

h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.subtitle,
.muted {
  margin-top: 4px;
  color: var(--muted);
}

.card {
  padding: 26px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.panel {
  min-height: 360px;
}

.banner {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.success {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.success-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  margin-bottom: 6px;
}

.success h2 {
  font-size: 18px;
  font-weight: 600;
}

.success .btn {
  margin-top: 8px;
}
</style>
