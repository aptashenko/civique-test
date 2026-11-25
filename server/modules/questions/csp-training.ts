import source from './data/csp/csp-all.json' with { type: 'json' }
import type { QuestionSnapshot } from '../quiz/domain/models'

// Keep history and practice-on-mistakes linked to the current questions.
const replacements = new Map([
  ['starter-1', 'csp-020'],
  ['starter-2', 'csp-017'],
  ['starter-3', 'csp-019'],
  ['csp-189', 'csp-186'],
])

export function currentQuestionId(questionId: string) {
  return replacements.get(questionId) ?? questionId
}

export const cspTrainingQuestions: QuestionSnapshot[] = source
  .filter(question => currentQuestionId(question.id) === question.id)
  .map(question => {
    const options = question.options.map((text, index) => ({ id: `option-${index + 1}`, text }))
    // Code du travail, article R1142-1. The source key says “never” despite the exceptions.
    const hasEmploymentCorrection = question.id === 'csp-006'
    const correct = options[hasEmploymentCorrection ? 1 : question.correctAnswer]
    if (!correct) throw new Error(`Invalid correct answer in ${question.id}`)

    return {
      questionId: question.id,
      version: 1,
      type: 'single_select',
      text: question.question,
      options,
      correctOptionIds: [correct.id],
      explanation: hasEmploymentCorrection
        ? 'En principe, un emploi ne peut pas être réservé à un sexe. Le Code du travail prévoit des exceptions limitées, par exemple pour les artistes qui interprètent un rôle masculin ou féminin.'
        : question.answerNote ?? null,
      categoryId: question.category,
      translations: {},
      sourceType: 'training',
    }
  })
