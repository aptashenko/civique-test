<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import type { Difficulty, Language, QuizAction, QuizMode } from '#shared/types/quiz'
import CiviqueButton from '~/shared/ui/civique/CiviqueButton.vue'
import CiviqueCard from '~/shared/ui/civique/CiviqueCard.vue'
import CiviqueNotice from '~/shared/ui/civique/CiviqueNotice.vue'
import CiviqueProgress from '~/shared/ui/civique/CiviqueProgress.vue'
import AnswerOptions from './AnswerOptions.vue'
import QuestionCard from './QuestionCard.vue'
import { errorMessageKey, useQuizStore } from '../stores/quiz'

const props = defineProps<{ id: string; mode: QuizMode }>()
const store = useQuizStore()
const session = computed(() => store.session?.id === props.id && store.session.config.mode === props.mode ? store.session : null)
const question = computed(() => session.value?.questions[session.value.currentQuestionIndex])
const selected = ref<string | null>(null)
const { locale, t } = useLocale()
const language = ref<Language | '' | null>(null)
const heading = ref<HTMLElement | null>(null)
const abandonDialog = ref<HTMLDialogElement | null>(null)
const abandonTitleId = useId()
const abandonDescriptionId = useId()
const leaveDialog = ref<HTMLDialogElement | null>(null)
const leaveTitleId = useId()
const leaveDescriptionId = useId()
let leaveConfirmation: Promise<boolean> | undefined
let resolveLeave: ((confirmed: boolean) => void) | undefined
const now = ref(0)
let clock: ReturnType<typeof setInterval> | undefined
let offset = 0
let elapsed = 0
let visibleSince: number | null = null
let timeoutRequested = false

const remaining = computed(() => {
  const deadline = session.value?.expiresAt
  return deadline && now.value ? Math.max(0, Math.ceil((Date.parse(deadline) - now.value) / 1000)) : null
})
const timerText = computed(() => {
  const seconds = remaining.value ?? 0
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
})
const locked = computed(() => store.busy || remaining.value === 0)
const questionLanguage = computed<Language | ''>({
  get: () => {
    if (session.value?.config.mode !== 'training') return ''
    const preferred = language.value ?? (locale.value === 'uk' ? 'uk' : '')
    return preferred && question.value?.translations?.[preferred] ? preferred : ''
  },
  set: value => { language.value = value },
})
const translation = computed(() => questionLanguage.value ? question.value?.translations?.[questionLanguage.value] : undefined)
const displayedOptions = computed(() => question.value?.options.map(option => ({
  ...option, text: translation.value?.options[option.id] ?? option.text,
})) ?? [])
const showQuestion = computed(() => session.value?.status === 'in_progress' && !session.value.confirmingFinish)
const answered = computed(() => session.value?.questions.filter(item => item.status === 'answered').length ?? 0)
const canSkipQuestion = computed(() => !!question.value && question.value.status !== 'answered' && session.value?.config.allowSkip === true)
const hasUnsavedAnswer = computed(() => !!selected.value && selected.value !== question.value?.selectedOptionIds[0])
const primarySubmits = computed(() => question.value?.status !== 'answered' || (session.value?.config.allowAnswerChange && hasUnsavedAnswer.value))
const forwardLabel = computed(() => session.value && session.value.currentQuestionIndex === session.value.questions.length - 1 ? 'summary' : 'next')

function visibility() {
  const tick = performance.now()
  if (visibleSince !== null) elapsed += tick - visibleSince
  visibleSince = document.visibilityState === 'visible' ? tick : null
}

function visitTime() {
  const total = elapsed + (visibleSince === null ? 0 : performance.now() - visibleSince)
  return Math.min(Math.round(total), 86_400_000)
}

function resetVisit() {
  elapsed = 0
  visibleSince = document.visibilityState === 'visible' ? performance.now() : null
}

async function act(action: QuizAction) {
  if (locked.value) return
  const hasTime = 'timeSpentMs' in action
  if (await store.perform(action) && hasTime) resetVisit()
}

function navigate(index: number) {
  return act({ action: 'navigate', index, timeSpentMs: visitTime() })
}

