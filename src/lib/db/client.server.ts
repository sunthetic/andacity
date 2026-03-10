import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '~/lib/db/schema'
import { getConfiguredDatabaseUrl, getServerRuntimeEnvValue } from '~/lib/server/runtime-env.server'

const DEFAULT_DB_SCHEMA = 'andacity_app'
const DEFAULT_DB_POOL_MAX = 10

const buildSearchPath = (schemaName: string) => {
  return Array.from(new Set([schemaName, DEFAULT_DB_SCHEMA, 'public'])).join(',')
}

const withSearchPathOption = (connectionString: string, schemaName: string) => {
  const addition = `-c search_path=${buildSearchPath(schemaName)}`

  try {
    const parsed = new URL(connectionString)
    const existing = String(parsed.searchParams.get('options') || '')
    const nextOptions = existing ? `${existing} ${addition}` : addition
    parsed.searchParams.set('options', nextOptions)
    return parsed.toString()
  } catch {
    // Fallback for permissive libpq strings that Node URL rejects.
    const separator = connectionString.includes('?') ? '&' : '?'
    return `${connectionString}${separator}options=${encodeURIComponent(addition)}`
  }
}

let pool: Pool | null = null
let db: ReturnType<typeof createDb> | null = null
let activeConfigSignature: string | null = null

type DbRuntimeConfig = {
  connectionString: string
  max: number
}

const resolveDbPoolMax = () => {
  const parsed = Number.parseInt(getServerRuntimeEnvValue('DB_POOL_MAX') || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DB_POOL_MAX
}

const resolveDbRuntimeConfig = (): DbRuntimeConfig => {
  const baseConnectionString = getConfiguredDatabaseUrl()
  if (!baseConnectionString) {
    throw new Error('DATABASE_URL or POSTGRES_URL is not configured for the Qwik server runtime')
  }

  return {
    connectionString: withSearchPathOption(baseConnectionString, DEFAULT_DB_SCHEMA),
    max: resolveDbPoolMax(),
  }
}

const configSignature = (config: DbRuntimeConfig) => {
  return `${config.connectionString}::${config.max}`
}

function createDb(config: DbRuntimeConfig) {
  const { connectionString, max } = config

  pool = new Pool({
    connectionString,
    max,
  })

  return drizzle(pool, {
    schema,
  })
}

export function getDb() {
  const nextConfig = resolveDbRuntimeConfig()
  const nextSignature = configSignature(nextConfig)

  if (!db || !pool || activeConfigSignature !== nextSignature) {
    if (pool) {
      void pool.end().catch((error) => {
        console.error('[db-pool-close]', error)
      })
    }

    db = createDb(nextConfig)
    activeConfigSignature = nextSignature
  }

  return db
}

export async function closeDb() {
  if (!pool) return
  await pool.end()
  pool = null
  db = null
  activeConfigSignature = null
}

export type DbClient = ReturnType<typeof getDb>
