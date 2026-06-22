import { component$, Slot } from '@builder.io/qwik'
import type { RequestHandler } from '@builder.io/qwik-city'
import {
  DecisioningProvider,
  useDecisioning,
} from '~/components/save-compare/DecisioningProvider'
import { UndoSnackbar } from '~/components/save-compare/UndoSnackbar'
import { SiteFooter } from '~/components/site/SiteFooter'
import { SiteHeader } from '~/components/site/SiteHeader'
import { ANALYTICS_PROVIDER } from '~/components/analytics/provider-config'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'

// Extra script-src hosts required by the configured analytics provider.
// Value is baked at build time; dead branches are eliminated.
const analyticsScriptSrcs = (): string[] => {
  if (ANALYTICS_PROVIDER === 'cloudflare') {
    return ['https://static.cloudflareinsights.com']
  }
  if (ANALYTICS_PROVIDER === 'ga4') {
    return ['https://www.googletagmanager.com']
  }
  return []
}

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
    <DecisioningProvider>
      <div class="min-h-screen text-[color:var(--color-text)]">

        <SiteHeader />

        <main>
          <Slot />
        </main>

        <SiteFooter />
        <DecisioningChrome />

      </div>
    </DecisioningProvider>
  )
})

const DecisioningChrome = component$(() => {
  const decisioning = useDecisioning()

  return (
    <UndoSnackbar
      message={decisioning.state.undo?.message || null}
      onUndo$={decisioning.undo$}
      onDismiss$={decisioning.dismissUndo$}
    />
  )
})

const cspCommon = () => {
  const extraScriptSrcs = analyticsScriptSrcs()
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...extraScriptSrcs,
  ].join(' ')

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc}`,
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
  const extraScriptSrcs = analyticsScriptSrcs()
  const devScriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    ...extraScriptSrcs,
  ].join(' ')

  return [
    ...cspCommon().filter((d) => !d.startsWith('script-src')),
    `script-src ${devScriptSrc}`,
    "connect-src 'self' ws: wss: http: https:",
  ].join('; ')
}
