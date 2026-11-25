import { getRouterParam } from 'h3'
import { database, lockOwner } from '../../modules/infrastructure/database'
import { Favorite } from '../../modules/infrastructure/entities'
import { QuizError } from '../../modules/quiz/domain/models'
import { api, objectBody, requireOwner } from '../../modules/quiz/presentation/http'
import { terms } from '../../modules/vocabulary/terms'

export default api(async event => {
  const termId = getRouterParam(event, 'id')
  const { favorite } = await objectBody(event)
  if (typeof favorite !== 'boolean' || !termId || !terms.some(term => term.id === termId)) {
    throw new QuizError('INVALID_REQUEST', 422)
  }
  const owner = await requireOwner(event, true)
  const db = await database()
  await db.transaction(async tx => {
    await lockOwner(tx, owner.id)
    const key = { ownerId: owner.id, termId }
    if (favorite) {
      await tx.upsert(Favorite, { ...key, lastActivityAt: new Date() }, ['ownerId', 'termId'])
    } else {
      await tx.delete(Favorite, key)
    }
  })
  return { favorite }
}, true)
