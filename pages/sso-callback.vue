<script setup lang="ts">
// Retour de GitHub après la connexion d'un compte : Clerk termine la liaison, puis on revient à l'assistant
useHead({ title: 'Connecting · Deplay' })

const TIMEOUT_MS = 20000
const clerk = useClerk()
const { user } = useUser()
const error = ref('')
const stuck = ref(false)

function clerkMessage(cause: unknown): string {
  // Clerk donne la raison précise (ex. compte déjà lié) dans errors[0].longMessage
  const first = (cause as { errors?: { longMessage?: string, message?: string }[] }).errors?.[0]
  return first?.longMessage || first?.message || (cause as Error).message || 'Could not connect GitHub. Please try again.'
}

onMounted(async () => {
  // Au bout de ce délai, on propose de reprendre à la main au lieu de rester sur cette page
  const timer = setTimeout(() => {
    stuck.value = true
  }, TIMEOUT_MS)

  try {
    // Clerk doit être chargé avant de traiter le retour
    for (let attempt = 0; attempt < 100 && !clerk.value?.loaded; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    await clerk.value.handleRedirectCallback({
      signInFallbackRedirectUrl: '/new/website',
      signUpFallbackRedirectUrl: '/new/website',
    })
    // Recharge le compte pour voir la liaison GitHub, puis revient à l'assistant
    await user.value?.reload()
    clearTimeout(timer)
    await navigateTo('/new/website', { replace: true })
  } catch (cause) {
    clearTimeout(timer)
    console.error('GitHub connection failed:', cause)
    error.value = clerkMessage(cause)
  }
})
</script>

<template>
  <div class="callback">
    <p v-if="error" class="banner">{{ error }}</p>
    <p v-else-if="stuck" class="muted">This is taking longer than expected.</p>
    <p v-else class="muted">Connecting GitHub…</p>
    <NuxtLink v-if="error || stuck" to="/new/website" class="btn">Back to the import form</NuxtLink>
  </div>
</template>

<style scoped>
.callback {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.muted {
  color: var(--muted);
}

.banner {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  font-size: 13px;
}
</style>
