import { identity } from '../../../modules/identity/identity'
import { listSessions } from '../../../modules/quiz/features/session-queries'
import { api } from '../../../modules/quiz/presentation/http'

export default api(async event => {
  const owner = await identity(event)
  return owner ? listSessions(owner.id) : []
})
