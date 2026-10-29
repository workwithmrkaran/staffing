import 'server-only'
import { Pool, types, type PoolClient } from 'pg'

// Return timestamptz columns as ISO strings instead of Date objects,
// so rows match the string types the UI expects.
types.setTypeParser(types.builtins.TIMESTAMPTZ, (value) => new Date(value).toISOString())

const globalForDb = globalThis as unknown as { a3aPool?: Pool }

/** Shared connection pool (reused across hot reloads in development). */
export function getPool(): Pool {
  if (globalForDb.a3aPool) return globalForDb.a3aPool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set.')
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
  })
  pool.on('error', (error) => console.error('[db] idle client error', error))
  globalForDb.a3aPool = pool
  return pool
}

/** Runs `fn` inside a transaction, rolling back on any error. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}
