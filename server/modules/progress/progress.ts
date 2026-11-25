import { database } from '../infrastructure/database'
import { QuizAttempt } from '../infrastructure/entities'
import { restore } from '../quiz/infrastructure/persistence'

export async function progress(ownerId: string) {
  const db = await database()
  const attempts = await db.manager.find(QuizAttempt, {
    where: { ownerId, status: 'completed' },
    order: { finishedAt: 'DESC' },
    select: { state: true },
  })
  const categories: Record<string, { answered: number; correct: number }> = Object.create(null)
  const totals = { answered: 0, correct: 0, training: 0, exam: 0 }
  const mistakes = new Map<string, string>()
  for (const { state: saved } of attempts) {
    const { config, questions } = restore(saved).state
    totals[config.mode] += 1
    for (const question of questions) {
      if (!question.answer) continue
      const category = categories[question.snapshot.categoryId] ??= { answered: 0, correct: 0 }
      category.answered += 1
      totals.answered += 1
      if (question.answer.isCorrect) {
        category.correct += 1
        totals.correct += 1
      } else {
        mistakes.set(question.snapshot.questionId, mistakes.get(question.snapshot.questionId) ?? question.snapshot.text)
      }
    }
  }
  return { ...totals, accuracy: totals.answered ? totals.correct / totals.answered : null, categories, mistakes: [...mistakes.values()] }
}
