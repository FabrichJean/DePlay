<script setup lang="ts">
import limitsConfig from '~/config/limits.json'

useHead({ title: 'Settings · Deplay' })

const { isLoaded, isSignedIn } = useAuth()
const { user } = useUser()
const { data } = await useProjects()

const projects = computed(() => data.value?.projects ?? [])
const usage = computed(() => data.value?.usage)
const webServiceCount = computed(() => projects.value.filter((project) => project.type === 'webservice').length)

const githubConnected = computed(() =>
  (user.value?.externalAccounts ?? []).some((account) => account.provider === 'github'),
)

const quota = formatQuota(limitsConfig.storageQuotaBytes)

function formatQuota(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}
</script>

<template>
  <div class="page">
    <header class="head">
      <h1>Settings</h1>
      <p class="subtitle">Your account, limits and connections.</p>
    </header>

    <template v-if="isLoaded && isSignedIn">
      <section class="card">
        <h2 class="title">Account</h2>
        <dl class="facts">
          <div>
            <dt>Name</dt>
            <dd>{{ user?.fullName || '—' }}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{{ user?.primaryEmailAddress?.emailAddress || '—' }}</dd>
          </div>
        </dl>
      </section>

      <section class="card">
        <h2 class="title">Connections</h2>
        <div class="row">
          <div>
            <p class="name">GitHub</p>
            <p class="muted">
              {{ githubConnected
                ? 'Connected. Deplay can list your repositories.'
                : 'Not connected. It is requested when you import a repository.' }}
            </p>
          </div>
          <span class="badge" :class="{ 'is-on': githubConnected }">
            {{ githubConnected ? 'Connected' : 'Not connected' }}
          </span>
        </div>
      </section>

      <section class="card">
        <h2 class="title">Limits</h2>
        <dl class="facts">
          <div>
            <dt>Storage</dt>
            <dd>Shared by websites and web services: {{ quota }}</dd>
          </div>
          <div>
            <dt>Web services</dt>
            <dd>{{ webServiceCount }} / {{ limitsConfig.maxWebServicesPerUser }}</dd>
          </div>
          <div>
            <dt>Memory per web service</dt>
            <dd>{{ limitsConfig.webServiceMemory }}</dd>
          </div>
          <div>
            <dt>Concurrent builds</dt>
            <dd>{{ limitsConfig.maxBuildsPerUser }} per account</dd>
          </div>
        </dl>
      </section>

      <WorkspaceUsage v-if="usage" :usage="usage" />
    </template>

    <section v-else class="card">
      <p class="muted">Sign in to see your settings.</p>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 760px;
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

.title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
}

.facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.facts dt {
  font-size: 12px;
  color: var(--muted);
}

.facts dd {
  font-size: 14px;
  margin-top: 2px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.name {
  font-weight: 600;
}

.badge {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--muted);
  border: 1px solid var(--border);
}

.badge.is-on {
  color: var(--primary);
  border-color: var(--primary-border);
  background: var(--primary-soft);
}

@media (max-width: 640px) {
  .facts {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
