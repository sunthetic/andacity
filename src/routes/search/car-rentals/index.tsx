import { component$ } from '@builder.io/qwik'
import type { DocumentHead, RequestHandler } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'

export const onGet: RequestHandler = async ({ url, redirect }) => {
  const q = String(url.searchParams.get('q') || '').trim()
  if (q) {
    throw redirect(302, `/search/car-rentals/${encodeURIComponent(q)}/1`)
  }
}

export default component$(() => {
  return (
    <Page>
      <div class="t-card p-7">
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          Car rentals search
        </h1>
        <p class="mt-2 max-w-[70ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
          Search pages stay noindex. City + detail pages are indexable.
        </p>

        <form method="get" action="/search/car-rentals" class="mt-6 grid gap-3">
          <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Destination</label>
          <input
            name="q"
            class="w-full rounded-2xl border border-[color:var(--color-border)] bg-white px-4 py-3 text-base outline-none focus-visible:shadow-[var(--ring-focus)]"
            placeholder="e.g., Las Vegas"
          />

          <div class="flex flex-wrap gap-2">
            <button class="t-btn-primary px-5" type="submit">
              Search
            </button>
            <a class="t-badge px-5 text-center" href="/car-rentals/in">
              Browse cities
            </a>
            <a class="t-badge px-5 text-center" href="/car-rentals">
              Car rentals hub
            </a>
          </div>
        </form>

        <div class="mt-6 text-xs text-[color:var(--color-text-muted)]">
          Tip: city pages are your SEO layer; search is for filtering and sorting.
        </div>
      </div>
    </Page>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Car Rentals Search | Andacity Travel'
  const description = 'Start a car rental search. Search pages are noindex; city + detail pages are indexable.'
  const canonicalHref = new URL('/search/car-rentals', url.origin).href

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { name: 'robots', content: 'noindex,follow' },

      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalHref },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}
