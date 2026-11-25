<script setup lang="ts">
defineProps<{ label: string; value: number; max: number }>()
</script>

<template>
  <div class="grid gap-2">
    <div class="cv-label flex flex-wrap justify-between gap-x-2">
      <span>{{ label }}</span>
      <span class="tabular-nums">{{ value }} / {{ max }}</span>
    </div>
    <progress :aria-label="label" :value="value" :max="max" />
  </div>
</template>

<style scoped>
progress {
  display: block;
  width: 100%;
  height: var(--cv-progress-height);
  overflow: hidden;
  appearance: none;
  border: 1px solid var(--cv-rule-strong);
  border-radius: 999px;
  background: var(--cv-progress-track);
  color: var(--cv-progress-fill);
  accent-color: var(--cv-progress-fill);
}
progress::-webkit-progress-bar { background: var(--cv-progress-track); }
progress::-webkit-progress-value { border-radius: 999px; background: var(--cv-progress-fill); }
progress::-moz-progress-bar { border-radius: 999px; background: var(--cv-progress-fill); }
</style>
