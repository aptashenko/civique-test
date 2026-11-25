import { defineStore } from 'pinia'
import type { MessageKey } from '~/shared/i18n/messages'
import type { ActionResult, QuizAction, SessionView } from '#shared/types/quiz'

export interface ApiError {
  code: string
  details?: { available?: number; sessionId?: string; knowledge?: number; situations?: number }
}

export function quizError(error: unknown): ApiError {
  const response = error as { data?: { data?: ApiError }; statusMessage?: string } | null
  return response?.data?.data ?? { code: response?.statusMessage ?? 'REQUEST_FAILED' }
}

export function errorMessageKey(code: string): MessageKey {
  const labels: Partial<Record<string, MessageKey>> = {
    ACCESS_DENIED: 'accessDenied',
    SESSION_NOT_FOUND: 'sessionNotFound',
    QUESTION_BANK_EMPTY: 'emptyBank',
    INVALID_CREDENTIALS: 'invalidCredentials',
    EMAIL_UNAVAILABLE: 'emailUnavailable',
    ACTIVE_SESSION_EXISTS: 'activeSession',
    SESSION_EXPIRED: 'sessionExpired',
    QUESTION_ALREADY_ANSWERED: 'alreadyAnswered',
    REVIEW_NOT_AVAILABLE: 'finishForCorrection',
    REQUEST_FAILED: 'requestFailed',
  }
  return labels[code] ?? 'unexpectedError'
}

export const useQuizStore = defineStore('quiz', () => {
  const session = ref<SessionView | null>(null)
  const busy = ref(false)
  const error = ref('')
  let pending: { actionKey: string; requestId: string; action: QuizAction } | undefined

  async function load(id: string) {
    busy.value = true
    error.value = ''
    try {
      session.value = await $fetch<SessionView>(`/api/quiz/sessions/${encodeURIComponent(id)}`)
    } catch (failure) {
      error.value = quizError(failure).code
    } finally {
      busy.value = false
    }
  }

  async function perform(action: QuizAction) {
    const current = session.value
    if (!current || busy.value) return false

    const actionKey = JSON.stringify(action.action === 'rate' ? action : { ...action, timeSpentMs: undefined })
    if (!pending || pending.actionKey !== actionKey) pending = { actionKey, requestId: crypto.randomUUID(), action }
    const { requestId, action: original } = pending
    const base = `/api/quiz/sessions/${encodeURIComponent(current.id)}`
    const path = original.action === 'submit' ? '/answers'
      : original.action === 'change' ? `/answers/${encodeURIComponent(original.sessionQuestionId)}`
      : `/${original.action}`
    busy.value = true
    error.value = ''
    try {
      const result = await $fetch<ActionResult>(base + path, {
        method: original.action === 'change' ? 'PATCH' : 'POST',
        body: { ...original, requestId },
        timeout: original.action === 'leave' ? 8000 : undefined,
      })
      pending = undefined
      session.value = result.session
      return true
    } catch (failure) {
      const { code } = quizError(failure)
      if (['SESSION_EXPIRED', 'SESSION_COMPLETED', 'QUESTION_ALREADY_ANSWERED'].includes(code)
        || (original.action === 'leave' && code === 'INVALID_SESSION_STATUS')) {
        pending = undefined
        await load(current.id)
      } else {
        error.value = code
      }
      return false
    } finally {
      busy.value = false
    }
  }

  function reset() {
    session.value = null
    error.value = ''
    pending = undefined
  }

  return { session, busy, error, load, perform, reset }
})
