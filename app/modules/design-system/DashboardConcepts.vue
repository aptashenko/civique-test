<script setup lang="ts">
import CiviqueButton from '~/shared/ui/civique/CiviqueButton.vue'
import CiviqueCard from '~/shared/ui/civique/CiviqueCard.vue'
import CiviqueMark from '~/shared/ui/civique/CiviqueMark.vue'
import CiviqueMascot from '~/shared/ui/civique/CiviqueMascot.vue'
import CiviqueProgress from '~/shared/ui/civique/CiviqueProgress.vue'
import CiviqueSymbol from '~/shared/ui/civique/CiviqueSymbol.vue'

const concepts = [
  { id: 'parcours', title: 'pathConcept', description: 'pathConceptDetail' },
  { id: 'carnet', title: 'notebookConcept', description: 'notebookConceptDetail' },
  { id: 'kiosque', title: 'kioskConcept', description: 'kioskConceptDetail' },
] as const
const selected = ref<typeof concepts[number]['id']>('parcours')
const group = useId()
const panel = useId()
const { t } = useLocale()
</script>

<template>
  <div class="grid gap-5">
    <fieldset class="concept-choices">
      <legend class="sr-only">{{ t('chooseConcept') }}</legend>
      <label v-for="concept in concepts" :key="concept.id" class="concept-choice">
        <input v-model="selected" type="radio" :name="group" :value="concept.id" :aria-controls="panel">
        <span>
          <strong>{{ t(concept.title) }}</strong>
          <span class="concept-description">{{ t(concept.description) }}</span>
        </span>
      </label>
    </fieldset>

    <div :id="panel" class="concept-preview">
      <div class="preview-bar">
        <span class="inline-flex items-center gap-2 font-black"><CiviqueMark /> Civique Prep</span>
        <span class="cv-label cv-muted">{{ t('demoData') }}</span>
      </div>

      <div v-if="selected === 'parcours'" class="preview-content path-layout">
        <div class="path-copy">
          <h3 class="cv-title">{{ t('homeTitle') }}</h3>
          <p class="cv-muted">{{ t('oneThemeAtATime') }}</p>
          <div class="path-companion" aria-hidden="true"><CiviqueMascot /></div>
          <CiviqueProgress :label="t('completedTopics')" :value="1" :max="5" />
        </div>
        <ol class="path-list">
          <li>
            <span class="path-node path-done" aria-hidden="true"></span>
            <div><strong>{{ t('shortValues') }}</strong><p class="cv-label cv-muted">{{ t('topicDone') }}</p></div>
          </li>
          <li class="path-current">
            <span class="path-node path-next" aria-hidden="true"></span>
            <div class="grid justify-items-start gap-2">
              <strong>{{ t('shortInstitutions') }}</strong>
              <CiviqueButton to="/quiz">{{ t('continuePath') }}</CiviqueButton>
            </div>
          </li>
          <li>
            <span class="path-node" aria-hidden="true"></span>
            <div><strong>{{ t('rightsAndDuties') }}</strong><p class="cv-label cv-muted">{{ t('topicToExplore') }}</p></div>
          </li>
          <li>
            <span class="path-node" aria-hidden="true"></span>
            <div><strong>{{ t('historyGeography') }}</strong><p class="cv-label cv-muted">{{ t('topicToExplore') }}</p></div>
          </li>
          <li>
            <span class="path-node" aria-hidden="true"></span>
            <div><strong>{{ t('livingInFrance') }}</strong><p class="cv-label cv-muted">{{ t('topicToExplore') }}</p></div>
          </li>
        </ol>
      </div>

      <div v-else-if="selected === 'carnet'" class="preview-content notebook-layout">
        <div class="notebook">
          <div class="notebook-heading">
            <div>
              <h3 class="cv-title">{{ t('notebookTitle') }}</h3>
              <p>{{ t('resumeWhereStopped') }}</p>
            </div>
            <CiviqueSymbol name="book" />
          </div>
          <div class="notebook-entry">
            <h4 class="cv-heading">{{ t('rightsAndDuties') }}</h4>
            <CiviqueProgress :label="t('answeredQuestions')" :value="6" :max="10" />
            <CiviqueButton to="/quiz">{{ t('resumeTraining') }}</CiviqueButton>
          </div>
        </div>
        <div class="grid content-start gap-4">
          <CiviqueCard to="/quiz?mistakes=1" tone="yellow">
            <CiviqueSymbol name="review" />
            <h4 class="cv-heading cv-card-title mt-3">{{ t('mistakes') }}</h4>
            <p class="cv-muted">{{ t('fourToReview') }}</p>
          </CiviqueCard>
          <CiviqueCard to="/review">
            <h4 class="cv-heading cv-card-title">{{ t('myCorrections') }}</h4>
            <p class="cv-muted">{{ t('seeCompleted') }}</p>
          </CiviqueCard>
        </div>
      </div>

      <div v-else class="preview-content kiosk-layout">
        <h3 class="cv-title">{{ t('chooseActivity') }}</h3>
        <div class="kiosk-grid">
          <CiviqueCard to="/quiz" tone="blue" class="kiosk-training">
            <div class="kiosk-training-content">
              <CiviqueSymbol name="book" />
              <h4 class="cv-heading cv-card-title">{{ t('training') }}</h4>
              <p>{{ t('chooseTopicAndCount') }}</p>
            </div>
            <div class="kiosk-mascot" aria-hidden="true"><CiviqueMascot /></div>
          </CiviqueCard>
          <CiviqueCard to="/exam" tone="yellow">
            <CiviqueSymbol name="target" />
            <h4 class="cv-heading cv-card-title mt-3">{{ t('mockExamShort') }}</h4>
            <p>{{ t('examFormat') }}</p>
          </CiviqueCard>
          <CiviqueCard to="/quiz?mistakes=1" tone="pink">
            <CiviqueSymbol name="review" />
            <h4 class="cv-heading cv-card-title mt-3">{{ t('mistakes') }}</h4>
            <p>{{ t('retryDifficult') }}</p>
          </CiviqueCard>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.concept-choices { display: grid; gap: var(--cv-step-2); }
