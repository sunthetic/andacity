import { getConfiguredDatabaseUrl, getServerRuntimeEnvValue } from '~/lib/server/runtime-env.server'

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on'])
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off'])

const normalize = (value: string | undefined) =>
  String(value || '')
    .trim()
    .toLowerCase()

export const isDbReadEnabled = () => {
  const explicit = normalize(getServerRuntimeEnvValue('DB_READS_ENABLED'))
  if (TRUE_VALUES.has(explicit)) return true
  if (FALSE_VALUES.has(explicit)) return false

  return Boolean(getConfiguredDatabaseUrl())
}

export async function tryDbRead<T>(
  dbAction: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (!isDbReadEnabled()) {
    return fallback()
  }

  try {
    return await dbAction()
  } catch (error) {
    console.error('[db-read-fallback]', error)
    return fallback()
  }
}
