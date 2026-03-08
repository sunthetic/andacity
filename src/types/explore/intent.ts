export type ExploreIntentKind = 'vibe' | 'theme' | 'idea' | 'seasonal' | 'city'

export type ExploreTravelStyle =
  | 'luxury'
  | 'budget'
  | 'romantic'
  | 'family'
  | 'business'
  | 'adventure'
  | 'wellness'
  | 'nightlife'
  | 'beach'
  | 'urban'

export type ExplorePriceTier = 'budget' | 'mid' | 'upscale' | 'luxury'
export type ExplorePickupType = 'airport' | 'city'
export type ExploreSeason = 'spring' | 'summer' | 'fall' | 'winter'

export type ExploreIntentLocation = {
  city?: string
  region?: string
  country?: string
  lat?: number
  lng?: number
}

export type ExploreHotelPresets = {
  starRatingMin?: number
  amenities?: string[]
  propertyTypes?: string[]
  neighborhoods?: string[]
  priceTier?: ExplorePriceTier
}

export type ExploreCarPresets = {
  vehicleClasses?: string[]
  pickupType?: ExplorePickupType
}

export type ExploreDateHints = {
  tripLengthDays?: number
  season?: ExploreSeason
  weekendFriendly?: boolean
}

export type ExploreIntentUi = {
  accent?: string
  heroMode?: string
  backgroundMode?: string
}

export type ExploreIntent = {
  kind: ExploreIntentKind
  label: string
  slug: string

  location?: ExploreIntentLocation
  travelStyle?: ExploreTravelStyle[]

  hotelPresets?: ExploreHotelPresets
  carPresets?: ExploreCarPresets

  dateHints?: ExploreDateHints

  ui?: ExploreIntentUi
}
