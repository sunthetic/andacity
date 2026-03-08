export const TRIP_STATUSES = ['draft', 'planning', 'ready', 'archived'] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]

export const TRIP_ITEM_TYPES = ['hotel', 'flight', 'car'] as const
export type TripItemType = (typeof TRIP_ITEM_TYPES)[number]

export type TripItemCandidate = {
  itemType: TripItemType
  inventoryId: number
  startDate?: string
  endDate?: string
  priceCents?: number
  currencyCode?: string
  title?: string
  subtitle?: string
  imageUrl?: string
  meta?: string[]
  metadata?: Record<string, unknown>
}

export type TripListItem = {
  id: number
  name: string
  status: TripStatus
  itemCount: number
  startDate: string | null
  endDate: string | null
  estimatedTotalCents: number
  currencyCode: string
  updatedAt: string
}

export type TripItem = {
  id: number
  tripId: number
  itemType: TripItemType
  position: number
  title: string
  subtitle: string | null
  startDate: string | null
  endDate: string | null
  priceCents: number
  currencyCode: string
  imageUrl: string | null
  meta: string[]
  startCityName: string | null
  endCityName: string | null
  hotelId: number | null
  flightItineraryId: number | null
  carInventoryId: number | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type TripDetails = TripListItem & {
  notes: string | null
  metadata: Record<string, unknown>
  citiesInvolved: string[]
  items: TripItem[]
}
