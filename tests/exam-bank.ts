import { cspQuotas } from '../server/modules/exam/csp-quotas.ts'
import type { QuestionSnapshot } from '../server/modules/quiz/domain/models'

export function makeExamBank(prefix = 'test', extraPerQuota = 0): QuestionSnapshot[] {
  return cspQuotas.flatMap((quota, group) => Array.from({ length: quota.required + extraPerQuota }, (_, index) => {
    const questionId = `${prefix}-${group}-${index}`
    return {
      questionId,
      version: 1,
      type: 'single_select',
      text: `Question de test ${questionId}`,
      options: ['a', 'b', 'c', 'd'].map(id => ({ id, text: `Option ${id}` })),
      correctOptionIds: ['a'],
      explanation: 'Test explanation',
      categoryId: quota.categoryId,
      ...(quota.notionId ? { notionId: quota.notionId } : {}),
      translations: {},
      sourceType: quota.sourceType,
    }
  }))
}
