import { $, component$, useSignal } from '@builder.io/qwik'
import { routeLoader$, useLocation, useNavigate } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { revalidateInventoryApi } from '~/lib/inventory/inventory-api'
import { Page } from '~/components/site/Page'
import { HotelResultCard } from '~/components/hotels/search/HotelResultCard'
import { InventoryRefreshControl } from '~/components/inventory/InventoryRefreshControl'
import type { HotelResult } from '~/types/hotels/search'
import { loadHotelResultsFromDb } from '~/lib/queries/hotels-search.server'
import {
  clampInt,
  normalizeQuery,
  safeTitleQuery,
} from '~/lib/search/hotels/normalize'
import { SearchMapCard } from '~/components/search/SearchMapCard'
import { SearchResultsSummary } from '~/components/search/SearchResultsSummary'
import { SearchEmptyState } from '~/components/search/SearchEmptyState'
import { computeNights } from '~/lib/search/hotels/dates'
import { FiltersPanel } from '~/components/search/filters/FiltersPanel'
import type {
  FilterSectionConfig,
  FilterValues,
} from '~/components/search/filters/types'
import { ResultsToolbar } from '~/components/search/results/ResultsToolbar'
import { ResultsPagination } from '~/components/results/ResultsPagination'

const HOTEL_FILTER_SECTIONS: FilterSectionConfig[] = [
  {
    type: 'checkbox',
    id: 'priceRange',
    title: 'Price range',
    options: [
      { label: 'Under $150', value: 'under-150' },
      { label: '$150–$300', value: '150-300' },
      { label: '$300–$500', value: '300-500' },
      { label: '$500+', value: '500-plus' },
    ],
  },
  {
    type: 'checkbox',
    id: 'starRating',
    title: 'Star rating',
    options: [
      { label: '3-star', value: '3' },
      { label: '4-star', value: '4' },
      { label: '5-star', value: '5' },
    ],
  },
  {
    type: 'checkbox',
    id: 'guestRating',
    title: 'Guest rating',
    options: [
      { label: '7+', value: '7' },
      { label: '8+', value: '8' },
      { label: '9+', value: '9' },
    ],
  },
  {
    type: 'checkbox',
    id: 'amenities',
    title: 'Amenities',
    options: [
      { label: 'Pool', value: 'pool' },
      { label: 'Wi-Fi', value: 'wifi' },
      { label: 'Parking', value: 'parking' },
      { label: 'Pet friendly', value: 'pet-friendly' },
    ],
  },
]

const HOTEL_SORT_OPTIONS = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price', value: 'price' },
  { label: 'Rating', value: 'rating' },
]

const parseMultiValue = (url: URL, key: string) => {
  const values = url.searchParams
    .getAll(key)
    .flatMap((entry) => String(entry || '').split(','))
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)

  return Array.from(new Set(values))
}

const parseSort = (url: URL) => {
  const value = String(url.searchParams.get('sort') || '').trim().toLowerCase()
  if (value === 'price' || value === 'rating' || value === 'price-desc') return value
  return 'recommended'
}

const toPageHref = (basePath: string, page: number, searchParams: URLSearchParams) => {
  const qs = searchParams.toString()
  return qs ? `${basePath}/${page}?${qs}` : `${basePath}/${page}`
}

const buildPageLinks = (
  page: number,
  totalPages: number,
  makeHref: (pageNumber: number) => string,
) => {
  const links: { label: string; href: string; active?: boolean }[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)

  for (let value = start; value <= end; value += 1) {
    links.push({
      label: String(value),
      href: makeHref(value),
      active: value === page,
    })
  }

  return links
}

export const useSearchHotelsPage = routeLoader$(async ({ params, url }) => {
  const query = normalizeQuery(params.query)
  const page = clampInt(params.pageNumber, 1, 9999)
  const checkIn = String(url.searchParams.get('checkIn') || '').trim() || null
  const checkOut = String(url.searchParams.get('checkOut') || '').trim() || null

  const filters = {
    priceRange: parseMultiValue(url, 'priceRange'),
    starRating: parseMultiValue(url, 'starRating'),
    guestRating: parseMultiValue(url, 'guestRating'),
    amenities: parseMultiValue(url, 'amenities'),
  }

  const sort = parseSort(url)

  const source = await loadHotelResultsFromDb({
    query,
    checkIn,
    checkOut,
    sort,
    page,
    pageSize: 24,
    filters,
  })

  const qHuman = source.matchedCity?.name || safeTitleQuery(query).replaceAll('-', ' ')

  return {
    query,
    page: source.page,
    qHuman,
    results: source.results,
    totalCount: source.totalCount,
    totalPages: source.totalPages,
    sort,
    filters,
  }
})

