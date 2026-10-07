<script setup lang="ts">
interface CliToken {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

const { data: tokens, refresh } = await useFetch<CliToken[]>('/api/tokens', { key: 'cli-tokens', default: () => [] })

const name = ref('')
const creating = ref(false)
const error = ref('')
// Jeton en clair, affiché une seule fois juste après sa création
const created = ref<{ name: string, token: string } | null>(null)
const copied = ref('')
const confirmingId = ref('')

const loginCommand = computed(() => (created.value ? `npx deplay-cli login --token ${created.value.token}` : ''))

async function createToken() {
  if (!name.value.trim() || creating.value) return
  creating.value = true
  error.value = ''
  try {
    const result = await $fetch<CliToken & { token: string }>('/api/tokens', { method: 'POST', body: { name: name.value } })
    created.value = { name: result.name, token: result.token }
    name.value = ''
    await refresh()
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage || 'Could not create the token.'
  } finally {
    creating.value = false
  }
}

async function revoke(id: string) {
  if (confirmingId.value !== id) {
    confirmingId.value = id
    return
  }
  confirmingId.value = ''
  await $fetch(`/api/tokens/${id}`, { method: 'DELETE' })
  await refresh()
}

async function copy(text: string, what: string) {
  await navigator.clipboard.writeText(text)
  copied.value = what
  setTimeout(() => { if (copied.value === what) copied.value = '' }, 1500)
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'
}
</script>

<template>
  <section class="card">
    <div class="head">
      <div>
        <h2 class="title">CLI tokens</h2>
        <p class="muted">Deploy a local folder with <code>npx deplay-cli deploy</code>. A token gives access to your projects: keep it secret.</p>
      </div>
    </div>

    <div v-if="created" class="reveal">
      <p class="reveal-title">Token “{{ created.name }}” created — copy it now, it won't be shown again.</p>
      <div class="code-row">
        <code>{{ created.token }}</code>
        <button type="button" class="btn small" @click="copy(created.token, 'token')">{{ copied === 'token' ? 'Copied' : 'Copy' }}</button>
      </div>
      <p class="muted">Then, in your terminal:</p>
      <div class="code-row">
        <code>{{ loginCommand }}</code>
        <button type="button" class="btn small" @click="copy(loginCommand, 'command')">{{ copied === 'command' ? 'Copied' : 'Copy' }}</button>
      </div>
      <button type="button" class="link" @click="created = null">Done</button>
    </div>

    <form class="create" @submit.prevent="createToken">
      <input v-model="name" type="text" maxlength="40" placeholder="Token name, e.g. MacBook" aria-label="Token name">
      <button type="submit" class="btn btn-primary" :disabled="!name.trim() || creating">
        {{ creating ? 'Creating…' : 'Create token' }}
      </button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>

    <ul v-if="tokens?.length" class="list">
      <li v-for="token in tokens" :key="token.id">
        <div class="meta">
          <p class="name">{{ token.name }}</p>
          <p class="muted"><code>{{ token.prefix }}…</code> · created {{ formatDate(token.createdAt) }} · last used {{ formatDate(token.lastUsedAt) }}</p>
        </div>
        <button type="button" class="btn small danger" @click="revoke(token.id)" @blur="confirmingId = ''">
          {{ confirmingId === token.id ? 'Confirm revoke' : 'Revoke' }}
        </button>
      </li>
    </ul>
    <p v-else class="muted empty">No token yet.</p>
  </section>
</template>

<style scoped>
.card {
  padding: 20px 22px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.muted {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

code {
  font-family: var(--font-mono);
  font-size: 12px;
}

.reveal {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--primary-border);
  border-radius: var(--radius);
  background: var(--primary-soft);
}

.reveal-title {
  font-size: 13px;
  font-weight: 600;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
}

.code-row code {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--text);
}

.link {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
}

.create {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.create input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font: inherit;
  outline: 0;
}

.create input:focus {
  border-color: var(--primary-border);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.small {
  height: 32px;
  padding: 0 12px;
  font-size: 12.5px;
  flex-shrink: 0;
}

.btn.danger:hover {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.4);
}

.error {
  margin-top: 8px;
  color: #f87171;
  font-size: 13px;
}

.list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid var(--border);
}

.meta {
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: 14px;
}

.empty {
  margin-top: 14px;
}

@media (max-width: 640px) {
  .create {
    flex-direction: column;
  }
}
</style>
