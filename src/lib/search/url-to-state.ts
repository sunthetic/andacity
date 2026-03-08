import type { SearchState } from '~/types/search/state'

type SearchStateDefaults = Partial<SearchState>

const RESERVED_KEYS = new Set(['q', 'query', 'city', 'lat', 'lng', 'checkIn', 'checkOut', 'sort', 'page'])

const toMaybeNumber = (raw: string | null) => {
  if (!raw) return undefined
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n : undefined
}

const toFilterValue = (raw: string): unknown => {
  const value = String(raw || '').trim()
  if (!value) return undefined

  if (value.includes(',')) {
    const parts = value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    return parts.length ? parts : undefined
  }

  if (value === '1' || value === 'true') return true
  if (value === '0' || value === 'false') return false

  const asNumber = Number(value)
  if (Number.isFinite(asNumber) && /^-?\d+(\.\d+)?$/.test(value)) return asNumber

  return value
}

const toPage = (raw: string | null, fallback = 1) => {
  const n = Number.parseInt(String(raw || ''), 10)
  if (!Number.isFinite(n) || n < 1) return fallback
  return n
}

export const searchStateFromUrl = (url: URL, defaults: SearchStateDefaults = {}): SearchState => {
  const sp = url.searchParams

  const state: SearchState = {
    query: String(defaults.query || '').trim(),
    location: defaults.location ? { ...defaults.location } : undefined,
    dates: defaults.dates ? { ...defaults.dates } : undefined,
    filters: defaults.filters ? { ...defaults.filters } : undefined,
    sort: defaults.sort,
    page: defaults.page,
  }

  const queryFromUrl = String(sp.get('q') || sp.get('query') || '').trim()
  if (queryFromUrl) {
    state.query = queryFromUrl
  }

  const city = String(sp.get('city') || '').trim()
  const lat = toMaybeNumber(sp.get('lat'))
  const lng = toMaybeNumber(sp.get('lng'))
  if (city || lat != null || lng != null) {
    state.location = {
      ...(state.location || {}),
      city: city || state.location?.city,
      lat: lat != null ? lat : state.location?.lat,
      lng: lng != null ? lng : state.location?.lng,
    }
  }

  const checkIn = String(sp.get('checkIn') || '').trim()
  const checkOut = String(sp.get('checkOut') || '').trim()
  if (checkIn || checkOut) {
    state.dates = {
      ...(state.dates || {}),
      checkIn: checkIn || state.dates?.checkIn,
      checkOut: checkOut || state.dates?.checkOut,
    }
  }

  const sort = String(sp.get('sort') || '').trim()
  if (sort) {
    state.sort = sort
  }

  state.page = toPage(sp.get('page'), state.page || 1)

  const filters: Record<string, unknown> = {
    ...(state.filters || {}),
  }

  for (const [key, raw] of sp.entries()) {
    if (RESERVED_KEYS.has(key)) continue
    const value = toFilterValue(raw)
    if (value === undefined) continue
    filters[key] = value
  }

  state.filters = Object.keys(filters).length ? filters : undefined

  return state
}
