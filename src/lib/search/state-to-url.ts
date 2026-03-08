import type { SearchState } from '~/types/search/state'

type SearchStateToUrlOptions = {
  includeQueryParam?: boolean
  includeLocationParams?: boolean
  dateParamKeys?: {
    checkIn?: string
    checkOut?: string
  }
}

const toParamValue = (value: unknown): string | null => {
  if (value == null) return null
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item || '').trim()).filter(Boolean)
    return items.length ? items.join(',') : null
  }

  if (typeof value === 'boolean') return value ? '1' : '0'

  const raw = String(value).trim()
  return raw ? raw : null
}

export const searchStateToUrl = (
  pathname: string,
  state: SearchState,
  options: SearchStateToUrlOptions = {},
) => {
  const checkInKey = options.dateParamKeys?.checkIn || 'checkIn'
  const checkOutKey = options.dateParamKeys?.checkOut || 'checkOut'
  const sp = new URLSearchParams()

  if (options.includeQueryParam !== false && state.query) {
    sp.set('q', state.query)
  }

  if (options.includeLocationParams !== false) {
    if (state.location?.city) {
      sp.set('city', state.location.city)
    }
    if (state.location?.lat != null) {
      sp.set('lat', String(state.location.lat))
    }
    if (state.location?.lng != null) {
      sp.set('lng', String(state.location.lng))
    }
  }

  if (state.dates?.checkIn) {
    sp.set(checkInKey, state.dates.checkIn)
  }
  if (state.dates?.checkOut) {
    sp.set(checkOutKey, state.dates.checkOut)
  }

  const filters = state.filters || {}
  const filterKeys = Object.keys(filters).sort((a, b) => a.localeCompare(b))
  for (const key of filterKeys) {
    const value = toParamValue(filters[key])
    if (!value) continue
    sp.set(key, value)
  }

  if (state.sort) {
    sp.set('sort', state.sort)
  }

  if (state.page && state.page > 1) {
    sp.set('page', String(state.page))
  }

  const query = sp.toString()
  return query ? `${pathname}?${query}` : pathname
}
