import { database } from '../modules/infrastructure/database'
import { NewsletterSubscription } from '../modules/infrastructure/entities'
import { QuizError } from '../modules/quiz/domain/models'
import { api, objectBody } from '../modules/quiz/presentation/http'

export default api(async event => {
  if (!useRuntimeConfig(event).public.newsletterPrivacyUrl.trim()) throw new QuizError('NEWSLETTER_UNAVAILABLE', 404)
  const { email: rawEmail, consent, locale } = await objectBody(event)
  if (consent !== true || (locale !== 'fr' && locale !== 'uk' && locale !== 'en')) throw new QuizError('INVALID_REQUEST', 422)

  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
  const [local = '', domain = '', extra] = email.split('@')
  const localPart = /^[a-z0-9!#$%&'*+/=?^`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^`{|}~-]+)*$/i
  const domainLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
  if (email.length > 254 || local.length > 64 || !localPart.test(local) || extra !== undefined
    || !domain.includes('.') || !domain.split('.').every(label => domainLabel.test(label))) {
    throw new QuizError('INVALID_EMAIL', 422)
  }

  await (await database()).manager.createQueryBuilder()
    .insert()
    .into(NewsletterSubscription)
    .values({ email, locale, consentVersion: 1 })
    .orIgnore()
    .execute()

  return { subscribed: true }
}, true)
