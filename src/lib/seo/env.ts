export const SEO_HOSTS = {
  prod: new Set(['andacity.com', 'www.andacity.com']),
  staging: new Set(['stage.andacity.apps.sunthetic.media']),
} as const

export const getPublicBaseUrl = (fallbackUrl: URL) => {
  const envBase = String(import.meta.env.PUBLIC_BASE_URL || '').trim()
  if (envBase) {
    try {
      return new URL(envBase)
    } catch {
      // ignore
    }
  }

  return new URL(fallbackUrl.origin)
}

export const shouldIndex = (baseUrl: URL) => {
  const host = baseUrl.host.toLowerCase()

  if (SEO_HOSTS.prod.has(host)) return true

  if (SEO_HOSTS.staging.has(host)) return false
  if (host.includes('localhost')) return false
  if (host.includes('127.0.0.1')) return false

  return false
}

/**
 * Canonical policy:
 * - Default: NO query params (prevents infinite permutations).
 * - Optional allowlist: keep only specific params (rare).
 * - Always strips tracking params if they appear.
 */
export const getCanonicalHref = (
  baseUrl: URL,
  input: { pathname: string; searchParams?: URLSearchParams | null; allowParams?: readonly string[] }
) => {
  const url = new URL(input.pathname, baseUrl)

  const sp = input.searchParams
  const allow = input.allowParams

  if (sp && allow && allow.length) {
    for (const key of allow) {
      const v = sp.get(key)
      if (v != null && v !== '') url.searchParams.set(key, v)
    }
  }

  stripTrackingParams(url.searchParams)

  return url.href
}

export const stripTrackingParams = (sp: URLSearchParams) => {
  // common marketing + affiliate + click IDs
  const exact = new Set([
    'gclid',
    'gbraid',
    'wbraid',
    'fbclid',
    'msclkid',
    'irclickid',
    'irgwc',
    'ref',
    'affid',
    'affiliate',
    'sid',
    'cid',
  ])

  for (const key of Array.from(sp.keys())) {
    const k = key.toLowerCase()

    if (k.startsWith('utm_')) {
      sp.delete(key)
      continue
    }

    if (exact.has(k)) {
      sp.delete(key)
      continue
    }
  }
}
