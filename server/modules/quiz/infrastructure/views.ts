import type { Feedback, SessionSummary, SessionView, SubmitAnswerResult } from '../../../../shared/types/quiz'
import type { QuizAnswer, QuizSessionQuestion, QuizSessionState } from '../domain/models'

export function summary(state: QuizSessionState): SessionSummary {
  return {
    id: state.id,
    status: state.status,
    config: state.config,
    startedAt: state.startedAt,
    expiresAt: state.expiresAt,
    finishedAt: state.finishedAt,
    completionReason: state.completionReason,
    result: state.result,
  }
}

function feedback(state: QuizSessionState, question: QuizSessionQuestion, review: boolean): Feedback | undefined {
  if (!review && (state.config.mode === 'exam' || !question.answer)) return
  return {
    isCorrect: question.answer?.isCorrect ?? false,
    score: question.answer?.score ?? 0,
    ...(review || state.config.showCorrectAnswer ? { correctOptionIds: question.snapshot.correctOptionIds } : {}),
    ...(review || state.config.showExplanation ? { explanation: question.snapshot.explanation } : {}),
  }
}

export function sessionView(state: QuizSessionState, now: Date, review = false): SessionView {
  return {
    ...summary(state),
    currentQuestionIndex: state.currentQuestionIndex,
    confirmingFinish: state.confirmingFinish,
    serverTime: now.toISOString(),
    questions: state.questions.map(question => ({
      id: question.id,
      categoryId: question.snapshot.categoryId,
      text: question.snapshot.text,
      sourceType: question.snapshot.sourceType,
      options: question.snapshot.options,
      status: question.status,
      selectedOptionIds: question.answer?.selectedOptionIds ?? [],
      skipCount: question.skipCount,
      timeSpentMs: question.timeSpentMs,
      difficulty: question.answer?.difficulty ?? null,
      ...(state.config.allowTranslation ? {
        translations: Object.fromEntries(Object.entries(question.snapshot.translations).map(([locale, translation]) => [
          locale, {
            text: translation.text,
            options: translation.options,
            ...(question.answer || review ? { explanation: translation.explanation } : {}),
          },
        ])),
      } : {}),
      feedback: feedback(state, question, review),
    })),
  }
}

export function answerView(state: QuizSessionState, answer: QuizAnswer): SubmitAnswerResult {
  const question = state.questions.find(item => item.id === answer.sessionQuestionId)!
  return {
    sessionQuestionId: answer.sessionQuestionId,
    answerId: answer.id,
    status: 'answered',
    answeredAt: answer.answeredAt,
    feedback: feedback(state, question, false),
  }
}
