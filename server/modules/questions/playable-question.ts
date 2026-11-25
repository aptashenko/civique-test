import type { QuestionSnapshot } from '../quiz/domain/models'

export function isPlayableQuestion(question: QuestionSnapshot) {
  return question.type === 'single_select' && question.options.length >= 2
    && new Set(question.options.map(option => option.id)).size === question.options.length
    && question.correctOptionIds.length === 1
    && question.options.some(option => option.id === question.correctOptionIds[0])
}
