import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateNewsletterSubscriptions1795560001000 implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    const schema = queryRunner.connection.driver.schema!.replaceAll('"', '""')
    await queryRunner.query(`
      CREATE TABLE "${schema}"."NewsletterSubscription" (
        "email" TEXT NOT NULL,
        "locale" TEXT NOT NULL,
        "consentVersion" INTEGER NOT NULL,
        "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NewsletterSubscription_pkey" PRIMARY KEY ("email")
      )
    `)
  }

  async down() {
    throw new Error('Export and remove the newsletter subscriber records explicitly before reverting this migration.')
  }
}
