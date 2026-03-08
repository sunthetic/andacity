export const TRIP_STATUSES = ['draft', 'planning', 'ready', 'archived'] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]

export const TRIP_ITEM_TYPES = ['hotel', 'flight', 'car'] as const
export type TripItemType = (typeof TRIP_ITEM_TYPES)[number]

export const TRIP_PRICE_DRIFT_STATUSES = ['increased', 'decreased', 'unchanged', 'unavailable'] as const
export type TripPriceDriftStatus = (typeof TRIP_PRICE_DRIFT_STATUSES)[number]

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
  hasMixedCurrencies: boolean
  updatedAt: string
}

export type TripVerticalPricing = {
  itemType: TripItemType
  itemCount: number
  currencyCode: string | null
  snapshotSubtotalCents: number | null
  currentSubtotalCents: number | null
  priceDeltaCents: number | null
  hasMixedCurrencies: boolean
}

export type TripPricingSummary = {
  currencyCode: string | null
  snapshotTotalCents: number | null
  currentTotalCents: number | null
  priceDeltaCents: number | null
  hasMixedCurrencies: boolean
  driftCounts: Record<TripPriceDriftStatus, number>
  verticals: TripVerticalPricing[]
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
  snapshotPriceCents: number
  snapshotCurrencyCode: string
  snapshotTimestamp: string
  currentPriceCents: number | null
  currentCurrencyCode: string | null
  priceDriftStatus: TripPriceDriftStatus
  priceDriftCents: number | null
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
  pricing: TripPricingSummary
  items: TripItem[]
}
