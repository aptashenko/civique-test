<script setup lang="ts">
import { NuxtLink } from '#components'

withDefaults(defineProps<{
  to?: string
  variant?: 'primary' | 'secondary' | 'reward' | 'danger'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}>(), { variant: 'primary', type: 'button' })
</script>

<template>
  <component
    :is="to && !disabled ? NuxtLink : 'button'"
    v-bind="to && !disabled ? { to } : { type, disabled }"
    class="cv-button"
    :data-variant="variant"
  >
    <slot />
  </component>
</template>

<style scoped>
.cv-button {
  --cv-button-bg: var(--cv-primary);
  --cv-button-fg: var(--cv-on-primary);
  --cv-button-hover: var(--cv-primary-pressed);
  --cv-button-edge: var(--cv-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cv-step-2);
  min-block-size: calc(var(--cv-target) + var(--cv-step-2));
  max-inline-size: 100%;
  padding: var(--cv-step-2) var(--cv-button-padding);
  border: var(--cv-stroke) solid var(--cv-button-edge);
  border-bottom-width: var(--cv-button-depth);
  border-radius: var(--cv-radius-control);
  background: var(--cv-button-bg);
  color: var(--cv-button-fg);
  font-weight: var(--cv-heading-weight);
  line-height: 1.25;
  text-align: center;
  text-decoration: none;
  transition: background-color var(--cv-motion-standard) var(--cv-ease), transform var(--cv-motion-fast) var(--cv-ease);
}
.cv-button[data-variant="secondary"] {
  --cv-button-bg: var(--cv-surface);
  --cv-button-fg: var(--cv-text);
  --cv-button-hover: var(--cv-bleu-light);
}
.cv-button[data-variant="reward"] {
  --cv-button-bg: var(--cv-soleil);
  --cv-button-fg: var(--cv-text);
  --cv-button-hover: var(--cv-reward-bg);
}
.cv-button[data-variant="danger"] {
  --cv-button-bg: var(--cv-surface);
  --cv-button-fg: var(--cv-error-fg);
  --cv-button-hover: var(--cv-error-bg);
  --cv-button-edge: var(--cv-error-fg);
}
@media (hover: hover) {
  .cv-button:not(:disabled):hover { background: var(--cv-button-hover); }
}
.cv-button:not(:disabled):active { transform: translateY(2px); }
.cv-button:disabled {
  background: var(--cv-canvas);
  color: var(--cv-text-secondary);
  border-color: var(--cv-rule-strong);
}
</style>
