import type { ExamQuota, ExamQuestionSource } from '../../../shared/types/exam'

function knowledge(categoryId: string, notionId: string, required: number): ExamQuota {
  return { categoryId, notionId, sourceType: 'official_knowledge', required }
}

function situations(categoryId: string): ExamQuota {
  return { categoryId, notionId: null, sourceType: 'practice_situation', required: 6 }
}

// Arrêté du 10 octobre 2025, article 3.
export const cspQuotas = [
  knowledge('republican_values', 'motto_and_symbols', 3),
  knowledge('republican_values', 'secularism', 2),
  situations('republican_values'),
  knowledge('political_system', 'democracy_and_voting', 3),
  knowledge('political_system', 'french_republic', 2),
  knowledge('political_system', 'european_institutions', 1),
  knowledge('rights_and_duties', 'fundamental_rights', 2),
  knowledge('rights_and_duties', 'resident_duties', 3),
  situations('rights_and_duties'),
  knowledge('history_geography_culture', 'history_periods_and_figures', 3),
  knowledge('history_geography_culture', 'territories_and_geography', 3),
  knowledge('history_geography_culture', 'french_heritage', 2),
  knowledge('living_in_france', 'settlement_and_residence', 1),
  knowledge('living_in_france', 'healthcare_access', 1),
  knowledge('living_in_france', 'working_in_france', 1),
  knowledge('living_in_france', 'parental_authority_and_education', 1),
] as const

export function examQuotaFor(question: { categoryId: string; notionId?: string; sourceType: ExamQuestionSource | 'training' }) {
  return cspQuotas.find(quota =>
    quota.sourceType === question.sourceType && quota.categoryId === question.categoryId
    && (quota.notionId === null || quota.notionId === question.notionId),
  )
}
