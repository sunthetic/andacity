import { $, component$, useSignal } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { useLocation } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { CarRentalResultCard } from '~/components/car-rentals/search/CarRentalResultCard'
import { CAR_RENTALS } from '~/data/car-rentals'
import { computeDays } from '~/lib/search/car-rentals/dates'
import { mapCarRentalsToResults } from '~/lib/search/car-rentals/mapCarRentalsToResults'
import { clampInt, normalizeQuery, safeTitleQuery } from '~/lib/search/car-rentals/normalize'
import type { CarRentalResult } from '~/types/car-rentals/search'
import { SearchMapCard } from '~/components/search/SearchMapCard'
import { SearchResultsSummary } from '~/components/search/SearchResultsSummary'
import { SearchEmptyState } from '~/components/search/SearchEmptyState'
import { FiltersPanel } from '~/components/search/filters/FiltersPanel'
import type { FilterSectionConfig, FilterValues } from '~/components/search/filters/types'
import { ResultsToolbar } from '~/components/search/results/ResultsToolbar'

const CAR_FILTER_DEFAULTS: FilterValues = {
  priceRange: [],
  vehicleClass: [],
  transmission: '',
  fuelPolicy: [],
  rentalCompany: [],
}

export const useSearchCarRentalsPage = routeLoader$(({ params }) => {
  const query = normalizeQuery(params.query)
  const page = clampInt(params.pageNumber, 1, 9999)
  const results = mapCarRentalsToResults(CAR_RENTALS, query)

  return {
    query,
    qHuman: safeTitleQuery(query),
    page,
    results,
  }
})