function submit() {
  if (!question.value || !selected.value) return
  return act({
    action: question.value.status === 'answered' ? 'change' : 'submit',
    sessionQuestionId: question.value.id,
    selectedOptionIds: [selected.value],
    timeSpentMs: visitTime(),
  })
}

function skip() {
  if (!question.value) return
  return act({ action: 'skip', sessionQuestionId: question.value.id, timeSpentMs: visitTime() })
}

function moveForward() {
  if (!session.value) return
  return navigate(session.value.currentQuestionIndex + 1)
}

function runPrimaryAction() {
  if (locked.value) return
  return primarySubmits.value ? submit() : moveForward()
}

function rate(difficulty: Difficulty) {
  if (question.value) return act({ action: 'rate', sessionQuestionId: question.value.id, difficulty })
}

function openAbandonDialog() {
  const dialog = abandonDialog.value
  if (!dialog || locked.value || dialog.open) return
  dialog.returnValue = 'stay'
  dialog.showModal()
}

async function finishAbandonDialog() {
  if (abandonDialog.value?.returnValue !== 'abandon' || locked.value) return
  if (await store.perform({ action: 'abandon' })) await navigateTo('/')
}

async function waitForIdle() {
  while (store.busy) {
    await new Promise<void>(resolve => {
      const stop = watch(() => store.busy, busy => {
        if (busy) return
        stop()
        resolve()
      })
    })
  }
}

function confirmLeaving() {
  const dialog = leaveDialog.value
  if (!dialog) return Promise.resolve(false)
  if (!leaveConfirmation) {
    leaveConfirmation = new Promise(resolve => { resolveLeave = resolve })
    dialog.returnValue = 'stay'
    dialog.showModal()
  }
  return leaveConfirmation
}

function resolveLeaveDialog() {
  const confirmed = leaveDialog.value?.returnValue === 'leave'
  resolveLeave?.(confirmed)
  resolveLeave = undefined
  leaveConfirmation = undefined
}

async function finishBeforeLeaving() {
  if (props.mode !== 'training') return true
  if (!session.value) await waitForIdle()
  if (session.value?.status !== 'in_progress') return true
  if (!await confirmLeaving()) return false

  await waitForIdle()
  if (session.value?.status !== 'in_progress') return true
  const completed = await store.perform({ action: 'leave' })
  return completed || session.value?.status !== 'in_progress'
    || store.error === 'SESSION_NOT_FOUND' || store.error === 'ACCESS_DENIED'
}

onBeforeRouteLeave(finishBeforeLeaving)
onBeforeRouteUpdate((to, from) => {
  if (to.params.sessionId !== from.params.sessionId) return finishBeforeLeaving()
})

watch(() => session.value?.serverTime, serverTime => {
  if (!serverTime) return
  offset = Date.parse(serverTime) - Date.now()
  now.value = Date.now() + offset
})

watch(() => [question.value?.id, question.value?.selectedOptionIds[0], session.value?.confirmingFinish], () => {
  selected.value = question.value?.selectedOptionIds[0] ?? null
})

watch([() => question.value?.id, () => session.value?.confirmingFinish, () => session.value?.status], async () => {
  await nextTick()
  heading.value?.focus()
})

onMounted(async () => {
  store.reset()
  resetVisit()
  document.addEventListener('visibilitychange', visibility)
  await store.load(props.id)
  clock = setInterval(() => {
    now.value = Date.now() + offset
    if (remaining.value === 0 && session.value?.status === 'in_progress' && !store.busy && !timeoutRequested) {
      timeoutRequested = true
      void store.load(props.id)
    }
  }, 250)
})

onBeforeUnmount(() => {
  clearInterval(clock)
  document.removeEventListener('visibilitychange', visibility)
})
</script>

