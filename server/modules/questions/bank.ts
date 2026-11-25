import { In } from 'typeorm'
import { database } from '../infrastructure/database'
import { BankQuestion } from '../infrastructure/entities'
import { cspExamQuestions } from './csp-exam'
import { cspTrainingQuestions } from './csp-training'
import { isPlayableQuestion } from './playable-question'

export async function loadBank() {
  const db = await database()
  const training = new Map(cspTrainingQuestions.map(question => [question.questionId, question]))
  const exam = new Map(cspExamQuestions.map(question => [question.questionId, question]))
  const bundledIds = new Set([...training.keys(), ...exam.keys()])
  const records = await db.manager.find(BankQuestion, {
    where: [{ active: true }, { active: false, id: In([...bundledIds]) }],
  })
  for (const record of records) {
    if (record.active) {
      const question = { ...record.data, questionId: record.id, version: record.version }
      training.set(record.id, question)
      if (question.sourceType === 'training') exam.delete(record.id)
      else exam.set(record.id, question)
    } else {
      training.delete(record.id)
      exam.delete(record.id)
    }
  }

  return {
    training: [...training.values()].filter(isPlayableQuestion),
    exam: [...exam.values()].filter(isPlayableQuestion),
  }
}