export default component$(() => {
  const data = useSearchCarRentalsPage().value
  const location = useLocation()

  const pathBase = `/search/car-rentals/${encodeURIComponent(data.query)}`

  const days = computeDays(location.url.searchParams.get('pickupDate'), location.url.searchParams.get('dropoffDate'))

  const values = useSignal<FilterValues>({ ...CAR_FILTER_DEFAULTS })
  const sort = useSignal<CarSort>('recommended')
  const mobileFiltersOpen = useSignal(false)

  const rentalCompanyOptions = Array.from(new Set(data.results.map((result) => result.name))).map((company) => ({
    label: company,
    value: company.toLowerCase(),
  }))

  const carFilterSections: FilterSectionConfig[] = [
    {
      type: 'checkbox',
      id: 'priceRange',
      title: 'Price range',
      options: [
        { label: 'Under $50/day', value: 'under-50' },
        { label: '$50–$100/day', value: '50-100' },
        { label: '$100–$150/day', value: '100-150' },
        { label: '$150+/day', value: '150-plus' },
      ],
    },
    {
      type: 'checkbox',
      id: 'vehicleClass',
      title: 'Vehicle class',
      options: [
        { label: 'Economy', value: 'economy' },
        { label: 'Compact', value: 'compact' },
        { label: 'SUV', value: 'suv' },
        { label: 'Luxury', value: 'luxury' },
      ],
    },
    {
      type: 'select',
      id: 'transmission',
      title: 'Transmission',
      placeholder: 'Any transmission',
      options: [
        { label: 'Automatic', value: 'automatic' },
        { label: 'Manual', value: 'manual' },
      ],
    },
    {
      type: 'checkbox',
      id: 'fuelPolicy',
      title: 'Fuel policy',
      options: [{ label: 'Full to full', value: 'full-to-full' }],
    },
    {
      type: 'checkbox',
      id: 'rentalCompany',
      title: 'Rental company',
      options: rentalCompanyOptions,
    },
  ]

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
    values.value = { ...CAR_FILTER_DEFAULTS }
  })
  const onSortChange$ = $((value: string) => {
    if (value === 'recommended' || value === 'price' || value === 'vehicle-class') {
      sort.value = value
    }
  })
  const onToggleFilters$ = $(() => {
    mobileFiltersOpen.value = !mobileFiltersOpen.value
  })

  const filteredResults = data.results.filter((rental) => matchesCarFilters(rental, values.value))
  const sortedResults = sortCarRentals(filteredResults, sort.value)
  const contextParts = [`Pickup: ${data.qHuman}`]
  if (days != null) {
    contextParts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
  }
  const pickupLocation = String(location.url.searchParams.get('q') || '').trim() || data.qHuman
  const pickupDate = String(location.url.searchParams.get('pickupDate') || '').trim()
  const dropoffDate = String(location.url.searchParams.get('dropoffDate') || '').trim()
  const drivers = String(location.url.searchParams.get('drivers') || '').trim()
  const searchAgainParams = new URLSearchParams()
  if (pickupLocation) {
    searchAgainParams.set('q', pickupLocation)
  }
  if (pickupDate) {
    searchAgainParams.set('pickupDate', pickupDate)
  }
  if (dropoffDate) {
    searchAgainParams.set('dropoffDate', dropoffDate)
  }
  if (drivers) {
    searchAgainParams.set('drivers', drivers)
  }
  const searchAgainHref = searchAgainParams.toString() ? `/car-rentals?${searchAgainParams.toString()}` : '/car-rentals'

  return (
    <Page breadcrumbs={[
      { label: 'Andacity Travel', href: '/' },
      { label: 'Car Rentals', href: '/car-rentals' },
      { label: 'Search', href: '/search/car-rentals' },
      { label: data.qHuman, href: `${pathBase}/1` },
    ]}>
      <div class="mt-4">
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          Car rental search results
        </h1>
        <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">{contextParts.join(' · ')}</p>
      </div>

      <ResultsToolbar
        sortId="car-rental-results-sort"
        resultCountLabel={`${sortedResults.length.toLocaleString('en-US')} car rentals found`}
        sortValue={sort.value}
        sortOptions={CAR_SORT_OPTIONS}
        mobileFiltersOpen={mobileFiltersOpen.value}
        onSortChange$={onSortChange$}
        onToggleFilters$={onToggleFilters$}
      />

      <div class="mt-4 lg:hidden">
        {mobileFiltersOpen.value ? (
          <FiltersPanel
            title="Filters"
            sections={carFilterSections}
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
          sections={carFilterSections}
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
                sortedResults.map((rental: CarRentalResult) => (
                  <CarRentalResultCard key={rental.id} r={rental} days={days} />
                ))
              ) : (
                <SearchEmptyState
                  title="No car rentals matched this search"
                  description="Try a nearby pickup location, different dates, or fewer constraints."
                  primaryAction={{ label: 'Search car rentals again', href: searchAgainHref }}
                  secondaryAction={{ label: 'Browse rental cities', href: '/car-rentals/in' }}
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
  const data = resolveValue(useSearchCarRentalsPage)

  const title = `Car rentals in ${data.qHuman} – Page ${data.page} | Andacity Travel`
  const description = `Browse car rental results for ${data.qHuman}. Compare policies and totals with clarity.`
  const canonicalPath = `/search/car-rentals/${encodeURIComponent(data.query)}/${data.page}`
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

const matchesCarFilters = (rental: CarRentalResult, values: FilterValues) => {
  const selectedPriceRanges = toSelected(values.priceRange)
  const selectedClasses = toSelected(values.vehicleClass)
  const selectedFuelPolicies = toSelected(values.fuelPolicy)
  const selectedCompanies = toSelected(values.rentalCompany)
  const selectedTransmission = typeof values.transmission === 'string' ? values.transmission : ''

  if (selectedPriceRanges.length && !selectedPriceRanges.some((range) => inCarPriceRange(rental.priceFrom, range))) {
    return false
  }

  const category = (rental.category || '').toLowerCase()
  if (selectedClasses.length && !selectedClasses.includes(category)) {
    return false
  }

  if (selectedTransmission) {
    const transmission = (rental.transmission || '').toLowerCase()
    if (transmission !== selectedTransmission) {
      return false
    }
  }

  if (selectedFuelPolicies.length) {
    const hasFullToFull = rental.inclusions.some((item) => item.toLowerCase().includes('fuel'))
    if (selectedFuelPolicies.includes('full-to-full') && !hasFullToFull) {
      return false
    }
  }

  if (selectedCompanies.length) {
    const company = rental.name.toLowerCase()
    if (!selectedCompanies.includes(company)) {
      return false
    }
  }

  return true
}

const inCarPriceRange = (price: number, range: string) => {
  if (range === 'under-50') return price < 50
  if (range === '50-100') return price >= 50 && price <= 100
  if (range === '100-150') return price > 100 && price <= 150
  if (range === '150-plus') return price > 150
  return true
}

const toSelected = (value: string[] | string | undefined) => {
  return Array.isArray(value) ? value : []
}

const CAR_SORT_OPTIONS = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price', value: 'price' },
  { label: 'Vehicle class', value: 'vehicle-class' },
]

type CarSort = 'recommended' | 'price' | 'vehicle-class'

const sortCarRentals = (items: CarRentalResult[], sort: CarSort) => {
  return [...items].sort((a, b) => {
    if (sort === 'price') return a.priceFrom - b.priceFrom
    if (sort === 'vehicle-class') {
      const categoryCompare = (a.category || '').localeCompare(b.category || '')
      if (categoryCompare !== 0) return categoryCompare
      return a.priceFrom - b.priceFrom
    }
    return b.score - a.score
  })
}
