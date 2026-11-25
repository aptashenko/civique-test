import { createError, defineEventHandler, getRouterParam, readBody, setResponseHeader, type H3Event } from 'h3'
import type { QuizAction } from '../../../../shared/types/quiz'
import { checkOrigin, identity } from '../../identity/identity'
import { QuizError } from '../domain/models'
import { trainingCounts } from '../../training/profile'
import type { StartOptions } from '../features/start-quiz'

export function api<T>(handler: (event: H3Event) => T, mutation = false) {
  return defineEventHandler(async event => {
    setResponseHeader(event, 'Cache-Control', 'private, no-store')
    try {
      if (mutation) checkOrigin(event)
      return await handler(event)
    } catch (error) {
      if (error instanceof QuizError) {
        throw createError({ statusCode: error.status, statusMessage: error.code, data: { code: error.code, details: error.details } })
      }
      throw error
    }
  })
}

export async function requireOwner(event: H3Event, createGuest = false) {
  const owner = await identity(event, createGuest)
  if (!owner) throw new QuizError('ACCESS_DENIED', 403)
  return owner
}

export function sessionId(event: H3Event) {
  const id = getRouterParam(event, 'id')
  if (!id) throw new QuizError('SESSION_NOT_FOUND', 404)
  return id
}

export async function objectBody(event: H3Event) {
  const body = await readBody<unknown>(event)
  if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new QuizError('INVALID_REQUEST', 422)
  return body as Record<string, unknown>
}

export async function startBody(event: H3Event): Promise<StartOptions> {
  const { mode, count, category, acceptAvailable, mistakes } = await objectBody(event)
  if (mode !== 'training' && mode !== 'exam') throw new QuizError('INVALID_REQUEST', 422)
  if (mode === 'exam') return { mode }
  if (count !== undefined && !trainingCounts.some(value => value === count)) throw new QuizError('INVALID_REQUEST', 422)
  if (category !== undefined && (typeof category !== 'string' || category.length > 100)) throw new QuizError('INVALID_REQUEST', 422)
  return { mode, count: count as StartOptions['count'], category, acceptAvailable: acceptAvailable === true, mistakes: mistakes === true }
}

export async function actionBody(event: H3Event, action: QuizAction['action']) {
  const body = await objectBody(event)
  if (typeof body.requestId !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(body.requestId)) {
    throw new QuizError('INVALID_REQUEST', 422)
  }
  const requestId = body.requestId
  const timeSpentMs = body.timeSpentMs
  if (timeSpentMs !== undefined && (typeof timeSpentMs !== 'number' || !Number.isInteger(timeSpentMs)
    || timeSpentMs < 0 || timeSpentMs > 86_400_000)) throw new QuizError('INVALID_REQUEST', 422)
  if (action === 'finish' || action === 'leave' || action === 'abandon') {
    return { requestId, command: { action } satisfies QuizAction }
  }
  if (action === 'navigate') {
    if (typeof body.index !== 'number' || !Number.isInteger(body.index)) throw new QuizError('INVALID_QUESTION_INDEX', 422)
    return { requestId, command: { action, index: body.index, timeSpentMs } satisfies QuizAction }
  }
  const sessionQuestionId = action === 'change' ? getRouterParam(event, 'questionId') : body.sessionQuestionId
  if (typeof sessionQuestionId !== 'string' || sessionQuestionId.length > 100) throw new QuizError('INVALID_REQUEST', 422)
  if (action === 'skip') return { requestId, command: { action, sessionQuestionId, timeSpentMs } satisfies QuizAction }
  if (action === 'rate') {
    const { difficulty } = body
    if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') throw new QuizError('INVALID_REQUEST', 422)
    return { requestId, command: { action, sessionQuestionId, difficulty } satisfies QuizAction }
  }
  const { selectedOptionIds } = body
  if (!Array.isArray(selectedOptionIds) || selectedOptionIds.length > 20
    || !selectedOptionIds.every((id: unknown) => typeof id === 'string' && id.length <= 100)) {
    throw new QuizError('INVALID_ANSWER_OPTION', 422)
  }
  return { requestId, command: { action, sessionQuestionId, selectedOptionIds, timeSpentMs } satisfies QuizAction }
}
