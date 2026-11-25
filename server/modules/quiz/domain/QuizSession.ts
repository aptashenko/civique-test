import type { QuizAction, QuizCompletionReason, QuizConfig, QuizResult } from '../../../../shared/types/quiz'
import { QuizError, type QuestionSnapshot, type QuizSessionState } from './models'

export class QuizSession {
  constructor(readonly state: QuizSessionState) {}

  static start(id: string, ownerId: string, config: QuizConfig, snapshots: QuestionSnapshot[], now: Date, createId: () => string) {
    const startedAt = now.toISOString()

    return new QuizSession({
      id, ownerId, config: { ...config },
      questions: snapshots.map((snapshot, position) => ({
        id: createId(), position, snapshot: structuredClone(snapshot),
        status: 'pending', answer: null, skipCount: 0, timeSpentMs: 0,
      })),
      currentQuestionIndex: 0,
      confirmingFinish: false,
      status: 'in_progress',
      startedAt,
      expiresAt: config.timeLimitMs === null ? null : new Date(now.getTime() + config.timeLimitMs).toISOString(),
      lastActivityAt: startedAt,
      finishedAt: null,
      abandonedAt: null,
      completionReason: null,
      result: null,
      version: 0,
    })
  }

  expire(now: Date): boolean {
    const { status, expiresAt } = this.state
    if (status !== 'in_progress' || expiresAt === null || now.getTime() < Date.parse(expiresAt)) return false

    this.complete(expiresAt, 'timeout')
    return true
  }

  apply(command: QuizAction, now: Date, createId: () => string) {
    const state = this.state
    if (state.status === 'completed') {
      throw new QuizError(state.completionReason === 'timeout' ? 'SESSION_EXPIRED' : 'SESSION_COMPLETED', 409)
    }
    if (state.status !== 'in_progress') throw new QuizError('INVALID_SESSION_STATUS', 409)
    if (state.expiresAt && now.getTime() >= Date.parse(state.expiresAt)) throw new QuizError('SESSION_EXPIRED', 409)

    const timestamp = now.toISOString()
    const current = state.questions[state.currentQuestionIndex]!

    switch (command.action) {
      case 'submit':
      case 'change': {
        const question = state.questions.find(item => item.id === command.sessionQuestionId)
        if (!question) throw new QuizError('QUESTION_NOT_FOUND', 404)
        if (command.action === 'submit' && question.status === 'answered') throw new QuizError('QUESTION_ALREADY_ANSWERED', 409)
        if (command.action === 'change' && (!state.config.allowAnswerChange || question.status !== 'answered')) {
          throw new QuizError('ANSWER_CHANGE_NOT_ALLOWED', 409)
        }
        if (question !== current || state.confirmingFinish) throw new QuizError('QUESTION_NOT_CURRENT', 409)

        const [optionId] = command.selectedOptionIds
        if (command.selectedOptionIds.length === 0) throw new QuizError('EMPTY_ANSWER', 422)
        if (question.snapshot.type !== 'single_select') throw new QuizError('UNSUPPORTED_QUESTION_TYPE', 422)
        if (command.selectedOptionIds.length !== 1) throw new QuizError('INVALID_ANSWER_COUNT', 422)
        if (!optionId || !question.snapshot.options.some(option => option.id === optionId)) {
          throw new QuizError('INVALID_ANSWER_OPTION', 422)
        }
        const isCorrect = question.snapshot.correctOptionIds.includes(optionId)
        const answer = {
          id: question.answer?.id ?? createId(),
          sessionQuestionId: question.id,
          selectedOptionIds: [optionId],
          isCorrect,
          score: Number(isCorrect),
          answeredAt: timestamp,
          difficulty: question.answer?.difficulty ?? null,
        }
        state.questions[question.position] = {
          ...question, status: 'answered', answer,
          timeSpentMs: question.timeSpentMs + (command.timeSpentMs ?? 0),
        }
        this.touch(timestamp)
        return answer
      }
      case 'skip':
        if (!state.config.allowSkip) throw new QuizError('SKIP_NOT_ALLOWED', 409)
        if (!state.questions.some(question => question.id === command.sessionQuestionId)) throw new QuizError('QUESTION_NOT_FOUND', 404)
        if (current.id !== command.sessionQuestionId || state.confirmingFinish) throw new QuizError('QUESTION_NOT_CURRENT', 409)
        if (current.status === 'answered') throw new QuizError('QUESTION_ALREADY_ANSWERED', 409)
        state.questions[current.position] = {
          ...current, status: 'skipped', skipCount: current.skipCount + 1,
          timeSpentMs: current.timeSpentMs + (command.timeSpentMs ?? 0),
        }
        this.navigate(current.position + 1)
        break
      case 'navigate':
        if (!state.config.allowNavigation && command.index !== current.position + 1) {
          throw new QuizError('NAVIGATION_NOT_ALLOWED', 409)
        }
        this.navigate(command.index)
        current.timeSpentMs += command.timeSpentMs ?? 0
        break
      case 'rate': {
        const question = state.questions.find(item => item.id === command.sessionQuestionId)
        if (!question) throw new QuizError('QUESTION_NOT_FOUND', 404)
        if (state.config.mode !== 'training' || !question.answer) throw new QuizError('RATING_NOT_ALLOWED', 409)
        question.answer.difficulty = command.difficulty
        break
      }
      case 'finish':
        if (!state.confirmingFinish) throw new QuizError('FINISH_CONFIRMATION_REQUIRED', 409)
        this.complete(timestamp, 'manual')
        return
      case 'leave':
        if (state.config.mode !== 'training') throw new QuizError('LEAVE_NOT_ALLOWED', 409)
        this.complete(timestamp, 'interrupted')
        return
      case 'abandon':
        state.status = 'abandoned'
        state.abandonedAt = timestamp
        break
    }
    this.touch(timestamp)
  }

  private navigate(index: number) {
    if (!Number.isInteger(index) || index < 0 || index > this.state.questions.length) {
      throw new QuizError('INVALID_QUESTION_INDEX', 422)
    }
    this.state.confirmingFinish = index === this.state.questions.length
    this.state.currentQuestionIndex = Math.min(index, this.state.questions.length - 1)
  }

  private touch(timestamp: string) {
    this.state.lastActivityAt = timestamp
    this.state.version += 1
  }

  private complete(timestamp: string, reason: QuizCompletionReason) {
    const state = this.state
    const result: QuizResult = {
      totalQuestions: state.questions.length,
      answeredCount: 0, correctCount: 0, incorrectCount: 0, skippedCount: 0, unansweredCount: 0,
      score: 0, maxScore: state.questions.length, scorePercent: 0, passed: null,
    }
    for (const question of state.questions) {
      if (question.status === 'answered') {
        result.answeredCount += 1
        result.correctCount += Number(question.answer.isCorrect)
        result.incorrectCount += Number(!question.answer.isCorrect)
        result.score += question.answer.score
      } else if (question.status === 'skipped') {
        result.skippedCount += 1
      } else {
        result.unansweredCount += 1
      }
    }
    result.scorePercent = result.maxScore ? 100 * result.score / result.maxScore : 0
    if (state.config.passingScorePercent !== null) result.passed = result.scorePercent >= state.config.passingScorePercent
    state.result = result
    state.finishedAt = timestamp
    state.completionReason = reason
    state.status = 'completed'
    state.confirmingFinish = false
    this.touch(timestamp)
  }
}
