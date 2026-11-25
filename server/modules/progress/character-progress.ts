import { civicThemes } from '../../../shared/civic-themes'
import type { TrainingStats } from './training-stats'

type CharacterLevel = 1 | 2 | 3

function themeLevel(correct: number, total: number): CharacterLevel {
  if (total === 0) return 1
  if (correct * 100 >= total * 80) return 3
  return correct * 100 >= total * 30 ? 2 : 1
}

export function summarizeCharacterProgress(categories: Partial<Record<string, TrainingStats>>) {
  const themes = civicThemes.map(categoryId => {
    const { correct = 0, total = 0 } = categories[categoryId] ?? {}
    return { categoryId, correct, total, level: themeLevel(correct, total) }
  })
  const level = themes.reduce<CharacterLevel>((lowest, theme) => theme.level < lowest ? theme.level : lowest, 3)

  return { level, themes }
}
