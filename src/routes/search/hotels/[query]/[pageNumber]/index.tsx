import { $, component$, useSignal } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { useLocation } from '@builder.io/qwik-city'
import { HOTELS } from '~/data/hotels'
import { Page } from '~/components/site/Page'
import { HotelResultCard } from '~/components/hotels/search/HotelResultCard'
import type { HotelResult } from '~/types/hotels/search'
import { mapHotelsToResults } from '~/lib/search/hotels/mapHotelsToResults'
import { clampInt, normalizeQuery, normalizeSort, safeTitleQuery } from '~/lib/search/hotels/normalize'
import { formatMoney } from '~/lib/formatMoney'
import { SearchMapCard } from '~/components/search/SearchMapCard'
import { SearchResultsSummary } from '~/components/search/SearchResultsSummary'
import { SearchHeaderBar } from '~/components/search/SearchHeaderBar'
import { SearchEmptyState } from '~/components/search/SearchEmptyState'
import { computeNights } from '~/lib/search/hotels/dates'
import { FiltersPanel } from '~/components/search/filters/FiltersPanel'
import type { FilterSectionConfig, FilterValues } from '~/components/search/filters/types'

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

const HOTEL_FILTER_DEFAULTS: FilterValues = {
  priceRange: [],
  starRating: [],
  guestRating: [],
  amenities: [],
}

export const useSearchHotelsPage = routeLoader$(({ params, url }) => {
  const query = normalizeQuery(params.query)
  const page = clampInt(params.pageNumber, 1, 9999)
  const sort = normalizeSort(url.searchParams.get('sort'))

  const results = mapHotelsToResults(HOTELS, query).slice().sort((a, b) => {
    if (sort === 'price-asc') return a.priceFrom - b.priceFrom
    if (sort === 'price-desc') return b.priceFrom - a.priceFrom
    if (sort === 'rating-desc') return b.rating - a.rating
    if (sort === 'reviewcount-desc') return b.reviewCount - a.reviewCount
    return b.score - a.score
  })

  const price = {
    min: results.length ? Math.min(...results.map((x) => x.priceFrom)) : null,
    max: results.length ? Math.max(...results.map((x) => x.priceFrom)) : null,
    currency: 'USD',
  }

  return {
    query,
    page,
    qHuman: safeTitleQuery(query),
    results,
    sort,
    price,
  }
})

