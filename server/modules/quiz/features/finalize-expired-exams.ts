import { LessThanOrEqual } from 'typeorm'
import { database, lockOwner } from '../../infrastructure/database'
import { QuizAttempt } from '../../infrastructure/entities'
import { restore, saveSession } from '../infrastructure/persistence'

export async function finalizeExpiredExams(ownerId?: string) {
  const db = await database()
  const due = await db.manager.find(QuizAttempt, {
    where: { ...(ownerId === undefined ? {} : { ownerId }), status: 'in_progress', mode: 'exam', expiresAt: LessThanOrEqual(new Date()) },
    select: { id: true, ownerId: true },
  })
  let count = 0
  for (const item of due) {
    await db.transaction(async tx => {
      await lockOwner(tx, item.ownerId)
      const current = await tx.findOneBy(QuizAttempt, { id: item.id })
      if (!current) return
      const session = restore(current.state)
      if (session.expire(new Date())) {
        await saveSession(tx, session)
        count += 1
      }
    })
  }
  return count
}
