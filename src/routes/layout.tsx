import { component$, Slot } from '@builder.io/qwik'
import type { RequestHandler } from '@builder.io/qwik-city'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'

export const onRequest: RequestHandler = ({ url, headers }) => {
  const baseUrl = getPublicBaseUrl(url)
  const isProd = shouldIndex(baseUrl)

  // Baseline hardening
  headers.set('x-content-type-options', 'nosniff')
  headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  headers.set('x-frame-options', 'DENY')
  headers.set('permissions-policy', [
    'geolocation=(self)',
    'camera=()',
    'microphone=()',
    'payment=(self)',
  ].join(', '))

  // HSTS only on production + HTTPS (don’t brick local/dev)
  if (isProd && baseUrl.protocol === 'https:') {
    headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains; preload')
  }

  // CSP:
  // - In dev, Vite typically needs looser policies (and Qwik may inline some scripts/styles)
  // - In prod, keep it strict but compatible
  const csp = isProd ? cspProd() : cspDev()
  headers.set('content-security-policy', csp)
}

export default component$(() => {
  return <Slot />
})

const cspProd = () => {
  // If you later add analytics, maps, image CDNs, etc. expand connect-src/img-src accordingly.
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https:",
    "upgrade-insecure-requests",
  ].join('; ')
}

const cspDev = () => {
  // Dev needs localhost websockets + eval sometimes.
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "connect-src 'self' ws: wss: http: https:",
  ].join('; ')
}
