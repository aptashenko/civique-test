import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cspTrainingQuestions, currentQuestionId } from '../server/modules/questions/csp-training'

test('the CSP bank provides distinct training questions with one valid answer', () => {
  assert.equal(cspTrainingQuestions.length, 190)
  assert.equal(new Set(cspTrainingQuestions.map(question => question.questionId)).size, 190)
  assert.equal(new Set(cspTrainingQuestions.map(question => question.categoryId)).size, 5)
  for (const question of cspTrainingQuestions) {
    assert.equal(question.sourceType, 'training')
    assert.equal(question.options.length, 4)
    assert.equal(new Set(question.options.map(option => option.id)).size, 4)
    assert.equal(question.correctOptionIds.length, 1)
    assert.ok(question.options.some(option => option.id === question.correctOptionIds[0]))
  }
})

test('the corrected employment answer and former question identifiers resolve to the current bank', () => {
  const corrected = cspTrainingQuestions.find(question => question.questionId === 'csp-006')!
  const answer = corrected.options.find(option => option.id === corrected.correctOptionIds[0])
  assert.equal(answer?.text, 'Oui, certains')
  for (const id of ['starter-1', 'starter-2', 'starter-3', 'csp-189']) {
    assert.ok(cspTrainingQuestions.some(question => question.questionId === currentQuestionId(id)))
  }
})
