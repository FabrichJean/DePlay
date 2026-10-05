<script setup lang="ts">
import type { WebsiteProjectInput } from '~/types/website'

const props = defineProps<{
  form: WebsiteProjectInput
  error?: string
}>()
</script>

<template>
  <div class="env">
    <p class="intro">
      Variables available to the install and build commands, for example an API address or a build flag.
    </p>
    <p class="warning">
      Values are written into the built files: anything the visitors' browser needs is visible to them. Do not put a
      private secret here if it must stay private.
    </p>
    <EnvVariablesEditor v-model="props.form.env" :error="error" />
  </div>
</template>

<style scoped>
.env {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.intro {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.warning {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: rgba(234, 179, 8, 0.08);
  border: 1px solid rgba(234, 179, 8, 0.25);
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}
</style>
