import { identity } from '../modules/identity/identity'
import { progress } from '../modules/progress/progress'
import { api } from '../modules/quiz/presentation/http'

export default api(async event => {
  const owner = await identity(event)
  return owner ? progress(owner.id) : null
})
