/**
 * CLAUDE-UI-023 — Destinations page sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production
 * host (gated on the real request host, matching all other /dev/ui-* routes).
 * Renders a premium "travel atlas" Destinations concept built on the `--ui-*`
 * token system inside the production global shell.
 *
 * Experience filtering via URL param works in the preview (tags are derived
 * from the real production `bestFor` data):
 *   /dev/ui-destinations?experience=beach
 *   /dev/ui-destinations?experience=family
 *
 * Does NOT replace the production /destinations route.
 * See docs/ui-redesign/samples/DESTINATIONS_SAMPLE.md for the approval gate.
 * Next (after approval): CLAUDE-UI-024 — Destinations page implementation.
 */
import { component$ } from '@builder.io/qwik'
import type { DocumentHead, RequestHandler } from '@builder.io/qwik-city'
import { shouldIndex } from '~/lib/seo/env'
import { DestinationsSample } from '~/components/dev/destinations/DestinationsSample'

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, 'Not found')
  headers.set('x-robots-tag', 'noindex, nofollow')
}

export default component$(() => (
  <>
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      Destinations page sample — CLAUDE-UI-023. Not production. noindex ·
      prod-gated. Experience filtering works via URL params. Switch palette +
      light/dark from the header theme control.
    </div>
    <DestinationsSample />
  </>
))

export const head: DocumentHead = {
  title: 'Destinations Page Sample (dev) | Andacity',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Internal destinations page design sample built on the --ui-* system. Not a production page.',
    },
  ],
}
