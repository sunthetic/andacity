/**
 * CLAUDE-UI-025 — Global search results page sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production
 * host (gated on the real request host, matching all other /dev/ui-* routes).
 * Renders a premium, multi-vertical global search results (SRP) concept built
 * on the `--ui-*` token system inside the production global shell.
 *
 * The vertical switcher uses real `?vertical=` navigation that works in the
 * preview (server-rendered via useLocation):
 *   /dev/ui-search                  (All — mixed, action-grouped overview)
 *   /dev/ui-search?vertical=hotels
 *   /dev/ui-search?vertical=flights
 *   /dev/ui-search?vertical=cars
 *   /dev/ui-search?vertical=destinations
 *
 * Hotels / flights / cars cards are ILLUSTRATIVE (every price tagged
 * "Illustrative"); the Destinations vertical uses REAL production data + links.
 *
 * Does NOT replace any production /search/* route (which today are noindex
 * redirect shims into the per-vertical results pages).
 * See docs/ui-redesign/samples/GLOBAL_SEARCH_SAMPLE.md for the approval gate.
 * Next (after approval): CLAUDE-UI-026 — Global Search Results Implementation.
 */
import { component$ } from '@builder.io/qwik'
import type { DocumentHead, RequestHandler } from '@builder.io/qwik-city'
import { shouldIndex } from '~/lib/seo/env'
import { GlobalSearchSample } from '~/components/dev/search/GlobalSearchSample'

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, 'Not found')
  headers.set('x-robots-tag', 'noindex, nofollow')
}

export default component$(() => (
  <>
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      ⚠ Global search results sample — CLAUDE-UI-025. Not production. noindex ·
      prod-gated. Hotels/flights/cars cards are illustrative (prices tagged
      "Illustrative"); Destinations use real data. Vertical switcher works via
      ?vertical=; sort/filters/pagination are labeled concept. Switch palette +
      light/dark from the header theme control.
    </div>

    <GlobalSearchSample />
  </>
))

export const head: DocumentHead = {
  title: 'Global Search Results Sample (dev) | Andacity',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Internal global search results page design sample built on the --ui-* system. Not a production page.',
    },
  ],
}
