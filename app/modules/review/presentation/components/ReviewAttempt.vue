<script setup lang="ts">
import CiviqueCard from '~/shared/ui/civique/CiviqueCard.vue'
import CiviqueNotice from '~/shared/ui/civique/CiviqueNotice.vue'

import type { SessionView } from '#shared/types/quiz'

const route = useRoute()
const url = computed(() => `/api/quiz/sessions/${encodeURIComponent(String(route.params.sessionId))}/review`)
const { data: session, error } = await useFetch<SessionView>(url)
const filter = ref('all')
const questions = computed(() => session.value?.questions.filter(question =>
  filter.value === 'all' || (filter.value === 'incorrect'
    ? question.status === 'answered' && !question.feedback?.isCorrect
    : question.status !== 'answered'),
) ?? [])
const { t } = useLocale()
</script>

<template>
  <section class="cv-narrow grid gap-5">
    <header class="cv-page-heading">
      <NuxtLink to="/review" class="cv-link justify-self-start">{{ t('history') }}</NuxtLink>
      <h1 class="cv-title">{{ t('review') }}</h1>
    </header>
    <CiviqueNotice v-if="error" :title="t('reviewUnavailable')" tone="error" role="alert" />
    <template v-else-if="session">
      <CiviqueCard v-if="session.result" tone="blue">
        <p class="cv-title tabular-nums">{{ session.result.correctCount }} / {{ session.result.totalQuestions }}</p>
        <p class="cv-muted">{{ t('correctAnswers') }}</p>
      </CiviqueCard>
      <label class="grid max-w-xs gap-1 font-bold">{{ t('filter') }}
        <select v-model="filter" class="cv-field">
          <option value="all">{{ t('allQuestions') }}</option>
          <option value="incorrect">{{ t('incorrectAnswers') }}</option>
          <option value="unanswered">{{ t('skippedOrUnanswered') }}</option>
        </select>
      </label>
      <CiviqueNotice v-if="!questions.length" :title="t('noFilteredQuestions')" />
      <ul v-else class="grid gap-4" :aria-label="t('reviewedQuestions')">
        <li v-for="question in questions" :key="question.id">
          <CiviqueCard class="grid gap-3">
            <h2 class="cv-heading" lang="fr">{{ question.text }}</h2>
            <p v-if="question.sourceType === 'practice_situation'" class="cv-label cv-muted">{{ t('practiceSituation') }}</p>
            <ul class="grid gap-2">
              <li v-for="option in question.options" :key="option.id" class="review-answer" :data-correct="question.feedback?.correctOptionIds?.includes(option.id) || undefined">
                <span lang="fr">{{ option.text }}</span>
                <span v-if="question.feedback?.correctOptionIds?.includes(option.id)" class="cv-label">{{ t('correct') }}</span>
                <span v-if="question.selectedOptionIds.includes(option.id)" class="cv-label">{{ t('yourAnswer') }}</span>
              </li>
            </ul>
            <p v-if="!question.selectedOptionIds.length" class="cv-muted">{{ question.status === 'skipped' ? t('skippedQuestion') : t('unanswered') }}</p>
            <p v-if="question.feedback?.explanation" lang="fr">{{ question.feedback.explanation }}</p>
          </CiviqueCard>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.review-answer { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cv-step-1) var(--cv-step-3); padding: var(--cv-step-2) var(--cv-step-3); border: 1px solid var(--cv-rule); border-radius: var(--cv-radius-control); }
.review-answer[data-correct="true"] { border-color: var(--cv-success-fg); background: var(--cv-success-bg); color: var(--cv-success-fg); }
</style>
