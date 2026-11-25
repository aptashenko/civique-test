import { readSession } from '../../../../modules/quiz/features/session-queries'
import { api, requireOwner, sessionId } from '../../../../modules/quiz/presentation/http'

export default api(async event => readSession((await requireOwner(event)).id, sessionId(event)))
