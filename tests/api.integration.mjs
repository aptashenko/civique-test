import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { In } from 'typeorm'
import { createDataSource } from '../server/modules/infrastructure/data-source.ts'
import { BankQuestion, NewsletterSubscription, Owner, QuizAttempt, QuizCompleted } from '../server/modules/infrastructure/entities.ts'

const base = process.env.CIVIQUE_TEST_URL
const database = process.env.CIVIQUE_TEST_DATABASE_URL
if (!base || !database) throw new Error('Set CIVIQUE_TEST_URL and CIVIQUE_TEST_DATABASE_URL to an isolated test deployment')

const db = await createDataSource(database).initialize()
const fixture = randomUUID()
const email = `test-${fixture}@example.test`
const testNewsletter = process.env.CIVIQUE_TEST_NEWSLETTER === '1'
const password = 'integration-test-password'
const ownerIds = new Set()
const bankIds = []

function client() {
  let cookie = ''
  return async (path, method = 'GET', body) => {
    const response = await fetch(new URL(path, base), {
      method,
      headers: { ...(cookie ? { cookie } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    const updatedCookie = response.headers.get('set-cookie')
    if (updatedCookie) cookie = updatedCookie.split(';')[0]
    return { status: response.status, body: await response.json() }
  }
}

function success(result) {
  assert.equal(result.status, 200, JSON.stringify(result.body))
  return result.body
}

function failure(result, status, code) {
  assert.equal(result.status, status, JSON.stringify(result.body))
  assert.equal(result.body.data?.code, code)
}

try {
  const anonymous = client()
  const subscribe = (fields = {}) => anonymous('/api/newsletter', 'POST', { email, consent: true, locale: 'uk', ...fields })
  if (testNewsletter) {
    failure(await subscribe({ consent: false }), 422, 'INVALID_REQUEST')
    failure(await subscribe({ email: 'invalid@example..test' }), 422, 'INVALID_EMAIL')
    assert.equal(await db.manager.countBy(NewsletterSubscription, { email }), 0)
    const duplicate = await Promise.all([subscribe(), subscribe({ email: ` ${email.toUpperCase()} ` })])
    for (const result of duplicate) assert.deepEqual(success(result), { subscribed: true })
    assert.equal(await db.manager.countBy(NewsletterSubscription, { email }), 1)
    const subscription = await db.manager.findOneByOrFail(NewsletterSubscription, { email })
    assert.equal(subscription.locale, 'uk')
    assert.equal(subscription.consentVersion, 1)
    assert.ok(subscription.consentedAt instanceof Date)
    console.log('Anonymous newsletter consent, validation and deduplication passed.')
  }
  for (const file of ['/questions/answer-key.json', '/questions/csp-all.json', '/csp-situations-100.json']) {
    const response = await fetch(new URL(file, base))
    assert.equal(response.status, 404)
  }
  const guest = client()
  const coverage = async () => success(await guest('/api/progress/training'))
  const blankCoverage = await coverage()
  assert.equal(Object.values(blankCoverage).length, 5)
  assert.equal(Object.values(blankCoverage).reduce((total, topic) => total + topic.total, 0), 190)
  assert.ok(Object.values(blankCoverage).every(topic => topic.answered === 0))
  const started = success(await guest('/api/quiz/sessions', 'POST', { mode: 'training', count: 5, category: 'republican_values' }))
  assert.equal(started.questions.length, 5)
  assert.ok(started.questions.every(question => question.categoryId === 'republican_values' && question.feedback === undefined))
  const record = await db.manager.findOneByOrFail(QuizAttempt, { id: started.id })
  ownerIds.add(record.ownerId)
  assert.equal(record.startedAt.toISOString(), started.startedAt)
  const training = `/api/quiz/sessions/${started.id}`
  const other = client()
  failure(await other(training), 403, 'ACCESS_DENIED')
  failure(await guest('/api/quiz/sessions', 'POST', { mode: 'training', count: 'all' }), 409, 'ACTIVE_SESSION_EXISTS')
  const question = started.questions[0]
  const send = (url, data, method = 'POST') => guest(url, method, { requestId: randomUUID(), ...data })
  success(await send(`${training}/skip`, { sessionQuestionId: question.id }))
  let resumed = success(await guest(training))
  assert.equal(resumed.questions[0].skipCount, 1)
  success(await send(`${training}/navigate`, { index: 0 }))
  const answer = { sessionQuestionId: question.id, selectedOptionIds: [question.options[0].id], requestId: randomUUID() }
  const competing = { ...answer, requestId: randomUUID() }
  const calls = await Promise.all([answer, competing].map(command => guest(`${training}/answers`, 'POST', command)))
  assert.deepEqual(calls.map(value => value.status).sort(), [200, 409])
  const winner = calls[0].status === 200 ? answer : competing
  const accepted = success(calls.find(value => value.status === 200))
  const replay = await guest(`${training}/answers`, 'POST', winner)
  assert.equal(accepted.session.questions[0].skipCount, 1)
  assert.ok('isCorrect' in accepted.answer.feedback)
  assert.deepEqual(success(replay), accepted)
  failure(await guest(`${training}/answers`, 'POST', {
    ...winner, selectedOptionIds: [question.options[1].id],
  }), 409, 'IDEMPOTENCY_CONFLICT')
  assert.deepEqual(await coverage(), blankCoverage)
  success(await send(`${training}/navigate`, { index: started.questions.length }))
  assert.equal(success(await send(`${training}/finish`, {})).session.completionReason, 'manual')
  assert.ok(success(await guest(`${training}/review`)).questions[0].feedback.correctOptionIds.length)
  assert.equal(success(await guest('/api/progress')).training, 1)
  assert.equal((await coverage()).republican_values.answered, 1)

  const interrupted = success(await guest('/api/quiz/sessions', 'POST', { mode: 'training', count: 'all', category: 'republican_values' }))
  const interruptedPath = `/api/quiz/sessions/${interrupted.id}`
  const interruptedRecord = await db.manager.findOneByOrFail(QuizAttempt, { id: interrupted.id })
  const repeatIndex = interruptedRecord.state.questions.findIndex(item =>
    item.snapshot.questionId === record.state.questions[0].snapshot.questionId,
  )
  assert.ok(repeatIndex >= 0)
  const anotherIndex = repeatIndex === 0 ? 1 : 0
  for (const index of [repeatIndex, anotherIndex]) {
    const item = interrupted.questions[index]
    success(await send(`${interruptedPath}/navigate`, { index }))
    success(await send(`${interruptedPath}/answers`, { sessionQuestionId: item.id, selectedOptionIds: [item.options[0].id] }))
  }
  assert.equal(success(await send(`${interruptedPath}/leave`, {})).session.completionReason, 'interrupted')
  assert.equal(success(await guest(`${interruptedPath}/review`)).result.totalQuestions, interrupted.questions.length)
  assert.equal(success(await guest('/api/quiz/sessions')).find(item => item.id === interrupted.id).completionReason, 'interrupted')
  const trainingCoverage = await coverage()
  assert.deepEqual(trainingCoverage, { ...blankCoverage, republican_values: { ...blankCoverage.republican_values, answered: 2 } })

  assert.equal(success(await guest('/api/vocabulary/devise', 'PUT', { favorite: true })).favorite, true)
  assert.equal(success(await guest('/api/vocabulary')).find(term => term.id === 'devise').favorite, true)
  success(await guest('/api/identity', 'POST', { action: 'register', email, password }))
  const newDevice = client()
  success(await newDevice('/api/identity', 'POST', { action: 'login', email, password }))
  assert.equal(success(await newDevice(training)).id, started.id)
  assert.equal(success(await newDevice('/api/vocabulary')).find(term => term.id === 'devise').favorite, true)
  console.log('Training, concurrent answer, replay, review and cross-device login passed.')

  const bundled = success(await guest('/api/quiz/catalog'))
  assert.equal(bundled.available, 190)
  assert.deepEqual(bundled.exam, { knowledge: 42, situations: 16, ready: true, missing: [] })
  bankIds.push('csp-029', 'csp-031', 'csp-032')
  await db.manager.insert(BankQuestion, bankIds.map(id => ({ id, version: 2, active: false, data: {} })))
  const shortage = success(await guest('/api/quiz/catalog')).exam
  assert.ok(shortage.knowledge >= 28 && shortage.situations >= 12)
  assert.equal(shortage.ready, false)
  assert.deepEqual(shortage.missing, [{
    categoryId: 'republican_values', notionId: 'secularism', sourceType: 'official_knowledge', required: 2, available: 0,
  }])
  const rejected = await guest('/api/quiz/sessions', 'POST', { mode: 'exam' })
  failure(rejected, 422, 'INSUFFICIENT_QUESTIONS')
  assert.deepEqual(rejected.body.data.details, shortage)
  await db.manager.delete(BankQuestion, { id: In(bankIds) })
  bankIds.length = 0
  assert.equal(success(await guest('/api/quiz/catalog')).exam.ready, true)
  const exam = success(await guest('/api/quiz/sessions', 'POST', { mode: 'exam' }))
  const path = `/api/quiz/sessions/${exam.id}`
  assert.equal(exam.questions.length, 40)
  assert.equal(exam.questions.filter(item => item.sourceType === 'official_knowledge').length, 28)
  assert.equal(Date.parse(exam.expiresAt) - Date.parse(exam.startedAt), 2_700_000)
  failure(await guest(`${path}/review`), 409, 'REVIEW_NOT_AVAILABLE')
  const first = exam.questions[0]
  const startedExam = await db.manager.findOneByOrFail(QuizAttempt, { id: exam.id })
  const [correctId] = startedExam.state.questions[0].snapshot.correctOptionIds
  const wrongId = first.options.find(option => option.id !== correctId).id
  const initial = success(await send(`${path}/answers`, { sessionQuestionId: first.id, selectedOptionIds: [wrongId] }))
  assert.equal(initial.answer.feedback, undefined)
  assert.equal(initial.session.questions[0].feedback, undefined)
  const changed = success(await send(`${path}/answers/${first.id}`, { selectedOptionIds: [correctId] }, 'PATCH'))
  assert.equal(changed.answer.answerId, initial.answer.answerId)
  assert.equal(changed.answer.feedback, undefined)
  const current = await db.manager.findOneByOrFail(QuizAttempt, { id: exam.id })
  assert.equal(current.expiresAt.toISOString(), exam.expiresAt)
  const expiresAt = new Date(Date.now() - 1000)
  await db.manager.update(QuizAttempt, exam.id, {
    expiresAt,
    state: { ...current.state, expiresAt: expiresAt.toISOString() },
  })
  failure(await send(`${path}/answers/${first.id}`, { selectedOptionIds: [wrongId] }, 'PATCH'), 409, 'SESSION_EXPIRED')
  resumed = success(await guest(path))
  assert.equal(resumed.status, 'completed')
  assert.equal(resumed.completionReason, 'timeout')
  assert.equal(resumed.result.correctCount, 1)
  assert.equal(resumed.questions[0].feedback, undefined)
  const review = success(await guest(`${path}/review`))
  assert.deepEqual(review.questions[0].feedback.correctOptionIds, [correctId])
  assert.equal(await db.manager.countBy(QuizCompleted, { attemptId: exam.id }), 1)
  assert.deepEqual(await coverage(), trainingCoverage)
  console.log('Exam quotas, hidden answer keys, change, timeout and review passed.')
} finally {
  if (testNewsletter) await db.manager.delete(NewsletterSubscription, { email })
  if (ownerIds.size) await db.manager.delete(Owner, { id: In([...ownerIds]) })
  if (bankIds.length) await db.manager.delete(BankQuestion, { id: In(bankIds) })
  await db.destroy()
}
