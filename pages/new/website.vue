<script setup lang="ts">
import { PRESETS } from '~/constants/presets'
import type { CreatedProject, WebsiteProjectInput } from '~/types/website'
import { envVariablesError } from '~/utils/env-variables'

const NAME_PATTERN = /^[a-z0-9-]{3,40}$/
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

const route = useRoute()
const isService = route.query.type === 'webservice'

useHead({ title: isService ? 'New web service · Deplay' : 'New website · Deplay' })

const form = reactive<WebsiteProjectInput>({
  name: '',
  type: isService ? 'webservice' : 'website',
  startCommand: '',
  source: 'git',
  repository: '',
  branch: 'main',
  preset: 'nuxt',
  rootDirectory: './',
  installCommand: PRESETS[0].installCommand,
  buildCommand: isService ? '' : PRESETS[0].buildCommand,
  outputDirectory: PRESETS[0].outputDirectory,
  env: [],
})

const current = ref(0)
const uploadedFiles = ref<File[]>([])
const errors = ref<Partial<Record<keyof WebsiteProjectInput | 'files', string>>>({})
const submitting = ref(false)
const submitError = ref('')
const uploadProgress = ref<UploadProgress | null>(null)
const { getToken } = useAuth()

const phaseLabel = computed(() => {
  const labels = {
    preparing: 'Preparing files…',
    sending: 'Uploading files…',
    processing: 'Processing on server…',
  }
  return uploadProgress.value ? labels[uploadProgress.value.phase] : ''
})

const progressDetail = computed(() => {
  const progress = uploadProgress.value
  if (!progress) return ''
  // Pendant la préparation, on compte les fichiers ; ensuite, les octets envoyés
  return progress.phase === 'preparing'
    ? `${progress.loaded} / ${progress.total} files`
    : `${formatBytes(progress.loaded)} / ${formatBytes(progress.total)}`
})
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
    {
      key: 'environment',
      label: 'Environment variables',
      summary: form.env.length ? `${form.env.length} variable${form.env.length > 1 ? 's' : ''}` : 'None',
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
      const totalBytes = uploadedFiles.value.reduce((sum, file) => sum + file.size, 0)
      if (!uploadedFiles.value.length) result.files = 'Add at least one file or folder.'
      else if (totalBytes > MAX_UPLOAD_BYTES) result.files = 'Uploads are limited to 200 MB. Remove large files and try again.'
    } else {
      if (!form.repository) result.repository = 'Choose a repository to import.'
      if (!form.branch.trim()) result.branch = 'Branch is required.'
    }
  }

  if (step === 1) {
    if (!NAME_PATTERN.test(form.name)) result.name = 'Use 3–40 lowercase letters, digits or dashes.'
    if (form.type === 'webservice' && !form.startCommand.trim()) result.startCommand = 'Enter the command that starts the service.'
    if (!form.rootDirectory.trim()) result.rootDirectory = 'Root directory is required.'
    if (form.type === 'website' && !form.outputDirectory.trim()) result.outputDirectory = 'Output directory is required.'
  }

  if (step === 2) {
    const envError = envVariablesError(form.env)
    if (envError) result.env = envError
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
      // Étape 1 : optimisation des images et archive zip, dans le navigateur
      const total = uploadedFiles.value.length
      uploadProgress.value = { phase: 'preparing', loaded: 0, total, percent: 0 }
      const archive = await packProject(uploadedFiles.value, ({ done, total: count }) => {
        uploadProgress.value = {
          phase: 'preparing',
          loaded: done,
          total: count,
          percent: Math.round((done / count) * 100),
        }
      })

      // Étape 2 : envoi de la configuration et de l'archive
      const body = new FormData()
      body.append('config', JSON.stringify({ ...form }))
      body.append('archive', archive, 'project.zip')
      // Jeton frais juste avant l'envoi : la préparation peut durer plusieurs minutes
      // useAuth renvoie getToken sous forme réactive : on en extrait la fonction
      const token = await unref(getToken)()
      created.value = await postWithProgress<CreatedProject>(
        '/api/projects/website',
        body,
        (progress) => {
          uploadProgress.value = progress
        },
        token ? { Authorization: `Bearer ${token}` } : {},
      )
    } else {
      created.value = await $fetch<CreatedProject>('/api/projects/website', {
        method: 'POST',
        body: { ...form },
      })
    }

    // Une fois créé, on ouvre directement la page de détail : le build y apparaît en direct
    await navigateTo(`/projects/${created.value.id}`)
  } catch (error) {
    // Affiche le message renvoyé par l'API (ex. « Upload exceeds 200 MB »), sinon un message générique
    const body = (error as { data?: { statusMessage?: string; data?: { errors?: Record<string, string> } } }).data
    const fieldError = body?.data?.errors ? Object.values(body.data.errors)[0] : undefined
    // Erreur côté navigateur (préparation, jeton, réseau) : on affiche son vrai message
    console.error('Project creation failed:', error)
    const clientMessage = error instanceof Error ? error.message : undefined
    submitError.value = fieldError ?? body?.statusMessage ?? clientMessage ?? 'Could not create the project. Please try again.'
  } finally {
    submitting.value = false
    uploadProgress.value = null
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
          <template #step-environment>
            <StepEnvironment :form="form" :files="uploadedFiles" :error="errors.env" />
          </template>
          <template #step-review>
            <StepReview :form="form" @edit="goTo" />
          </template>
        </WizardStepper>
      </section>

      <div v-if="uploadProgress" class="progress" role="status" aria-live="polite">
        <div class="progress-head">
          <span>{{ phaseLabel }}</span>
          <span>{{ uploadProgress.percent }}%</span>
        </div>
        <div class="progress-bar" role="progressbar" :aria-valuenow="uploadProgress.percent" aria-valuemin="0" aria-valuemax="100">
          <span :style="{ width: `${uploadProgress.percent}%` }" />
        </div>
        <p class="muted">{{ progressDetail }}</p>
      </div>

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

.progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--card);
}

.progress-head {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
}

.progress-bar {
  height: 6px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.progress-bar span {
  display: block;
  height: 100%;
  background: var(--primary);
  transition: width 0.2s ease;
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
