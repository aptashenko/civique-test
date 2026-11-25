import type { MigrationInterface, QueryRunner } from 'typeorm'

// The first migration must recognize the original layout even after the entities evolve.
const baseline = {
  Owner: {
    columns: 'id email passwordHash lastActivityAt expiresAt',
    primary: 'id',
    indexes: ['Owner_email_key'],
  },
  Identity: {
    columns: 'tokenHash ownerId expiresAt',
    primary: 'tokenHash',
    indexes: ['Identity_ownerId_idx', 'Identity_expiresAt_idx'],
    foreignKey: 'Identity_ownerId_fkey',
  },
  QuizAttempt: {
    columns: 'id ownerId mode status activeKey startedAt expiresAt finishedAt abandonedAt lastActivityAt state',
    primary: 'id',
    indexes: [
      'QuizAttempt_activeKey_key',
      'QuizAttempt_ownerId_status_finishedAt_idx',
      'QuizAttempt_status_expiresAt_idx',
      'QuizAttempt_mode_status_lastActivityAt_idx',
    ],
    foreignKey: 'QuizAttempt_ownerId_fkey',
  },
  QuizRequest: {
    columns: 'attemptId requestId payload response expiresAt',
    primary: 'attemptId requestId',
    indexes: ['QuizRequest_expiresAt_idx'],
    foreignKey: 'QuizRequest_attemptId_fkey',
  },
  QuizCompleted: {
    columns: 'attemptId completedAt',
    primary: 'attemptId',
    indexes: [],
    foreignKey: 'QuizCompleted_attemptId_fkey',
  },
  BankQuestion: {
    columns: 'id version active data',
    primary: 'id',
    indexes: [],
  },
  Favorite: {
    columns: 'ownerId termId lastActivityAt',
    primary: 'ownerId termId',
    indexes: ['Favorite_lastActivityAt_idx'],
    foreignKey: 'Favorite_ownerId_fkey',
  },
}

const timestampColumns = new Set(['startedAt', 'expiresAt', 'finishedAt', 'abandonedAt', 'lastActivityAt', 'completedAt'])
const jsonColumns = new Set(['state', 'response', 'data'])

function columnType(name: string) {
  if (timestampColumns.has(name)) return 'timestamp without time zone'
  if (jsonColumns.has(name)) return 'jsonb'
  if (name === 'version') return 'integer'
  if (name === 'active') return 'boolean'
  return 'text'
}

export class InitialQuizSchema1795478400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    const schema = queryRunner.connection.driver.schema!
    const tables = await queryRunner.getTables(Object.keys(baseline).map(name => `${schema}.${name}`))
    if (tables.length) {
      for (const [name, expected] of Object.entries(baseline)) {
        const table = tables.find(item => item.name === name || item.name === `${schema}.${name}`)
        if (!table) throw new Error(`Cannot baseline an incomplete quiz schema. Missing table: ${name}`)

        const columnsMatch = expected.columns.split(' ').every(name => {
          const column = table.findColumnByName(name)
          return column?.type === columnType(name)
            && (!timestampColumns.has(name) || column.precision === 3)
        })
        const primaryMatches = table.primaryColumns.map(column => column.name).sort().join(' ')
          === expected.primary.split(' ').sort().join(' ')
        const indexesMatch = expected.indexes.every(name => table.indices.some(index =>
          index.name === name && index.isUnique === name.endsWith('_key'),
        ))
        const keyMatches = !('foreignKey' in expected) || table.foreignKeys.some(key =>
          key.name === expected.foreignKey && key.onDelete === 'CASCADE' && key.onUpdate === 'CASCADE',
        )
        if (!columnsMatch || !primaryMatches || !indexesMatch || !keyMatches) {
          throw new Error(`Cannot baseline a quiz schema with incompatible structure in ${name}`)
        }
      }
      return
    }

    const escapedSchema = schema.replaceAll('"', '""')
    await queryRunner.query(`SET LOCAL search_path TO "${escapedSchema}"`)
    await queryRunner.query(`CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Identity" (
    "tokenHash" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Identity_pkey" PRIMARY KEY ("tokenHash")
);

CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "activeKey" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "state" JSONB NOT NULL,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizRequest" (
    "attemptId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizRequest_pkey" PRIMARY KEY ("attemptId","requestId")
);

CREATE TABLE "QuizCompleted" (
    "attemptId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizCompleted_pkey" PRIMARY KEY ("attemptId")
);

CREATE TABLE "BankQuestion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB NOT NULL,

    CONSTRAINT "BankQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Favorite" (
    "ownerId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("ownerId","termId")
);

CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");

CREATE INDEX "Identity_ownerId_idx" ON "Identity"("ownerId");

CREATE INDEX "Identity_expiresAt_idx" ON "Identity"("expiresAt");

CREATE UNIQUE INDEX "QuizAttempt_activeKey_key" ON "QuizAttempt"("activeKey");

CREATE INDEX "QuizAttempt_ownerId_status_finishedAt_idx" ON "QuizAttempt"("ownerId", "status", "finishedAt");

CREATE INDEX "QuizAttempt_status_expiresAt_idx" ON "QuizAttempt"("status", "expiresAt");

CREATE INDEX "QuizAttempt_mode_status_lastActivityAt_idx" ON "QuizAttempt"("mode", "status", "lastActivityAt");

CREATE INDEX "QuizRequest_expiresAt_idx" ON "QuizRequest"("expiresAt");

CREATE INDEX "Favorite_lastActivityAt_idx" ON "Favorite"("lastActivityAt");

ALTER TABLE "Identity" ADD CONSTRAINT "Identity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuizRequest" ADD CONSTRAINT "QuizRequest_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuizCompleted" ADD CONSTRAINT "QuizCompleted_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;`)
  }

  async down() {
    throw new Error('The quiz baseline may contain existing application data and cannot be reverted automatically.')
  }
}
