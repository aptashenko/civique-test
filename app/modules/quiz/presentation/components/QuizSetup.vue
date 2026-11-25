<script setup lang="ts">
import type { ExamAvailability } from '#shared/types/exam'
import type { QuizMode, SessionView } from '#shared/types/quiz'
import { examNotionLabel } from '~/shared/lib/exam-notions'
import CiviqueButton from '~/shared/ui/civique/CiviqueButton.vue'
import CiviqueCard from '~/shared/ui/civique/CiviqueCard.vue'
import CiviqueNotice from '~/shared/ui/civique/CiviqueNotice.vue'
import CiviqueSymbol from '~/shared/ui/civique/CiviqueSymbol.vue'
import { questionCategoryLabel } from '~/shared/lib/question-categories'
import { errorMessageKey, quizError, type ApiError } from '../stores/quiz'

const props = defineProps<{ mode: QuizMode }>()
const route = useRoute()
const training = computed(() => props.mode === 'training')
const count = ref<number | 'all'>(10)
const category = ref('')
const busy = ref(false)
const error = ref<ApiError | null>(null)
const errorText = computed(() => {
  const problem = error.value
  if (!problem) return ''
  if (problem.details?.available !== undefined) return t('remainingAvailable', { count: problem.details.available })
  return t(problem.code === 'INSUFFICIENT_QUESTIONS' ? 'insufficientExam' : errorMessageKey(problem.code))
})
const smaller = ref<number | null>(null)
const activeId = ref<string | null>(null)
const { data: catalog, error: catalogError, refresh: refreshCatalog } = await useFetch<{
  available: number; categories: string[]; counts: Array<number | 'all'>; exam: ExamAvailability
}>('/api/quiz/catalog')
const ready = computed(() => catalog.value?.exam.ready === true)

watch([() => route.query.category, () => catalog.value?.categories], ([requested, categories]) => {
  category.value = typeof requested === 'string' && categories?.includes(requested) ? requested : ''
}, { immediate: true })


async function start(acceptAvailable = false) {
  busy.value = true
  error.value = null
  smaller.value = null
  activeId.value = null
  try {
    const session = await $fetch<SessionView>('/api/quiz/sessions', {
      method: 'POST',
      body: { mode: props.mode, count: count.value, category: category.value || undefined, acceptAvailable, mistakes: route.query.mistakes === '1' },
    })
    await navigateTo(`${training.value ? '/quiz' : '/exam'}/${session.id}`)
  } catch (failure) {
    const problem = quizError(failure)
    smaller.value = problem.details?.available ?? null
    activeId.value = problem.details?.sessionId ?? null
    error.value = problem
    if (!training.value && problem.code === 'INSUFFICIENT_QUESTIONS') await refreshCatalog()
  } finally {
    busy.value = false
  }
}
const { t } = useLocale()
</script>

<template>
  <section class="cv-narrow grid gap-5">
    <header class="cv-page-heading">
      <CiviqueSymbol :name="training ? 'book' : 'target'" />
      <h1 class="cv-title">{{ training ? (route.query.mistakes === '1' ? t('mistakes') : t('training')) : t('mockExam') }}</h1>
      <p class="cv-muted">{{ training ? t('trainingIntro') : t('examIntro') }}</p>
    </header>
    <CiviqueNotice v-if="catalogError" :title="t('bankUnavailable')" tone="error" role="alert" />
    <CiviqueCard :tone="training ? 'blue' : 'paper'" class="grid gap-5">
      <form v-if="training" class="grid gap-4" @submit.prevent="start()">
        <label class="grid gap-1 font-extrabold">{{ t('category') }}
          <select v-model="category" class="cv-field">
            <option value="">{{ t('allCategories') }}</option>
            <option v-for="item in catalog?.categories" :key="item" :value="item">{{ questionCategoryLabel(item, t) }}</option>
          </select>
        </label>
        <label class="grid gap-1 font-extrabold">{{ t('questionCount') }}
          <select v-model="count" class="cv-field">
            <option v-for="size in catalog?.counts ?? [5, 10, 20, 40, 'all']" :key="size" :value="size">{{ size === 'all' ? t('all') : size }}</option>
          </select>
        </label>
        <p class="cv-label cv-muted">{{ t('trainingCorrection') }}</p>
        <CiviqueButton class="justify-self-start" type="submit" :disabled="busy || !!catalogError">{{ busy ? t('loading') : t('startTraining') }}</CiviqueButton>
      </form>
      <template v-else>
        <dl class="exam-facts">
          <div><dt>{{ t('questions') }}</dt><dd>40</dd></div>
          <div><dt>{{ t('minutes') }}</dt><dd>45</dd></div>
          <div><dt>{{ t('passingScore') }}</dt><dd>80 %</dd></div>
        </dl>
        <CiviqueNotice v-if="catalog && !ready" :title="t('examUnavailable')" role="status">
          {{ t('examBank', { knowledge: catalog.exam.knowledge, situations: catalog.exam.situations }) }}
        </CiviqueNotice>
        <details v-if="catalog?.exam.missing.length" class="exam-missing">
          <summary>{{ t('examMissing') }}</summary>
          <ul class="grid gap-2">
            <li v-for="quota in catalog.exam.missing" :key="quota.notionId ?? quota.categoryId" class="exam-missing-row">
              <span>{{ quota.notionId ? examNotionLabel(quota.notionId, t) : t('situationalTopic', { topic: questionCategoryLabel(quota.categoryId, t) }) }}</span>
              <span class="cv-label cv-muted tabular-nums">{{ quota.available }}/{{ quota.required }}</span>
            </li>
          </ul>
        </details>
        <CiviqueButton class="justify-self-start" :disabled="busy || !ready" @click="start()">{{ busy ? t('loading') : t('startTimer') }}</CiviqueButton>
      </template>
    </CiviqueCard>
    <CiviqueNotice v-if="error" :title="errorText" tone="error" role="alert" />
    <CiviqueButton v-if="smaller !== null" class="justify-self-start" variant="secondary" :disabled="busy" @click="start(true)">{{ t('continueWith', { count: smaller }) }}</CiviqueButton>
    <CiviqueButton v-if="activeId" class="justify-self-start" variant="secondary" :to="`${training ? '/quiz' : '/exam'}/${activeId}`">{{ t('resumeSession') }}</CiviqueButton>
  </section>
</template>

<style scoped>
.exam-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--cv-step-2); text-align: center; }
.exam-facts div { display: flex; flex-direction: column-reverse; justify-content: start; padding: var(--cv-step-2); border-radius: var(--cv-radius-control); background: var(--cv-bleu-light); }
.exam-facts dt { font-size: var(--cv-label-size); font-weight: var(--cv-label-weight); line-height: 1.25; }
.exam-facts dd { font-size: 1.5rem; font-weight: var(--cv-display-weight); }
.exam-missing { border: 1px solid var(--cv-rule-strong); border-radius: var(--cv-radius-control); padding-inline: var(--cv-step-3); }
.exam-missing summary { min-block-size: var(--cv-target); padding-block: var(--cv-step-2); font-weight: var(--cv-label-weight); }
.exam-missing ul { padding-block-end: var(--cv-step-3); }
.exam-missing-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--cv-step-2); }
</style>
