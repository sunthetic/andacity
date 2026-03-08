import type { ExploreIntent } from '~/types/explore/intent'
import type { CarSearchSeed, ExploreSearchContext } from '~/types/explore/search'

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

export const exploreIntentToCarSearchSeed = (intent: ExploreIntent): CarSearchSeed => {
  const filters: CarSearchSeed['filters'] = {}

  const vehicleClasses = toList(intent.carPresets?.vehicleClasses)
  if (vehicleClasses) {
    filters.vehicleClasses = vehicleClasses
  }

  if (intent.carPresets?.pickupType) {
    filters.pickupType = intent.carPresets.pickupType
  }

  return {
    query: toQuery(intent),
    filters,
    context: toContext(intent),
  }
}
