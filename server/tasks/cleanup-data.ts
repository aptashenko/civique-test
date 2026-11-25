import { IsNull, LessThanOrEqual, Not } from 'typeorm'
import { database } from '../modules/infrastructure/database'
import { Favorite, Identity, Owner, QuizAttempt, QuizRequest } from '../modules/infrastructure/entities'
import { DAY } from '../modules/identity/identity'
import { finalizeExpiredExams } from '../modules/quiz/features/finalize-expired-exams'

export default defineTask({
  meta: { name: 'cleanup-data', description: 'Delete expired guest records and inactive accounts' },
  async run() {
    const finalized = await finalizeExpiredExams()
    const timestamp = Date.now()
    const cutoff = (days: number) => new Date(timestamp - days * DAY)
    const db = await database()
    const deleted = await db.transaction(async tx => {
      const guests = tx.createQueryBuilder(Owner, 'guest').select('guest.id').where('guest.email IS NULL')
      const guestScope = `"ownerId" IN (${guests.getQuery()})`
      const attempts = await tx.createQueryBuilder().delete().from(QuizAttempt)
        .where(guestScope)
        .andWhere(`(
          ("mode" = 'training' AND "status" = 'in_progress' AND "lastActivityAt" <= :trainingCutoff)
          OR ("status" = 'abandoned' AND "abandonedAt" <= :abandonedCutoff)
          OR ("status" = 'completed' AND "finishedAt" <= :completedCutoff)
        )`, { trainingCutoff: cutoff(30), abandonedCutoff: cutoff(7), completedCutoff: cutoff(90) })
        .execute()
      const requests = await tx.delete(QuizRequest, { expiresAt: LessThanOrEqual(cutoff(0)) })
      const favorites = await tx.createQueryBuilder().delete().from(Favorite)
        .where(guestScope)
        .andWhere('"lastActivityAt" <= :expiry', { expiry: cutoff(90) })
        .execute()
      const identities = await tx.delete(Identity, { expiresAt: LessThanOrEqual(cutoff(0)) })
      const guestsDeleted = await tx.delete(Owner, { email: IsNull(), expiresAt: LessThanOrEqual(cutoff(0)) })
      const users = await tx.delete(Owner, { email: Not(IsNull()), lastActivityAt: LessThanOrEqual(cutoff(730)) })
      return [attempts, requests, favorites, identities, guestsDeleted, users]
        .reduce((total, result) => total + (result.affected ?? 0), 0)
    })
    return { result: { finalized, deleted } }
  },
})
