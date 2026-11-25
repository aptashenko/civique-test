import { randomUUID } from 'node:crypto'
import type { ActionResult, QuizAction } from '../../../../shared/types/quiz'
import { database } from '../../infrastructure/database'
import { QuizRequest } from '../../infrastructure/entities'
import { QuizError } from '../domain/models'
import { saveSession } from '../infrastructure/persistence'
import { answerView, sessionView } from '../infrastructure/views'
import { loadOwned } from './load-owned-session'

export async function mutateSession(ownerId: string, id: string, requestId: string, action: QuizAction): Promise<ActionResult> {
  const outcome = await (await database()).transaction(async tx => {
    const { session, now } = await loadOwned(tx, ownerId, id)
    const key = { attemptId: id, requestId }
    const payload = JSON.stringify(action)
    const previous = await tx.findOneBy(QuizRequest, key)
    if (previous && previous.expiresAt > now) {
      if (previous.payload !== payload) return { error: new QuizError('IDEMPOTENCY_CONFLICT', 409) }
      return { result: previous.response }
    }
    try {
      const answer = session.apply(action, now, randomUUID)
      await saveSession(tx, session)
      const result: ActionResult = {
        session: sessionView(session.state, now),
        ...(answer ? { answer: answerView(session.state, answer) } : {}),
      }
      await tx.upsert(QuizRequest, { ...key, payload, response: result, expiresAt: new Date(+now + 86_400_000) }, ['attemptId', 'requestId'])
      return { result }
    } catch (error) {
      if (error instanceof QuizError) return { error }
      throw error
    }
  })
  if (outcome.error) throw outcome.error
  return outcome.result
}
