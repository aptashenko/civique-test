import type { EntityManager } from 'typeorm'
import { lockOwner } from '../../infrastructure/database'
import { QuizAttempt } from '../../infrastructure/entities'
import { QuizError } from '../domain/models'
import { restore, saveSession } from '../infrastructure/persistence'

export async function loadOwned(tx: EntityManager, ownerId: string, id: string) {
  await lockOwner(tx, ownerId)
  const record = await tx.findOne(QuizAttempt, { where: { id }, relations: { owner: true } })
  if (!record) throw new QuizError('SESSION_NOT_FOUND', 404)
  if (record.ownerId !== ownerId) throw new QuizError('ACCESS_DENIED', 403)
  const now = new Date()
  if (!record.owner.email && record.mode === 'training' && record.status === 'in_progress'
    && record.lastActivityAt.getTime() <= +now - 30 * 86_400_000) {
    throw new QuizError('SESSION_NOT_FOUND', 404)
  }
  const session = restore(record.state)
  if (session.expire(now)) await saveSession(tx, session)
  return { session, now }
}
