<script setup lang="ts">
import type { AnswerOption } from '#shared/types/quiz'
import CiviqueChoices from '~/shared/ui/civique/CiviqueChoices.vue'

const selected = defineModel<string | null>({ required: true })
const props = defineProps<{ options: AnswerOption[]; disabled: boolean; correctIds?: string[]; textLang?: string }>()
const labelledOptions = computed(() => props.options.map(option => ({ id: option.id, label: option.text })))
const { t } = useLocale()
</script>

<template>
  <CiviqueChoices v-model="selected" :legend="t('chooseAnswer')" hide-legend :text-lang="textLang" :options="labelledOptions" :disabled="disabled" :correct-ids="correctIds" />
</template>
