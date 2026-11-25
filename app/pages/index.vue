<script setup lang="ts">
import type { SessionSummary } from '#shared/types/quiz'
import { civicThemes, questionCategoryLabel } from '~/shared/lib/question-categories'
import CiviqueButton from '~/shared/ui/civique/CiviqueButton.vue'
import CiviqueCard from '~/shared/ui/civique/CiviqueCard.vue'
import CiviqueMascot from '~/shared/ui/civique/CiviqueMascot.vue'
import CiviqueNotice from '~/shared/ui/civique/CiviqueNotice.vue'
import CiviqueProgress from '~/shared/ui/civique/CiviqueProgress.vue'
import CiviqueSymbol from '~/shared/ui/civique/CiviqueSymbol.vue'

const { t } = useLocale()

const [{ data: sessions, error: sessionError }, { data: progress, error: progressError }] = await Promise.all([
  useFetch<SessionSummary[]>('/api/quiz/sessions'),
  useFetch('/api/progress/training'),
])
const activeTraining = computed(() => sessions.value?.find(session => session.status === 'in_progress' && session.config.mode === 'training'))
const activeExam = computed(() => sessions.value?.find(session => session.status === 'in_progress' && session.config.mode === 'exam'))
const topicProgress = computed(() => civicThemes.map(id => ({
  id,
  title: questionCategoryLabel(id, t),
  answered: progress.value?.[id]?.answered ?? 0,
  total: progress.value?.[id]?.total ?? 0,
})))
const started = computed(() => topicProgress.value.filter(topic => topic.answered > 0).length)
const nextTheme = computed(() => {
  if (progressError.value) return
  let next: (typeof topicProgress.value)[number] | undefined
  for (const topic of topicProgress.value) {
    if (topic.answered >= topic.total) continue
    if (!next || topic.answered * next.total < next.answered * topic.total) next = topic
  }
  return next
})

function topicLink(category: string) {
  return `/quiz?category=${encodeURIComponent(category)}`
}
</script>

<template>
  <div class="home">
    <div class="home-primary">
      <section class="home-intro" aria-labelledby="home-title">
        <div class="intro-copy">
          <h1 id="home-title" class="cv-display">{{ t('homeTitle') }}</h1>
          <p>{{ t('homeIntro') }}</p>
          <div class="flex flex-wrap gap-2">
            <CiviqueButton v-if="activeTraining" :to="`/quiz/${activeTraining.id}`">{{ t('resumeTraining') }}</CiviqueButton>
            <CiviqueButton v-else :to="nextTheme ? topicLink(nextTheme.id) : '/quiz'">{{ t(started ? 'continueLearning' : 'startTraining') }}</CiviqueButton>
            <CiviqueButton v-if="activeExam" :to="`/exam/${activeExam.id}`" variant="secondary">{{ t('resumeExam') }}</CiviqueButton>
          </div>
        </div>
        <div class="intro-art" aria-hidden="true"><CiviqueMascot /></div>
        <div v-if="!progressError" class="intro-progress">
          <CiviqueProgress :label="t('startedThemes')" :value="started" :max="civicThemes.length" />
        </div>
      </section>

      <section class="home-path" aria-labelledby="path-title">
        <h2 id="path-title" class="cv-heading">{{ t('fiveThemes') }}</h2>
        <ol class="path-list">
          <li v-for="(topic, index) in topicProgress" :key="topic.id">
            <NuxtLink :to="topicLink(topic.id)" class="path-link" :data-highlight="!activeTraining && nextTheme?.id === topic.id">
              <span aria-hidden="true" class="path-number" :data-started="topic.answered > 0">{{ index + 1 }}</span>
              <span class="path-topic">
                <strong>{{ topic.title }}</strong>
                <span v-if="!progressError" class="cv-label cv-muted">
                  {{ topic.total ? t('topicCoverage', { answered: topic.answered, total: topic.total }) : t('topicEmpty') }}
                </span>
              </span>
              <span class="path-arrow" aria-hidden="true"></span>
            </NuxtLink>
          </li>
        </ol>
      </section>
    </div>

    <CiviqueNotice v-if="sessionError || progressError" :title="t('activityUnavailable')" tone="error" role="alert">
      {{ t('canTrainByTopic') }}
    </CiviqueNotice>

    <section :aria-label="t('otherActivities')" class="home-actions">
      <CiviqueCard to="/exam" tone="yellow">
        <CiviqueSymbol name="target" />
        <h2 class="cv-heading cv-card-title mt-3">{{ t('mockExam') }}</h2>
        <p class="cv-muted">{{ t('examFormat') }}</p>
      </CiviqueCard>
      <CiviqueCard to="/quiz?mistakes=1" tone="pink">
        <CiviqueSymbol name="review" />
        <h2 class="cv-heading cv-card-title mt-3">{{ t('mistakes') }}</h2>
        <p class="cv-muted">{{ t('retryDifficult') }}</p>
      </CiviqueCard>
      <CiviqueCard to="/progress" tone="blue">
        <CiviqueSymbol name="book" />
        <h2 class="cv-heading cv-card-title mt-3">{{ t('myProgress') }}</h2>
        <p class="cv-muted">{{ t('trackByTopic') }}</p>
      </CiviqueCard>
    </section>
  </div>
