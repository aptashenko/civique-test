import { database } from '../infrastructure/database'
import { QuizAttempt } from '../infrastructure/entities'

export async function sessionsStartedToday(now = new Date()) {
  const db = await database()
  const parisMidnight = "date_trunc('day', CAST(:now AS timestamptz) AT TIME ZONE 'Europe/Paris')"
  // Convert each local midnight to the UTC timestamp format used by startedAt.
  const startOfDay = `(${parisMidnight} AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC'`
  const endOfDay = `((${parisMidnight} + INTERVAL '1 day') AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC'`

  const counts = await db.createQueryBuilder(QuizAttempt, 'attempt')
    .select("COUNT(*) FILTER (WHERE attempt.mode = 'training')", 'training')
    .addSelect("COUNT(*) FILTER (WHERE attempt.mode = 'exam')", 'exam')
    .where(`attempt.startedAt >= (${startOfDay})`)
    .andWhere(`attempt.startedAt < (${endOfDay})`)
    .setParameter('now', now.toISOString())
    .getRawOne<{ training: string; exam: string }>()

  if (!counts) throw new Error('Started session counts query returned no row')

  const training = Number(counts.training)
  const exam = Number(counts.exam)
  return { total: training + exam, training, exam }
}
