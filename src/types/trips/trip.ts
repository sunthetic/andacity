export const TRIP_STATUSES = ['draft', 'planning', 'ready', 'archived'] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]

export const TRIP_ITEM_TYPES = ['hotel', 'flight', 'car'] as const
export type TripItemType = (typeof TRIP_ITEM_TYPES)[number]

export const TRIP_PRICE_DRIFT_STATUSES = ['increased', 'decreased', 'unchanged', 'unavailable'] as const
export type TripPriceDriftStatus = (typeof TRIP_PRICE_DRIFT_STATUSES)[number]

export const TRIP_ITEM_VALIDITY_STATUSES = [
  'valid',
  'unavailable',
  'stale',
  'price_only_changed',
] as const
export type TripItemValidityStatus = (typeof TRIP_ITEM_VALIDITY_STATUSES)[number]

export const TRIP_VALIDATION_SEVERITIES = ['warning', 'blocking'] as const
export type TripValidationSeverity = (typeof TRIP_VALIDATION_SEVERITIES)[number]

export const TRIP_INTELLIGENCE_STATUSES = [
  'valid_itinerary',
  'warnings_present',
  'blocking_issues_present',
] as const
export type TripIntelligenceStatus = (typeof TRIP_INTELLIGENCE_STATUSES)[number]

export type TripValidationIssue = {
  code: string
  scope: 'availability' | 'itinerary'
  severity: TripValidationSeverity
  message: string
  itemId?: number
  relatedItemIds?: number[]
}

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
  availabilityStatus: TripItemValidityStatus
  availabilityCheckedAt: string | null
  availabilityExpiresAt: string | null
  imageUrl: string | null
  meta: string[]
  issues: TripValidationIssue[]
  startCityName: string | null
  endCityName: string | null
  hotelId: number | null
  flightItineraryId: number | null
  carInventoryId: number | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type TripIntelligenceSummary = {
  status: TripIntelligenceStatus
  checkedAt: string | null
  expiresAt: string | null
  itemStatusCounts: Record<TripItemValidityStatus, number>
  issueCounts: {
    warning: number
    blocking: number
  }
  issues: TripValidationIssue[]
}

export type TripDetails = TripListItem & {
  notes: string | null
  metadata: Record<string, unknown>
  citiesInvolved: string[]
  pricing: TripPricingSummary
  intelligence: TripIntelligenceSummary
  items: TripItem[]
}