</template>

<style scoped>
.home, .home-primary { display: grid; gap: var(--cv-step-6); }
.home-intro {
  position: relative;
  display: grid;
  align-content: start;
  gap: var(--cv-step-4);
  padding: clamp(1.25rem, 3vw, 2rem);
  border: var(--cv-stroke) solid var(--cv-text);
  border-bottom-width: 7px;
  border-radius: var(--cv-radius-feature);
  background: var(--cv-bleu-light);
}
.intro-copy { display: grid; justify-items: start; gap: var(--cv-step-3); }
.intro-copy h1 { max-width: 16ch; font-size: clamp(2.5rem, 5vw, 4rem); }
.intro-copy h1:lang(uk) { max-width: 17ch; font-size: clamp(2rem, 4.7vw, 3.6rem); overflow-wrap: anywhere; }
.intro-copy p { max-width: 28ch; color: var(--cv-text-secondary); font-size: clamp(1rem, 2vw, 1.15rem); }
.intro-art { width: min(55%, 12rem); justify-self: center; }
.intro-progress { padding: var(--cv-step-3); border: 1px solid var(--cv-rule-strong); border-radius: var(--cv-radius-control); background: var(--cv-surface); }
.home-path { display: grid; align-content: start; gap: var(--cv-step-3); min-width: 0; }
.path-list { position: relative; display: grid; gap: var(--cv-step-2); padding: 0; list-style: none; }
.path-list::before { content: ""; position: absolute; inset: var(--cv-step-4) auto var(--cv-step-4) 2rem; border-left: 2px dashed var(--cv-rule-strong); }
.path-link {
  position: relative;
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) 1rem;
  align-items: center;
  gap: var(--cv-step-3);
  min-block-size: 4.4rem;
  padding: var(--cv-step-3) var(--cv-step-4);
  border: var(--cv-stroke) solid var(--cv-rule-strong);
  border-bottom-width: 4px;
  border-radius: var(--cv-radius-card);
  background: var(--cv-surface);
  text-decoration: none;
  transition: background-color var(--cv-motion-fast) var(--cv-ease), transform var(--cv-motion-fast) var(--cv-ease);
}
.path-link[data-highlight="true"] { border-color: var(--cv-text); background: var(--cv-bleu-light); }
.path-link:hover { background: var(--cv-bleu-light); }
.path-link:active { transform: translateY(2px); }
.path-topic { display: grid; gap: .15rem; line-height: 1.3; }
.path-topic strong { font-weight: var(--cv-heading-weight); }
.path-number {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border: var(--cv-stroke) solid var(--cv-text);
  border-radius: 50%;
  background: var(--cv-surface);
  font-weight: var(--cv-heading-weight);
}
.path-number[data-started="true"] { background: var(--cv-success-bg); color: var(--cv-success-fg); }
.path-link[data-highlight="true"] .path-number { background: var(--cv-soleil); }
.path-arrow { width: .6rem; height: .6rem; justify-self: center; border-right: 2px solid; border-top: 2px solid; transform: rotate(45deg); }
.home-actions { display: grid; gap: var(--cv-step-3); }
@media (min-width: 46rem) {
  .home-primary { grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr); }
  .home-actions { grid-template-columns: repeat(3, minmax(0,1fr)); }
  .home-intro { grid-template-columns: minmax(0,1fr) minmax(5rem, 29%); align-content: space-between; }
  .intro-copy { grid-column: 1 / -1; }
  .intro-art { grid-column: 2; grid-row: 2; width: 100%; align-self: center; }
  .intro-progress { grid-column: 1; grid-row: 2; align-self: center; }
  .home-intro:not(:has(.intro-progress)) .intro-art { grid-column: 1 / -1; width: min(45%, 9rem); }
}
@media (max-width: 33.99rem) {
  .home-intro { grid-template-columns: minmax(0, 1fr) minmax(4rem, 29%); gap: var(--cv-step-3) var(--cv-step-2); }
  .intro-copy { grid-column: 1 / -1; }
  .intro-art { grid-column: 2; grid-row: 2; width: 100%; align-self: center; }
  .intro-progress { grid-column: 1; grid-row: 2; align-self: center; }
}
</style>
