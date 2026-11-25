<script setup lang="ts">
import DashboardConcepts from '~/modules/design-system/DashboardConcepts.vue'
import CiviqueButton from '~/shared/ui/civique/CiviqueButton.vue'
import CiviqueCard from '~/shared/ui/civique/CiviqueCard.vue'
import CiviqueChoices from '~/shared/ui/civique/CiviqueChoices.vue'
import CiviqueLocale from '~/shared/ui/civique/CiviqueLocale.vue'
import CiviqueMark from '~/shared/ui/civique/CiviqueMark.vue'
import CiviqueMascot from '~/shared/ui/civique/CiviqueMascot.vue'
import CiviqueNotice from '~/shared/ui/civique/CiviqueNotice.vue'
import CiviqueProgress from '~/shared/ui/civique/CiviqueProgress.vue'
import CiviqueSymbol from '~/shared/ui/civique/CiviqueSymbol.vue'

const { t } = useLocale()

useSeoMeta({
  title: () => `${t('showcaseTitle')} · Civique Prep`,
  description: () => t('showcaseDescription'),
})

const palette = [
  { name: 'blue', token: '--cv-bleu', hex: '#2563EB', role: 'primaryAction', ink: '--cv-white' },
  { name: 'ink', token: '--cv-encre', hex: '#243247', role: 'textAndBorders', ink: '--cv-white' },
  { name: 'paper', token: '--cv-papier', hex: '#F7F8FA', role: 'interfaceBackground', ink: '--cv-encre' },
  { name: 'coral', token: '--cv-corail', hex: '#FF4B4B', role: 'errorSignal', ink: '--cv-encre-foncee' },
  { name: 'sun', token: '--cv-soleil', hex: '#FFC800', role: 'stepsAndRewards', ink: '--cv-encre' },
  { name: 'meadow', token: '--cv-prairie', hex: '#58CC02', role: 'successSignal', ink: '--cv-encre' },
] as const

const scale = [
  { role: 'displayType', class: 'cv-display', size: '40–80 px · 950', example: 'understandFrance' },
  { role: 'titleType', class: 'cv-title', size: '30–48 px · 900', example: 'homeTitle' },
  { role: 'headingType', class: 'cv-heading', size: '22 px · 900', example: 'mistakes' },
  { role: 'bodyType', class: '', size: '16 px · 650', example: 'trainingIntro' },
  { role: 'labelType', class: 'cv-label', size: '14 px · 800', example: 'answeredQuestions' },
] as const

const options = [
  { id: 'marseillaise', label: 'La Marseillaise' },
  { id: 'depart', label: 'Le Chant du départ' },
  { id: 'joie', label: 'L’Hymne à la joie' },
]
const selected = ref<string | null>(null)
const checked = ref(false)
const correct = computed(() => selected.value === 'marseillaise')
const resetButton = ref<HTMLElement | null>(null)
const question = ref<HTMLFormElement | null>(null)

async function check() {
  if (!selected.value || checked.value) return
  checked.value = true
  await nextTick()
  resetButton.value?.querySelector('button')?.focus()
}

async function reset() {
  checked.value = false
  selected.value = null
  await nextTick()
  question.value?.querySelector('input')?.focus()
}
</script>

