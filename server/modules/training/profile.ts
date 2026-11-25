import type { QuizConfig } from '../../../shared/types/quiz'

export const trainingCounts = [5, 10, 20, 40, 'all'] as const

export const trainingConfig: QuizConfig = {
  mode: 'training',
  questionCount: 10,
  timeLimitMs: null,
  passingScorePercent: null,
  shuffleQuestions: true,
  shuffleAnswers: true,
  showExplanation: true,
  showCorrectAnswer: true,
  allowNavigation: true,
  allowSkip: true,
  allowTranslation: true,
  allowAnswerChange: false,
}
