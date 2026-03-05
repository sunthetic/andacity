import type { ActiveFilters, SortKey } from '~/types/car-rentals/search'
import { normalizeIsoDate } from '~/lib/search/car-rentals/dates'
import { clampMaybeInt, toFloatOrNull, toIntOrNull } from '~/lib/search/car-rentals/number'

export const parseActiveFilters = (sp: URLSearchParams): ActiveFilters => {
  const categories = sp.getAll('category').map((x) => x.trim()).filter(Boolean)
  const transmissions = sp.getAll('transmission').map((x) => x.trim()).filter(Boolean)

  const seats = sp
    .getAll('seats')
    .map((x) => Number.parseInt(x, 10))
    .filter((n) => Number.isFinite(n) && n >= 2 && n <= 9)

  const inclusions = sp.getAll('include').map((x) => x.trim()).filter(Boolean)

  const freeCancellationOnly = sp.get('freeCancel') === '1'
  const payAtCounterOnly = sp.get('payAtCounter') === '1'

  const ratingMin = toFloatOrNull(sp.get('ratingMin'))
  const priceMin = toIntOrNull(sp.get('minPrice'))
  const priceMax = toIntOrNull(sp.get('maxPrice'))

  const pickupDate = normalizeIsoDate(sp.get('pickupDate'))
  const dropoffDate = normalizeIsoDate(sp.get('dropoffDate'))
  const drivers = clampMaybeInt(sp.get('drivers'), 1, 6)

  return {
    categories,
    transmissions,
    seats,
    inclusions,
    freeCancellationOnly,
    payAtCounterOnly,
    ratingMin,
    priceMin,
    priceMax,
    pickupDate,
    dropoffDate,
    drivers,
  }
}

export const hasAnyFilters = (a: ActiveFilters) =>
  Boolean(
    a.categories.length ||
    a.transmissions.length ||
    a.seats.length ||
    a.inclusions.length ||
    a.freeCancellationOnly ||
    a.payAtCounterOnly ||
    a.ratingMin != null ||
    a.priceMin != null ||
    a.priceMax != null ||
    a.pickupDate ||
    a.dropoffDate ||
    a.drivers != null,
  )

export const buildSearchParams = (a: ActiveFilters, sort: SortKey) => {
  const sp = new URLSearchParams()
  if (sort && sort !== 'relevance') sp.set('sort', sort)

  for (const x of a.categories) sp.append('category', x)
  for (const x of a.transmissions) sp.append('transmission', x)
  for (const x of a.seats) sp.append('seats', String(x))
  for (const x of a.inclusions) sp.append('include', x)

  if (a.freeCancellationOnly) sp.set('freeCancel', '1')
  if (a.payAtCounterOnly) sp.set('payAtCounter', '1')

  if (a.ratingMin != null) sp.set('ratingMin', String(a.ratingMin))
  if (a.priceMin != null) sp.set('minPrice', String(a.priceMin))
  if (a.priceMax != null) sp.set('maxPrice', String(a.priceMax))

  if (a.pickupDate) sp.set('pickupDate', a.pickupDate)
  if (a.dropoffDate) sp.set('dropoffDate', a.dropoffDate)
  if (a.drivers != null) sp.set('drivers', String(a.drivers))

  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

export const serializeHiddenInputs = (a: ActiveFilters) => {
  const inputs: { name: string; value: string }[] = []

  for (const x of a.categories) inputs.push({ name: 'category', value: x })
  for (const x of a.transmissions) inputs.push({ name: 'transmission', value: x })
  for (const x of a.seats) inputs.push({ name: 'seats', value: String(x) })
  for (const x of a.inclusions) inputs.push({ name: 'include', value: x })

  if (a.freeCancellationOnly) inputs.push({ name: 'freeCancel', value: '1' })
  if (a.payAtCounterOnly) inputs.push({ name: 'payAtCounter', value: '1' })

  if (a.ratingMin != null) inputs.push({ name: 'ratingMin', value: String(a.ratingMin) })
  if (a.priceMin != null) inputs.push({ name: 'minPrice', value: String(a.priceMin) })
  if (a.priceMax != null) inputs.push({ name: 'maxPrice', value: String(a.priceMax) })

  if (a.pickupDate) inputs.push({ name: 'pickupDate', value: a.pickupDate })
  if (a.dropoffDate) inputs.push({ name: 'dropoffDate', value: a.dropoffDate })
  if (a.drivers != null) inputs.push({ name: 'drivers', value: String(a.drivers) })

  return inputs
}

export const renderActiveChips = (a: ActiveFilters, pathBase: string, sort: SortKey) => {
  const chips: { label: string; href: string }[] = []
  const base = `${pathBase}/1`
  const makeHref = (next: ActiveFilters) => `${base}${buildSearchParams(next, sort)}`

  for (const x of a.categories) {
    const next = { ...a, categories: a.categories.filter((v) => v !== x) }
    chips.push({ label: x, href: makeHref(next) })
  }

  for (const x of a.transmissions) {
    const next = { ...a, transmissions: a.transmissions.filter((v) => v !== x) }
    chips.push({ label: x, href: makeHref(next) })
  }

  for (const x of a.seats) {
    const next = { ...a, seats: a.seats.filter((v) => v !== x) }
    chips.push({ label: `${x} seats`, href: makeHref(next) })
  }

  for (const x of a.inclusions) {
    const next = { ...a, inclusions: a.inclusions.filter((v) => v !== x) }
    chips.push({ label: x, href: makeHref(next) })
  }

  if (a.freeCancellationOnly) {
    const next = { ...a, freeCancellationOnly: false }
    chips.push({ label: 'Free cancellation', href: makeHref(next) })
  }

  if (a.payAtCounterOnly) {
    const next = { ...a, payAtCounterOnly: false }
    chips.push({ label: 'Pay at counter', href: makeHref(next) })
  }

  if (a.priceMin != null) {
    const next = { ...a, priceMin: null }
    chips.push({ label: `Min $${a.priceMin}`, href: makeHref(next) })
  }

  if (a.priceMax != null) {
    const next = { ...a, priceMax: null }
    chips.push({ label: `Max $${a.priceMax}`, href: makeHref(next) })
  }

  if (a.pickupDate) {
    const next = { ...a, pickupDate: null }
    chips.push({ label: `Pickup ${a.pickupDate}`, href: makeHref(next) })
  }

  if (a.dropoffDate) {
    const next = { ...a, dropoffDate: null }
    chips.push({ label: `Dropoff ${a.dropoffDate}`, href: makeHref(next) })
  }

  if (a.drivers != null) {
    const next = { ...a, drivers: null }
    chips.push({ label: `${a.drivers} drivers`, href: makeHref(next) })
  }

  return chips.map((c) => (
    <a key={c.label} class="t-badge hover:bg-white" href={c.href} >
      {c.label} < span class="ml-1 text-[color:var(--color-text-muted)]" >×</span>
    </a>
  ))
}
