type EnvGetterLike = {
  get(key: string): string | undefined
}

const SERVER_RUNTIME_KEYS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'DB_POOL_MAX',
  'DB_READS_ENABLED',
  'OG_SIGNING_SECRET',
  'PAYMENT_PROVIDER',
  'STRIPE_SECRET_KEY',
  'STRIPE_API_BASE',
  'PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
] as const

export type ServerRuntimeKey = (typeof SERVER_RUNTIME_KEYS)[number]

type ServerRuntimeEnv = Partial<Record<ServerRuntimeKey, string>>

const readValue = (value: string | undefined) => {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed : undefined
}

const readProcessEnvValue = (key: ServerRuntimeKey) => {
  if (typeof process === 'undefined') return undefined
  return readValue(process.env[key])
}

const createRuntimeEnv = (getter: EnvGetterLike) => {
  return SERVER_RUNTIME_KEYS.reduce<ServerRuntimeEnv>((acc, key) => {
    const value = readValue(getter.get(key))
    if (value) {
      acc[key] = value
    }
    return acc
  }, {})
}

let runtimeEnv = SERVER_RUNTIME_KEYS.reduce<ServerRuntimeEnv>((acc, key) => {
  const value = readProcessEnvValue(key)
  if (value) {
    acc[key] = value
  }
  return acc
}, {})

export const initializeServerRuntimeEnv = (env: EnvGetterLike) => {
  runtimeEnv = createRuntimeEnv(env)
}

export const getServerRuntimeEnvValue = (key: ServerRuntimeKey) => {
  return runtimeEnv[key]
}

export const getConfiguredDatabaseUrl = () => {
  return getServerRuntimeEnvValue('DATABASE_URL') || getServerRuntimeEnvValue('POSTGRES_URL')
}
