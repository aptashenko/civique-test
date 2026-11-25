import { EntitySchema } from 'typeorm'
import type { ActionResult, QuizMode, QuizStatus } from '../../../shared/types/quiz'
import type { QuestionSnapshot, QuizSessionState } from '../quiz/domain/models'

interface OwnerRow {
  id: string
  email: string | null
  passwordHash: string | null
  lastActivityAt: Date
  expiresAt: Date | null
}

interface IdentityRow {
  tokenHash: string
  ownerId: string
  expiresAt: Date
  owner: OwnerRow
}

interface QuizAttemptRow {
  id: string
  ownerId: string
  owner: OwnerRow
  mode: QuizMode
  status: QuizStatus
  activeKey: string | null
  startedAt: Date
  expiresAt: Date | null
  finishedAt: Date | null
  abandonedAt: Date | null
  lastActivityAt: Date
  state: QuizSessionState
}

interface QuizRequestRow {
  attemptId: string
  requestId: string
  payload: string
  response: ActionResult
  expiresAt: Date
  attempt: QuizAttemptRow
}

interface QuizCompletedRow {
  attemptId: string
  completedAt: Date
  attempt: QuizAttemptRow
}

interface BankQuestionRow {
  id: string
  version: number
  active: boolean
  data: Omit<QuestionSnapshot, 'questionId' | 'version'>
}

interface FavoriteRow {
  ownerId: string
  termId: string
  lastActivityAt: Date
  owner: OwnerRow
}

interface NewsletterSubscriptionRow {
  email: string
  locale: 'fr' | 'uk' | 'en'
  consentVersion: number
  consentedAt: Date
}

const text = { type: 'text' } as const
const timestamp = { type: 'timestamp', precision: 3 } as const

function reference(target: string, name: string, foreignKeyConstraintName: string) {
  return {
    target,
    type: 'many-to-one' as const,
    joinColumn: { name, foreignKeyConstraintName },
    nullable: false,
    onDelete: 'CASCADE' as const,
    onUpdate: 'CASCADE' as const,
  }
}

export const Owner = new EntitySchema<OwnerRow>({
  name: 'Owner',
  tableName: 'Owner',
  columns: {
    id: { ...text, primary: true, primaryKeyConstraintName: 'Owner_pkey' },
    email: { ...text, nullable: true },
    passwordHash: { ...text, nullable: true },
    lastActivityAt: { ...timestamp, default: () => 'CURRENT_TIMESTAMP' },
    expiresAt: { ...timestamp, nullable: true },
  },
  indices: [{ name: 'Owner_email_key', columns: ['email'], unique: true }],
})

export const Identity = new EntitySchema<IdentityRow>({
  name: 'Identity',
  tableName: 'Identity',
  columns: {
    tokenHash: { ...text, primary: true, primaryKeyConstraintName: 'Identity_pkey' },
    ownerId: text,
    expiresAt: timestamp,
  },
  relations: { owner: reference('Owner', 'ownerId', 'Identity_ownerId_fkey') },
  indices: [
    { name: 'Identity_ownerId_idx', columns: ['ownerId'] },
    { name: 'Identity_expiresAt_idx', columns: ['expiresAt'] },
  ],
})

export const QuizAttempt = new EntitySchema<QuizAttemptRow>({
  name: 'QuizAttempt',
  tableName: 'QuizAttempt',
  columns: {
    id: { ...text, primary: true, primaryKeyConstraintName: 'QuizAttempt_pkey' },
    ownerId: text,
    mode: text,
    status: text,
    activeKey: { ...text, nullable: true },
    startedAt: timestamp,
    expiresAt: { ...timestamp, nullable: true },
    finishedAt: { ...timestamp, nullable: true },
    abandonedAt: { ...timestamp, nullable: true },
    lastActivityAt: timestamp,
    state: { type: 'jsonb' },
  },
  relations: { owner: reference('Owner', 'ownerId', 'QuizAttempt_ownerId_fkey') },
  indices: [
    { name: 'QuizAttempt_activeKey_key', columns: ['activeKey'], unique: true },
    { name: 'QuizAttempt_ownerId_status_finishedAt_idx', columns: ['ownerId', 'status', 'finishedAt'] },
    { name: 'QuizAttempt_status_expiresAt_idx', columns: ['status', 'expiresAt'] },
    { name: 'QuizAttempt_mode_status_lastActivityAt_idx', columns: ['mode', 'status', 'lastActivityAt'] },
  ],
})

export const QuizRequest = new EntitySchema<QuizRequestRow>({
  name: 'QuizRequest',
  tableName: 'QuizRequest',
  columns: {
    attemptId: { ...text, primary: true, primaryKeyConstraintName: 'QuizRequest_pkey' },
    requestId: { ...text, primary: true, primaryKeyConstraintName: 'QuizRequest_pkey' },
    payload: text,
    response: { type: 'jsonb' },
    expiresAt: timestamp,
  },
  relations: { attempt: reference('QuizAttempt', 'attemptId', 'QuizRequest_attemptId_fkey') },
  indices: [{ name: 'QuizRequest_expiresAt_idx', columns: ['expiresAt'] }],
})

export const QuizCompleted = new EntitySchema<QuizCompletedRow>({
  name: 'QuizCompleted',
  tableName: 'QuizCompleted',
  columns: {
    attemptId: { ...text, primary: true, primaryKeyConstraintName: 'QuizCompleted_pkey' },
    completedAt: timestamp,
  },
  relations: { attempt: reference('QuizAttempt', 'attemptId', 'QuizCompleted_attemptId_fkey') },
})

export const BankQuestion = new EntitySchema<BankQuestionRow>({
  name: 'BankQuestion',
  tableName: 'BankQuestion',
  columns: {
    id: { ...text, primary: true, primaryKeyConstraintName: 'BankQuestion_pkey' },
    version: { type: 'integer' },
    active: { type: 'boolean', default: true },
    data: { type: 'jsonb' },
  },
})

export const Favorite = new EntitySchema<FavoriteRow>({
  name: 'Favorite',
  tableName: 'Favorite',
  columns: {
    ownerId: { ...text, primary: true, primaryKeyConstraintName: 'Favorite_pkey' },
    termId: { ...text, primary: true, primaryKeyConstraintName: 'Favorite_pkey' },
    lastActivityAt: { ...timestamp, default: () => 'CURRENT_TIMESTAMP' },
  },
  relations: { owner: reference('Owner', 'ownerId', 'Favorite_ownerId_fkey') },
  indices: [{ name: 'Favorite_lastActivityAt_idx', columns: ['lastActivityAt'] }],
})

export const NewsletterSubscription = new EntitySchema<NewsletterSubscriptionRow>({
  name: 'NewsletterSubscription',
  tableName: 'NewsletterSubscription',
  columns: {
    email: { ...text, primary: true, primaryKeyConstraintName: 'NewsletterSubscription_pkey' },
    locale: text,
    consentVersion: { type: 'integer' },
    consentedAt: { ...timestamp, default: () => 'CURRENT_TIMESTAMP' },
  },
})

export const entities = [Owner, Identity, QuizAttempt, QuizRequest, QuizCompleted, BankQuestion, Favorite, NewsletterSubscription]
