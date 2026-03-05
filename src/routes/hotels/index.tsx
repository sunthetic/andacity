import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { HOTELS } from '~/data/hotels'
import { ListingCardGrid } from '~/components/vertical/ListingCardGrid'

export default component$(() => {
  const items = HOTELS

  return (
    <Page>
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            Hotels
          </h1>
          <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
            Indexable hotel guides with clear amenities and policy summaries. Search results stay noindex.
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <a class="t-btn-primary px-4 text-center" href="/hotels/in">
              Browse cities
            </a>
            <a class="t-btn-primary px-4 text-center" href="/search/hotels">
              Search hotels
            </a>
          </div>
          <div class="mt-4 flex flex-wrap gap-2 text-sm">
            <span class="text-[color:var(--color-text-muted)]">Popular:</span>
            <a class="t-badge hover:bg-white" href="/hotels/in/las-vegas">Las Vegas</a>
            <a class="t-badge hover:bg-white" href="/hotels/in/orlando">Orlando</a>
            <a class="t-badge hover:bg-white" href="/hotels/in/new-york-city">New York</a>
          </div>
        </div>

      </div>

      <ListingCardGrid variant="hotels" items={items} />
    </Page>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Hotels | Andacity Travel'
  const description =
    'Browse indexable hotel guides with clear amenities and policy summaries. Search pages stay noindex; hotel pages earn rankings.'

  const canonicalHref = new URL('/hotels', url.origin).href

  const listCap = 24

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Hotels',
            item: canonicalHref,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Andacity hotels',
        itemListElement: HOTELS.slice(0, listCap).map((h, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: h.name,
          url: new URL(buildHotelDetailHref(h.slug), url.origin).href,
          numberOfItems: HOTELS.length,
        })),
      },
    ],
  })

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalHref },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
    scripts: [
      {
        key: 'ld-hotels',
        props: { type: 'application/ld+json' },
        script: jsonLd,
      },
    ],
  }
}

const buildHotelDetailHref = (hotelSlug: string) => {
  return `/hotels/${encodeURIComponent(hotelSlug)}`
}
