<script setup lang="ts">
defineProps<{ question: string }>()
</script>

<template>
  <h1 class="cv-title question-title">{{ question }}</h1>
</template>

<style scoped>
.question-title { font-size: clamp(1.5rem, 4vw, 2.1rem); line-height: 1.2; }
</style>
