import type { ExamAvailability } from '../../../shared/types/exam'
import { isPlayableQuestion } from '../questions/playable-question'
import { shuffled } from '../questions/shuffle'
import { QuizError, type QuestionSnapshot } from '../quiz/domain/models'
import { cspQuotas, examQuotaFor } from './csp-quotas'

function questionPools(bank: readonly QuestionSnapshot[]) {
  const pools = new Map(cspQuotas.map(quota => [quota, [] as QuestionSnapshot[]] as const))
  const ids = new Set<string>()
  const texts = new Set<string>()
  const ordered = [...bank].sort((a, b) => a.questionId.localeCompare(b.questionId, 'en'))
  for (const question of ordered) {
    const quota = examQuotaFor(question)
    if (!quota || question.options.length !== 4 || !isPlayableQuestion(question)) continue

    const text = question.text.normalize('NFKC').toLocaleLowerCase('fr').replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ').trim()
    if (!text || ids.has(question.questionId) || texts.has(text)) continue

    pools.get(quota)!.push(question)
    ids.add(question.questionId)
    texts.add(text)
  }
  return pools
}

function availability(pools: ReturnType<typeof questionPools>): ExamAvailability {
  let knowledge = 0
  let situations = 0
  const missing: ExamAvailability['missing'] = []

  for (const [quota, questions] of pools) {
    const available = questions.length
    if (quota.sourceType === 'official_knowledge') knowledge += available
    else situations += available
    if (available < quota.required) missing.push({ ...quota, available })
  }

  return { knowledge, situations, ready: missing.length === 0, missing }
}

export function examAvailability(bank: readonly QuestionSnapshot[]) {
  return availability(questionPools(bank))
}

export function selectExamQuestions(bank: readonly QuestionSnapshot[]) {
  const pools = questionPools(bank)
  const exam = availability(pools)
  if (!exam.ready) throw new QuizError('INSUFFICIENT_QUESTIONS', 422, exam)

  return [...pools].flatMap(([quota, questions]) => shuffled(questions).slice(0, quota.required))
}
