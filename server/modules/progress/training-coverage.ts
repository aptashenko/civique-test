import { database } from '../infrastructure/database'
import { QuizAttempt } from '../infrastructure/entities'
import { loadBank } from '../questions/bank'
import { summarizeCharacterProgress } from './character-progress'
import { summarizeTraining } from './training-stats'

async function trainingStats(ownerId?: string) {
  const db = await database()
  const [{ training }, attempts] = await Promise.all([
    loadBank(),
    ownerId ? db.manager.find(QuizAttempt, {
      where: { ownerId, mode: 'training', status: 'completed' },
      select: { state: true },
    }) : [],
  ])

  return summarizeTraining(training, attempts)
}

export async function trainingCoverage(ownerId?: string) {
  const stats = await trainingStats(ownerId)
  return Object.fromEntries(Object.entries(stats).map(([category, { answered, total }]) => [category, { answered, total }]))
}

export async function characterProgress(ownerId?: string) {
  return summarizeCharacterProgress(await trainingStats(ownerId))
}