<template>
  <div v-if="session" class="cv-narrow grid gap-5">
    <CiviqueCard v-if="session.status === 'completed' && session.result" tone="blue" class="grid justify-items-start gap-4">
      <div ref="heading" tabindex="-1"><h1 class="cv-title">{{ t('result') }}</h1></div>
      <div class="grid">
        <p class="cv-display tabular-nums">{{ session.result.correctCount }} / {{ session.result.totalQuestions }}</p>
        <p class="cv-muted">{{ t('correctAnswers') }}</p>
      </div>
      <p v-if="session.result.passed !== null" class="cv-pill" :data-tone="session.result.passed ? 'success' : 'error'">{{ session.result.passed ? t('passed') : t('failed') }}</p>
      <CiviqueNotice v-if="session.completionReason === 'timeout'" :title="t('timeout')" role="status">{{ t('answersSaved') }}</CiviqueNotice>
      <CiviqueButton :to="`/review/${session.id}`">{{ t('seeReview') }}</CiviqueButton>
    </CiviqueCard>

    <CiviqueCard v-else-if="session.status === 'abandoned'" class="grid justify-items-start gap-3">
      <h1 class="cv-title">{{ t('abandoned') }}</h1>
      <CiviqueButton variant="secondary" to="/">{{ t('backHome') }}</CiviqueButton>
    </CiviqueCard>

    <template v-else>
      <div class="session-strip">
        <NuxtLink to="/" class="cv-link">{{ t('home') }}</NuxtLink>
        <button type="button" class="session-exit cv-label" aria-haspopup="dialog" :disabled="locked" @click="openAbandonDialog">{{ t('abandon') }}</button>
        <div class="session-status">
          <div v-if="remaining !== null" class="session-timer" :data-urgent="remaining <= 60">
            <span class="cv-label">{{ t('remainingTime') }}</span>
            <span role="timer" :aria-label="t('remainingTime')" class="text-xl font-black tabular-nums">{{ timerText }}</span>
          </div>
          <CiviqueProgress v-else :label="t('answeredQuestions')" :value="answered" :max="session.questions.length" />
        </div>
      </div>
      <CiviqueNotice v-if="store.error" :title="t(errorMessageKey(store.error))" tone="error" role="alert" />
      <CiviqueCard v-if="remaining === 0" class="grid justify-items-start gap-2">
        <strong>{{ t('sessionExpired') }}</strong>
        <CiviqueButton variant="secondary" @click="store.load(id)">{{ t('refreshResult') }}</CiviqueButton>
      </CiviqueCard>

      <CiviqueCard v-if="showQuestion && question" class="grid gap-5">
        <div ref="heading" tabindex="-1" class="grid gap-2">
          <p class="cv-label question-position">{{ t('questionPosition', { index: session.currentQuestionIndex + 1, total: session.questions.length }) }}</p>
          <QuestionCard :lang="questionLanguage || 'fr'" :question="translation?.text ?? question.text" />
        </div>
        <label v-if="session.config.mode === 'training' && Object.keys(question.translations ?? {}).length" class="grid gap-1 font-bold">
          {{ t('questionLanguage') }}
          <select v-model="questionLanguage" class="cv-field">
            <option value="" lang="fr">Français</option>
            <option v-for="(_, locale) in question.translations" :key="locale" :value="locale" :lang="locale">{{ { uk: 'Українська', ru: 'Русский', en: 'English' }[locale] }}</option>
          </select>
        </label>
        <AnswerOptions v-model="selected" :text-lang="questionLanguage || 'fr'" :options="displayedOptions" :disabled="locked || (question.status === 'answered' && !session.config.allowAnswerChange)" :correct-ids="question.feedback?.correctOptionIds" />
        <div aria-live="polite" class="session-feedback">
          <CiviqueNotice v-if="question.feedback" :tone="question.feedback.isCorrect ? 'success' : 'error'" :title="t(question.feedback.isCorrect ? 'correctFeedback' : 'remember')">
            <template v-if="question.feedback.explanation" #default><span :lang="translation?.explanation ? questionLanguage : 'fr'">{{ translation?.explanation ?? question.feedback.explanation }}</span></template>
          </CiviqueNotice>
          <p v-else-if="question.status === 'answered'" class="cv-muted">{{ t('answerSaved') }}</p>
        </div>
        <div class="question-actions">
          <div class="question-primary">
            <CiviqueButton :disabled="primarySubmits && !hasUnsavedAnswer" :aria-disabled="locked || undefined" @click="runPrimaryAction">
              {{ t(primarySubmits ? (question.status === 'answered' ? 'modifyAnswer' : 'submit') : forwardLabel) }}
            </CiviqueButton>
          </div>
          <div v-if="(session.config.allowNavigation && session.currentQuestionIndex > 0) || question.status !== 'answered'" class="question-navigation">
            <button
              v-if="session.config.allowNavigation && session.currentQuestionIndex > 0"
              type="button"
              class="question-nav-button"
              :disabled="locked"
              @click="navigate(session.currentQuestionIndex - 1)"
            ><span class="previous-arrow" aria-hidden="true"></span>{{ t('previous') }}</button>
            <button v-if="canSkipQuestion" type="button" class="question-nav-button question-nav-forward" :disabled="locked" @click="skip">{{ t('skip') }}</button>
            <button
              v-else-if="question.status !== 'answered'"
              type="button"
              class="question-nav-button question-nav-forward"
              :disabled="locked || hasUnsavedAnswer"
              @click="moveForward"
            >{{ t(forwardLabel) }}</button>
          </div>
        </div>
        <div v-if="props.mode === 'training' && question.feedback" class="flex flex-wrap items-center gap-2" role="group" :aria-label="t('feltDifficulty')">
          <span class="cv-label mr-1">{{ t('difficulty') }}</span>
          <CiviqueButton v-for="level in (['easy', 'medium', 'hard'] as const)" :key="level" :aria-pressed="question.difficulty === level" :variant="question.difficulty === level ? 'primary' : 'secondary'" :disabled="locked" @click="rate(level)">{{ t(level) }}</CiviqueButton>
        </div>
      </CiviqueCard>

      <CiviqueCard v-else-if="session.confirmingFinish" class="grid justify-items-start gap-4">
        <div ref="heading" tabindex="-1"><h1 class="cv-title">{{ t('finishPrompt') }}</h1></div>
        <p>{{ t('savedOutOf', { answered, total: session.questions.length }) }}</p>
        <div class="flex flex-wrap gap-2">
          <CiviqueButton :disabled="locked" @click="act({ action: 'finish' })">{{ t('confirmFinish') }}</CiviqueButton>
          <CiviqueButton variant="secondary" :disabled="locked" @click="navigate(session.currentQuestionIndex)">{{ t('backToQuestions') }}</CiviqueButton>
        </div>
      </CiviqueCard>

      <details v-if="session.config.allowNavigation" :open="props.mode === 'exam'" class="question-index">
        <summary>{{ t('goToQuestion') }}</summary>
        <nav class="flex flex-wrap gap-2" :aria-label="t('questions')">
          <CiviqueButton
            v-for="(item, index) in session.questions"
            :key="item.id"
            class="min-w-12 !px-2"
            :variant="showQuestion && index === session.currentQuestionIndex ? 'primary' : 'secondary'"
            :aria-current="showQuestion && index === session.currentQuestionIndex ? 'step' : undefined"
            :aria-label="t('questionNav', { index: index + 1, status: t(item.status) })"
            :disabled="locked"
            @click="navigate(index)"
          >{{ index + 1 }}<span v-if="item.status === 'answered'" aria-hidden="true">✓</span><span v-else-if="item.status === 'skipped'" aria-hidden="true">•</span></CiviqueButton>
        </nav>
      </details>

    </template>
  </div>

  <CiviqueCard v-else class="cv-narrow grid justify-items-start gap-3">
    <CiviqueNotice v-if="store.error || store.session" :title="t(store.error ? errorMessageKey(store.error) : 'wrongMode')" tone="error" role="alert" />
    <p v-else role="status">{{ t('loadingSession') }}</p>
    <CiviqueButton v-if="store.error || store.session" variant="secondary" to="/">{{ t('backHome') }}</CiviqueButton>
  </CiviqueCard>

  <dialog ref="abandonDialog" class="session-dialog" :aria-labelledby="abandonTitleId" :aria-describedby="abandonDescriptionId" @close="finishAbandonDialog">
    <form method="dialog" class="grid gap-4">
      <h2 :id="abandonTitleId" class="cv-heading">{{ t('abandonPrompt') }}</h2>
      <p :id="abandonDescriptionId" class="cv-muted">{{ t('abandonWarning') }}</p>
      <div class="flex flex-wrap gap-2">
        <CiviqueButton type="submit" value="stay" variant="secondary" autofocus>{{ t('stayTraining') }}</CiviqueButton>
        <CiviqueButton type="submit" value="abandon" variant="danger" :disabled="locked">{{ t('abandon') }}</CiviqueButton>
      </div>
    </form>
  </dialog>

  <dialog
    v-if="props.mode === 'training'"
    ref="leaveDialog"
    class="session-dialog"
    :aria-labelledby="leaveTitleId"
    :aria-describedby="leaveDescriptionId"
    @cancel.prevent="leaveDialog?.close('stay')"
    @close="resolveLeaveDialog"
  >
    <form method="dialog" class="grid gap-4">
      <h2 :id="leaveTitleId" class="cv-heading">{{ t('leavePrompt') }}</h2>
      <p :id="leaveDescriptionId" class="cv-muted">{{ t('leaveWarning') }}</p>
      <div class="flex flex-wrap gap-2">
        <CiviqueButton type="submit" value="stay" variant="secondary" autofocus>{{ t('stayTraining') }}</CiviqueButton>
        <CiviqueButton type="submit" value="leave">{{ t('finishAndLeave') }}</CiviqueButton>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.session-strip { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--cv-step-2) var(--cv-step-4); }
