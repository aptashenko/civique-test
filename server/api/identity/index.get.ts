import { identity } from '../../modules/identity/identity'
import { api } from '../../modules/quiz/presentation/http'

export default api(async event => ({ email: (await identity(event))?.email ?? null }))
