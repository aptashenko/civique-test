import assert from 'node:assert/strict'
import { test } from 'node:test'
import { civicThemes } from '../shared/civic-themes'
import { summarizeCharacterProgress } from '../server/modules/progress/character-progress'
import { summarizeTraining } from '../server/modules/progress/training-stats'

test('training counts each question once and keeps credit after a later mistake', () => {
  const categoryId = 'republican_values'
  const bank = ['csp-020', 'skipped', 'incorrect'].map(questionId => ({ questionId, categoryId }))
  const response = (questionId: string, isCorrect: boolean | null) => ({
    snapshot: { questionId },
    answer: isCorrect === null ? null : { isCorrect },
  })
  const stats = summarizeTraining(bank, [
    { state: { questions: [response('csp-020', false), response('skipped', null)] } },
    { state: { questions: [response('starter-1', true), response('removed', true)] } },
    { state: { questions: [response('csp-020', false), response('incorrect', false)] } },
  ])

  assert.deepEqual(stats[categoryId], { answered: 2, correct: 1, total: 3 })
})

test('theme levels advance at 30 and 80 percent without rounding up', () => {
  const categoryId = civicThemes[0]
  const thresholds = [[29, 100, 1], [30, 100, 2], [79, 100, 2], [80, 100, 3], [13, 17, 2], [14, 17, 3]]

  for (const [correct, total, level] of thresholds) {
    const progress = summarizeCharacterProgress({ [categoryId]: { answered: correct, correct, total } })
    assert.deepEqual(progress.themes[0], { categoryId, correct, total, level })
  }
})

test('the general level is the lowest level across the five civic themes', () => {
  const allThemesAtLevelThree = Object.fromEntries(civicThemes.map(category => [category, { answered: 8, correct: 8, total: 10 }]))
  const category = civicThemes[4]

  assert.equal(summarizeCharacterProgress(allThemesAtLevelThree).level, 3)
  assert.equal(summarizeCharacterProgress({ ...allThemesAtLevelThree, [category]: { answered: 8, correct: 7, total: 10 } }).level, 2)
  assert.equal(summarizeCharacterProgress({ ...allThemesAtLevelThree, [category]: { answered: 0, correct: 0, total: 0 } }).level, 1)
  assert.deepEqual(summarizeCharacterProgress({}), {
    level: 1,
    themes: civicThemes.map(categoryId => ({ categoryId, correct: 0, total: 0, level: 1 })),
  })
})
