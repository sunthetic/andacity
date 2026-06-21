/**
 * CLAUDE-UI-029 — Trips page sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production
 * host (gated on the real request host, matching all other /dev/ui-* routes).
 * Renders a clean, functional trips builder concept built on the `--ui-*`
 * token system inside the production global shell.
 *
 * Does NOT replace the production /trips route.
 * See docs/ui-redesign/CLAUDE_UI_AUDIT.md for the approval gate.
 * Next (after approval): CLAUDE-UI-030 — Trips page implementation.
 */
import { component$ } from '@builder.io/qwik'
import type { DocumentHead, RequestHandler } from '@builder.io/qwik-city'
import { shouldIndex } from '~/lib/seo/env'
import { TripsSample } from '~/components/dev/trips/TripsSample'

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, 'Not found')
  headers.set('x-robots-tag', 'noindex, nofollow')
}

export default component$(() => (
  <>
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      Trips page sample — CLAUDE-UI-029. Not production. noindex · prod-gated.
      Switch palette + light/dark from the header theme control.
    </div>
    <TripsSample />
  </>
))

export const head: DocumentHead = {
  title: 'Trips Page Sample (dev) | Andacity',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Internal trips page design sample built on the --ui-* system. Not a production page.',
    },
  ],
}
