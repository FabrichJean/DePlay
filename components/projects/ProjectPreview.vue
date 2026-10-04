<script setup lang="ts">
import { STATUS_META } from '~/constants/status'
import type { ProjectStatus } from '~/types/project'

const props = defineProps<{
  status: ProjectStatus
  /** Capture d'écran du site publié, si elle existe */
  thumbnailUrl?: string | null
}>()

const color = computed(() => STATUS_META[props.status].color)
// Une image seulement quand le site est en ligne : sinon l'aperçu schématique
const image = computed(() => (props.status === 'live' ? props.thumbnailUrl : null))
</script>

<template>
  <div v-if="image" class="preview is-image">
    <img :src="image" alt="" loading="lazy" decoding="async" />
  </div>

  <!-- Aperçu schématique : affiché tant qu'il n'y a pas de capture du site -->
  <div v-else class="preview" :style="{ '--c': color }" aria-hidden="true">
    <div class="frame">
      <span class="topbar" />
      <div class="content">
        <span class="side" />
        <div class="main">
          <span class="line wide" />
          <span class="line" />
          <span class="block" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview {
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: linear-gradient(160deg, #111a24, #0a1016);
  padding: 8px;
  overflow: hidden;
}

.preview.is-image {
  padding: 0;
  background: #0a1016;
}

.preview.is-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}

.frame {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.topbar {
  height: 8px;
  border-radius: 3px;
  background: #1d2934;
}

.content {
  flex: 1;
  display: flex;
  gap: 6px;
  min-height: 0;
}

.side {
  width: 22%;
  border-radius: 3px;
  background: #15202a;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.line {
  height: 5px;
  width: 40%;
  border-radius: 3px;
  background: #22303c;
}

.line.wide {
  width: 70%;
}

.block {
  flex: 1;
  border-radius: 4px;
  background: color-mix(in srgb, var(--c) 25%, #0f1820);
  border: 1px solid color-mix(in srgb, var(--c) 40%, transparent);
}
</style>
