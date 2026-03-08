import { component$ } from '@builder.io/qwik'
import { FlightCard } from '~/components/flights/FlightCard'
import { FlightFilters } from '~/components/flights/FlightFilters'
import type { FlightFilterGroup } from '~/components/flights/FlightFilters'
import { ResultsShell } from '~/components/results/ResultsShell'
import type { ResultsSortOption } from '~/components/results/ResultsSort'
import { FLIGHT_SORT_OPTIONS } from '~/lib/search/flights/flight-sort-options'
import { mapSearchStateToFlights } from '~/lib/search/flights/map-search-state-to-flights'
import { searchStateToUrl } from '~/lib/search/state-to-url'
import type { FlightItineraryTypeSlug } from '~/lib/search/flights/routing'
import type { FlightResult, FlightTimeWindow } from '~/types/flights/search'
import type { SearchState } from '~/types/search/state'

const PAGE_SIZE = 6

const normalizeToken = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '')

const titleCase = (token: string) =>
  normalizeToken(token)
    .split('-')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ')

const clampPage = (page: number, totalPages: number) => {
  if (page < 1) return 1
  if (page > totalPages) return totalPages
  return page
}

const formatDate = (isoDate: string | undefined) => {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return ''
  const [y, m, d] = isoDate.split('-').map((x) => Number.parseInt(x, 10))
  const date = new Date(Date.UTC(y, m - 1, d))
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)
}

const buildQuerySummary = (
  fromLabel: string,
  toLabel: string,
  itineraryType: FlightItineraryTypeSlug,
  depart?: string,
  ret?: string,
) => {
  const parts = [`Flights from ${fromLabel} to ${toLabel}`]
  parts.push(itineraryType === 'one-way' ? 'One-way' : 'Round-trip')

  const departLabel = formatDate(depart)
  const returnLabel = formatDate(ret)

  if (itineraryType === 'one-way' && departLabel) {
    parts.push(`Depart ${departLabel}`)
  } else if (departLabel && returnLabel) {
    parts.push(`${departLabel}–${returnLabel}`)
  } else if (departLabel) {
    parts.push(`Depart ${departLabel}`)
  }

  return parts.join(' · ')
}

const withFilters = (
  state: SearchState,
  updater: (filters: Record<string, unknown>) => Record<string, unknown>,
): SearchState => {
  const nextFilters = updater({ ...(state.filters || {}) })
  return {
    ...state,
    page: 1,
    filters: Object.keys(nextFilters).length ? nextFilters : undefined,
  }
}

const withSingleToggle = (state: SearchState, key: string, value: string): SearchState => {
  return withFilters(state, (filters) => {
    const current = normalizeToken(String(filters[key] || ''))
    if (current === normalizeToken(value)) {
      delete filters[key]
    } else {
      filters[key] = value
    }
    return filters
  })
}

const withArrayToggle = (state: SearchState, key: string, value: string): SearchState => {
  return withFilters(state, (filters) => {
    const currentRaw = filters[key]
    const current = Array.isArray(currentRaw)
      ? currentRaw.map((item) => normalizeToken(String(item || ''))).filter(Boolean)
      : String(currentRaw || '')
          .split(',')
          .map((item) => normalizeToken(item))
          .filter(Boolean)

    const has = current.includes(value)
    const next = has ? current.filter((item) => item !== value) : [...current, value]

    if (next.length) {
      filters[key] = next
    } else {
      delete filters[key]
    }

    return filters
  })
}

const withMaxStopsToggle = (state: SearchState, value: '0' | '1' | '2'): SearchState => {
  return withFilters(state, (filters) => {
    delete filters.nonstop
    delete filters.stops

    const current = String(filters.maxStops || '').trim()
    if (current === value) {
      delete filters.maxStops
    } else {
      filters.maxStops = value
    }

    return filters
  })
}

const withSort = (state: SearchState, sort: string): SearchState => ({
  ...state,
  sort,
  page: 1,
})

const withPage = (state: SearchState, page: number): SearchState => ({
  ...state,
  page,
})

const buildPageLinks = (
  page: number,
  totalPages: number,
  toHref: (pageNumber: number) => string,
) => {
  const links: { label: string; href: string; active?: boolean }[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)

  for (let current = start; current <= end; current += 1) {
    links.push({
      label: String(current),
      href: toHref(current),
      active: current === page,
    })
  }

  return links
}

