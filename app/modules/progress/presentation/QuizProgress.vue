<script setup lang="ts">
import type { MessageKey } from '~/shared/i18n/messages'
import CiviqueButton from '~/shared/ui/civique/CiviqueButton.vue'
import CiviqueCard from '~/shared/ui/civique/CiviqueCard.vue'
import CiviqueNotice from '~/shared/ui/civique/CiviqueNotice.vue'
import CiviqueProgress from '~/shared/ui/civique/CiviqueProgress.vue'
import { questionCategoryLabel } from '~/shared/lib/question-categories'

const { data, status, refresh } = await useFetch('/api/progress/character')
const { t } = useLocale()

const stages = {
  1: { name: 'cocoHatchling', image: '/brand/coco-hatchling.webp' },
  2: { name: 'cocoYoungChick', image: '/brand/coco-young-chick.webp' },
  3: { name: 'cocoRooster', image: '/brand/coco.webp' },
} as const satisfies Record<1 | 2 | 3, { name: MessageKey; image: string }>
const stageLevels = [1, 2, 3] as const

const currentStage = computed(() => stages[data.value?.level ?? 1])
const topicsAtNextLevel = computed(() => {
  const progress = data.value
  return progress?.themes.filter(topic => topic.level > progress.level).length ?? 0
})

function practiceLink(categoryId: string) {
  return `/quiz?category=${encodeURIComponent(categoryId)}`
}
</script>

<template>
  <div class="character-progress">
    <header class="cv-page-heading">
      <h1 class="cv-title">{{ t('myProgress') }}</h1>
    </header>

    <p v-if="status === 'pending'" role="status" class="cv-muted">{{ t('loading') }}</p>
    <CiviqueNotice v-else-if="!data" :title="t('progressUnavailable')" tone="error" role="alert">
      <CiviqueButton class="mt-3" variant="secondary" @click="refresh()">{{ t('retry') }}</CiviqueButton>
    </CiviqueNotice>

    <template v-else>
      <CiviqueCard :tone="data.level === 3 ? 'green' : 'blue'" class="character-card">
        <div class="character-summary">
          <p class="overall-label cv-label">{{ t('cocoOverallLevel') }}</p>
          <h2 class="cv-title character-stage">{{ t(currentStage.name) }}</h2>
          <p class="cv-muted">{{ t(data.level === 3 ? 'cocoTopStage' : 'cocoAdvanceTogether') }}</p>
          <CiviqueProgress
            v-if="data.level < 3"
            class="overall-progress"
            :label="t('cocoNextStageProgress')"
            :value="topicsAtNextLevel"
            :max="data.themes.length"
          />
        </div>
        <div class="character-art" aria-hidden="true">
          <img :src="currentStage.image" alt="" width="768" height="768" decoding="async">
        </div>
      </CiviqueCard>

      <ol class="growth-stages" :aria-label="t('cocoGrowth')">
        <li
          v-for="level in stageLevels"
          :key="level"
          class="growth-stage"
          :data-current="level === data.level"
          :aria-current="level === data.level ? 'step' : undefined"
        >
          <span class="growth-portrait">
            <img :src="stages[level].image" alt="" width="768" height="768" decoding="async">
          </span>
          <span class="cv-label">{{ t(stages[level].name) }}</span>
        </li>
      </ol>

      <section class="topics-section" aria-labelledby="character-topics">
        <div class="topics-heading">
          <h2 id="character-topics" class="cv-heading">{{ t('cocoThemeLevels') }}</h2>
          <p class="cv-muted">{{ t('cocoLevelRules') }}</p>
        </div>

        <ul class="topic-list">
          <li v-for="topic in data.themes" :key="topic.categoryId">
            <CiviqueCard class="topic-card">
              <div class="topic-heading">
                <h3 class="topic-title">{{ questionCategoryLabel(topic.categoryId, t) }}</h3>
                <span class="cv-pill topic-stage" :data-stage="topic.level">{{ t(stages[topic.level].name) }}</span>
              </div>

              <div class="topic-progress">
                <CiviqueProgress v-if="topic.total > 0" :label="t('cocoCorrectQuestions')" :value="topic.correct" :max="topic.total" />
                <p v-else class="cv-label cv-muted">{{ t('topicEmpty') }}</p>
              </div>

              <CiviqueButton
                v-if="topic.total > 0"
                class="topic-action"
                variant="secondary"
                :to="practiceLink(topic.categoryId)"
                :aria-label="t('cocoPracticeTopicLabel', { topic: questionCategoryLabel(topic.categoryId, t) })"
              >{{ t('cocoPracticeTopic') }}</CiviqueButton>
            </CiviqueCard>
          </li>
        </ul>
      </section>
    </template>

    <CiviqueButton class="history-link" variant="secondary" to="/review">{{ t('sessionHistory') }}</CiviqueButton>
  </div>
