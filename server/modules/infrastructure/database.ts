import type { DataSource, EntityManager } from 'typeorm'
import { createDataSource } from './data-source'

let connection: Promise<DataSource> | undefined

export function database() {
  connection ??= createDataSource().initialize().catch(error => {
    connection = undefined
    throw error
  })
  return connection
}

export async function closeDatabase() {
  const current = connection
  connection = undefined
  if (!current) return
  const dataSource = await current.catch(() => null)
  if (dataSource?.isInitialized) await dataSource.destroy()
}

export async function lockOwner(tx: EntityManager, ownerId: string) {
  await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [ownerId])
}
