import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '~/lib/db/schema'

const DEFAULT_DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/andacity'

let pool: Pool | null = null
let db: ReturnType<typeof createDb> | null = null

function createDb() {
  const connectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_URL || DEFAULT_DATABASE_URL

  pool = new Pool({
    connectionString,
    max: Number.parseInt(process.env.DB_POOL_MAX || '10', 10),
  })

  return drizzle(pool, {
    schema,
  })
}

export function getDb() {
  if (!db) {
    db = createDb()
  }

  return db
}

export async function closeDb() {
  if (!pool) return
  await pool.end()
  pool = null
  db = null
}

export type DbClient = ReturnType<typeof getDb>
