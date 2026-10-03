<script setup lang="ts">
// Sans utilisateur connecté, la page s'affiche sans sidebar ni barre supérieure
const { isLoaded, isSignedIn } = useAuth()
</script>

<template>
  <div v-if="!isLoaded" class="boot" aria-hidden="true" />

  <div v-else-if="isSignedIn" class="shell">
    <AppSidebar />

    <div class="main">
      <AppTopbar />

      <main class="content">
        <slot />
      </main>
    </div>
  </div>

  <slot v-else />
</template>

<style scoped>
.boot {
  min-height: 100vh;
}
</style>
