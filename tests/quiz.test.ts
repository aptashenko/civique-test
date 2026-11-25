import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { QuizSession } from '../server/modules/quiz/domain/QuizSession'
import type { QuestionSnapshot } from '../server/modules/quiz/domain/models'
import { cspConfig } from '../server/modules/exam/profile'
import { trainingConfig } from '../server/modules/training/profile'
import { sessionView } from '../server/modules/quiz/infrastructure/views'

const now = new Date('2026-01-01T10:00:00.000Z')
const question: QuestionSnapshot = {
  questionId: 'original', version: 1, type: 'single_select', text: 'Original question',
  options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
  correctOptionIds: ['a'], explanation: 'Original explanation',
  categoryId: 'symbols', translations: {}, sourceType: 'training',
}

function start(mode = trainingConfig, count = 2) {
  return QuizSession.start('session', 'guest', { ...mode, questionCount: count }, Array.from({ length: count }, () => question), now, randomUUID)
}

test('skip, revisit, answer and calculate totals for distinct pending and skipped questions', () => {
  const session = start(trainingConfig, 3)
  const item = session.state.questions[0]!
  session.apply({ action: 'skip', sessionQuestionId: item.id }, now, randomUUID)
  session.apply({ action: 'navigate', index: 0 }, now, randomUUID)
  session.apply({ action: 'skip', sessionQuestionId: item.id }, now, randomUUID)
  session.apply({ action: 'navigate', index: 0 }, now, randomUUID)
  session.apply({ action: 'submit', sessionQuestionId: item.id, selectedOptionIds: ['a'] }, now, randomUUID)
  assert.equal(session.state.questions[0]?.skipCount, 2)
  assert.equal(session.state.questions[0]?.status, 'answered')
  session.apply({ action: 'navigate', index: 1 }, now, randomUUID)
  session.apply({ action: 'skip', sessionQuestionId: session.state.questions[1]!.id }, now, randomUUID)
  session.apply({ action: 'navigate', index: 3 }, now, randomUUID)
  session.apply({ action: 'finish' }, now, randomUUID)
  assert.deepEqual(session.state.result, {
    totalQuestions: 3, answeredCount: 1, correctCount: 1, incorrectCount: 0,
    skippedCount: 1, unansweredCount: 1, score: 1, maxScore: 3, scorePercent: 100 / 3, passed: null,
  })
})

test('validation preserves session state and a second submit cannot overwrite an accepted answer', () => {
  const session = start()
  const sessionQuestionId = session.state.questions[0]!.id
  for (const [selectedOptionIds, error] of [
    [[], 'EMPTY_ANSWER'], [['a', 'a'], 'INVALID_ANSWER_COUNT'],
    [['a', 'b'], 'INVALID_ANSWER_COUNT'], [['outside'], 'INVALID_ANSWER_OPTION'],
  ] as const) {
    assert.throws(() => session.apply({ action: 'submit', sessionQuestionId, selectedOptionIds: [...selectedOptionIds] }, now, randomUUID), { message: error })
    assert.equal(session.state.version, 0)
  }
  session.apply({ action: 'submit', sessionQuestionId, selectedOptionIds: ['b'] }, now, randomUUID)
  assert.throws(() => session.apply({ action: 'submit', sessionQuestionId, selectedOptionIds: ['a'] }, now, randomUUID), { message: 'QUESTION_ALREADY_ANSWERED' })
  assert.throws(() => session.apply({ action: 'change', sessionQuestionId, selectedOptionIds: ['a'] }, now, randomUUID), { message: 'ANSWER_CHANGE_NOT_ALLOWED' })
  assert.deepEqual(session.state.questions[0]?.answer?.selectedOptionIds, ['b'])
})

test('leaving a training attempt records a reviewable partial result without manual confirmation', () => {
  const session = start()
  const first = session.state.questions[0]!
  session.apply({ action: 'submit', sessionQuestionId: first.id, selectedOptionIds: ['a'] }, now, randomUUID)
  assert.throws(() => session.apply({ action: 'finish' }, now, randomUUID), { message: 'FINISH_CONFIRMATION_REQUIRED' })
  session.apply({ action: 'leave' }, now, randomUUID)
  assert.equal(session.state.status, 'completed')
  assert.equal(session.state.completionReason, 'interrupted')
  assert.equal(session.state.finishedAt, now.toISOString())
  assert.equal(session.state.result?.answeredCount, 1)
  assert.equal(session.state.result?.unansweredCount, 1)
  assert.equal(session.state.result?.correctCount, 1)
  assert.deepEqual(sessionView(session.state, now, true).questions[0]?.feedback?.correctOptionIds, ['a'])

  const exam = start(cspConfig)
  assert.throws(() => exam.apply({ action: 'leave' }, now, randomUUID), { message: 'LEAVE_NOT_ALLOWED' })
  assert.equal(exam.state.status, 'in_progress')
})

test('CSP answer change is scored at the inclusive threshold and expiry is authoritative', () => {
  const session = start(cspConfig, 40)
  for (let index = 0; index < 32; index += 1) {
    const item = session.state.questions[index]!
    session.apply({ action: 'navigate', index }, now, randomUUID)
    const answer = session.apply({ action: 'submit', sessionQuestionId: item.id, selectedOptionIds: ['b'] }, now, randomUUID)
    const change = session.apply({ action: 'change', sessionQuestionId: item.id, selectedOptionIds: ['a'] }, now, randomUUID)
    assert.equal(answer?.id, change?.id)
  }
  const deadline = new Date(+now + 45 * 60_000)
  assert.throws(() => session.apply({ action: 'navigate', index: 33 }, deadline, randomUUID), { message: 'SESSION_EXPIRED' })
  assert.equal(session.expire(deadline), true)
  assert.equal(session.expire(deadline), false)
  assert.equal(session.state.result?.scorePercent, 80)
  assert.equal(session.state.result?.passed, true)
  assert.equal(session.state.finishedAt, deadline.toISOString())
  assert.equal(session.state.completionReason, 'timeout')
})

test('the snapshot is stable and exam views reveal keys only through the completed review', () => {
  const source = structuredClone(question)
  const session = QuizSession.start('session', 'guest', cspConfig, [source], now, randomUUID)
  source.text = 'Changed'
  source.options.reverse()
  const sessionQuestionId = session.state.questions[0]!.id
  session.apply({ action: 'submit', sessionQuestionId, selectedOptionIds: ['a'] }, now, randomUUID)
  const view = sessionView(session.state, now)
  assert.equal(view.questions[0]?.text, 'Original question')
  assert.equal(view.questions[0]?.options[0]?.id, 'a')
  assert.equal(view.questions[0]?.feedback, undefined)
  session.apply({ action: 'navigate', index: 1 }, now, randomUUID)
  session.apply({ action: 'finish' }, now, randomUUID)
  assert.equal(sessionView(session.state, now).questions[0]?.feedback, undefined)
  assert.deepEqual(sessionView(session.state, now, true).questions[0]?.feedback?.correctOptionIds, ['a'])
})
