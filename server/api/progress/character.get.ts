import { identity } from '../../modules/identity/identity'
import { characterProgress } from '../../modules/progress/training-coverage'
import { api } from '../../modules/quiz/presentation/http'

export default api(async event => {
  const owner = await identity(event)
  return characterProgress(owner?.id)
})
