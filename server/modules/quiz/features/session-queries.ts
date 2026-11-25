import { IsNull, MoreThan, Not } from 'typeorm'
import { database } from '../../infrastructure/database'
import { QuizAttempt } from '../../infrastructure/entities'
import { QuizError } from '../domain/models'
import { restore, saveSession } from '../infrastructure/persistence'
import { sessionView, summary } from '../infrastructure/views'
import { finalizeExpiredExams } from './finalize-expired-exams'
import { loadOwned } from './load-owned-session'

export async function readSession(ownerId: string, id: string, review = false) {
  const view = await (await database()).transaction(async tx => {
    const { session, now } = await loadOwned(tx, ownerId, id)
    if (review && session.state.status !== 'completed') return null
    if (!review && session.state.status === 'in_progress' && session.state.config.mode === 'training') {
      session.state.lastActivityAt = now.toISOString()
      await saveSession(tx, session)
    }
    return sessionView(session.state, now, review)
  })
  if (!view) throw new QuizError('REVIEW_NOT_AVAILABLE', 409)
  return view
}

export async function listSessions(ownerId: string) {
  await finalizeExpiredExams(ownerId)
  const db = await database()
  const sessions = await db.manager.find(QuizAttempt, {
    where: [
      { ownerId, status: 'completed' },
      { ownerId, status: 'in_progress', mode: 'exam' },
      { ownerId, status: 'in_progress', mode: 'training', owner: { email: Not(IsNull()) } },
      { ownerId, status: 'in_progress', mode: 'training', lastActivityAt: MoreThan(new Date(Date.now() - 30 * 86_400_000)) },
    ],
    order: { startedAt: 'DESC' },
    select: { state: true },
  })
  return sessions.map(record => summary(restore(record.state).state))
}
