import { component$ } from '@builder.io/qwik'
import { ANALYTICS_PROVIDER, CF_TOKEN, GA_ID } from './provider-config'

// Builds a single inline script that dynamically loads the analytics provider.
// Uses dynamic script injection to avoid render-blocking; returns null when no
// provider is configured so the app fails safe with no env vars set.
const buildInlineScript = (): string | null => {
  if (ANALYTICS_PROVIDER === 'cloudflare' && CF_TOKEN) {
    // Cloudflare Web Analytics: cookieless, no cross-site tracking.
    // Loads beacon.min.js via dynamic <script> with the required data-cf-beacon attribute.
    const beaconAttr = JSON.stringify(JSON.stringify({ token: CF_TOKEN }))
    return (
      `!function(){` +
      `var s=document.createElement('script');` +
      `s.defer=true;` +
      `s.src='https://static.cloudflareinsights.com/beacon.min.js';` +
      `s.setAttribute('data-cf-beacon',${beaconAttr});` +
      `document.head.appendChild(s)` +
      `}()`
    )
  }

  if (ANALYTICS_PROVIDER === 'ga4' && GA_ID) {
    // Google Analytics 4: queues events before gtag.js loads, then loads it async.
    // GA4 sets analytics cookies; update /privacy and add cookie disclosure if required.
    const measId = JSON.stringify(GA_ID)
    return (
      `window.dataLayer=window.dataLayer||[];` +
      `function gtag(){window.dataLayer.push(arguments)}` +
      `gtag('js',new Date());` +
      `gtag('config',${measId});` +
      `!function(){` +
      `var s=document.createElement('script');` +
      `s.async=true;` +
      `s.src='https://www.googletagmanager.com/gtag/js?id='+${measId};` +
      `document.head.appendChild(s)` +
      `}()`
    )
  }

  return null
}

const INLINE_SCRIPT = buildInlineScript()

export const AnalyticsProvider = component$(() => {
  if (!INLINE_SCRIPT) return null
  return <script dangerouslySetInnerHTML={INLINE_SCRIPT} />
})
