<script setup lang="ts">
import CiviqueButton from '~/shared/ui/civique/CiviqueButton.vue'
import CiviqueCard from '~/shared/ui/civique/CiviqueCard.vue'
import CiviqueNotice from '~/shared/ui/civique/CiviqueNotice.vue'
import CiviqueSymbol from '~/shared/ui/civique/CiviqueSymbol.vue'

import type { SessionSummary } from '#shared/types/quiz'

const { data, error } = await useFetch<SessionSummary[]>('/api/quiz/sessions')
const completed = computed(() => data.value?.filter(session => session.status === 'completed') ?? [])
const date = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'long', timeZone: 'UTC' }))
const { locale, t } = useLocale()
</script>

<template>
  <section class="cv-narrow grid gap-5">
    <header class="cv-page-heading">
      <CiviqueSymbol name="review" />
      <h1 class="cv-title">{{ t('sessionHistory') }}</h1>
      <p class="cv-muted">{{ t('historyIntro') }}</p>
    </header>
    <CiviqueNotice v-if="error" :title="t('historyUnavailable')" tone="error" role="alert" />
    <CiviqueCard v-else-if="!completed.length" tone="blue" class="grid justify-items-start gap-3">
      <h2 class="cv-heading">{{ t('noSessions') }}</h2>
      <p>{{ t('finishForReview') }}</p>
      <CiviqueButton to="/quiz">{{ t('startTraining') }}</CiviqueButton>
    </CiviqueCard>
    <ul v-else class="grid gap-3" :aria-label="t('sessionHistory')">
      <li v-for="session in completed" :key="session.id">
        <CiviqueCard :to="`/review/${session.id}`">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="cv-heading cv-card-title">{{ session.config.mode === 'exam' ? t('mockExam') : t('training') }}</h2>
                <span v-if="session.completionReason === 'interrupted'" class="cv-pill bg-[var(--cv-reward-bg)]">{{ t('interruptedAttempt') }}</span>
              </div>
              <time v-if="session.finishedAt" class="cv-muted" :datetime="session.finishedAt">{{ date.format(new Date(session.finishedAt)) }}</time>
            </div>
            <div class="grid justify-items-start gap-1">
              <span class="cv-pill" data-tone="success">{{ t('correctRatio', { correct: session.result?.correctCount ?? 0, total: session.result?.totalQuestions ?? 0 }) }}</span>
              <span class="cv-label underline">{{ t('seeReview') }}</span>
            </div>
          </div>
        </CiviqueCard>
      </li>
    </ul>
  </section>
</template>
