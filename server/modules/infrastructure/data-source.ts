import 'reflect-metadata'
import pg from 'pg'
import { DataSource } from 'typeorm'
import { entities } from './entities.ts'
import { InitialQuizSchema1795478400000 } from './migrations/initial.ts'
import { MarkInterruptedTraining1795560000000 } from './migrations/interrupted-training.ts'
import { CreateNewsletterSubscriptions1795560001000 } from './migrations/newsletter.ts'

export function createDataSource(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required')
  const url = new URL(databaseUrl)
  const schema = url.searchParams.get('schema') || 'public'
  url.searchParams.delete('schema')

  // The existing PostgreSQL timestamp columns store UTC without a timezone.
  pg.defaults.parseInputDatesAsUTC = true
  return new DataSource({
    type: 'postgres',
    url: url.toString(),
    schema,
    entities,
    migrations: [InitialQuizSchema1795478400000, MarkInterruptedTraining1795560000000, CreateNewsletterSubscriptions1795560001000],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    installExtensions: false,
    invalidWhereValuesBehavior: { null: 'throw', undefined: 'throw' },
    extra: {
      options: '-c timezone=UTC',
      types: {
        getTypeParser(oid: number, format: 'text' | 'binary' = 'text') {
          if (oid === 1114 && format === 'text') return (value: string) => new Date(`${value.replace(' ', 'T')}Z`)
          return format === 'binary' ? pg.types.getTypeParser(oid, 'binary') : pg.types.getTypeParser(oid, 'text')
        },
      },
    },
  })
}
