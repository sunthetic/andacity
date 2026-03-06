import { $, component$, useSignal } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { useLocation } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { SearchMapCard } from '~/components/search/SearchMapCard'
import { SearchResultsSummary } from '~/components/search/SearchResultsSummary'
import { SearchEmptyState } from '~/components/search/SearchEmptyState'
import { FiltersPanel } from '~/components/search/filters/FiltersPanel'
import type { FilterSectionConfig, FilterValues } from '~/components/search/filters/types'
import { FlightResultCard } from '~/components/flights/search/FlightResultCard'
import type { FlightResult } from '~/types/flights/search'
import { ResultsToolbar } from '~/components/search/results/ResultsToolbar'
import { normalizeFlightItineraryType } from '~/lib/search/flights/routing'

const FLIGHTS_FILTER_DEFAULTS: FilterValues = {
  stops: [],
  priceRange: [],
  airline: [],
  departureWindow: [],
  arrivalWindow: [],
}

const FLIGHT_FILTER_SECTIONS: FilterSectionConfig[] = [
  {
    type: 'checkbox',
    id: 'stops',
    title: 'Stops',
    options: [
      { label: 'Nonstop', value: '0' },
      { label: '1 stop', value: '1' },
      { label: '2+ stops', value: '2plus' },
    ],
  },
  {
    type: 'checkbox',
    id: 'priceRange',
    title: 'Price range',
    options: [
      { label: 'Under $200', value: 'under-200' },
      { label: '$200–$400', value: '200-400' },
      { label: '$400–$700', value: '400-700' },
      { label: '$700+', value: '700-plus' },
    ],
  },
  {
    type: 'checkbox',
    id: 'airline',
    title: 'Airline',
    options: [
      { label: 'Delta', value: 'delta' },
      { label: 'American', value: 'american' },
      { label: 'United', value: 'united' },
      { label: 'Southwest', value: 'southwest' },
    ],
  },
  {
    type: 'checkbox',
    id: 'departureWindow',
    title: 'Departure time',
    options: [
      { label: 'Morning', value: 'morning' },
      { label: 'Afternoon', value: 'afternoon' },
      { label: 'Evening', value: 'evening' },
      { label: 'Overnight', value: 'overnight' },
    ],
  },
  {
    type: 'checkbox',
    id: 'arrivalWindow',
    title: 'Arrival time',
    options: [
      { label: 'Morning', value: 'morning' },
      { label: 'Afternoon', value: 'afternoon' },
      { label: 'Evening', value: 'evening' },
      { label: 'Overnight', value: 'overnight' },
    ],
  },
]

export const useSearchFlightsPage = routeLoader$(({ params, url }) => {
  const query = String(params.query || 'anywhere').trim() || 'anywhere'
  const page = clampInt(params.pageNumber, 1, 9999)

  const from = String(url.searchParams.get('from') || '').trim() || 'Denver'
  const to = String(url.searchParams.get('to') || '').trim() || 'New York'
  const depart = String(url.searchParams.get('depart') || '').trim()
  const itineraryType = normalizeFlightItineraryType(String(url.searchParams.get('itineraryType') || '').trim().toLowerCase())
  const ret = itineraryType === 'round-trip' ? String(url.searchParams.get('return') || '').trim() : ''
  const travelers = String(url.searchParams.get('travelers') || '').trim()
  const cabin = String(url.searchParams.get('cabin') || '').trim()

  return {
    query,
    qHuman: safeTitleQuery(query),
    page,
    from,
    to,
    depart,
    ret,
    itineraryType,
    travelers,
    cabin,
    results: FLIGHT_RESULTS,
  }
})

