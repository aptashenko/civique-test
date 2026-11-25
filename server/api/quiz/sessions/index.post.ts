import { startSession } from '../../../modules/quiz/features/start-quiz'
import { api, requireOwner, startBody } from '../../../modules/quiz/presentation/http'

export default api(async event => {
  const options = await startBody(event)
  const owner = await requireOwner(event, true)
  return startSession(owner.id, options)
}, true)
