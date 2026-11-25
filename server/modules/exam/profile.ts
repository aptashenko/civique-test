import type { QuizConfig } from '../../../shared/types/quiz'
import { cspQuotas } from './csp-quotas'

export const cspConfig: QuizConfig = {
  mode: 'exam',
  profile: 'CSP',
  questionCount: cspQuotas.reduce((total, quota) => total + quota.required, 0),
  timeLimitMs: 45 * 60_000,
  passingScorePercent: 80,
  shuffleQuestions: true,
  shuffleAnswers: true,
  showExplanation: false,
  showCorrectAnswer: false,
  allowNavigation: true,
  allowSkip: true,
  allowTranslation: false,
  allowAnswerChange: true,
}
