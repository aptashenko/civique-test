import type { MigrationInterface, QueryRunner } from 'typeorm'

export class MarkInterruptedTraining1795560000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    const schema = queryRunner.connection.driver.schema!.replaceAll('"', '""')
    const attempts = `"${schema}"."QuizAttempt"`
    const requests = `"${schema}"."QuizRequest"`
    await queryRunner.query(`
      WITH interrupted AS (
        UPDATE ${attempts} AS attempt
        SET state = jsonb_set(attempt.state, '{completionReason}', '"interrupted"')
        WHERE attempt.mode = 'training'
          AND attempt.status = 'completed'
          AND attempt.state->>'completionReason' = 'manual'
          AND EXISTS (
            SELECT 1 FROM ${requests} AS request
            WHERE request."attemptId" = attempt.id
              AND request.payload = $1
              AND request.response->'session'->>'status' = 'completed'
          )
        RETURNING attempt.id
      )
      UPDATE ${requests} AS request
      SET response = jsonb_set(request.response, '{session,completionReason}', '"interrupted"')
      FROM interrupted
      WHERE request."attemptId" = interrupted.id AND request.payload = $1
    `, [JSON.stringify({ action: 'leave' })])
  }

  async down() {
    // Keep the corrected attempt history across code rollbacks.
  }
}
