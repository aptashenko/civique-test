import { finalizeExpiredExams } from '../modules/quiz/features/finalize-expired-exams'

export default defineTask({
  meta: { name: 'finalize-exams', description: 'Complete expired exam attempts' },
  async run() {
    return { result: await finalizeExpiredExams() }
  },
})
