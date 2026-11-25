import type { QuizAction } from '../../../../shared/types/quiz'
import { mutateSession } from '../features/quiz-commands'
import { actionBody, api, requireOwner, sessionId } from './http'

export function actionHandler(action: QuizAction['action']) {
  return api(async event => {
    const { command, requestId } = await actionBody(event, action)
    const owner = await requireOwner(event)
    return mutateSession(owner.id, sessionId(event), requestId, command)
  }, true)
}
