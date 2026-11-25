export type ExamQuestionSource = 'official_knowledge' | 'practice_situation'

export interface ExamQuota {
  categoryId: string
  notionId: string | null
  sourceType: ExamQuestionSource
  required: number
}

export interface ExamAvailability {
  knowledge: number
  situations: number
  ready: boolean
  missing: (ExamQuota & { available: number })[]
}
