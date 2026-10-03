<script setup lang="ts">
import { PRESETS } from '~/constants/presets'
import type { CreatedProject, WebsiteProjectInput } from '~/types/website'

useHead({ title: 'New website · Deplay' })

const NAME_PATTERN = /^[a-z0-9-]{3,40}$/

const form = reactive<WebsiteProjectInput>({
  name: '',
  source: 'git',
  repository: '',
  branch: 'main',
  preset: 'nuxt',
  rootDirectory: './',
  installCommand: PRESETS[0].installCommand,
  buildCommand: PRESETS[0].buildCommand,
  outputDirectory: PRESETS[0].outputDirectory,
})

const current = ref(0)
const uploadedFiles = ref<File[]>([])
const errors = ref<Partial<Record<keyof WebsiteProjectInput | 'files', string>>>({})
const submitting = ref(false)
const submitError = ref('')
const created = ref<CreatedProject | null>(null)

// Résumé affiché sous chaque étape terminée
const steps = computed(() => {
  const presetLabel = PRESETS.find((item) => item.value === form.preset)?.label ?? form.preset
  return [
    {
      key: 'repository',
      label: 'Import repository',
      summary: sourceSummary(),
    },
    {
      key: 'configure',
      label: 'Configure',
      summary: `${form.name || '—'} · ${presetLabel}`,
    },
    { key: 'review', label: 'Review & deploy' },
  ]
})

function sourceSummary(): string {
  if (form.source === 'upload') {
    const count = uploadedFiles.value.length
    return count ? `${count} uploaded file${count > 1 ? 's' : ''}` : ''
  }
  return form.repository ? `${form.repository} · ${form.branch}` : ''
}

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
    if (form.source === 'upload') {
      if (!uploadedFiles.value.length) result.files = 'Add at least one file or folder.'
    } else {
      if (!form.repository) result.repository = 'Choose a repository to import.'
      if (!form.branch.trim()) result.branch = 'Branch is required.'
    }
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
  current.value = Math.min(current.value + 1, steps.value.length - 1)
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
  for (let step = 0; step < steps.value.length - 1; step++) {
    if (!validateStep(step)) {
      current.value = step
      return
    }
  }

  submitting.value = true
  try {
    if (form.source === 'upload') {
      // Multipart : la configuration en JSON + les fichiers, avec leur chemin relatif pour les dossiers
      const body = new FormData()
      body.append('config', JSON.stringify({ ...form }))
      for (const file of uploadedFiles.value) {
        body.append('files', file, file.webkitRelativePath || file.name)
      }
      created.value = await $fetch<CreatedProject>('/api/projects/website', { method: 'POST', body })
    } else {
      created.value = await $fetch<CreatedProject>('/api/projects/website', {
        method: 'POST',
        body: { ...form },
      })
    }
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

    <section v-if="created" class="card success">
      <span class="success-icon"><AppIcon name="check" :size="22" /></span>
      <h2>Project “{{ created.name }}” created</h2>
      <p class="muted">The first build will start shortly.</p>
      <NuxtLink to="/" class="btn btn-primary">Go to projects</NuxtLink>
    </section>

    <template v-else>
      <section class="card">
        <WizardStepper :steps="steps" :current="current" @go="goTo">
          <template #step-repository>
            <StepRepository
              :form="form"
              v-model:files="uploadedFiles"
              :error="errors.repository || errors.branch || errors.files"
            />
          </template>
          <template #step-configure>
            <StepConfigure :form="form" :errors="errors" />
          </template>
          <template #step-review>
            <StepReview :form="form" @edit="goTo" />
          </template>
        </WizardStepper>
      </section>

      <p v-if="submitError" class="banner">{{ submitError }}</p>

      <footer class="actions">
        <NuxtLink v-if="current === 0" to="/" class="btn">Cancel</NuxtLink>
        <button v-else type="button" class="btn" @click="back">Back</button>

        <button
          v-if="current < steps.length - 1"
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
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
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

.head-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}

.head-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius);
  background: var(--primary-soft);
  color: var(--primary);
}

h1 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.subtitle,
.muted {
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
}

.card {
  padding: 20px 22px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
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
  gap: 8px;
}

.actions .btn {
  height: 36px;
  padding: 0 14px;
  font-size: 13px;
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
