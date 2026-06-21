/**
 * CLAUDE-UI-021 — Explore page sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production
 * host (gated on the real request host, matching all other /dev/ui-* routes).
 * Renders a cinematic, discovery-first Explore concept built on the `--ui-*`
 * token system inside the production global shell.
 *
 * Theme and idea filtering via URL params works in the preview:
 *   /dev/ui-explore?theme=beach
 *   /dev/ui-explore?idea=quick-mountain-escapes
 *   /dev/ui-explore?destination=miami
 *
 * Does NOT replace the production /explore route.
 * See docs/ui-redesign/samples/EXPLORE_SAMPLE.md for the approval gate.
 * Next (after approval): CLAUDE-UI-022 — Explore page implementation.
 */
import { component$ } from '@builder.io/qwik'
import type { DocumentHead, RequestHandler } from '@builder.io/qwik-city'
import { shouldIndex } from '~/lib/seo/env'
import { ExploreSample } from '~/components/dev/explore/ExploreSample'

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, 'Not found')
  headers.set('x-robots-tag', 'noindex, nofollow')
}

export default component$(() => (
  <>
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      Explore page sample — CLAUDE-UI-021. Not production. noindex · prod-gated.
      Theme/idea/destination filtering works via URL params. Switch palette +
      light/dark from the header theme control.
    </div>
    <ExploreSample />
  </>
))

export const head: DocumentHead = {
  title: 'Explore Page Sample (dev) | Andacity',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Internal explore page design sample built on the --ui-* system. Not a production page.',
    },
  ],
}
