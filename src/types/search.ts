import type { SearchVertical } from '~/types/search-entity'

export type SearchParamsFilters = {
  priceRange?: Array<string | number> | null
  starRating?: Array<string | number> | null
  guestRating?: Array<string | number> | null
  amenities?: string[] | null
  refundableOnly?: boolean | null
  sort?: string | null
}

export type SearchParams = {
  vertical: SearchVertical
  origin?: string
  destination?: string
  departDate?: string
  returnDate?: string
  checkInDate?: string
  checkOutDate?: string
  passengers?: number
  occupancy?: number
  adults?: number
  children?: number
  rooms?: number
  pickupLocation?: string
  dropoffLocation?: string
  filters?: SearchParamsFilters
}
