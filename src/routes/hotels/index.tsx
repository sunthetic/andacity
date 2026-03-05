import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { HOTELS } from '~/data/hotels'

export default component$(() => {
  const items = HOTELS

  return (
    <div class="mx-auto max-w-6xl px-4 py-10">
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

      <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((h) => (
          <a
            key={h.slug}
            class="t-card block overflow-hidden hover:bg-white"
            href={buildHotelDetailHref(h.slug)}
          >
            <div class="bg-[color:var(--color-neutral-50)]">
              <img
                class="h-40 w-full object-cover"
                src={h.images[0] || '/img/demo/hotel-1.jpg'}
                alt={h.name}
                loading="lazy"
                width={640}
                height={320}
              />
            </div>

            <div class="p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                    {h.name}
                  </div>
                  <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    {h.city} · {h.neighborhood} · {h.stars}★
                  </div>
                </div>

                <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  From {formatMoney(h.fromNightly, h.currency)}
                  <span class="ml-1 text-[color:var(--color-text-muted)]">/night</span>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <span class="t-badge">
                  {h.rating.toFixed(1)} ★{' '}
                  <span class="text-[color:var(--color-text-muted)]">
                    ({h.reviewCount.toLocaleString('en-US')})
                  </span>
                </span>

                {h.policies.freeCancellation ? (
                  <span class="t-badge t-badge--deal">Free cancellation</span>
                ) : (
                  <span class="t-badge">Cancellation varies</span>
                )}
                {h.policies.payLater ? (
                  <span class="t-badge t-badge--deal">Pay later</span>
                ) : (
                  <span class="t-badge">Prepay</span>
                )}
              </div>

              <div class="mt-3 text-xs text-[color:var(--color-text-muted)]">
                Top amenities:{' '}
                <span class="text-[color:var(--color-text)]">
                  {h.amenities.slice(0, 4).join(' · ')}
                </span>
              </div>

              <div class="mt-4 text-sm text-[color:var(--color-action)]">View hotel →</div>
            </div>
          </a>
        ))}
      </div>
    </div>
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

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}
