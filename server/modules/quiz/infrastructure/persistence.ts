import type { EntityManager } from 'typeorm'
import { QuizAttempt, QuizCompleted } from '../../infrastructure/entities'
import { QuizSession } from '../domain/QuizSession'
import type { QuizSessionState } from '../domain/models'

export function restore(state: QuizSessionState) {
  return new QuizSession(state)
}

export function sessionData(state: QuizSessionState) {
  return {
    mode: state.config.mode,
    status: state.status,
    activeKey: state.status === 'in_progress' ? `${state.ownerId}:${state.config.mode}` : null,
    startedAt: new Date(state.startedAt),
    expiresAt: state.expiresAt ? new Date(state.expiresAt) : null,
    finishedAt: state.finishedAt ? new Date(state.finishedAt) : null,
    abandonedAt: state.abandonedAt ? new Date(state.abandonedAt) : null,
    lastActivityAt: new Date(state.lastActivityAt),
    state,
  }
}

export async function saveSession(tx: EntityManager, session: QuizSession) {
  const state = session.state
  await tx.update(QuizAttempt, state.id, sessionData(state))
  if (state.finishedAt) {
    await tx.createQueryBuilder()
      .insert()
      .into(QuizCompleted)
      .values({ attemptId: state.id, completedAt: new Date(state.finishedAt) })
      .orIgnore()
      .execute()
  }
}