.concept-choice {
  display: flex;
  align-items: start;
  gap: var(--cv-step-2);
  min-block-size: var(--cv-target);
  padding: var(--cv-step-3);
  border: var(--cv-stroke) solid var(--cv-rule-strong);
  border-bottom-width: 4px;
  border-radius: var(--cv-radius-control);
  background: var(--cv-surface);
  cursor: pointer;
}
.concept-choice input { margin-block-start: .25rem; width: 1.125rem; height: 1.125rem; flex: none; accent-color: var(--cv-primary); }
.concept-choice strong { display: block; font-weight: var(--cv-heading-weight); }
.concept-choice:has(:checked) { border-color: var(--cv-primary-pressed); background: var(--cv-bleu-light); }
.concept-choice:has(:focus-visible) { outline: 3px solid var(--cv-focus); outline-offset: 2px; }
.concept-description { display: block; color: var(--cv-text-secondary); font-size: var(--cv-label-size); line-height: 1.45; }
.concept-preview {
  border: var(--cv-stroke) solid var(--cv-text);
  border-bottom-width: var(--cv-depth);
  border-radius: var(--cv-radius-feature);
  background: var(--cv-surface);
}
.preview-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--cv-step-2) var(--cv-step-4);
  padding: var(--cv-step-3) var(--cv-step-4);
  border-bottom: var(--cv-stroke) solid var(--cv-rule);
}
.preview-content { display: grid; gap: var(--cv-step-6); padding: var(--cv-card-padding); }
.path-copy { display: grid; align-content: start; gap: var(--cv-step-3); }
.path-companion { max-width: 10rem; margin-inline: auto; }
.path-list { position: relative; display: grid; gap: var(--cv-step-2); list-style: none; padding: 0; }
.path-list::before {
  content: ""; position: absolute; inset: 1.5rem auto 1.5rem 1.8rem;
  border-inline-start: 2px dashed var(--cv-rule-strong);
}
.path-list li {
  position: relative;
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: var(--cv-step-3);
  align-items: center;
  padding: var(--cv-step-3) var(--cv-step-4);
}
.path-list .path-current { border-radius: var(--cv-radius-card); background: var(--cv-bleu-light); }
.path-node { display: grid; place-items: center; width: 1.75rem; aspect-ratio: 1; border: var(--cv-stroke) solid var(--cv-text); border-radius: 50%; background: var(--cv-surface); }
.path-node.path-done { background: var(--cv-prairie); }
.path-node.path-next { background: var(--cv-soleil); }
.path-done::after { content: ""; display: block; width: .65rem; height: .35rem; border-left: 2px solid; border-bottom: 2px solid; transform: translateY(-1px) rotate(-45deg); }
.path-next::after { content: ""; display: block; width: .5rem; aspect-ratio: 1; border-radius: 50%; background: var(--cv-text); }
.notebook {
  overflow: hidden;
  border: var(--cv-stroke) solid var(--cv-text);
  border-bottom-width: var(--cv-depth);
  border-radius: var(--cv-radius-card);
  background: var(--cv-bleu-light);
}
.notebook-heading { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--cv-step-3); padding: var(--cv-card-padding); }
.notebook-heading p { margin-top: var(--cv-step-2); }
.notebook-entry {
  display: grid;
  justify-items: start;
  gap: var(--cv-step-4);
  margin: 0 var(--cv-step-3) var(--cv-step-3);
  padding: var(--cv-card-padding);
  border-inline-start: 4px solid var(--cv-corail);
  border-radius: .35rem var(--cv-radius-control) var(--cv-radius-control) .35rem;
  background: var(--cv-surface);
}
.notebook-entry > div { width: 100%; }
.kiosk-grid { display: grid; gap: var(--cv-step-4); }
.kiosk-training { position: relative; display: grid; align-items: center; }
.kiosk-training-content { position: relative; display: grid; gap: var(--cv-step-2); z-index: 1; }
.kiosk-mascot { max-width: 11rem; margin: auto; }

@media (min-width: 48rem) {
  .concept-choices { grid-template-columns: repeat(3, minmax(0,1fr)); }
  .path-layout { grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr); }
  .notebook-layout { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); }
  .kiosk-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kiosk-training { grid-column: span 2; grid-template-columns: minmax(0,1fr) 12rem; }
}
@media (max-width: 32rem) {
  .path-companion { display: none; }
}
</style>
