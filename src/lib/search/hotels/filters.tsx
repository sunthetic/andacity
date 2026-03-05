import type { ActiveFilters, SortKey } from '~/types/hotels/search'
import { clampMaybeInt, toFloatOrNull, toIntOrNull } from '~/lib/search/hotels/number'
import { normalizeIsoDate } from '~/lib/search/hotels/dates'

export const parseActiveFilters = (sp: URLSearchParams): ActiveFilters => {
  const stars = sp
    .getAll('stars')
    .map((x) => Number.parseInt(x, 10))
    .filter((n) => [2, 3, 4, 5].includes(n))

  const neighborhoods = sp.getAll('area').map((x) => x.trim()).filter(Boolean)
  const amenities = sp.getAll('amenity').map((x) => x.trim()).filter(Boolean)

  const refundableOnly = sp.get('refundable') === '1'

  const ratingMin = toFloatOrNull(sp.get('ratingMin'))
  const priceMin = toIntOrNull(sp.get('minPrice'))
  const priceMax = toIntOrNull(sp.get('maxPrice'))

  const checkIn = normalizeIsoDate(sp.get('checkIn'))
  const checkOut = normalizeIsoDate(sp.get('checkOut'))
  const adults = clampMaybeInt(sp.get('adults'), 1, 10)
  const rooms = clampMaybeInt(sp.get('rooms'), 1, 6)

  return {
    stars,
    neighborhoods,
    amenities,
    refundableOnly,
    ratingMin,
    priceMin,
    priceMax,
    checkIn,
    checkOut,
    adults,
    rooms,
  }
}

export const hasAnyFilters = (a: ActiveFilters) =>
  Boolean(
    a.stars.length ||
    a.neighborhoods.length ||
    a.amenities.length ||
    a.refundableOnly ||
    a.ratingMin != null ||
    a.priceMin != null ||
    a.priceMax != null ||
    a.checkIn ||
    a.checkOut ||
    a.adults != null ||
    a.rooms != null,
  )

export const buildSearchParams = (a: ActiveFilters, sort: SortKey) => {
  const sp = new URLSearchParams()
  if (sort && sort !== 'relevance') sp.set('sort', sort)

  for (const s of a.stars) sp.append('stars', String(s))
  for (const n of a.neighborhoods) sp.append('area', n)
  for (const x of a.amenities) sp.append('amenity', x)

  if (a.refundableOnly) sp.set('refundable', '1')
  if (a.ratingMin != null) sp.set('ratingMin', String(a.ratingMin))
  if (a.priceMin != null) sp.set('minPrice', String(a.priceMin))
  if (a.priceMax != null) sp.set('maxPrice', String(a.priceMax))

  if (a.checkIn) sp.set('checkIn', a.checkIn)
  if (a.checkOut) sp.set('checkOut', a.checkOut)
  if (a.adults != null) sp.set('adults', String(a.adults))
  if (a.rooms != null) sp.set('rooms', String(a.rooms))

  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

export const serializeHiddenInputs = (a: ActiveFilters) => {
  const inputs: { name: string; value: string }[] = []

  for (const s of a.stars) inputs.push({ name: 'stars', value: String(s) })
  for (const n of a.neighborhoods) inputs.push({ name: 'area', value: n })
  for (const x of a.amenities) inputs.push({ name: 'amenity', value: x })

  if (a.refundableOnly) inputs.push({ name: 'refundable', value: '1' })
  if (a.ratingMin != null) inputs.push({ name: 'ratingMin', value: String(a.ratingMin) })
  if (a.priceMin != null) inputs.push({ name: 'minPrice', value: String(a.priceMin) })
  if (a.priceMax != null) inputs.push({ name: 'maxPrice', value: String(a.priceMax) })

  if (a.checkIn) inputs.push({ name: 'checkIn', value: a.checkIn })
  if (a.checkOut) inputs.push({ name: 'checkOut', value: a.checkOut })
  if (a.adults != null) inputs.push({ name: 'adults', value: String(a.adults) })
  if (a.rooms != null) inputs.push({ name: 'rooms', value: String(a.rooms) })

  return inputs
}

export const renderActiveChips = (a: ActiveFilters, pathBase: string, sort: SortKey) => {
  const chips: { label: string; href: string }[] = []
  const base = `${pathBase}/1`
  const makeHref = (next: ActiveFilters) => `${base}${buildSearchParams(next, sort)}`

  for (const s of a.stars) {
    const next = { ...a, stars: a.stars.filter((x) => x !== s) }
    chips.push({ label: `${s}★`, href: makeHref(next) })
  }

  for (const n of a.neighborhoods) {
    const next = { ...a, neighborhoods: a.neighborhoods.filter((x) => x !== n) }
    chips.push({ label: n, href: makeHref(next) })
  }

  for (const x of a.amenities) {
    const next = { ...a, amenities: a.amenities.filter((y) => y !== x) }
    chips.push({ label: x, href: makeHref(next) })
  }

  if (a.refundableOnly) {
    const next = { ...a, refundableOnly: false }
    chips.push({ label: 'Free cancellation', href: makeHref(next) })
  }

  if (a.priceMin != null) {
    const next = { ...a, priceMin: null }
    chips.push({ label: `Min $${a.priceMin}`, href: makeHref(next) })
  }

  if (a.priceMax != null) {
    const next = { ...a, priceMax: null }
    chips.push({ label: `Max $${a.priceMax}`, href: makeHref(next) })
  }

  if (a.checkIn) {
    const next = { ...a, checkIn: null }
    chips.push({ label: `Check-in ${a.checkIn}`, href: makeHref(next) })
  }

  if (a.checkOut) {
    const next = { ...a, checkOut: null }
    chips.push({ label: `Check-out ${a.checkOut}`, href: makeHref(next) })
  }

  if (a.adults != null) {
    const next = { ...a, adults: null }
    chips.push({ label: `${a.adults} adults`, href: makeHref(next) })
  }

  if (a.rooms != null) {
    const next = { ...a, rooms: null }
    chips.push({ label: `${a.rooms} rooms`, href: makeHref(next) })
  }

  return chips.map((c) => (
    <a key={c.label} class="t-badge hover:bg-white" href={c.href}>
      {c.label} <span class="ml-1 text-[color:var(--color-text-muted)]">×</span>
    </a>
  ))
}