export const FlightsResultsAdapter = component$((props: FlightsResultsAdapterProps) => {
  const toHref = (nextState: SearchState) =>
    searchStateToUrl(props.basePath, nextState, {
      includeQueryParam: false,
      includeLocationParams: false,
      dateParamKeys: { checkIn: 'depart', checkOut: 'return' },
    })

  const mapped = mapSearchStateToFlights(props.results, props.searchState)
  const requestedPage = props.searchState.page && props.searchState.page > 0 ? props.searchState.page : 1
  const totalPages = Math.max(1, Math.ceil(mapped.items.length / PAGE_SIZE))
  const page = clampPage(requestedPage, totalPages)
  const offset = (page - 1) * PAGE_SIZE
  const pageItems = mapped.items.slice(offset, offset + PAGE_SIZE)

  const sortOptions: ResultsSortOption[] = FLIGHT_SORT_OPTIONS.map((option) => ({
    label: option.label,
    value: option.value,
    active: mapped.activeSort === option.value,
    href: toHref(withSort(props.searchState, option.value)),
  }))

  const stopsOptions: { label: string; value: '0' | '1' | '2' }[] = [
    { label: 'Nonstop', value: '0' },
    { label: 'Up to 1 stop', value: '1' },
    { label: 'Up to 2 stops', value: '2' },
  ]

  const stopFilters = stopsOptions.map((option) => ({
    label: option.label,
    href: toHref(withMaxStopsToggle(props.searchState, option.value)),
    active: String(mapped.selectedFilters.maxStops ?? '') === option.value,
  }))

  const timeWindows: FlightTimeWindow[] = ['morning', 'afternoon', 'evening', 'overnight']

  const departureFilters = timeWindows
    .filter((window) => props.results.some((result) => normalizeToken(result.departureWindow) === window))
    .map((window) => ({
      label: titleCase(window),
      href: toHref(withArrayToggle(props.searchState, 'departureWindow', window)),
      active: mapped.selectedFilters.departureWindows.includes(window),
    }))

  const arrivalFilters = timeWindows
    .filter((window) => props.results.some((result) => normalizeToken(result.arrivalWindow) === window))
    .map((window) => ({
      label: titleCase(window),
      href: toHref(withArrayToggle(props.searchState, 'arrivalWindow', window)),
      active: mapped.selectedFilters.arrivalWindows.includes(window),
    }))

  const cabinFilters = Array.from(
    new Set(props.results.map((result) => normalizeToken(result.cabinClass || '')).filter(Boolean)),
  )
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      label: titleCase(value),
      href: toHref(withSingleToggle(props.searchState, 'cabin', value)),
      active: mapped.selectedFilters.cabinClass === value,
    }))

  const priceBands: { label: string; value: 'under-200' | '200-400' | '400-700' | '700-plus' }[] = [
    { label: 'Under $200', value: 'under-200' },
    { label: '$200–$400', value: '200-400' },
    { label: '$400–$700', value: '400-700' },
    { label: '$700+', value: '700-plus' },
  ]

  const priceFilters = priceBands.map((option) => ({
    label: option.label,
    href: toHref(withSingleToggle(props.searchState, 'priceBand', option.value)),
    active: mapped.selectedFilters.priceBand === option.value,
  }))

  const filterGroups: FlightFilterGroup[] = [
    { title: 'Stops', options: stopFilters },
    { title: 'Departure window', options: departureFilters },
    { title: 'Arrival window', options: arrivalFilters },
    { title: 'Cabin class', options: cabinFilters },
    { title: 'Price band', options: priceFilters },
  ].filter((group) => group.options.length > 0)

  return (
    <ResultsShell
      querySummary={buildQuerySummary(
        props.fromLabel,
        props.toLabel,
        props.itineraryType,
        props.searchState.dates?.checkIn,
        props.searchState.dates?.checkOut,
      )}
      editSearchHref={props.editSearchHref}
      filtersTitle="Flight filters"
      resultCountLabel={`${mapped.items.length.toLocaleString('en-US')} flights`}
      sortOptions={sortOptions}
      pagination={{
        page,
        totalPages,
        prevHref: page > 1 ? toHref(withPage(props.searchState, page - 1)) : undefined,
        nextHref: page < totalPages ? toHref(withPage(props.searchState, page + 1)) : undefined,
        pageLinks: buildPageLinks(page, totalPages, (pageNumber) => toHref(withPage(props.searchState, pageNumber))),
      }}
      empty={mapped.items.length
        ? undefined
        : {
          title: `No flights match this selection from ${props.fromLabel} to ${props.toLabel}`,
          description: 'Try removing a filter, changing sort, or broadening your route and dates.',
          primaryAction: props.emptyPrimaryAction || { label: 'Search flights again', href: '/flights' },
          secondaryAction: props.emptySecondaryAction || { label: 'Explore destinations', href: '/explore' },
        }}
    >
      <FlightFilters q:slot="filters-desktop" groups={filterGroups} />
      <FlightFilters q:slot="filters-mobile" groups={filterGroups} />

      <div class="grid gap-3">
        {pageItems.map((result) => (
          <FlightCard key={result.id} result={result} ctaHref={props.flightCtaHref} />
        ))}
      </div>
    </ResultsShell>
  )
})

type FlightsResultsAdapterProps = {
  results: FlightResult[]
  searchState: SearchState
  fromLabel: string
  toLabel: string
  itineraryType: FlightItineraryTypeSlug
  basePath: string
  editSearchHref?: string
  flightCtaHref?: string
  emptyPrimaryAction?: {
    label: string
    href: string
  }
  emptySecondaryAction?: {
    label: string
    href: string
  }
}
