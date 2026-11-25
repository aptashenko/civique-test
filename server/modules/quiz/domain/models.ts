import type { AnswerOption, Difficulty, Language, QuizCompletionReason, QuizConfig, QuizResult, QuizStatus, Translation } from '../../../../shared/types/quiz'

export interface QuestionSnapshot {
  questionId: string
  version: number
  type: 'single_select' | 'multi_select' | 'true_false'
  text: string
  options: AnswerOption[]
  correctOptionIds: string[]
  explanation: string | null
  categoryId: string
  notionId?: string
  translations: Partial<Record<Language, Translation>>
  sourceType: 'official_knowledge' | 'practice_situation' | 'training'
}

export interface QuizAnswer {
  id: string
  sessionQuestionId: string
  selectedOptionIds: string[]
  isCorrect: boolean
  score: number
  answeredAt: string
  difficulty: Difficulty | null
}

interface SessionQuestion {
  id: string
  position: number
  snapshot: QuestionSnapshot
  skipCount: number
  timeSpentMs: number
}

export type QuizSessionQuestion = SessionQuestion & (
  | { status: 'pending' | 'skipped'; answer: null }
  | { status: 'answered'; answer: QuizAnswer }
)

export interface QuizSessionState {
  id: string
  ownerId: string
  config: QuizConfig
  questions: QuizSessionQuestion[]
  currentQuestionIndex: number
  confirmingFinish: boolean
  status: QuizStatus
  startedAt: string
  expiresAt: string | null
  lastActivityAt: string
  finishedAt: string | null
  abandonedAt: string | null
  completionReason: QuizCompletionReason | null
  result: QuizResult | null
  version: number
}

export class QuizError extends Error {
  constructor(public code: string, public status: number, public details?: unknown) {
    super(code)
  }
}
