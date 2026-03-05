import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { CAR_RENTALS } from '~/data/car-rentals'
import { ListingCardGrid } from '~/components/vertical/ListingCardGrid'
import { Breadcrumbs } from '~/components/site/Breadcrumbs'

export const useCarRentalSearch = routeLoader$(({ params, error, url }) => {
  const rawQuery = String(params.query || '').trim().toLowerCase()
  const rawPage = String(params.pageNumber || '1').trim()

  const pageNumber = Math.max(1, Number.parseInt(rawPage, 10) || 1)

  if (!rawQuery) throw error(404, 'Not found')

  // Treat "anywhere" and "all" as browse-all queries
  const query = rawQuery === 'anywhere' || rawQuery === 'all' ? '' : rawQuery

  const pageSize = 12

  const all = query
    ? CAR_RENTALS.filter((c) => {
      const hay = [
        c.name,
        c.city,
        c.region,
        c.country,
        c.cityQuery,
        c.pickupArea,
        c.pickupAddressLine,
        c.inclusions.join(' '),
        c.offers.map((o) => [o.name, o.category, o.transmission, o.features.join(' ')].join(' ')).join(' '),
      ]
        .join(' ')
        .toLowerCase()

      return hay.includes(query)
    })
    : CAR_RENTALS.slice()

  if (!all.length) {
    // Keep the page indexable? No: search pages are intended to stay noindex anyway.
    // Still return a valid page state with empty results so UI can show "no results".
    return {
      query: rawQuery,
      normalizedQuery: query,
      pageNumber,
      pageSize,
      total: 0,
      totalPages: 1,
      items: [],
      canonicalHref: new URL(`/search/car-rentals/${encodeURIComponent(rawQuery)}/1`, url.origin).href,
    }
  }

  const total = all.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(pageNumber, totalPages)

  const start = (safePage - 1) * pageSize
  const items = all.slice(start, start + pageSize)

  return {
    query: rawQuery,
    normalizedQuery: query,
    pageNumber: safePage,
    pageSize,
    total,
    totalPages,
    items,
    canonicalHref: new URL(`/search/car-rentals/${encodeURIComponent(rawQuery)}/${safePage}`, url.origin).href,
  }
})

