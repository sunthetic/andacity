import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '~/lib/db/schema'

const DEFAULT_DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/andacity'
const DEFAULT_DB_SCHEMA = 'andacity_app'

const resolveDbSchema = () => {
  const value = String(process.env.DB_SCHEMA || DEFAULT_DB_SCHEMA)
    .trim()
    .toLowerCase()

  return /^[a-z_][a-z0-9_]*$/.test(value) ? value : DEFAULT_DB_SCHEMA
}

const withSearchPathOption = (connectionString: string, schemaName: string) => {
  try {
    const parsed = new URL(connectionString)
    const existing = String(parsed.searchParams.get('options') || '')
    if (/search_path/i.test(existing)) return connectionString

    const addition = `-c search_path=${schemaName},public`
    const nextOptions = existing ? `${existing} ${addition}` : addition
    parsed.searchParams.set('options', nextOptions)
    return parsed.toString()
  } catch {
    return connectionString
  }
}

let pool: Pool | null = null
let db: ReturnType<typeof createDb> | null = null

function createDb() {
  const baseConnectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_URL || DEFAULT_DATABASE_URL
  const schemaName = resolveDbSchema()
  const connectionString = withSearchPathOption(baseConnectionString, schemaName)

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
