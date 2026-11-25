import { readFile } from 'node:fs/promises'
import { createDataSource } from '../server/modules/infrastructure/data-source.ts'
import { BankQuestion } from '../server/modules/infrastructure/entities.ts'
import { examQuotaFor } from '../server/modules/exam/csp-quotas.ts'

const path = process.argv[2]
if (!path) throw new Error('Usage: npm run db:questions -- path/to/questions.json')
const questions = JSON.parse(await readFile(path, 'utf8'))
if (!Array.isArray(questions) || !questions.length) throw new Error('Expected a nonempty question array')

const allowedSources = ['official_knowledge', 'practice_situation', 'training']
const languages = ['uk', 'ru', 'en']
const text = value => typeof value === 'string' && value.trim().length > 0
const ids = new Set()
const rows = questions.map((question, index) => {
  const label = question?.questionId || index
  function invalid(reason) { throw new Error(`Invalid question ${label}: ${reason}`) }
  if (!question || !text(question.questionId) || question.questionId.startsWith('starter-') || ids.has(question.questionId)) invalid('duplicate or missing questionId')
  const { questionId, version, active = true, ...data } = question
  if (!Number.isInteger(version) || version < 1 || version > 2147483647 || typeof active !== 'boolean') invalid('version or activity')
  if (data.type !== 'single_select' || !text(data.text) || !text(data.categoryId) || !allowedSources.includes(data.sourceType)) invalid('text, category, type or source')
  if (data.notionId !== undefined && !text(data.notionId)) invalid('notionId')
  if (active && data.sourceType !== 'training' && !examQuotaFor(data)) {
    invalid(data.sourceType === 'official_knowledge' ? 'CSP category or notionId' : 'CSP situational category')
  }
  if (data.explanation !== null && !text(data.explanation)) invalid('explanation')
  if (!Array.isArray(data.options) || data.options.length < 2 || data.options.length > 20
    || (data.sourceType !== 'training' && data.options.length !== 4)
    || !data.options.every(option => option && text(option.id) && text(option.text))) invalid('options')
  const options = new Set(data.options.map(option => option.id))
  if (!Array.isArray(data.correctOptionIds) || data.correctOptionIds.length !== 1
    || !options.has(data.correctOptionIds[0]) || options.size !== data.options.length) invalid('correct answer')
  data.translations ??= {}
  if (typeof data.translations !== 'object' || Array.isArray(data.translations)) invalid('translations')
  for (const [locale, translation] of Object.entries(data.translations)) {
    if (!languages.includes(locale) || !translation || !text(translation.text) || !translation.options
      || Object.keys(translation.options).length !== options.size
      || !Object.entries(translation.options).every(([id, value]) => options.has(id) && text(value))
      || (translation.explanation !== undefined && !text(translation.explanation))) invalid(`translation ${locale}`)
  }
  ids.add(questionId)
  return { id: questionId, version, active, data }
})

const database = await createDataSource().initialize()
try {
  await database.transaction(async tx => {
    await tx.query("SET LOCAL statement_timeout = '30s'")
    await tx.query("SELECT pg_advisory_xact_lock(hashtextextended('question-bank-import', 0))")
    for (const row of rows) {
      const existing = await tx.findOneBy(BankQuestion, { id: row.id })
      if (existing && row.version <= existing.version) throw new Error(`Increase version before replacing ${row.id}`)
      await tx.upsert(BankQuestion, row, ['id'])
    }
  })
  console.log(`Imported ${rows.length} questions.`)
} finally {
  await database.destroy()
}
