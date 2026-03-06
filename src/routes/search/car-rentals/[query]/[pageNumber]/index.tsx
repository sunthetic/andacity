import { $, component$, useSignal } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { useLocation } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { CarRentalResultCard } from '~/components/car-rentals/search/CarRentalResultCard'
import { CAR_RENTALS } from '~/data/car-rentals'
import { computeDays } from '~/lib/search/car-rentals/dates'
import { mapCarRentalsToResults } from '~/lib/search/car-rentals/mapCarRentalsToResults'
import { clampInt, normalizeQuery, normalizeSort, safeTitleQuery } from '~/lib/search/car-rentals/normalize'
import type { CarRentalResult } from '~/types/car-rentals/search'
import { formatMoney } from '~/lib/formatMoney'
import { SearchMapCard } from '~/components/search/SearchMapCard'
import { SearchResultsSummary } from '~/components/search/SearchResultsSummary'
import { SearchHeaderBar } from '~/components/search/SearchHeaderBar'
import { SearchEmptyState } from '~/components/search/SearchEmptyState'
import { FiltersPanel } from '~/components/search/filters/FiltersPanel'
import type { FilterSectionConfig, FilterValues } from '~/components/search/filters/types'

const CAR_FILTER_DEFAULTS: FilterValues = {
  priceRange: [],
  vehicleClass: [],
  transmission: '',
  fuelPolicy: [],
  rentalCompany: [],
}

export const useSearchCarRentalsPage = routeLoader$(({ params, url }) => {
  const query = normalizeQuery(params.query)
  const page = clampInt(params.pageNumber, 1, 9999)
  const sort = normalizeSort(url.searchParams.get('sort'))

  const results = mapCarRentalsToResults(CAR_RENTALS, query).slice().sort((a, b) => {
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
    qHuman: safeTitleQuery(query),
    page,
    results,
    sort,
    price,
  }
})

export default component$(() => {
  const data = useSearchCarRentalsPage().value
  const location = useLocation()

  const pathBase = `/search/car-rentals/${encodeURIComponent(data.query)}`
  const page1Action = `${pathBase}/1`

  const days = computeDays(location.url.searchParams.get('pickupDate'), location.url.searchParams.get('dropoffDate'))

  const values = useSignal<FilterValues>({ ...CAR_FILTER_DEFAULTS })
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

  const filteredResults = data.results.filter((rental) => matchesCarFilters(rental, values.value))

  return (
    <Page breadcrumbs={[
      { label: 'Andacity Travel', href: '/' },
      { label: 'Car Rentals', href: '/car-rentals' },
      { label: 'Search', href: '/search/car-rentals' },
      { label: data.qHuman, href: `${pathBase}/1` },
    ]}>
      <SearchHeaderBar
        title={`Car rentals in ${data.qHuman}`}
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
          Car rentals search
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
          sections={carFilterSections}
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
                  sections={carFilterSections}
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
                filteredResults.map((rental: CarRentalResult) => (
                  <CarRentalResultCard key={rental.id} r={rental} days={days} />
                ))
              ) : (
                <SearchEmptyState
                  title="No car rentals matched this search"
                  description="Try a nearby pickup location, different dates, or fewer constraints."
                  primaryAction={{ label: 'Search car rentals again', href: '/car-rentals' }}
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
