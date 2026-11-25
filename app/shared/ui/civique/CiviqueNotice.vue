<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'info' | 'success' | 'error'; title: string }>(), { tone: 'info' })
</script>

<template>
  <div class="cv-notice" :data-tone="tone">
    <strong>{{ title }}</strong>
    <p v-if="$slots.default"><slot /></p>
  </div>
</template>

<style scoped>
.cv-notice {
  padding: var(--cv-step-3) var(--cv-step-4);
  border: var(--cv-stroke) solid var(--cv-focus);
  border-radius: var(--cv-radius-control);
  background: var(--cv-bleu-light);
}
.cv-notice[data-tone="success"] {
  color: var(--cv-success-fg);
  border-color: var(--cv-success-fg);
  background: var(--cv-success-bg);
}
.cv-notice[data-tone="error"] {
  color: var(--cv-error-fg);
  border-color: var(--cv-error-fg);
  background: var(--cv-error-bg);
}
</style>
