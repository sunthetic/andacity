import { component$ } from '@builder.io/qwik'
import type { DocumentHead, RequestHandler } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { buildFlightsSearchPath, normalizeFlightItineraryType, slugifyLocation } from '~/lib/search/flights/routing'

export const onGet: RequestHandler = async ({ url, redirect }) => {
  const from = String(url.searchParams.get('from') || '').trim()
  const to = String(url.searchParams.get('to') || '').trim()
  const fromLocationSlug = slugifyLocation(from)
  const toLocationSlug = slugifyLocation(to)

  if (fromLocationSlug && toLocationSlug) {
    const itineraryType = normalizeFlightItineraryType(url.searchParams.get('itineraryType'))
    const path = buildFlightsSearchPath(fromLocationSlug, toLocationSlug, itineraryType, 1)
    const query = new URLSearchParams(url.searchParams)
    query.delete('from')
    query.delete('to')
    query.delete('itineraryType')
    if (itineraryType === 'one-way') {
      query.delete('return')
    }

    const queryString = query.toString()
    throw redirect(302, queryString ? `${path}?${queryString}` : path)
  }

  const q = String(url.searchParams.get('q') || '').trim()
  if (q) {
    throw redirect(302, `/search/flights/${encodeURIComponent(q)}/1`)
  }
}

export default component$(() => {
  return (
    <Page>
      <div class="t-card p-7">
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          Flights search
        </h1>
        <p class="mt-2 max-w-[70ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
          Search pages stay noindex.
        </p>

        <form method="get" action="/search/flights" class="mt-6 grid gap-3">
          <div>
            <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Query</label>
            <input
              name="q"
              class="mt-1 w-full rounded-2xl border border-[color:var(--color-border)] bg-white px-4 py-3 text-base outline-none focus-visible:shadow-[var(--ring-focus)]"
              placeholder="e.g., anywhere"
            />
          </div>

          <button class="t-btn-primary w-fit px-5" type="submit">
            Search
          </button>
        </form>
      </div>
    </Page>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Flights Search | Andacity Travel'
  const description = 'Start a flights search. Search pages are noindex.'
  const canonicalHref = new URL('/search/flights', url.origin).href

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { name: 'robots', content: 'noindex,follow' },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}
