<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: '' })
</script>

<template>
  <img src="/brand/coco.webp" width="768" height="768" :alt="alt" decoding="async" class="cv-mascot">
</template>

<style scoped>
.cv-mascot { display: block; width: 100%; height: auto; object-fit: contain; }
</style>