export default component$(() => {
  const data = useSearchHotelsPage().value
  const location = useLocation()

  const pathBase = `/search/hotels/${encodeURIComponent(data.query)}`
  const page1Action = `${pathBase}/1`

  const nights = computeNights(location.url.searchParams.get('checkIn'), location.url.searchParams.get('checkOut'))

  const values = useSignal<FilterValues>({ ...HOTEL_FILTER_DEFAULTS })
  const mobileFiltersOpen = useSignal(false)

  const onCheckboxToggle$ = $((sectionId: string, optionValue: string) => {
    const current = values.value[sectionId]
    if (!Array.isArray(current)) return

    const nextValues = current.includes(optionValue)
      ? current.filter((value) => value !== optionValue)
      : [...current, optionValue]

    values.value = {
      ...values.value,
      [sectionId]: nextValues,
    }
  })

  const onSelectChange$ = $((sectionId: string, value: string) => {
    values.value = {
      ...values.value,
      [sectionId]: value,
    }
  })

  const onReset$ = $(() => {
    values.value = { ...HOTEL_FILTER_DEFAULTS }
  })

  const filteredResults = data.results.filter((hotel) => matchesHotelFilters(hotel, values.value))

  return (
    <Page breadcrumbs={[
      { label: 'Andacity Travel', href: '/' },
      { label: 'Hotels', href: '/hotels' },
      { label: 'Search', href: '/search/hotels' },
      { label: data.qHuman, href: `${pathBase}/1` },
    ]}>
      <SearchHeaderBar
        title={`Hotels in ${data.qHuman}`}
        description="Transparent totals, clear policies, and fast filtering. Search result pages are noindex."
      >
        <span q:slot="badges" class="t-badge">
          {filteredResults.length.toLocaleString('en-US')} results
        </span>

        {data.price.min != null && data.price.max != null ? (
          <span q:slot="badges" class="t-badge">
            From {formatMoney(data.price.min, data.price.currency)}–{formatMoney(data.price.max, data.price.currency)}
          </span>
        ) : null}

        <span q:slot="badges" class="t-badge">
          Hotels search
        </span>

        <form method="get" action={page1Action} class="t-panel flex items-center gap-2 p-3" q:slot="sort">
          <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Sort</label>
          <select
            name="sort"
            class="rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
            value={data.sort}
          >
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
            <option value="rating-desc">Rating</option>
            <option value="reviewcount-desc">Review count</option>
          </select>

          <button class="t-btn-primary" type="submit">
            Apply
          </button>
        </form>
      </SearchHeaderBar>

      <div class="mt-6 grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
        <FiltersPanel
          title="Filters"
          class="hidden lg:block"
          sections={HOTEL_FILTER_SECTIONS}
          values={values.value}
          onCheckboxToggle$={onCheckboxToggle$}
          onSelectChange$={onSelectChange$}
          onReset$={onReset$}
        />

        <main>
          <div class="mb-4 lg:hidden">
            <button class="t-btn-primary w-full" type="button" onClick$={() => { mobileFiltersOpen.value = !mobileFiltersOpen.value }}>
              {mobileFiltersOpen.value ? 'Hide filters' : 'Show filters'}
            </button>

            {mobileFiltersOpen.value ? (
              <div class="mt-3">
                <FiltersPanel
                  title="Filters"
                  sections={HOTEL_FILTER_SECTIONS}
                  values={values.value}
                  onCheckboxToggle$={onCheckboxToggle$}
                  onSelectChange$={onSelectChange$}
                  onReset$={onReset$}
                />
              </div>
            ) : null}
          </div>

          <SearchMapCard />

          <section class="mt-6">
            <SearchResultsSummary
              shown={filteredResults.length}
              total={data.results.length}
              page={1}
              totalPages={1}
            />

            <div class="mt-4 grid gap-3">
              {filteredResults.length ? (
                filteredResults.map((hotel: HotelResult) => <HotelResultCard key={hotel.id} h={hotel} nights={nights} />)
              ) : (
                <SearchEmptyState
                  title="No hotels matched this search"
                  description="Try different dates, a broader destination, or fewer constraints."
                  primaryAction={{ label: 'Search hotels again', href: '/hotels' }}
                  secondaryAction={{ label: 'Browse hotel cities', href: '/hotels' }}
                />
              )}
            </div>
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

const matchesHotelFilters = (hotel: HotelResult, values: FilterValues) => {
  const selectedPriceRanges = toSelected(values.priceRange)
  const selectedStarRatings = toSelected(values.starRating)
  const selectedGuestRatings = toSelected(values.guestRating)
  const selectedAmenities = toSelected(values.amenities)

  if (selectedPriceRanges.length && !selectedPriceRanges.some((range) => inHotelPriceRange(hotel.priceFrom, range))) {
    return false
  }

  if (selectedStarRatings.length && !selectedStarRatings.includes(String(hotel.stars))) {
    return false
  }

  if (selectedGuestRatings.length) {
    const guestScore = hotel.rating <= 5 ? hotel.rating * 2 : hotel.rating
    if (!selectedGuestRatings.some((rating) => guestScore >= Number(rating))) {
      return false
    }
  }

  if (selectedAmenities.length) {
    const normalizedAmenities = hotel.amenities.map((amenity) => amenity.toLowerCase())
    const amenityMap: Record<string, string> = {
      pool: 'pool',
      wifi: 'wifi',
      parking: 'parking',
      'pet-friendly': 'pet',
    }

    const hasAmenity = (amenity: string) => {
      const needle = amenityMap[amenity] ?? amenity
      return normalizedAmenities.some((item) => item.includes(needle))
    }

    if (!selectedAmenities.every(hasAmenity)) {
      return false
    }
  }

  return true
}

const inHotelPriceRange = (price: number, range: string) => {
  if (range === 'under-150') return price < 150
  if (range === '150-300') return price >= 150 && price <= 300
  if (range === '300-500') return price > 300 && price <= 500
  if (range === '500-plus') return price > 500
  return true
}

const toSelected = (value: string[] | string | undefined) => {
  return Array.isArray(value) ? value : []
}
