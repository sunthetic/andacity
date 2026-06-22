import { component$, useTask$ } from '@builder.io/qwik'

// Captures unhandled client-side errors and sends them to the first-party
// /api/errors endpoint for server-side logging. Runs once on hydration;
// listeners are never removed because this component lives in root.tsx.
//
// For full Sentry integration: install @sentry/browser, initialize with
// PUBLIC_SENTRY_DSN, and remove or supplement these handlers.
export const ErrorMonitor = component$(() => {
  useTask$(() => {
    if (typeof window === 'undefined') return

    const report = (payload: object) => {
      try {
        navigator.sendBeacon?.('/api/errors', JSON.stringify(payload))
      } catch {
        // ignore — never let the monitor crash the page
      }
    }

    window.addEventListener('error', (event: ErrorEvent) => {
      report({
        kind: 'unhandled-error',
        message: String(event.message || '').slice(0, 500),
        // Strip origin from filename to avoid leaking full server paths
        filename: String(event.filename || '').replace(
          typeof location !== 'undefined' ? location.origin : '',
          '',
        ).slice(0, 200),
        lineno: typeof event.lineno === 'number' ? event.lineno : undefined,
        colno: typeof event.colno === 'number' ? event.colno : undefined,
        occurredAt: new Date().toISOString(),
      })
    })

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason
      report({
        kind: 'unhandled-rejection',
        reason: (
          reason instanceof Error ? reason.message : String(reason || '')
        ).slice(0, 500),
        occurredAt: new Date().toISOString(),
      })
    })
  })

  return null
})