.session-strip .cv-link { justify-self: start; }
.session-status { grid-column: 1 / -1; min-width: 0; }
.session-exit, .question-nav-button {
  display: inline-flex;
  align-items: center;
  gap: var(--cv-step-2);
  min-block-size: var(--cv-target);
  padding-inline: var(--cv-step-3);
  border-radius: var(--cv-radius-control);
  color: var(--cv-primary-pressed);
  cursor: pointer;
}
.session-exit { justify-self: end; color: var(--cv-error-fg); text-align: end; }
.session-exit:disabled, .question-nav-button:disabled { color: var(--cv-text-secondary); cursor: default; }
@media (hover: hover) {
  .session-exit:not(:disabled):hover { background: var(--cv-error-bg); }
  .question-nav-button:not(:disabled):hover { background: var(--cv-bleu-light); }
}
.session-timer { display: flex; width: fit-content; flex-wrap: wrap; align-items: center; gap: var(--cv-step-2); padding: var(--cv-step-2) var(--cv-step-3); border: var(--cv-stroke) solid var(--cv-text); border-radius: var(--cv-radius-control); background: var(--cv-surface); }
.session-timer[data-urgent="true"] { color: var(--cv-error-fg); background: var(--cv-error-bg); border-color: var(--cv-error-fg); }
.question-position { color: var(--cv-primary-pressed); }
.session-feedback:empty { display: none; }
.question-actions { display: grid; gap: var(--cv-step-2); }
.question-primary { display: grid; }
.question-primary :deep(button[aria-disabled='true']) {
  --cv-button-bg: var(--cv-canvas);
  --cv-button-hover: var(--cv-canvas);
  --cv-button-fg: var(--cv-text-secondary);
  --cv-button-edge: var(--cv-rule-strong);
  cursor: default;
  transform: none;
}
.question-navigation { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cv-step-2); }
.question-nav-button { font-weight: var(--cv-label-weight); }
.question-nav-forward { margin-inline-start: auto; }
.previous-arrow { width: .5rem; height: .5rem; border-bottom: 2px solid; border-left: 2px solid; transform: rotate(45deg); }
@media (min-width: 36rem) {
  .session-strip { grid-template-columns: auto minmax(0, 1fr) auto; }
  .session-status { grid-area: 1 / 2; }
  .session-exit { grid-area: 1 / 3; }
  .session-timer { margin-inline: auto; }
}
.question-index { padding-inline: var(--cv-step-4); border: var(--cv-stroke) solid var(--cv-rule-strong); border-radius: var(--cv-radius-control); background: var(--cv-surface); }
.question-index summary { min-block-size: var(--cv-target); padding-block: var(--cv-step-2); font-weight: var(--cv-label-weight); }
.question-index nav { padding-block-end: var(--cv-step-4); }
.session-dialog {
  position: fixed;
  inset: 0;
  width: min(26rem, 100% - 2rem);
  max-height: calc(100% - 2rem);
  margin: auto;
  padding: var(--cv-card-padding);
  border: var(--cv-stroke) solid var(--cv-text);
  border-bottom-width: var(--cv-depth);
  border-radius: var(--cv-radius-feature);
  background: var(--cv-surface);
  color: var(--cv-text);
}
.session-dialog::backdrop { background: color-mix(in srgb, var(--cv-text) 55%, transparent); }
</style>
