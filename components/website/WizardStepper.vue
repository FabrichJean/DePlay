<script setup lang="ts">
interface Step {
  key: string
  label: string
  /** Résumé affiché une fois l'étape terminée */
  summary?: string
}

defineProps<{
  steps: Step[]
  current: number
}>()

const emit = defineEmits<{
  go: [index: number]
}>()
</script>

<template>
  <ol class="wizard">
    <li
      v-for="(step, index) in steps"
      :key="step.key"
      class="step"
      :class="{ 'is-done': index < current, 'is-active': index === current, 'is-pending': index > current }"
    >
      <div class="rail">
        <span class="circle">
          <AppIcon v-if="index < current" name="check" :size="14" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span v-if="index < steps.length - 1" class="line" />
      </div>

      <div class="content">
        <div class="head">
          <button
            type="button"
            class="title"
            :disabled="index > current"
            :aria-current="index === current ? 'step' : undefined"
            @click="emit('go', index)"
          >
            {{ step.label }}
          </button>

          <template v-if="index < current">
            <span v-if="step.summary" class="summary">{{ step.summary }}</span>
            <button type="button" class="edit" @click="emit('go', index)">Edit</button>
          </template>
        </div>

        <!-- Seule l'étape en cours affiche son contenu -->
        <div v-if="index === current" class="body">
          <slot :name="`step-${step.key}`" />
        </div>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.wizard {
  list-style: none;
  margin: 0;
  padding: 0;
}

.step {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 14px;
}

.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.circle {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--muted);
}

.step.is-active .circle {
  background: var(--primary);
  border-color: var(--primary);
  color: #ffffff;
}

.step.is-done .circle {
  background: var(--primary-soft);
  border-color: var(--primary-border);
  color: var(--primary);
}

.line {
  flex: 1;
  width: 2px;
  margin: 4px 0;
  background: var(--border);
}

.step.is-done .line {
  background: var(--primary-border);
}

.content {
  min-width: 0;
  padding-bottom: 26px;
}

.step:last-child .content {
  padding-bottom: 0;
}

.head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  min-height: 28px;
}

.title {
  padding: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  text-align: left;
}

.title:disabled {
  color: var(--muted);
  cursor: default;
}

.step.is-done .title:hover {
  color: var(--primary);
}

.summary {
  font-size: 13px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.edit {
  margin-left: auto;
  font-size: 13px;
  color: var(--primary);
}

.edit:hover {
  text-decoration: underline;
}

.body {
  margin-top: 18px;
}
</style>
