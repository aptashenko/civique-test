import { randomUUID } from 'node:crypto'
import type { QuizMode } from '../../../../shared/types/quiz'
import { IsNull } from 'typeorm'
import { database, lockOwner } from '../../infrastructure/database'
import { Owner, QuizAttempt } from '../../infrastructure/entities'
import { loadBank } from '../../questions/bank'
import { currentQuestionId } from '../../questions/csp-training'
import { shuffled } from '../../questions/shuffle'
import { cspConfig } from '../../exam/profile'
import { examAvailability, selectExamQuestions } from '../../exam/question-selection'
import { trainingConfig, trainingCounts } from '../../training/profile'
import { QuizSession } from '../domain/QuizSession'
import { QuizError } from '../domain/models'
import { restore, saveSession, sessionData } from '../infrastructure/persistence'
import { sessionView } from '../infrastructure/views'

export interface StartOptions {
  mode: QuizMode
  count?: typeof trainingCounts[number]
  category?: string
  acceptAvailable?: boolean
  mistakes?: boolean
}

export async function catalog() {
  const { training, exam } = await loadBank()
  const categories = [...new Set(training.map(question => question.categoryId))].sort()
  return {
    available: training.length,
    categories,
    counts: trainingCounts,
    exam: examAvailability(exam),
  }
}

export async function startSession(ownerId: string, options: StartOptions) {
  const bank = await loadBank()
  return (await database()).transaction(async tx => {
    await lockOwner(tx, ownerId)
    const now = new Date()
    const existing = await tx.findOneBy(QuizAttempt, { activeKey: `${ownerId}:${options.mode}` })
    if (existing) {
      const session = restore(existing.state)
      if (session.expire(now)) await saveSession(tx, session)
      else if (options.mode === 'training' && existing.lastActivityAt.getTime() <= +now - 30 * 86_400_000
        && await tx.existsBy(Owner, { id: ownerId, email: IsNull() })) {
        await tx.delete(QuizAttempt, existing.id)
      } else {
        throw new QuizError('ACTIVE_SESSION_EXISTS', 409, { sessionId: existing.id })
      }
    }

    const config = { ...(options.mode === 'exam' ? cspConfig : trainingConfig) }
    let questions
    if (options.mode === 'exam') {
      questions = selectExamQuestions(bank.exam)
    } else {
      questions = bank.training.filter(question => !options.category || question.categoryId === options.category)
      if (options.mistakes) {
        const completed = await tx.find(QuizAttempt, { where: { ownerId, status: 'completed' }, select: { state: true } })
        const mistakes = new Set(completed.flatMap(record => restore(record.state).state.questions
          .filter(question => question.answer && !question.answer.isCorrect)
          .map(question => currentQuestionId(question.snapshot.questionId))))
        questions = questions.filter(question => mistakes.has(question.questionId))
      }
      if (questions.length === 0) throw new QuizError('QUESTION_BANK_EMPTY', 422)
      const count = options.count ?? trainingConfig.questionCount
      if (count !== 'all' && count > questions.length && !options.acceptAvailable && !options.mistakes) {
        throw new QuizError('INSUFFICIENT_QUESTIONS', 422, { available: questions.length })
      }
      config.questionCount = count === 'all' ? questions.length : Math.min(count, questions.length)
    }

    const ordered = config.shuffleQuestions ? shuffled(questions) : questions
    const snapshots = ordered.slice(0, config.questionCount).map(question => ({
      ...question, options: config.shuffleAnswers ? shuffled(question.options) : question.options,
    }))
    const session = QuizSession.start(randomUUID(), ownerId, config, snapshots, now, randomUUID)
    await tx.insert(QuizAttempt, { id: session.state.id, ownerId, ...sessionData(session.state) })
    return sessionView(session.state, now)
  })
}
