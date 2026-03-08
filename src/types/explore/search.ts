import type {
  ExploreIntentKind,
  ExplorePickupType,
  ExplorePriceTier,
  ExploreSeason,
} from '~/types/explore/intent'

export type ExploreSearchContext = {
  intentSlug: string
  intentKind: ExploreIntentKind
  accent?: string
  heroMode?: string
  backgroundMode?: string
  season?: ExploreSeason
  weekendFriendly?: boolean
  tripLengthDays?: number
}

export type HotelSearchSeed = {
  query: string
  filters: {
    starRatingMin?: number
    amenities?: string[]
    propertyTypes?: string[]
    neighborhoods?: string[]
    priceTier?: ExplorePriceTier
  }
  context?: ExploreSearchContext
}

export type CarSearchSeed = {
  query: string
  filters: {
    vehicleClasses?: string[]
    pickupType?: ExplorePickupType
  }
  context?: ExploreSearchContext
}

export type FlightSearchSeed = {
  from: string
  to: string
  itineraryType?: 'round-trip' | 'one-way'
  filters: {
    maxStops?: 0 | 1 | 2
    cabinClass?: 'economy' | 'premium-economy' | 'business' | 'first'
  }
  context?: ExploreSearchContext
}
