<script setup lang="ts">
export interface KeyValueRow {
  label: string
  value: string | number | null | undefined
  mono?: boolean
}

const props = defineProps<{
  rows: KeyValueRow[]
}>()

// Valeur absente : on l'affiche plutôt que de laisser la ligne vide
const display = (value: KeyValueRow['value']) => (value === null || value === undefined || value === '' ? '—' : String(value))
</script>

<template>
  <dl class="kv">
    <div v-for="row in props.rows" :key="row.label" class="kv-row">
      <dt>{{ row.label }}</dt>
      <dd :class="{ mono: row.mono }">{{ display(row.value) }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.kv {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 28px;
}

.kv-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

dt {
  color: var(--muted);
  flex-shrink: 0;
}

dd {
  margin: 0;
  text-align: right;
  min-width: 0;
  overflow-wrap: anywhere;
}

.mono {
  font-family: var(--font-mono);
  font-size: 12px;
}

@media (max-width: 640px) {
  .kv {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
