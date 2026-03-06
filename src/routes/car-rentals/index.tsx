import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { useLocation } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { Breadcrumbs } from '~/components/site/Breadcrumbs'
import { ListingCardGrid } from '~/components/vertical/ListingCardGrid'
import { CAR_RENTALS } from '~/data/car-rentals'

export default component$(() => {
  const items = CAR_RENTALS
  const loc = useLocation()

  const q = String(loc.url.searchParams.get('q') || '').trim()
  const pickupDate = String(loc.url.searchParams.get('pickupDate') || '').trim()
  const dropoffDate = String(loc.url.searchParams.get('dropoffDate') || '').trim()
  const drivers = String(loc.url.searchParams.get('drivers') || '').trim()

  return (
    <Page>

      <Breadcrumbs
        items={[
          { label: 'Andacity Travel', href: '/' },
          { label: 'Car Rentals', href: '/car-rentals' },
        ]}
      />

      <div class="mt-4 grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
        {pickupDate}
        <div>
          <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
            Car Rentals
          </h1>

          <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
            Indexable car rental guides with clear inclusions and policy summaries. Search results stay noindex.
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <a class="t-btn-primary px-4 text-center" href="/car-rentals/in">
              Browse cities
            </a>
            <a class="t-btn-primary px-4 text-center" href="/search/car-rentals">
              Search car rentals
            </a>
          </div>

          <div class="mt-4 flex flex-wrap gap-2 text-sm">
            <span class="text-[color:var(--color-text-muted)]">Popular:</span>
            <a class="t-badge hover:bg-white" href="/car-rentals/in/las-vegas">
              Las Vegas
            </a>
            <a class="t-badge hover:bg-white" href="/car-rentals/in/orlando">
              Orlando
            </a>
            <a class="t-badge hover:bg-white" href="/car-rentals/in/new-york-city">
              New York
            </a>
          </div>
        </div>

        <aside class="lg:sticky lg:top-24 lg:self-start">
          <div class="t-card p-5">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              Search car rentals
            </div>

            <form method="get" action="/search/car-rentals" class="mt-4 grid gap-3">
              <div>
                <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                  Destination
                </label>
                <input
                  name="q"
                  class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                  placeholder="e.g., Las Vegas"
                  value={q}
                />
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                    Pickup
                  </label>
                  <input
                    name="pickupDate"
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="YYYY-MM-DD"
                    value={pickupDate}
                  />
                </div>

                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                    Dropoff
                  </label>
                  <input
                    name="dropoffDate"
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="YYYY-MM-DD"
                    value={dropoffDate}
                  />
                </div>
              </div>

              <div>
                <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                  Drivers
                </label>
                <input
                  name="drivers"
                  class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                  placeholder="1"
                  value={drivers}
                />
              </div>

              <button class="t-btn-primary" type="submit">
                Search
              </button>

              <div class="text-xs text-[color:var(--color-text-muted)]">
                City and detail pages are indexable. Search pages remain noindex.
              </div>
            </form>
          </div>
        </aside>
      </div>

      <section class="mt-8">
        <div class="flex items-end justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
              Featured car rentals
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Guide-style inventory pages with clear inclusions and policy highlights.
            </p>
          </div>

          <a class="text-sm text-[color:var(--color-action)] hover:underline" href="/search/car-rentals/anywhere/1">
            View all →
          </a>
        </div>

        <ListingCardGrid variant="car-rentals" items={items} />
      </section>
    </Page>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Car Rentals | Andacity Travel'
  const description =
    'Browse indexable car rental guides with clear inclusions and policy summaries. Search pages stay noindex; detail pages earn rankings.'

  const canonicalHref = new URL('/car-rentals', url.origin).href

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
            name: 'Car Rentals',
            item: canonicalHref,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Andacity car rentals',
        itemListElement: CAR_RENTALS.slice(0, listCap).map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          url: new URL(buildCarRentalDetailHref(c.slug), url.origin).href,
          numberOfItems: CAR_RENTALS.length,
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
        key: 'ld-car-rentals',
        props: { type: 'application/ld+json' },
        script: jsonLd,
      },
    ],
  }
}

const buildCarRentalDetailHref = (rentalSlug: string) => {
  return `/car-rentals/${encodeURIComponent(rentalSlug)}`
}
