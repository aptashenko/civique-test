import { MigrationExecutor } from 'typeorm'
import { createDataSource } from '../server/modules/infrastructure/data-source.ts'

const database = await createDataSource().initialize()
const runner = database.createQueryRunner()
try {
  const schema = database.options.schema
  await runner.startTransaction()
  await runner.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`civique:migrations:${schema}`])
  if (!await runner.hasSchema(schema)) {
    await runner.query(`CREATE SCHEMA "${schema.replaceAll('"', '""')}"`)
  }
  const executor = new MigrationExecutor(database, runner)
  executor.transaction = 'all'
  const applied = await executor.executePendingMigrations()
  await runner.commitTransaction()
  console.log(applied.length ? applied.map(migration => migration.name).join('\n') : 'Database is up to date.')
} catch (error) {
  if (runner.isTransactionActive) await runner.rollbackTransaction()
  throw error
} finally {
  await runner.release()
  await database.destroy()
}
