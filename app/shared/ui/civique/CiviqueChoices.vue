<script setup lang="ts">
const model = defineModel<string | null>({ required: true })
defineProps<{
  legend: string
  options: { id: string; label: string }[]
  correctIds?: readonly string[]
  hideLegend?: boolean
  textLang?: string
  disabled?: boolean
}>()

const name = useId()
const { t } = useLocale()
</script>

<template>
  <fieldset :disabled="disabled" class="cv-choices">
    <legend :class="hideLegend ? 'sr-only' : 'cv-heading'">{{ legend }}</legend>
    <label v-for="option in options" :key="option.id" class="cv-choice" :data-result="correctIds?.includes(option.id) ? 'correct' : correctIds && model === option.id ? 'incorrect' : undefined">
      <input v-model="model" :name="name" type="radio" :value="option.id">
      <span :lang="textLang">{{ option.label }}</span>
      <strong v-if="correctIds?.includes(option.id)" class="cv-label">{{ t('correct') }}</strong>
      <strong v-else-if="correctIds && model === option.id" class="cv-label">{{ t('incorrect') }}</strong>
    </label>
  </fieldset>
</template>

<style scoped>
.cv-choices { display: grid; gap: var(--cv-step-2); min-inline-size: 0; }
legend { padding: 0; margin-bottom: var(--cv-step-4); }
.cv-choice {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--cv-step-2) var(--cv-step-3);
  min-block-size: calc(var(--cv-target) + var(--cv-step-2));
  padding: var(--cv-step-2) var(--cv-step-3);
  border: var(--cv-stroke) solid var(--cv-rule-strong);
  border-bottom-width: 4px;
  border-radius: var(--cv-radius-control);
  background: var(--cv-surface);
  cursor: pointer;
  transition: background-color var(--cv-motion-fast) var(--cv-ease);
}
.cv-choice input { flex: none; width: 1.2rem; height: 1.2rem; accent-color: var(--cv-primary); }
.cv-choice:has(:focus-visible) { outline: 3px solid var(--cv-focus); outline-offset: 2px; }
.cv-choice:has(:checked) { border-color: var(--cv-focus); background: var(--cv-bleu-light); }
.cv-choice strong { margin-inline-start: auto; }
.cv-choice[data-result="correct"] { color: var(--cv-success-fg); border-color: var(--cv-success-fg); background: var(--cv-success-bg); }
.cv-choice[data-result="incorrect"] { color: var(--cv-error-fg); border-color: var(--cv-error-fg); background: var(--cv-error-bg); }
fieldset:disabled .cv-choice { cursor: default; }
</style>
