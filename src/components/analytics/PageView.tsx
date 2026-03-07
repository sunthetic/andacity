import { component$, useTask$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'

export const PageView = component$(() => {
  const loc = useLocation()

  useTask$(({ track }) => {
    track(() => loc.url.pathname + loc.url.search)
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return
    }

    const path = loc.url.pathname + loc.url.search

    // Drop-in hook point: replace with your provider later (Plausible, GA4, PostHog, etc.)
    // For now, this is a no-op unless you choose to implement /api/analytics/pageview.
    try {
      navigator.sendBeacon?.('/api/analytics/pageview', JSON.stringify({ path }))
    } catch {
      // ignore
    }

    // Also expose a DOM event for quick debugging / devtools listeners.
    window.dispatchEvent(new CustomEvent('andacity:pageview', { detail: { path } }))
  })

  return null
})
