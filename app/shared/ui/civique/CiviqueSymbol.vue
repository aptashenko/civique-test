<script setup lang="ts">
defineProps<{ name: 'book' | 'target' | 'review' }>()
</script>

<template>
  <span class="cv-symbol" :data-name="name" aria-hidden="true"><i></i></span>
</template>

<style scoped>
.cv-symbol {
  display: grid;
  place-items: center;
  flex: none;
  width: 3rem;
  height: 3rem;
  border: var(--cv-stroke) solid currentColor;
  border-bottom-width: 4px;
  border-radius: .875rem;
  background: var(--cv-surface);
  color: var(--cv-text);
}
i { position: relative; display: block; width: 1.3rem; height: 1.3rem; }
[data-name="book"] i { border: 2px solid currentColor; border-radius: 3px; transform: rotate(-9deg); }
[data-name="book"] i::before { content: ""; position: absolute; inset: 0 auto 0 3px; border-left: 2px solid currentColor; }
[data-name="book"] i::after { content: ""; position: absolute; inset: 3px 2px auto 7px; border-top: 2px solid currentColor; }
[data-name="target"] i { border: 2px solid currentColor; border-radius: 50%; }
[data-name="target"] i::before { content: ""; position: absolute; inset: 3px; border: 2px solid currentColor; border-radius: 50%; }
[data-name="target"] i::after { content: ""; position: absolute; inset: 6px; border-radius: 50%; background: currentColor; }
[data-name="review"] i { border: 2px solid currentColor; border-radius: 3px; transform: rotate(8deg); }
[data-name="review"] i::after {
  content: ""; position: absolute; inset: 3px 2px 6px; border-bottom: 2px solid currentColor; border-left: 2px solid currentColor;
  transform: rotate(-46deg);
}
</style>
