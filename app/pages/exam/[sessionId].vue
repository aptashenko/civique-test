<script setup lang="ts">
import { QuizPlayer } from '~/modules/quiz'

const route = useRoute()
const sessionId = computed(() => String(route.params.sessionId))
</script>

<template><QuizPlayer :key="sessionId" :id="sessionId" mode="exam" /></template>
