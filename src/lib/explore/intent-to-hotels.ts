import type { ExploreIntent } from '~/types/explore/intent'
import type { ExploreSearchContext, HotelSearchSeed } from '~/types/explore/search'

const toQuery = (intent: ExploreIntent) => {
  const city = String(intent.location?.city || '').trim()
  if (city) return city

  const label = String(intent.label || '').trim()
  if (label) return label

  const slug = String(intent.slug || '').trim()
  return slug || 'anywhere'
}

const toList = (items: string[] | undefined) => {
  if (!items || !items.length) return undefined
  const normalized = items.map((item) => String(item || '').trim()).filter(Boolean)
  return normalized.length ? normalized : undefined
}

const toContext = (intent: ExploreIntent): ExploreSearchContext => {
  return {
    intentSlug: intent.slug,
    intentKind: intent.kind,
    accent: intent.ui?.accent,
    heroMode: intent.ui?.heroMode,
    backgroundMode: intent.ui?.backgroundMode,
    season: intent.dateHints?.season,
    weekendFriendly: intent.dateHints?.weekendFriendly,
    tripLengthDays: intent.dateHints?.tripLengthDays,
  }
}

export const exploreIntentToHotelSearchSeed = (intent: ExploreIntent): HotelSearchSeed => {
  const filters: HotelSearchSeed['filters'] = {}

  if (intent.hotelPresets?.starRatingMin != null) {
    filters.starRatingMin = intent.hotelPresets.starRatingMin
  }

  const amenities = toList(intent.hotelPresets?.amenities)
  if (amenities) {
    filters.amenities = amenities
  }

  const propertyTypes = toList(intent.hotelPresets?.propertyTypes)
  if (propertyTypes) {
    filters.propertyTypes = propertyTypes
  }

  const neighborhoods = toList(intent.hotelPresets?.neighborhoods)
  if (neighborhoods) {
    filters.neighborhoods = neighborhoods
  }

  if (intent.hotelPresets?.priceTier) {
    filters.priceTier = intent.hotelPresets.priceTier
  }

  return {
    query: toQuery(intent),
    filters,
    context: toContext(intent),
  }
}
