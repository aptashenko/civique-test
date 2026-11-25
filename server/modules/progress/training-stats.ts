import { currentQuestionId } from '../questions/csp-training'
import type { QuestionSnapshot, QuizAnswer } from '../quiz/domain/models'

type BankQuestion = Pick<QuestionSnapshot, 'questionId' | 'categoryId'>

interface AttemptQuestion {
  snapshot: Pick<QuestionSnapshot, 'questionId'>
  answer: Pick<QuizAnswer, 'isCorrect'> | null
}

export interface TrainingStats {
  answered: number
  correct: number
  total: number
}

export function summarizeTraining(bank: readonly BankQuestion[], attempts: readonly { state: { questions: readonly AttemptQuestion[] } }[]) {
  const questions = new Map(bank.map(question => [question.questionId, question.categoryId]))
  const categories: Record<string, TrainingStats> = Object.create(null)
  for (const category of questions.values()) {
    const stats = categories[category] ??= { answered: 0, correct: 0, total: 0 }
    stats.total += 1
  }

  const answers = new Map<string, boolean>()
  for (const { state } of attempts) {
    for (const { answer, snapshot } of state.questions) {
      if (!answer) continue
      const id = questions.has(snapshot.questionId) ? snapshot.questionId : currentQuestionId(snapshot.questionId)
      if (questions.has(id)) answers.set(id, answer.isCorrect || answers.get(id) === true)
    }
  }
  for (const [id, isCorrect] of answers) {
    const stats = categories[questions.get(id)!]!
    stats.answered += 1
    if (isCorrect) stats.correct += 1
  }

  return categories
}
