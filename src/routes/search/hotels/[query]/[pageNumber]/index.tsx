import { $, component$, useSignal } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { useLocation } from '@builder.io/qwik-city'
import { HOTELS } from '~/data/hotels'
import { Page } from '~/components/site/Page'
import { HotelResultCard } from '~/components/hotels/search/HotelResultCard'
import type { HotelResult } from '~/types/hotels/search'
import { mapHotelsToResults } from '~/lib/search/hotels/mapHotelsToResults'
import { clampInt, normalizeQuery, safeTitleQuery } from '~/lib/search/hotels/normalize'
import { SearchMapCard } from '~/components/search/SearchMapCard'
import { SearchResultsSummary } from '~/components/search/SearchResultsSummary'
import { SearchEmptyState } from '~/components/search/SearchEmptyState'
import { computeNights } from '~/lib/search/hotels/dates'
import { FiltersPanel } from '~/components/search/filters/FiltersPanel'
import type { FilterSectionConfig, FilterValues } from '~/components/search/filters/types'
import { ResultsToolbar } from '~/components/search/results/ResultsToolbar'

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

export const useSearchHotelsPage = routeLoader$(({ params }) => {
  const query = normalizeQuery(params.query)
  const page = clampInt(params.pageNumber, 1, 9999)
  const results = mapHotelsToResults(HOTELS, query)

  return {
    query,
    page,
    qHuman: safeTitleQuery(query),
    results,
  }
})

export default component$(() => {
  const data = useSearchHotelsPage().value
  const location = useLocation()

  const pathBase = `/search/hotels/${encodeURIComponent(data.query)}`

  const nights = computeNights(location.url.searchParams.get('checkIn'), location.url.searchParams.get('checkOut'))

  const values = useSignal<FilterValues>({ ...HOTEL_FILTER_DEFAULTS })
  const sort = useSignal<HotelSort>('recommended')
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
  const onSortChange$ = $((value: string) => {
    if (value === 'recommended' || value === 'price' || value === 'rating') {
      sort.value = value
    }
  })
  const onToggleFilters$ = $(() => {
    mobileFiltersOpen.value = !mobileFiltersOpen.value
  })

  const filteredResults = data.results.filter((hotel) => matchesHotelFilters(hotel, values.value))
  const sortedResults = sortHotels(filteredResults, sort.value)
  const contextParts = [`Destination: ${data.qHuman}`]
  if (nights != null) {
    contextParts.push(`${nights} ${nights === 1 ? 'night' : 'nights'}`)
  }

  return (
    <Page breadcrumbs={[
      { label: 'Andacity Travel', href: '/' },
      { label: 'Hotels', href: '/hotels' },
      { label: 'Search', href: '/search/hotels' },
      { label: data.qHuman, href: `${pathBase}/1` },
    ]}>
      <div class="mt-4">
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          Hotel search results
        </h1>
        <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">{contextParts.join(' · ')}</p>
      </div>

      <ResultsToolbar
        sortId="hotel-results-sort"
        resultCountLabel={`${sortedResults.length.toLocaleString('en-US')} hotels found`}
        sortValue={sort.value}
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
            values={values.value}
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
          values={values.value}
          onCheckboxToggle$={onCheckboxToggle$}
          onSelectChange$={onSelectChange$}
          onReset$={onReset$}
        />

        <main>
          <SearchMapCard />

          <section class="mt-6">
            <SearchResultsSummary
              shown={sortedResults.length}
              total={data.results.length}
              page={1}
              totalPages={1}
            />

            <div class="mt-4 grid gap-3">
              {sortedResults.length ? (
                sortedResults.map((hotel: HotelResult) => <HotelResultCard key={hotel.id} h={hotel} nights={nights} />)
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

const HOTEL_SORT_OPTIONS = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price', value: 'price' },
  { label: 'Rating', value: 'rating' },
]

type HotelSort = 'recommended' | 'price' | 'rating'

const sortHotels = (items: HotelResult[], sort: HotelSort) => {
  return [...items].sort((a, b) => {
    if (sort === 'price') return a.priceFrom - b.priceFrom
    if (sort === 'rating') return b.rating - a.rating
    return b.score - a.score
  })
}
