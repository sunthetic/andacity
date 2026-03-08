import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { FlightCard } from '~/components/flights/FlightCard'
import { FlightFilters } from '~/components/flights/FlightFilters'
import type { FlightFilterGroup } from '~/components/flights/FlightFilters'
import { ResultsShell } from '~/components/results/ResultsShell'
import { CompareDrawer } from '~/components/save-compare/CompareDrawer'
import { CompareTray } from '~/components/save-compare/CompareTray'
import type { ResultsSortOption } from '~/components/results/ResultsSort'
import { formatMoney } from '~/lib/formatMoney'
import {
  FLIGHT_SORT_OPTIONS,
  type FlightSortKey,
} from '~/lib/search/flights/flight-sort-options'
import type {
  FlightSearchFacets,
  FlightsSelectedFilters,
} from '~/lib/search/flights/filter-types'
import type { FlightItineraryTypeSlug } from '~/lib/search/flights/routing'
import { searchStateToUrl } from '~/lib/search/state-to-url'
import { canOpenCompare } from '~/lib/save-compare/compare-state'
import {
  clearSavedCollection,
  isItemSaved,
  loadSavedItems,
  persistSavedItems,
  removeSavedItem,
  toggleSavedItem,
} from '~/lib/save-compare/saved-state'
import { SAVE_COMPARE_STORAGE_KEY } from '~/lib/save-compare/storage'
import type { FlightResult } from '~/types/flights/search'
import type { SavedItem } from '~/types/save-compare/saved-item'
import type { SearchState } from '~/types/search/state'

const FLIGHTS_VERTICAL = 'flights' as const

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