export default component$(() => {
  const data = useSearchFlightsPage().value
  const location = useLocation()

  const values = useSignal<FilterValues>({ ...FLIGHTS_FILTER_DEFAULTS })
  const sort = useSignal<FlightSort>('best')
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
    values.value = { ...FLIGHTS_FILTER_DEFAULTS }
  })
  const onSortChange$ = $((value: string) => {
    if (value === 'best' || value === 'price' || value === 'duration') {
      sort.value = value
    }
  })
  const onToggleFilters$ = $(() => {
    mobileFiltersOpen.value = !mobileFiltersOpen.value
  })

  const filteredResults = data.results.filter((flight) => matchesFlightFilters(flight, values.value))
  const sortedResults = sortFlights(filteredResults, sort.value)
  const contextParts = [`${data.from} to ${data.to}`]
  if (data.depart) {
    contextParts.push(`Depart ${data.depart}`)
  }
  if (data.ret) {
    contextParts.push(`Return ${data.ret}`)
  }
  const searchAgainParams = new URLSearchParams()
  searchAgainParams.set('itineraryType', data.itineraryType)
  searchAgainParams.set('from', data.from)
  searchAgainParams.set('to', data.to)
  if (data.depart) {
    searchAgainParams.set('depart', data.depart)
  }
  if (data.itineraryType === 'round-trip' && data.ret) {
    searchAgainParams.set('return', data.ret)
  }
  if (data.travelers) {
    searchAgainParams.set('travelers', data.travelers)
  }
  if (data.cabin) {
    searchAgainParams.set('cabin', data.cabin)
  }
  const searchAgainHref = `/flights?${searchAgainParams.toString()}`

  return (
    <Page breadcrumbs={[
      { label: 'Andacity Travel', href: '/' },
      { label: 'Flights', href: '/flights' },
      { label: 'Search', href: '/search/flights' },
      { label: data.qHuman, href: location.url.pathname },
    ]}>
      <div class="mt-4">
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          Flight search results
        </h1>
        <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">{contextParts.join(' · ')}</p>
      </div>

      <ResultsToolbar
        sortId="flight-results-sort"
        resultCountLabel={`${sortedResults.length.toLocaleString('en-US')} flights found`}
        sortValue={sort.value}
        sortOptions={FLIGHT_SORT_OPTIONS}
        mobileFiltersOpen={mobileFiltersOpen.value}
        onSortChange$={onSortChange$}
        onToggleFilters$={onToggleFilters$}
      />

      <div class="mt-4 lg:hidden">
        {mobileFiltersOpen.value ? (
          <FiltersPanel
            title="Filters"
            sections={FLIGHT_FILTER_SECTIONS}
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
          sections={FLIGHT_FILTER_SECTIONS}
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
                sortedResults.map((flight) => <FlightResultCard key={flight.id} flight={flight} />)
              ) : (
                <SearchEmptyState
                  title="No flights matched this search"
                  description="Try broader time windows, fewer stop restrictions, or different routes."
                  primaryAction={{ label: 'Search flights again', href: searchAgainHref }}
                  secondaryAction={{ label: 'Browse destinations', href: '/destinations' }}
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
  const data = resolveValue(useSearchFlightsPage)
  const title = `Flights from ${data.from} to ${data.to} – Page ${data.page} | Andacity Travel`
  const description = `Browse flight results from ${data.from} to ${data.to} with simple, fast filters.`
  const canonicalPath = `/search/flights/${encodeURIComponent(data.query)}/${data.page}`
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

const matchesFlightFilters = (flight: FlightResult, values: FilterValues) => {
  const selectedStops = toSelected(values.stops)
  const selectedPriceRanges = toSelected(values.priceRange)
  const selectedAirlines = toSelected(values.airline)
  const selectedDepartureWindows = toSelected(values.departureWindow)
  const selectedArrivalWindows = toSelected(values.arrivalWindow)

  if (selectedStops.length && !selectedStops.some((stop) => matchesStops(flight.stops, stop))) {
    return false
  }

  if (selectedPriceRanges.length && !selectedPriceRanges.some((range) => inFlightPriceRange(flight.price, range))) {
    return false
  }

  if (selectedAirlines.length && !selectedAirlines.includes(flight.airline.toLowerCase())) {
    return false
  }

  if (selectedDepartureWindows.length && !selectedDepartureWindows.includes(flight.departureWindow)) {
    return false
  }

  if (selectedArrivalWindows.length && !selectedArrivalWindows.includes(flight.arrivalWindow)) {
    return false
  }

  return true
}

const matchesStops = (stops: number, selected: string) => {
  if (selected === '0') return stops === 0
  if (selected === '1') return stops === 1
  if (selected === '2plus') return stops >= 2
  return true
}

const inFlightPriceRange = (price: number, range: string) => {
  if (range === 'under-200') return price < 200
  if (range === '200-400') return price >= 200 && price <= 400
  if (range === '400-700') return price > 400 && price <= 700
  if (range === '700-plus') return price > 700
  return true
}

const toSelected = (value: string[] | string | undefined) => {
  return Array.isArray(value) ? value : []
}

const clampInt = (value: string | undefined, min: number, max: number) => {
  const n = Number.parseInt(String(value || ''), 10)
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

const safeTitleQuery = (query: string) => {
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

const FLIGHT_SORT_OPTIONS = [
  { label: 'Best', value: 'best' },
  { label: 'Price', value: 'price' },
  { label: 'Duration', value: 'duration' },
]

type FlightSort = 'best' | 'price' | 'duration'

const sortFlights = (items: FlightResult[], sort: FlightSort) => {
  return [...items].sort((a, b) => {
    if (sort === 'price') return a.price - b.price
    if (sort === 'duration') return flightDurationMinutes(a) - flightDurationMinutes(b)
    const stopsCompare = a.stops - b.stops
    if (stopsCompare !== 0) return stopsCompare
    const durationCompare = flightDurationMinutes(a) - flightDurationMinutes(b)
    if (durationCompare !== 0) return durationCompare
    return a.price - b.price
  })
}

const flightDurationMinutes = (flight: FlightResult) => {
  const diff = flight.arrivalMinutes - flight.departureMinutes
  return diff >= 0 ? diff : diff + 24 * 60
}

const FLIGHT_RESULTS: FlightResult[] = [
  {
    id: 'flt-1',
    airline: 'Delta',
    origin: 'Denver (DEN)',
    destination: 'New York (JFK)',
    departureTime: '06:10',
    arrivalTime: '11:45',
    departureMinutes: 370,
    arrivalMinutes: 705,
    departureWindow: 'morning',
    arrivalWindow: 'morning',
    stops: 0,
    stopsLabel: 'Nonstop',
    duration: '3h 35m',
    price: 189,
    currency: 'USD',
  },
  {
    id: 'flt-2',
    airline: 'American',
    origin: 'Denver (DEN)',
    destination: 'New York (LGA)',
    departureTime: '09:20',
    arrivalTime: '15:10',
    departureMinutes: 560,
    arrivalMinutes: 910,
    departureWindow: 'morning',
    arrivalWindow: 'afternoon',
    stops: 1,
    stopsLabel: '1 stop',
    duration: '4h 50m',
    price: 248,
    currency: 'USD',
  },
  {
    id: 'flt-3',
    airline: 'United',
    origin: 'Denver (DEN)',
    destination: 'New York (EWR)',
    departureTime: '13:40',
    arrivalTime: '19:20',
    departureMinutes: 820,
    arrivalMinutes: 1160,
    departureWindow: 'afternoon',
    arrivalWindow: 'evening',
    stops: 0,
    stopsLabel: 'Nonstop',
    duration: '3h 40m',
    price: 332,
    currency: 'USD',
  },
  {
    id: 'flt-4',
    airline: 'Southwest',
    origin: 'Denver (DEN)',
    destination: 'New York (LGA)',
    departureTime: '16:55',
    arrivalTime: '23:30',
    departureMinutes: 1015,
    arrivalMinutes: 1410,
    departureWindow: 'evening',
    arrivalWindow: 'evening',
    stops: 1,
    stopsLabel: '1 stop',
    duration: '5h 35m',
    price: 281,
    currency: 'USD',
  },
  {
    id: 'flt-5',
    airline: 'Delta',
    origin: 'Denver (DEN)',
    destination: 'New York (JFK)',
    departureTime: '22:45',
    arrivalTime: '05:40',
    departureMinutes: 1365,
    arrivalMinutes: 340,
    departureWindow: 'overnight',
    arrivalWindow: 'morning',
    stops: 1,
    stopsLabel: '1 stop',
    duration: '5h 55m',
    price: 418,
    currency: 'USD',
  },
  {
    id: 'flt-6',
    airline: 'American',
    origin: 'Denver (DEN)',
    destination: 'New York (JFK)',
    departureTime: '20:10',
    arrivalTime: '06:35',
    departureMinutes: 1210,
    arrivalMinutes: 395,
    departureWindow: 'evening',
    arrivalWindow: 'morning',
    stops: 2,
    stopsLabel: '2+ stops',
    duration: '8h 25m',
    price: 167,
    currency: 'USD',
  },
  {
    id: 'flt-7',
    airline: 'United',
    origin: 'Denver (DEN)',
    destination: 'New York (EWR)',
    departureTime: '11:15',
    arrivalTime: '17:05',
    departureMinutes: 675,
    arrivalMinutes: 1025,
    departureWindow: 'morning',
    arrivalWindow: 'afternoon',
    stops: 1,
    stopsLabel: '1 stop',
    duration: '4h 50m',
    price: 512,
    currency: 'USD',
  },
  {
    id: 'flt-8',
    airline: 'Southwest',
    origin: 'Denver (DEN)',
    destination: 'New York (LGA)',
    departureTime: '05:55',
    arrivalTime: '13:30',
    departureMinutes: 355,
    arrivalMinutes: 810,
    departureWindow: 'morning',
    arrivalWindow: 'afternoon',
    stops: 2,
    stopsLabel: '2+ stops',
    duration: '6h 35m',
    price: 736,
    currency: 'USD',
  },
]
