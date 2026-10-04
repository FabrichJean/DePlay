<script setup lang="ts">
// Retour de GitHub après la connexion d'un compte : Clerk termine la liaison, puis on revient à l'assistant
useHead({ title: 'Connecting · Deplay' })

const clerk = useClerk()
const error = ref('')

onMounted(async () => {
  try {
    await clerk.value.handleRedirectCallback({
      signInFallbackRedirectUrl: '/new/website',
      signUpFallbackRedirectUrl: '/new/website',
    })
  } catch (cause) {
    console.error('GitHub connection failed:', cause)
    error.value = 'Could not connect GitHub. Please try again.'
  }
})
</script>

<template>
  <div class="callback">
    <p v-if="!error" class="muted">Connecting GitHub…</p>
    <p v-else class="banner">{{ error }}</p>
    <NuxtLink v-if="error" to="/new/website" class="btn">Back to the import form</NuxtLink>
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