const formatDate = (isoDate: string | undefined) => {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return ''
  const [y, m, d] = isoDate.split('-').map((x) => Number.parseInt(x, 10))
  const date = new Date(Date.UTC(y, m - 1, d))
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
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

const withSingleToggle = (
  state: SearchState,
  key: string,
  value: string,
): SearchState => {
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

const withArrayToggle = (
  state: SearchState,
  key: string,
  value: string,
): SearchState => {
  return withFilters(state, (filters) => {
    const currentRaw = filters[key]
    const current = Array.isArray(currentRaw)
      ? currentRaw
          .map((item) => normalizeToken(String(item || '')))
          .filter(Boolean)
      : String(currentRaw || '')
          .split(',')
          .map((item) => normalizeToken(item))
          .filter(Boolean)

    const has = current.includes(value)
    const next = has
      ? current.filter((item) => item !== value)
      : [...current, value]

    if (next.length) {
      filters[key] = next
    } else {
      delete filters[key]
    }

    return filters
  })
}

const withMaxStopsToggle = (
  state: SearchState,
  value: '0' | '1' | '2',
): SearchState => {
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

const stopLabel = (value: 0 | 1 | 2) => {
  if (value === 0) return 'Nonstop'
  if (value === 1) return 'Up to 1 stop'
  return 'Up to 2 stops'
}

export const FlightsResultsAdapter = component$(
  (props: FlightsResultsAdapterProps) => {
    const toHref = (nextState: SearchState) =>
      searchStateToUrl(props.basePath, nextState, {
        includeQueryParam: false,
        includeLocationParams: false,
        dateParamKeys: { checkIn: 'depart', checkOut: 'return' },
      })

    const pageItems = props.results
    const savedItems = useSignal<SavedItem[]>([])
    const compareOpen = useSignal(false)

    const toSavedFlightItem = (result: FlightResult): SavedItem => ({
      id: result.id,
      vertical: FLIGHTS_VERTICAL,
      title: result.airline,
      subtitle: `${result.origin} → ${result.destination}`,
      price: `${formatMoney(result.price, result.currency)} /traveler`,
      meta: [
        `Depart ${result.departureTime}`,
        `Arrive ${result.arrivalTime}`,
        result.duration,
        result.stopsLabel,
        result.cabinClass ? titleCase(result.cabinClass) : '',
      ].filter(Boolean),
      href: props.flightCtaHref || props.editSearchHref || '/flights',
    })

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      const syncSaved = () => {
        savedItems.value = loadSavedItems(FLIGHTS_VERTICAL)
      }

      syncSaved()

      const onStorage = (event: StorageEvent) => {
        if (event.key && event.key !== SAVE_COMPARE_STORAGE_KEY) return
        syncSaved()
      }

      window.addEventListener('storage', onStorage)
      cleanup(() => window.removeEventListener('storage', onStorage))
    })

    const onToggleSave$ = $((item: SavedItem) => {
      const next = toggleSavedItem(savedItems.value, item)
      savedItems.value = next
      persistSavedItems(FLIGHTS_VERTICAL, next)
    })

    const onRemoveSaved$ = $((id: string) => {
      const next = removeSavedItem(savedItems.value, id)
      savedItems.value = next
      persistSavedItems(FLIGHTS_VERTICAL, next)
    })

    const onClearSaved$ = $(() => {
      const next = clearSavedCollection()
      savedItems.value = next
      persistSavedItems(FLIGHTS_VERTICAL, next)
      compareOpen.value = false
    })

    const onOpenCompare$ = $(() => {
      if (!canOpenCompare(savedItems.value.length)) return
      compareOpen.value = true
    })

    const onCloseCompare$ = $(() => {
      compareOpen.value = false
    })

    const canCompare = canOpenCompare(savedItems.value.length)

    const sortOptions: ResultsSortOption[] = FLIGHT_SORT_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
      active: props.activeSort === option.value,
      href: toHref(withSort(props.searchState, option.value)),
    }))

    const stopFilters = props.filterFacets.maxStops.map((value) => ({
      label: stopLabel(value),
      href: toHref(withMaxStopsToggle(props.searchState, String(value) as '0' | '1' | '2')),
      active: props.selectedFilters.maxStops === value,
    }))

    const departureFilters = props.filterFacets.departureWindows.map((window) => ({
      label: titleCase(window),
      href: toHref(withArrayToggle(props.searchState, 'departureWindow', window)),
      active: props.selectedFilters.departureWindows.includes(window),
    }))

    const arrivalFilters = props.filterFacets.arrivalWindows.map((window) => ({
      label: titleCase(window),
      href: toHref(withArrayToggle(props.searchState, 'arrivalWindow', window)),
      active: props.selectedFilters.arrivalWindows.includes(window),
    }))

    const cabinFilters = props.filterFacets.cabinClasses.map((value) => ({
      label: titleCase(value),
      href: toHref(withSingleToggle(props.searchState, 'cabin', value)),
      active: props.selectedFilters.cabinClass === value,
    }))

    const priceBands: {
      label: string
      value: 'under-200' | '200-400' | '400-700' | '700-plus'
    }[] = [
      { label: 'Under $200', value: 'under-200' },
      { label: '$200–$400', value: '200-400' },
      { label: '$400–$700', value: '400-700' },
      { label: '$700+', value: '700-plus' },
    ]

    const priceFilters = priceBands.map((option) => ({
      label: option.label,
      href: toHref(withSingleToggle(props.searchState, 'priceBand', option.value)),
      active: props.selectedFilters.priceBand === option.value,
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
        resultCountLabel={`${props.totalCount.toLocaleString('en-US')} flights`}
        sortOptions={sortOptions}
        pagination={{
          page: props.page,
          totalPages: props.totalPages,
          prevHref:
            props.page > 1
              ? toHref(withPage(props.searchState, props.page - 1))
              : undefined,
          nextHref:
            props.page < props.totalPages
              ? toHref(withPage(props.searchState, props.page + 1))
              : undefined,
          pageLinks: buildPageLinks(props.page, props.totalPages, (pageNumber) =>
            toHref(withPage(props.searchState, pageNumber)),
          ),
        }}
        empty={
          props.totalCount
            ? undefined
            : {
                title: `No flights match this selection from ${props.fromLabel} to ${props.toLabel}`,
                description:
                  'Try removing a filter, changing sort, or broadening your route and dates.',
                primaryAction: props.emptyPrimaryAction || {
                  label: 'Search flights again',
                  href: '/flights',
                },
                secondaryAction: props.emptySecondaryAction || {
                  label: 'Explore destinations',
                  href: '/explore',
                },
              }
        }
      >
        <FlightFilters q:slot="filters-desktop" groups={filterGroups} />
        <FlightFilters q:slot="filters-mobile" groups={filterGroups} />

        <div class="grid gap-3">
          {pageItems.map((result) => {
            const savedItem = toSavedFlightItem(result)

            return (
              <FlightCard
                key={result.id}
                result={result}
                ctaHref={props.flightCtaHref}
                savedItem={savedItem}
                isSaved={isItemSaved(savedItems.value, savedItem.id)}
                onToggleSave$={onToggleSave$}
              />
            )
          })}
        </div>

        {canCompare ? (
          <CompareTray
            q:slot="results-overlay"
            vertical={FLIGHTS_VERTICAL}
            savedCount={savedItems.value.length}
            onOpen$={onOpenCompare$}
            onClear$={onClearSaved$}
          />
        ) : null}

        <CompareDrawer
          q:slot="results-overlay"
          open={compareOpen.value && canCompare}
          vertical={FLIGHTS_VERTICAL}
          items={savedItems.value}
          onClose$={onCloseCompare$}
          onClear$={onClearSaved$}
          onRemove$={onRemoveSaved$}
        />
      </ResultsShell>
    )
  },
)

type FlightsResultsAdapterProps = {
  results: FlightResult[]
  totalCount: number
  page: number
  totalPages: number
  activeSort: FlightSortKey
  selectedFilters: FlightsSelectedFilters
  filterFacets: FlightSearchFacets
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
