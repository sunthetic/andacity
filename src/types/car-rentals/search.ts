import type { AvailabilityConfidenceModel } from '~/lib/inventory/availability-confidence'
import type { InventoryFreshnessModel } from '~/lib/inventory/freshness'
import type { BookableEntity } from '~/types/bookable-entity'
import type {
  CarSearchEntity,
  CarSearchEntityPayload,
} from '~/types/search-entity'

export type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating-desc' | 'reviewcount-desc'

export type ActiveFilters = {
  categories: string[]
  transmissions: string[]
  seats: number[]
  inclusions: string[]
  freeCancellationOnly: boolean
  payAtCounterOnly: boolean

  ratingMin: number | null
  priceMin: number | null
  priceMax: number | null

  pickupDate: string | null
  dropoffDate: string | null
  drivers: number | null
}

export type CarRentalResult = {
  id: string
  inventoryId?: number
  canonicalInventoryId?: string
  slug: string
  name: string
  city: string
  pickupArea: string
  locationId?: number | null

  vehicleName?: string | null
  category: string | null
  transmission: string | null
  seats: number | null
  bags?: string | null
  pickupType?: 'airport' | 'city' | null
  rating: number
  reviewCount: number
  priceFrom: number
  currency: string

  freeCancellation: boolean
  payAtCounter: boolean

  inclusions: string[]
  image: string

  badges: string[]
  score: number
  availabilityConfidence?: AvailabilityConfidenceModel
  freshness?: InventoryFreshnessModel
  searchEntity?: CarSearchEntity<CarSearchEntityPayload>
  bookableEntity?: BookableEntity<CarSearchEntityPayload>
}

export type Facets = {
  categories: { name: string; count: number }[]
  transmissions: { name: string; count: number }[]
  seats: { name: string; count: number }[]
  inclusions: { name: string; count: number }[]
}
