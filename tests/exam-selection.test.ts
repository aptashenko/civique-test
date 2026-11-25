import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cspConfig } from '../server/modules/exam/profile'
import { examQuotaFor } from '../server/modules/exam/csp-quotas'
import { examAvailability, selectExamQuestions } from '../server/modules/exam/question-selection'
import { cspExamQuestions } from '../server/modules/questions/csp-exam'
import { makeExamBank } from './exam-bank'

test('the bundled exam is ready without imports and every eligible question has an explanation', () => {
  assert.deepEqual(examAvailability(cspExamQuestions), { knowledge: 42, situations: 16, ready: true, missing: [] })
  assert.equal(cspExamQuestions.length, 58)
  assert.ok(cspExamQuestions.every(question => question.explanation?.trim()))
  assert.equal(selectExamQuestions(cspExamQuestions).length, 40)
})

test('CSP samples the official distribution by notion and source', () => {
  const bank = makeExamBank('test', 2)
  const selected = selectExamQuestions(bank)
  assert.equal(cspConfig.questionCount, 40)
  assert.equal(selected.length, 40)
  assert.equal(new Set(selected.map(question => question.questionId)).size, 40)
  assert.equal(selected.filter(question => question.sourceType === 'official_knowledge').length, 28)
  const counts = Object.fromEntries(selected.map(question => [question.notionId ?? question.categoryId, 0]))
  for (const question of selected) counts[question.notionId ?? question.categoryId]! += 1
  assert.deepEqual(counts, {
    motto_and_symbols: 3, secularism: 2, republican_values: 6,
    democracy_and_voting: 3, french_republic: 2, european_institutions: 1,
    fundamental_rights: 2, resident_duties: 3, rights_and_duties: 6,
    history_periods_and_figures: 3, territories_and_geography: 3, french_heritage: 2,
    settlement_and_residence: 1, healthcare_access: 1, working_in_france: 1,
    parental_authority_and_education: 1,
  })
})

test('a surplus in other notions cannot fill a missing notion', () => {
  const bank = makeExamBank('test', 2).filter(question => question.notionId !== 'secularism')
  const availability = examAvailability(bank)
  assert.ok(availability.knowledge >= 28 && availability.situations >= 12)
  assert.equal(availability.ready, false)
  assert.deepEqual(availability.missing.map(({ notionId, required, available }) => [notionId, required, available]), [
    ['secularism', 2, 0],
  ])
  assert.throws(() => selectExamQuestions(bank), { message: 'INSUFFICIENT_QUESTIONS', details: availability })
})

test('a quota only counts playable, classified, distinct questions', () => {
  const bank = makeExamBank()
  const question = bank.find(item => item.notionId === 'secularism')!
  const remaining = bank.filter(item => item !== question)
  const other = remaining.find(item => item.notionId === 'secularism')!
  const duplicate = { ...question, text: other.text.toUpperCase().replaceAll(' ', ' ! ') }
  const availability = examAvailability([
    ...remaining,
    duplicate,
    { ...question, questionId: 'invalid-options', correctOptionIds: ['outside'] },
    { ...question, questionId: 'unclassified', notionId: undefined },
    { ...question, questionId: 'unverified', sourceType: 'training' },
  ])
  assert.deepEqual(availability.missing, [{ ...examQuotaFor(question), available: 1 }])
})