</template>

<style scoped>
.character-progress {
  display: grid;
  gap: var(--cv-step-6);
  width: min(100%, 55rem);
  margin-inline: auto;
}
.character-card {
  display: grid;
  align-items: center;
  gap: var(--cv-step-4);
  padding: clamp(var(--cv-step-4), 4vw, var(--cv-step-8));
  border-radius: var(--cv-radius-feature);
}
.character-summary { display: grid; gap: var(--cv-step-2); min-width: 0; }
.overall-label { color: var(--cv-primary-pressed); }
.character-stage { font-size: clamp(1.75rem, 4.5vw, 3.25rem); }
.overall-progress {
  max-width: 26rem;
  margin-block-start: var(--cv-step-2);
  --cv-progress-track: var(--cv-surface);
}
.character-art {
  display: grid;
  justify-items: center;
  align-items: center;
  grid-area: 1 / 1;
  isolation: isolate;
}
.character-art::before {
  content: '';
  grid-area: 1 / 1;
  width: 74%;
  max-width: 13rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--cv-surface);
}
.character-art img { grid-area: 1 / 1; width: min(64%, 12rem); height: auto; }
.growth-stages {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--cv-step-2);
  max-width: 37rem;
  width: 100%;
  margin-inline: auto;
  text-align: center;
}
.growth-stage {
  position: relative;
  display: grid;
  justify-items: center;
  align-content: start;
  gap: var(--cv-step-2);
  color: var(--cv-text-secondary);
}
.growth-stage:not(:last-child)::after {
  content: '';
  position: absolute;
  inset-block-start: 2rem;
  inset-inline-start: calc(50% + 2rem);
  width: calc(100% - 4rem + var(--cv-step-2));
  height: var(--cv-stroke);
  background: var(--cv-rule);
}
.growth-portrait {
  z-index: 1;
  display: grid;
  place-items: center;
  width: 4rem;
  aspect-ratio: 1;
  border: var(--cv-stroke) solid var(--cv-rule);
  border-radius: 50%;
  background: var(--cv-surface);
}
.growth-portrait img { width: 83%; height: auto; }
.growth-stage[data-current='true'] { color: var(--cv-primary-pressed); }
.growth-stage[data-current='true'] .growth-portrait { border-color: var(--cv-primary-pressed); background: var(--cv-bleu-light); }
.topics-section, .topics-heading, .topic-list, .topic-heading { display: grid; gap: var(--cv-step-2); }
.topics-section { gap: var(--cv-step-4); }
.topics-heading p { max-width: 62ch; }
.topic-list { gap: var(--cv-step-3); }
.topic-card { display: grid; align-items: center; gap: var(--cv-step-4); }
.topic-title { font-size: 1.125rem; font-weight: var(--cv-heading-weight); line-height: 1.25; }
.topic-stage { color: var(--cv-text-secondary); background: var(--cv-canvas); }
.topic-stage[data-stage='2'] { color: var(--cv-primary-pressed); background: var(--cv-bleu-light); }
.topic-stage[data-stage='3'] { color: var(--cv-success-fg); background: var(--cv-success-bg); }
.topic-progress { min-width: 0; }
.topic-action, .history-link { justify-self: start; }

@media (min-width: 44rem) {
  .character-card { grid-template-columns: minmax(0, 1fr) minmax(0, .65fr); }
  .character-art { grid-area: 1 / 2; }
  .character-art img { width: min(86%, 14rem); }
  .topic-card { grid-template-columns: minmax(0, 1fr) minmax(0, 17rem); column-gap: var(--cv-step-8); }
}
</style>
