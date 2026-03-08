import { exploreIntentToCarSearchSeed } from '~/lib/explore/intent-to-cars'
import { exploreIntentToHotelSearchSeed } from '~/lib/explore/intent-to-hotels'
import type { ExploreIntent } from '~/types/explore/intent'
import type { CarSearchSeed, ExploreSearchContext, HotelSearchSeed } from '~/types/explore/search'

type SerializeSeedOptions = {
  page?: number
}

const resolvePage = (page: number | undefined) => {
  if (typeof page !== 'number') return 1
  if (!Number.isFinite(page)) return 1
  if (page < 1) return 1
  return Math.floor(page)
}

const toQuerySegment = (query: string) => {
  const normalized = String(query || '').trim() || 'anywhere'
  return encodeURIComponent(normalized)
}

const setCsv = (sp: URLSearchParams, key: string, values: string[] | undefined) => {
  if (!values || !values.length) return
  sp.set(key, values.join(','))
}

const setExploreContext = (sp: URLSearchParams, context: ExploreSearchContext | undefined) => {
  if (!context) return

  sp.set('explore', context.intentSlug)
  sp.set('intent', context.intentKind)

  if (context.accent) {
    sp.set('accent', context.accent)
  }

  if (context.heroMode) {
    sp.set('heroMode', context.heroMode)
  }

  if (context.backgroundMode) {
    sp.set('backgroundMode', context.backgroundMode)
  }

  if (context.season) {
    sp.set('season', context.season)
  }

  if (context.weekendFriendly != null) {
    sp.set('weekend', context.weekendFriendly ? '1' : '0')
  }

  if (context.tripLengthDays != null) {
    sp.set('tripLength', String(context.tripLengthDays))
  }
}

export const serializeHotelSearchSeedToHref = (
  seed: HotelSearchSeed,
  options: SerializeSeedOptions = {},
) => {
  const page = resolvePage(options.page)
  const path = `/search/hotels/${toQuerySegment(seed.query)}/${page}`
  const sp = new URLSearchParams()

  if (seed.filters.starRatingMin != null) {
    sp.set('starsMin', String(seed.filters.starRatingMin))
  }

  setCsv(sp, 'amenities', seed.filters.amenities)
  setCsv(sp, 'propertyTypes', seed.filters.propertyTypes)
  setCsv(sp, 'neighborhoods', seed.filters.neighborhoods)

  if (seed.filters.priceTier) {
    sp.set('price', seed.filters.priceTier)
  }

  setExploreContext(sp, seed.context)

  const query = sp.toString()
  return query ? `${path}?${query}` : path
}

export const serializeCarSearchSeedToHref = (
  seed: CarSearchSeed,
  options: SerializeSeedOptions = {},
) => {
  const page = resolvePage(options.page)
  const path = `/search/car-rentals/${toQuerySegment(seed.query)}/${page}`
  const sp = new URLSearchParams()

  sp.set('q', String(seed.query || '').trim() || 'anywhere')

  setCsv(sp, 'class', seed.filters.vehicleClasses)

  if (seed.filters.pickupType) {
    sp.set('pickup', seed.filters.pickupType)
  }

  setExploreContext(sp, seed.context)

  const query = sp.toString()
  return query ? `${path}?${query}` : path
}

export const serializeExploreIntentToHotelHref = (
  intent: ExploreIntent,
  options: SerializeSeedOptions = {},
) => {
  return serializeHotelSearchSeedToHref(exploreIntentToHotelSearchSeed(intent), options)
}

export const serializeExploreIntentToCarHref = (
  intent: ExploreIntent,
  options: SerializeSeedOptions = {},
) => {
  return serializeCarSearchSeedToHref(exploreIntentToCarSearchSeed(intent), options)
}
