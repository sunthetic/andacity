import { component$, Slot } from '@builder.io/qwik'
import type { RequestHandler } from '@builder.io/qwik-city'
import { SiteFooter } from '~/components/site/SiteFooter'
import { SiteHeader } from '~/components/site/SiteHeader'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'

export const onRequest: RequestHandler = ({ url, headers }) => {
  const baseUrl = getPublicBaseUrl(url)
  const isProd = shouldIndex(baseUrl)

  // Baseline hardening
  headers.set('x-content-type-options', 'nosniff')
  headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  headers.set('x-frame-options', 'DENY')
  headers.set('x-xss-protection', '0')
  headers.set(
    'permissions-policy',
    [
      'geolocation=(self)',
      'camera=()',
      'microphone=()',
      'payment=(self)',
    ].join(', ')
  )

  // HSTS only on production + HTTPS (don’t brick local/dev)
  if (isProd && baseUrl.protocol === 'https:') {
    headers.set(
      'strict-transport-security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // CSP:
  // - Dev: allow ws/wss + unsafe-eval for tooling
  // - Prod: strict but compatible with Qwik inline styles/scripts
  headers.set('content-security-policy', isProd ? cspProd() : cspDev())
}

export default component$(() => {
  return (
    <div class="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-text)]">

      <SiteHeader />

      <main>
        <Slot />
      </main>

      <SiteFooter />

    </div>
  )
})

const cspCommon = () => {
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
  ]
}

const cspProd = () => {
  return [
    ...cspCommon(),
    "connect-src 'self' https:",
    'upgrade-insecure-requests',
  ].join('; ')
}

const cspDev = () => {
  return [
    ...cspCommon(),
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "connect-src 'self' ws: wss: http: https:",
  ].join('; ')
}