export default component$(() => {
  const data = useCarRentalSearch().value

  const hasResults = data.items.length > 0

  return (
    <Page>
      <Breadcrumbs
        items={[
          { label: 'Andacity Travel', href: '/' },
          { label: 'Car Rentals', href: '/car-rentals' },
          { label: 'Search', href: '/search/car-rentals/anywhere/1' },
          {
            label: data.query === 'anywhere' || data.query === 'all' ? 'Anywhere' : data.query,
            href: buildSearchHref(data.query, data.pageNumber),
          },
        ]}
      />
      
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            Search car rentals
          </h1>
          <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
            Results for{' '}
            <span class="font-semibold text-[color:var(--color-text-strong)]">
              {data.query === 'anywhere' || data.query === 'all' ? 'Anywhere' : data.query}
            </span>
            . Search pages stay noindex.
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <a class="t-btn-primary px-4 text-center" href="/car-rentals">
              Back to car rentals
            </a>

            {data.query && data.query !== 'anywhere' && data.query !== 'all' ? (
              <a class="t-btn-primary px-4 text-center" href={buildCityHref(data.query)}>
                Try city guide
              </a>
            ) : null}
          </div>

          <div class="mt-4 text-sm text-[color:var(--color-text-muted)]">
            {hasResults ? (
              <>
                Showing{' '}
                <span class="text-[color:var(--color-text-strong)]">
                  {rangeLabel(data.pageNumber, data.pageSize, data.total)}
                </span>{' '}
                of <span class="text-[color:var(--color-text-strong)]">{data.total.toLocaleString('en-US')}</span>
              </>
            ) : (
              <>No results found.</>
            )}
          </div>
        </div>

        {/* Pagination (top) */}
        {data.totalPages > 1 ? (
          <div class="flex flex-wrap items-center gap-2">
            <a
              class="t-btn-primary px-4 text-center"
              href={buildSearchHref(data.query, Math.max(1, data.pageNumber - 1))}
              aria-disabled={data.pageNumber <= 1}
            >
              Prev
            </a>

            <span class="text-sm text-[color:var(--color-text-muted)]">
              Page <span class="text-[color:var(--color-text-strong)]">{data.pageNumber}</span> of{' '}
              <span class="text-[color:var(--color-text-strong)]">{data.totalPages}</span>
            </span>

            <a
              class="t-btn-primary px-4 text-center"
              href={buildSearchHref(data.query, Math.min(data.totalPages, data.pageNumber + 1))}
              aria-disabled={data.pageNumber >= data.totalPages}
            >
              Next
            </a>
          </div>
        ) : null}
      </div>

      {/* Results */}
      {hasResults ? (
        <ListingCardGrid variant="car-rentals" items={data.items} />
      ) : (
        <div class="mt-6 t-card p-5">
          <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">No matches</div>
          <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
            Try a different query (e.g. <span class="font-semibold">orlando</span> or{' '}
            <span class="font-semibold">miami</span>), or browse the city guides.
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <a class="t-btn-primary px-4 text-center" href="/car-rentals/in/orlando">
              Orlando
            </a>
            <a class="t-btn-primary px-4 text-center" href="/car-rentals/in/las-vegas">
              Las Vegas
            </a>
            <a class="t-btn-primary px-4 text-center" href="/car-rentals/in/new-york-city">
              New York
            </a>
          </div>
        </div>
      )}

      {/* Pagination (bottom) */}
      {data.totalPages > 1 ? (
        <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
          <a
            class="t-btn-primary px-4 text-center"
            href={buildSearchHref(data.query, Math.max(1, data.pageNumber - 1))}
            aria-disabled={data.pageNumber <= 1}
          >
            Prev
          </a>

          <div class="text-sm text-[color:var(--color-text-muted)]">
            Page <span class="text-[color:var(--color-text-strong)]">{data.pageNumber}</span> of{' '}
            <span class="text-[color:var(--color-text-strong)]">{data.totalPages}</span>
          </div>

          <a
            class="t-btn-primary px-4 text-center"
            href={buildSearchHref(data.query, Math.min(data.totalPages, data.pageNumber + 1))}
            aria-disabled={data.pageNumber >= data.totalPages}
          >
            Next
          </a>
        </div>
      ) : null}
    </Page>
  )
})

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useCarRentalSearch)

  const qLabel = data.query === 'anywhere' || data.query === 'all' ? 'Anywhere' : data.query

  const title = `Search car rentals: ${qLabel} (Page ${data.pageNumber}) | Andacity Travel`
  const description =
    'Search car rentals by city or query. Search pages stay noindex; city guides and detail pages are indexable.'

  // Canonicalize to the current page (and normalize empty queries back to "anywhere")
  const canonicalHref = data.canonicalHref

  const robots = 'noindex,follow'

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
            item: new URL('/car-rentals', url.origin).href,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: `Search: ${qLabel}`,
            item: canonicalHref,
          },
        ],
      },
    ],
  })

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { name: 'robots', content: robots },
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
        key: 'ld-car-rentals-search',
        props: { type: 'application/ld+json' },
        script: jsonLd,
      },
    ],
  }
}

const buildCityHref = (citySlug: string) => {
  return `/car-rentals/in/${encodeURIComponent(citySlug)}`
}

const buildSearchHref = (query: string, pageNumber: number) => {
  const q = String(query || '').trim()
  const safeQ = q ? q : 'anywhere'
  return `/search/car-rentals/${encodeURIComponent(safeQ)}/${encodeURIComponent(String(pageNumber))}`
}

const buildCarRentalDetailHref = (rentalSlug: string) => {
  return `/car-rentals/${encodeURIComponent(rentalSlug)}`
}

const rangeLabel = (pageNumber: number, pageSize: number, total: number) => {
  const start = (pageNumber - 1) * pageSize + 1
  const end = Math.min(total, pageNumber * pageSize)
  return `${start.toLocaleString('en-US')}–${end.toLocaleString('en-US')}`
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
