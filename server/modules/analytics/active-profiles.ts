import { database } from '../infrastructure/database'
import { QuizAttempt } from '../infrastructure/entities'

const dayMs = 86_400_000

export async function activeProfiles(now = new Date()) {
  const db = await database()
  const from = (days: number) => new Date(now.getTime() - days * dayMs).toISOString()
  const latestAnswers = db.createQueryBuilder(QuizAttempt, 'attempt')
    .innerJoin('attempt.owner', 'owner')
    .select('owner.email IS NOT NULL', 'registered')
    .addSelect(`MAX((
      SELECT MAX((question #>> '{answer,answeredAt}')::timestamptz)
      FROM jsonb_array_elements(attempt.state -> 'questions') AS questions(question)
      WHERE (question #>> '{answer,answeredAt}')::timestamptz <= :now
    ))`, 'latest_answer_at')
    .groupBy('owner.id')

  const counts = await db.createQueryBuilder()
    .select('COUNT(*) FILTER (WHERE profile.registered AND profile.latest_answer_at >= :from7)', 'registered7')
    .addSelect('COUNT(*) FILTER (WHERE NOT profile.registered AND profile.latest_answer_at >= :from7)', 'guests7')
    .addSelect('COUNT(*) FILTER (WHERE profile.registered)', 'registered30')
    .addSelect('COUNT(*) FILTER (WHERE NOT profile.registered)', 'guests30')
    .from(`(${latestAnswers.getQuery()})`, 'profile')
    .where('profile.latest_answer_at >= :from30')
    .setParameters({ now: now.toISOString(), from7: from(7), from30: from(30) })
    .getRawOne<{ registered7: string; guests7: string; registered30: string; guests30: string }>()

  if (!counts) throw new Error('Active profile counts query returned no row')

  return {
    last7Days: { registered: Number(counts.registered7), guests: Number(counts.guests7) },
    last30Days: { registered: Number(counts.registered30), guests: Number(counts.guests30) },
  }
}
