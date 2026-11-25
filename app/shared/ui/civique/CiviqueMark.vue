<template>
  <span class="cv-mark" aria-hidden="true"><i></i><i></i><i></i></span>
</template>

<style scoped>
.cv-mark {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 2.125rem;
  aspect-ratio: 1;
  border: var(--cv-stroke) solid var(--cv-text);
  border-bottom-width: 4px;
  border-radius: .6rem;
  background: var(--cv-surface);
}
i {
  display: block;
  width: .28rem;
  height: .85rem;
  border: 1px solid var(--cv-text);
  border-radius: .16rem;
  background: var(--cv-primary);
  transform: rotate(12deg);
}
i:nth-child(2) { background: var(--cv-white); }
i:nth-child(3) { background: var(--cv-corail); }
</style>
