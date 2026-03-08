import type { ExploreIntent } from '~/types/explore/intent'
import type { ExploreSearchContext, FlightSearchSeed } from '~/types/explore/search'

const toDestination = (intent: ExploreIntent) => {
  const city = String(intent.location?.city || '').trim()
  if (city) return city
  return 'Anywhere'
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

const toCabinClass = (intent: ExploreIntent): FlightSearchSeed['filters']['cabinClass'] => {
  const styles = intent.travelStyle || []
  if (styles.includes('luxury') || styles.includes('business')) return 'business'
  return 'economy'
}

export const exploreIntentToFlightSearchSeed = (intent: ExploreIntent): FlightSearchSeed => {
  const filters: FlightSearchSeed['filters'] = {
    maxStops: intent.dateHints?.weekendFriendly ? 1 : 2,
    cabinClass: toCabinClass(intent),
  }

  return {
    from: 'Anywhere',
    to: toDestination(intent),
    itineraryType: 'round-trip',
    filters,
    context: toContext(intent),
  }
}
