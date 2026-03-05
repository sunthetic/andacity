import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'

export default component$(() => {
  return (
    <div class="mx-auto max-w-6xl px-4 py-10">
      <div class="t-card p-7">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
              Andacity Travel
            </h1>
            <p class="mt-2 max-w-[70ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              Vertical-first travel booking. Indexable destination and listing pages — search stays noindex.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <a class="t-btn-primary px-5 text-center" href="/hotels">
              Hotels
            </a>
            <a class="t-badge px-5 text-center" href="/car-rentals">
              Car rentals (soon)
            </a>
            <a class="t-badge px-5 text-center" href="/flights">
              Flights (soon)
            </a>
          </div>
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a class="t-card block p-5 hover:bg-white" href="/hotels">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Hotels hub</div>
            <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">
              Indexable listings + cities. Search stays noindex.
            </div>
            <div class="mt-4 text-sm text-[color:var(--color-action)]">Browse hotels →</div>
          </a>

          <a class="t-card block p-5 hover:bg-white" href="/hotels/in">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Hotels by city</div>
            <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">
              City guides designed to rank and route users into search.
            </div>
            <div class="mt-4 text-sm text-[color:var(--color-action)]">Browse cities →</div>
          </a>

          <a class="t-card block p-5 hover:bg-white" href="/search/hotels">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Hotel search</div>
            <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">
              Filter + sort with shareable URLs (noindex).
            </div>
            <div class="mt-4 text-sm text-[color:var(--color-action)]">Search hotels →</div>
          </a>
        </div>
      </div>
    </div>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Andacity Travel'
  const description = 'Vertical-first travel booking. Hotels live now; flights and car rentals coming soon.'
  const canonicalHref = new URL('/', url.origin).href
  const ogImage = new URL('/og/home.png', url.origin).href

  return {
    title,
    meta: [
      { name: 'description', content: description },

      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalHref },
      { property: 'og:image', content: ogImage },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}
