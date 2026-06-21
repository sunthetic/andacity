/**
 * CLAUDE-UI-026 — Production global search overview route.
 *
 * Route: /search/all/[query]/[pageNumber]
 *
 * Inherits `x-robots-tag: noindex, follow` from /search/layout.tsx.
 * Does NOT interfere with any existing /search/hotels/, /search/flights/,
 * or /search/car-rentals/ shims — `all` is a new static segment.
 *
 * See docs/ui-redesign/GLOBAL_SEARCH_IMPLEMENTATION.md for the full
 * route decision record.
 */
import { component$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'
import type { DocumentHead, RequestHandler } from '@builder.io/qwik-city'
import { GlobalSearchPage } from '~/components/search/GlobalSearchPage'

export const onGet: RequestHandler = ({ params, redirect }) => {
  const page = Number(params.pageNumber)
  if (!Number.isFinite(page) || page < 1 || !Number.isInteger(page)) {
    throw redirect(302, `/search/all/${encodeURIComponent(params.query)}/1`)
  }
}

export default component$(() => {
  const location = useLocation()
  const query = decodeURIComponent(location.params.query || '').trim() || 'Travel'
  const page = Math.max(1, Number(location.params.pageNumber) || 1)
  return <GlobalSearchPage query={query} page={page} />
})

export const head: DocumentHead = ({ params }) => {
  const query = decodeURIComponent(params.query || '').trim()
  const title = query ? `"${query}" — Search | Andacity` : 'Search | Andacity'
  return {
    title,
    meta: [
      { name: 'robots', content: 'noindex, follow' },
      {
        name: 'description',
        content: query
          ? `Search results for "${query}" across hotels, flights, car rentals, and destinations on Andacity.`
          : 'Search across hotels, flights, car rentals, and destinations on Andacity.',
      },
    ],
  }
}
