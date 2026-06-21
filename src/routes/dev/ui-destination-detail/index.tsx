/**
 * CLAUDE-UI-027 — Destination detail page sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production
 * host (gated on the real request host, matching all other /dev/ui-* routes).
 * Renders a premium, editorial "city guide" Destination Detail concept built on
 * the `--ui-*` token system inside the production global shell.
 *
 * Uses one real destination from the production dataset (Miami by default).
 * Preview either real destination via URL param:
 *   /dev/ui-destination-detail                       → Miami
 *   /dev/ui-destination-detail?destination=san-diego → San Diego
 * (Unknown slugs fall back to Miami / the first valid destination.)
 *
 * Does NOT replace the production /destinations/[slug] route.
 * See docs/ui-redesign/samples/DESTINATION_DETAIL_SAMPLE.md for the approval gate.
 * Next (after approval): CLAUDE-UI-028 — Destination Detail page implementation.
 */
import { component$ } from '@builder.io/qwik'
import type { DocumentHead, RequestHandler } from '@builder.io/qwik-city'
import { shouldIndex } from '~/lib/seo/env'
import { DestinationDetailSample } from '~/components/dev/destinations/DestinationDetailSample'

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, 'Not found')
  headers.set('x-robots-tag', 'noindex, nofollow')
}

export default component$(() => (
  <>
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      Destination detail page sample — CLAUDE-UI-027. Not production. noindex ·
      prod-gated. Preview San Diego with ?destination=san-diego. Switch palette +
      light/dark from the header theme control.
    </div>
    <DestinationDetailSample />
  </>
))

export const head: DocumentHead = {
  title: 'Destination Detail Page Sample (dev) | Andacity',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Internal destination detail page design sample built on the --ui-* system. Not a production page.',
    },
  ],
}