<template>
  <div class="showcase">
    <header class="cv-shell showcase-top">
      <NuxtLink to="/" class="showcase-brand">
        <CiviqueMark />
        <span>Civique Prep</span>
      </NuxtLink>
      <nav :aria-label="t('showcaseNavigation')" class="showcase-nav">
        <a href="#fondations">{{ t('foundationsNav') }}</a>
        <a href="#composants">{{ t('componentsNav') }}</a>
        <a href="#concepts">{{ t('conceptsNav') }}</a>
      </nav>
      <CiviqueLocale />
    </header>

    <div class="cv-shell">
      <section class="showcase-hero" aria-labelledby="identity-title">
        <div class="hero-copy">
          <p class="cv-label identity-label">{{ t('visualIdentity') }}</p>
          <h1 id="identity-title" class="cv-display">{{ t('understand') }}<br>{{ t('france') }}</h1>
          <p class="hero-summary">{{ t('showcaseIntro') }}</p>
          <CiviqueButton to="#concepts">{{ t('seeConcepts') }}</CiviqueButton>
        </div>
        <figure class="hero-art">
          <span class="art-star art-star-top" aria-hidden="true"></span>
          <span class="art-star art-star-bottom" aria-hidden="true"></span>
          <div class="mascot-art"><CiviqueMascot :alt="t('mascotAlt')" /></div>
          <figcaption>{{ t('mascotCaption') }}</figcaption>
        </figure>
      </section>

      <section id="fondations" class="showcase-section" aria-labelledby="foundations-title">
        <div class="section-title">
          <h2 id="foundations-title" class="cv-title">{{ t('foundations') }}</h2>
          <p class="cv-muted">{{ t('foundationsIntro') }}</p>
        </div>

        <div>
          <h3 class="cv-heading mb-4">{{ t('palette') }}</h3>
          <ul class="swatch-grid" :aria-label="t('paletteAria')">
            <li v-for="color in palette" :key="color.token" class="swatch">
              <div :style="{ backgroundColor: `var(${color.token})`, color: `var(${color.ink})` }">
                <strong>{{ t(color.name) }}</strong>
              </div>
              <p>{{ t(color.role) }} <span class="swatch-value">{{ color.hex }}</span></p>
            </li>
          </ul>
        </div>

        <div class="foundation-grid">
          <div class="type-sheet">
            <div class="foundation-head"><h3 class="cv-heading">{{ t('typography') }}</h3><span class="cv-label cv-muted">Nunito Variable</span></div>
            <dl class="type-list">
              <div v-for="row in scale" :key="row.role" class="type-row">
                <dt class="cv-label cv-muted">{{ t(row.role) }} <span>{{ row.size }}</span></dt>
                <dd :class="row.class">{{ t(row.example) }}</dd>
              </div>
            </dl>
          </div>
          <div class="type-sheet">
            <div class="foundation-head"><h3 class="cv-heading">{{ t('formAndRhythm') }}</h3></div>
            <dl class="rhythm-list">
              <div><dt>{{ t('spacing') }}</dt><dd>{{ t('spacingValues') }}</dd></div>
              <div><dt>{{ t('corners') }}</dt><dd>{{ t('cornerValues') }}</dd></div>
              <div><dt>{{ t('depth') }}</dt><dd>{{ t('depthValues') }}</dd></div>
              <div><dt>{{ t('interaction') }}</dt><dd>{{ t('interactionValues') }}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section id="composants" class="showcase-section" aria-labelledby="components-title">
        <div class="section-title">
          <h2 id="components-title" class="cv-title">{{ t('components') }}</h2>
          <p class="cv-muted">{{ t('componentsIntro') }}</p>
        </div>
        <div class="component-grid">
          <CiviqueCard class="component-cell">
            <h3 class="cv-heading">{{ t('buttons') }}</h3>
            <div class="flex flex-wrap gap-3">
              <CiviqueButton to="#concepts">{{ t('primaryAction') }}</CiviqueButton>
              <CiviqueButton to="#fondations" variant="secondary">{{ t('secondaryAction') }}</CiviqueButton>
              <CiviqueButton to="#concepts" variant="reward">{{ t('afterThis') }}</CiviqueButton>
              <CiviqueButton disabled>{{ t('unavailable') }}</CiviqueButton>
            </div>
          </CiviqueCard>
          <CiviqueCard class="component-cell">
            <h3 class="cv-heading">{{ t('progression') }}</h3>
            <CiviqueProgress :label="t('answeredQuestions')" :value="6" :max="10" />
            <CiviqueCard to="/progress" tone="blue" class="progress-link">
              <CiviqueSymbol name="book" />
              <strong class="cv-card-title">{{ t('seeMyProgress') }}</strong>
            </CiviqueCard>
          </CiviqueCard>
          <CiviqueCard class="component-cell answer-cell">
            <h3 class="cv-heading">{{ t('answerChoices') }}</h3>
            <form ref="question" class="grid gap-4" @submit.prevent="check">
              <CiviqueChoices
                v-model="selected"
                :legend="t('sampleQuestion')"
                :options="options" text-lang="fr"
                :disabled="checked"
                :correct-ids="checked ? ['marseillaise'] : undefined"
              />
              <div aria-live="polite">
                <CiviqueNotice v-if="checked" :tone="correct ? 'success' : 'error'" :title="t(correct ? 'correct' : 'remember')">{{ t('sampleExplanation') }}</CiviqueNotice>
              </div>
              <div v-if="checked" ref="resetButton">
                <CiviqueButton variant="secondary" @click="reset">{{ t('retry') }}</CiviqueButton>
              </div>
              <div v-else><CiviqueButton type="submit" :disabled="!selected">{{ t('checkAnswer') }}</CiviqueButton></div>
            </form>
          </CiviqueCard>
          <CiviqueCard class="component-cell">
            <h3 class="cv-heading">{{ t('notices') }}</h3>
            <CiviqueNotice :title="t('resumeSample')">{{ t('answersSaved') }}</CiviqueNotice>
            <CiviqueNotice :title="t('topicDone')" tone="success">{{ t('tenAnswered') }}</CiviqueNotice>
            <CiviqueNotice :title="t('saveInterrupted')" tone="error">{{ t('checkConnection') }}</CiviqueNotice>
          </CiviqueCard>
        </div>
      </section>

      <section id="concepts" class="showcase-section" aria-labelledby="concepts-title">
        <div class="section-title">
          <h2 id="concepts-title" class="cv-title">{{ t('threeDashboards') }}</h2>
          <p class="cv-muted">{{ t('compareConcepts') }}</p>
        </div>
        <DashboardConcepts />
      </section>
    </div>
  </div>