export default component$(() => {
  const data = useSearchHotelsPage().value
  const location = useLocation()
  const navigate = useNavigate()

  const pathBase = `/search/hotels/${encodeURIComponent(data.query)}`
  const mobileFiltersOpen = useSignal(false)

  const nights = computeNights(
    location.url.searchParams.get('checkIn'),
    location.url.searchParams.get('checkOut'),
  )

  const activeFilters: FilterValues = {
    priceRange: data.filters.priceRange,
    starRating: data.filters.starRating,
    guestRating: data.filters.guestRating,
    amenities: data.filters.amenities,
  }

  const onCheckboxToggle$ = $(async (sectionId: string, optionValue: string) => {
    const params = new URLSearchParams(location.url.searchParams)
    const key = sectionId
    const current = new Set(
      String(params.get(key) || '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    )

    if (current.has(optionValue)) {
      current.delete(optionValue)
    } else {
      current.add(optionValue)
    }

    if (!current.size) {
      params.delete(key)
    } else {
      params.set(key, Array.from(current).join(','))
    }

    await navigate(toPageHref(pathBase, 1, params))
  })

  const onSelectChange$ = $(async (sectionId: string, value: string) => {
    void sectionId
    void value
    // Hotels filters are checkbox-based in this view.
  })

  const onReset$ = $(async () => {
    const params = new URLSearchParams(location.url.searchParams)
    params.delete('priceRange')
    params.delete('starRating')
    params.delete('guestRating')
    params.delete('amenities')
    params.delete('sort')
    await navigate(toPageHref(pathBase, 1, params))
  })

  const onSortChange$ = $(async (value: string) => {
    const params = new URLSearchParams(location.url.searchParams)
    if (value === 'recommended') {
      params.delete('sort')
    } else if (value === 'price' || value === 'rating' || value === 'price-desc') {
      params.set('sort', value)
    }

    await navigate(toPageHref(pathBase, 1, params))
  })

  const onToggleFilters$ = $(() => {
    mobileFiltersOpen.value = !mobileFiltersOpen.value
  })

  const contextParts = [`Destination: ${data.qHuman}`]
  if (nights != null) {
    contextParts.push(`${nights} ${nights === 1 ? 'night' : 'nights'}`)
  }

  const destination =
    String(location.url.searchParams.get('destination') || '').trim() ||
    data.qHuman
  const checkIn = String(location.url.searchParams.get('checkIn') || '').trim()
  const checkOut = String(
    location.url.searchParams.get('checkOut') || '',
  ).trim()
  const guests = String(location.url.searchParams.get('guests') || '').trim()
  const searchAgainParams = new URLSearchParams()
  if (destination) {
    searchAgainParams.set('destination', destination)
  }
  if (checkIn) {
    searchAgainParams.set('checkIn', checkIn)
  }
  if (checkOut) {
    searchAgainParams.set('checkOut', checkOut)
  }
  if (guests) {
    searchAgainParams.set('guests', guests)
  }
  const searchAgainHref = searchAgainParams.toString()
    ? `/hotels?${searchAgainParams.toString()}`
    : '/hotels'

  const makePageHref = (pageNumber: number) =>
    toPageHref(pathBase, pageNumber, location.url.searchParams)
  const refreshHref = `${location.url.pathname}${location.url.search}`
  const visibleInventoryIds = data.results.flatMap((hotel) =>
    hotel.inventoryId != null ? [hotel.inventoryId] : [],
  )
  const detailParams = new URLSearchParams()
  if (checkIn) detailParams.set('checkIn', checkIn)
  if (checkOut) detailParams.set('checkOut', checkOut)

  const onRevalidateVisibleResults$ = $(async () => {
    if (!visibleInventoryIds.length) {
      throw new Error('No visible hotel inventory can be revalidated.')
    }

    await revalidateInventoryApi({
      itemType: 'hotel',
      inventoryIds: visibleInventoryIds,
    })
  })

  return (
    <Page
      breadcrumbs={[
        { label: 'Andacity Travel', href: '/' },
        { label: 'Hotels', href: '/hotels' },
        { label: 'Search', href: '/search/hotels' },
        { label: data.qHuman, href: `${pathBase}/1` },
      ]}
    >
      <div class="mt-4">
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          Hotel search results
        </h1>
        <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
          {contextParts.join(' · ')}
        </p>
      </div>

      <div class="mt-4 flex justify-end">
        <InventoryRefreshControl
          id={`hotel-search:${refreshHref}`}
          mode={visibleInventoryIds.length ? 'action' : 'unsupported'}
          onRefresh$={
            visibleInventoryIds.length ? onRevalidateVisibleResults$ : undefined
          }
          reloadHref={refreshHref}
          reloadOnSuccess={true}
          label="Refresh visible availability"
          refreshingLabel="Refreshing..."
          refreshedLabel="Availability refreshed"
          failedLabel="Retry refresh"
          unsupportedLabel="Refresh unavailable"
          unsupportedMessage="No visible hotel inventory can refresh availability right now."
          successMessage="Visible hotel availability signals were refreshed from the latest stored inventory."
          failureMessage="Failed to refresh visible hotel availability signals."
          align="right"
        />
      </div>

      <ResultsToolbar
        sortId="hotel-results-sort"
        resultCountLabel={`${data.totalCount.toLocaleString('en-US')} hotels found`}
        sortValue={data.sort}
        sortOptions={HOTEL_SORT_OPTIONS}
        mobileFiltersOpen={mobileFiltersOpen.value}
        onSortChange$={onSortChange$}
        onToggleFilters$={onToggleFilters$}
      />

      <div class="mt-4 lg:hidden">
        {mobileFiltersOpen.value ? (
          <FiltersPanel
            title="Filters"
            sections={HOTEL_FILTER_SECTIONS}
            values={activeFilters}
            onCheckboxToggle$={onCheckboxToggle$}
            onSelectChange$={onSelectChange$}
            onReset$={onReset$}
          />
        ) : null}
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
        <FiltersPanel
          title="Filters"
          class="hidden lg:block"
          sections={HOTEL_FILTER_SECTIONS}
          values={activeFilters}
          onCheckboxToggle$={onCheckboxToggle$}
          onSelectChange$={onSelectChange$}
          onReset$={onReset$}
        />

        <main>
          <SearchMapCard />

          <section class="mt-6">
            <SearchResultsSummary
              shown={data.results.length}
              total={data.totalCount}
              page={data.page}
              totalPages={data.totalPages}
            />

            <div class="mt-4 grid gap-3">
              {data.results.length ? (
                data.results.map((hotel: HotelResult) => (
                  <HotelResultCard
                    key={hotel.id}
                    h={hotel}
                    nights={nights}
                    detailHref={
                      detailParams.size
                        ? `/hotels/${encodeURIComponent(hotel.slug)}?${detailParams.toString()}`
                        : `/hotels/${encodeURIComponent(hotel.slug)}`
                    }
                  />
                ))
              ) : (
                <SearchEmptyState
                  title="No hotels matched this search"
                  description="Try different dates, a broader destination, or fewer constraints."
                  primaryAction={{
                    label: 'Search hotels again',
                    href: searchAgainHref,
                  }}
                  secondaryAction={{
                    label: 'Browse hotel cities',
                    href: '/hotels',
                  }}
                />
              )}
            </div>

            <ResultsPagination
              page={data.page}
              totalPages={data.totalPages}
              prevHref={data.page > 1 ? makePageHref(data.page - 1) : undefined}
              nextHref={
                data.page < data.totalPages
                  ? makePageHref(data.page + 1)
                  : undefined
              }
              pageLinks={buildPageLinks(data.page, data.totalPages, makePageHref)}
            />
          </section>
        </main>
      </div>
    </Page>
  )
})

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useSearchHotelsPage)

  const title = `Hotels in ${data.qHuman} – Page ${data.page} | Andacity Travel`
  const description = `Browse hotel results for ${data.qHuman}. Compare totals and policies with clarity.`
  const canonicalPath = `/search/hotels/${encodeURIComponent(data.query)}/${data.page}`
  const canonicalHref = new URL(canonicalPath, url.origin).href

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { name: 'robots', content: 'noindex,follow,max-image-preview:large' },
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
