import { clearIdentity, registerOrLogin } from '../../modules/identity/identity'
import { QuizError } from '../../modules/quiz/domain/models'
import { api, objectBody } from '../../modules/quiz/presentation/http'

export default api(async event => {
  const { action, email, password } = await objectBody(event)
  if (action === 'logout' || action === 'delete' || action === 'history') {
    await clearIdentity(event, action)
    return { ok: true }
  }
  if ((action !== 'register' && action !== 'login') || typeof email !== 'string' || email.length > 254
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string'
    || password.length < 12 || password.length > 128) throw new QuizError('INVALID_CREDENTIALS', 422)
  return registerOrLogin(event, action, email.trim().toLowerCase(), password)
}, true)