</template>

<style scoped>
.showcase { min-block-size: 100vh; padding-block-end: var(--cv-step-16); }
.showcase-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--cv-step-2) var(--cv-step-4);
  padding-block: var(--cv-step-2);
}
.showcase-brand, .showcase-nav a {
  display: inline-flex;
  align-items: center;
  min-height: var(--cv-target);
  color: var(--cv-text);
  text-decoration: none;
}
.showcase-brand { gap: var(--cv-step-2); font-size: 1.15rem; font-weight: var(--cv-heading-weight); }
.showcase-nav { display: flex; margin-inline-start: auto; flex-wrap: wrap; gap: 0 var(--cv-step-3); font-size: var(--cv-label-size); font-weight: var(--cv-label-weight); }
@media (max-width: 40rem) { .showcase-nav { order: 1; flex-basis: 100%; margin-inline-start: 0; } }
.showcase-nav a:hover, .showcase-brand:hover { text-decoration: underline; }
.showcase-hero {
  display: grid;
  min-inline-size: 0;
  border: var(--cv-stroke) solid var(--cv-text);
  border-bottom-width: 7px;
  border-radius: var(--cv-radius-feature);
  background: var(--cv-surface);
  overflow: clip;
}
.hero-copy {
  display: grid;
  justify-items: start;
  align-content: center;
  gap: var(--cv-step-4);
  padding: clamp(1.25rem, 5vw, 3.5rem);
}
.identity-label { color: var(--cv-primary-pressed); }
.hero-summary { max-width: 31ch; color: var(--cv-text-secondary); font-size: clamp(1rem, 2.25vw, 1.25rem); }
.hero-art {
  position: relative;
  isolation: isolate;
  display: grid;
  align-content: center;
  justify-items: center;
  padding: var(--cv-step-4);
  border-top: var(--cv-stroke) solid var(--cv-text);
  background: var(--cv-bleu-light);
}
.hero-art::before {
  position: absolute;
  z-index: -1;
  inset: 9% 10% 10%;
  content: "";
  border: 2px dashed var(--cv-rule-strong);
  border-radius: 46% 54% 48% 52%;
  transform: rotate(-9deg);
}
.mascot-art { width: min(82%, 22rem); }
.hero-art figcaption {
  margin-block-start: -.15rem;
  padding: .25rem .7rem;
  border: var(--cv-stroke) solid var(--cv-text);
  border-radius: 999px;
  background: var(--cv-reward-bg);
  font-size: var(--cv-label-size);
  font-weight: var(--cv-heading-weight);
  transform: rotate(-3deg);
}
.art-star { position: absolute; width: 1.7rem; aspect-ratio: 1; background: var(--cv-soleil); clip-path: polygon(50% 0, 61% 38%, 100% 50%, 61% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); }
.art-star-top { inset: 13% 15% auto auto; }
.art-star-bottom { inset: auto auto 24% 13%; width: 1.15rem; background: var(--cv-primary); }
.showcase-section { display: grid; gap: var(--cv-step-6); padding-top: clamp(2.5rem, 6vw, 4.5rem); }
.section-title { display: grid; gap: var(--cv-step-2); }
.section-title p { max-width: 65ch; }
.swatch-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: var(--cv-step-3); }
.swatch {
  overflow: clip;
  border: var(--cv-stroke) solid var(--cv-text);
  border-radius: var(--cv-radius-control);
  background: var(--cv-surface);
}
.swatch div { display: flex; align-items: end; min-height: 4.5rem; padding: var(--cv-step-2) var(--cv-step-3); font-weight: var(--cv-heading-weight); line-height: 1.2; }
.swatch p { padding: var(--cv-step-2) var(--cv-step-3); color: var(--cv-text-secondary); font-size: var(--cv-label-size); line-height: 1.35; }
.swatch-value { display: block; margin-top: .2rem; font-variant-numeric: tabular-nums; }
.foundation-grid, .component-grid { display: grid; gap: var(--cv-step-4); }
.type-sheet {
  min-inline-size: 0;
  padding: var(--cv-card-padding);
  border: var(--cv-stroke) solid var(--cv-rule);
  border-radius: var(--cv-radius-card);
  background: var(--cv-surface);
}
.foundation-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--cv-step-2); }
.type-list, .rhythm-list { margin-top: var(--cv-step-4); }
.type-row, .rhythm-list > div { padding-block: var(--cv-step-3); border-top: 1px solid var(--cv-rule); }
.type-row dt { display: flex; flex-wrap: wrap; gap: .25rem 1rem; justify-content: space-between; }
.type-row dd { margin-top: .25rem; }
.type-row .cv-display { font-size: clamp(2rem, 5.7vw, 3.75rem); }
.type-row .cv-title { font-size: clamp(1.5rem, 3.9vw, 2.25rem); }
.rhythm-list dt { font-weight: var(--cv-heading-weight); }
.rhythm-list dd { color: var(--cv-text-secondary); }
.component-cell { display: grid; align-content: start; gap: var(--cv-step-4); }
.progress-link { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cv-step-3); justify-self: start; }
@media (min-width: 38rem) {
  .swatch-grid { grid-template-columns: repeat(3, minmax(0,1fr)); }
}
@media (min-width: 48rem) {
  .showcase-top { padding-block: var(--cv-step-4); }
  .showcase-hero { grid-template-columns: minmax(0, 1.09fr) minmax(0, .91fr); min-block-size: 25.5rem; }
  .hero-art { border-top: 0; border-inline-start: var(--cv-stroke) solid var(--cv-text); }
  .showcase-nav { gap: var(--cv-step-6); }
  .swatch-grid { grid-template-columns: repeat(6, minmax(0,1fr)); }
  .foundation-grid { grid-template-columns: minmax(0,1.45fr) minmax(0,1fr); }
  .component-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
}
</style>
