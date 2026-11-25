import { catalog } from '../../modules/quiz/features/start-quiz'
import { api } from '../../modules/quiz/presentation/http'

export default api(() => catalog())
