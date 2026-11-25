<script setup lang="ts">
import { NuxtLink } from '#components'

withDefaults(defineProps<{
  to?: string
  tone?: 'paper' | 'blue' | 'yellow' | 'pink' | 'green'
}>(), { tone: 'paper' })
</script>

<template>
  <component :is="to ? NuxtLink : 'div'" v-bind="to ? { to } : {}" class="cv-card" :class="{ block: Boolean(to) }" :data-tone="tone" :data-interactive="Boolean(to)">
    <slot />
  </component>
</template>

<style scoped>
.cv-card {
  min-inline-size: 0;
  padding: var(--cv-card-padding);
  border: var(--cv-stroke) solid var(--cv-card-border);
  border-radius: var(--cv-radius-card);
  background: var(--cv-surface);
  color: var(--cv-text);
  text-decoration: none;
}
.cv-card[data-tone="blue"] { background: var(--cv-bleu-light); }
.cv-card[data-tone="yellow"] { background: var(--cv-reward-bg); }
.cv-card[data-tone="pink"] { background: var(--cv-error-bg); }
.cv-card[data-tone="green"] { background: var(--cv-success-bg); }
.cv-card[data-interactive="true"] {
  border-bottom-width: var(--cv-depth);
  transition: transform var(--cv-motion-fast) var(--cv-ease);
}
@media (hover: hover) {
  .cv-card[data-interactive="true"]:hover { transform: translateY(-2px); }
  .cv-card[data-interactive="true"]:hover :deep(.cv-card-title) { text-decoration: underline; text-underline-offset: .16em; }
}
.cv-card[data-interactive="true"]:active { transform: translateY(2px); }
</style>
