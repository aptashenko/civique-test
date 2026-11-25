import { identity, DAY } from '../../modules/identity/identity'
import { MoreThan } from 'typeorm'
import { database } from '../../modules/infrastructure/database'
import { Favorite } from '../../modules/infrastructure/entities'
import { api } from '../../modules/quiz/presentation/http'
import { terms } from '../../modules/vocabulary/terms'

export default api(async event => {
  const owner = await identity(event)
  const favorites = owner ? await (await database()).manager.find(Favorite, {
    where: { ownerId: owner.id, ...(owner.email ? {} : { lastActivityAt: MoreThan(new Date(Date.now() - 90 * DAY)) }) },
    select: { termId: true },
  }) : []
  return terms.map(term => ({ ...term, favorite: favorites.some(item => item.termId === term.id) }))
})
