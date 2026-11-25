export type QuizMode = 'training' | 'exam'
export type QuizStatus = 'in_progress' | 'completed' | 'abandoned'
export type QuizCompletionReason = 'manual' | 'timeout' | 'interrupted'
export type QuestionStatus = 'pending' | 'skipped' | 'answered'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Language = 'uk' | 'ru' | 'en'

export interface QuizConfig {
  mode: QuizMode
  questionCount: number
  timeLimitMs: number | null
  passingScorePercent: number | null
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  showExplanation: boolean
  showCorrectAnswer: boolean
  allowNavigation: boolean
  allowSkip: boolean
  allowTranslation: boolean
  allowAnswerChange: boolean
  profile?: 'CSP'
}

export interface AnswerOption {
  id: string
  text: string
}

export interface QuizResult {
  totalQuestions: number
  answeredCount: number
  correctCount: number
  incorrectCount: number
  skippedCount: number
  unansweredCount: number
  score: number
  maxScore: number
  scorePercent: number
  passed: boolean | null
}

export interface Translation {
  text: string
  options: Record<string, string>
  explanation?: string
}

export interface Feedback {
  isCorrect: boolean
  score: number
  correctOptionIds?: string[]
  explanation?: string | null
}

export interface QuestionView {
  id: string
  categoryId: string
  text: string
  sourceType: 'official_knowledge' | 'practice_situation' | 'training'
  options: AnswerOption[]
  status: QuestionStatus
  selectedOptionIds: string[]
  skipCount: number
  timeSpentMs: number
  difficulty: Difficulty | null
  translations?: Partial<Record<Language, Translation>>
  feedback?: Feedback
}

export interface SessionSummary {
  id: string
  config: QuizConfig
  status: QuizStatus
  startedAt: string
  expiresAt: string | null
  finishedAt: string | null
  completionReason: QuizCompletionReason | null
  result: QuizResult | null
}

export interface SessionView extends SessionSummary {
  questions: QuestionView[]
  currentQuestionIndex: number
  confirmingFinish: boolean
  serverTime: string
}

export type QuizAction =
  | { action: 'submit' | 'change'; sessionQuestionId: string; selectedOptionIds: string[]; timeSpentMs?: number }
  | { action: 'skip'; sessionQuestionId: string; timeSpentMs?: number }
  | { action: 'navigate'; index: number; timeSpentMs?: number }
  | { action: 'finish' | 'leave' | 'abandon' }
  | { action: 'rate'; sessionQuestionId: string; difficulty: Difficulty }

export interface SubmitAnswerResult {
  sessionQuestionId: string
  answerId: string
  status: 'answered'
  answeredAt: string
  feedback?: Feedback
}

export interface ActionResult {
  session: SessionView
  answer?: SubmitAnswerResult
}
