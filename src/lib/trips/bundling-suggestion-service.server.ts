import {
  buildCarPriceDisplay,
  buildFlightPriceDisplay,
  buildHotelPriceDisplay,
  mergePriceDisplayMetadata,
} from '~/lib/pricing/price-display'
import { computeDays } from '~/lib/search/car-rentals/dates'
import { computeNights } from '~/lib/search/hotels/dates'
import { addDays } from '~/lib/trips/date-utils'
import { recommendationQueryHelpers } from '~/lib/trips/recommendation-query-helpers.server'
import {
  tripGapAnalyzer,
  type TripGapAnalyzerInput,
} from '~/lib/trips/trip-gap-analyzer'
import type {
  TripBundlingGap,
  TripBundlingSuggestion,
  TripBundlingSuggestionType,
  TripBundlingSummary,
  TripItemCandidate,
} from '~/types/trips/trip'

type BuildTripBundlingSummaryInput = TripGapAnalyzerInput & {
  maxSuggestions?: number
}

const getPriorityRank = (priority: TripBundlingGap['priority']) => {
  if (priority === 'high') return 0
  if (priority === 'medium') return 1
  return 2
}

const toSuggestionType = (
  gapType: TripBundlingGap['gapType'],
): TripBundlingSuggestionType => {
  if (gapType === 'missing_return_flight') return 'add_return_flight'
  if (gapType === 'missing_lodging') return 'add_hotel_near_arrival'
  if (gapType === 'arrival_ground_transport') return 'add_ground_transport_after_arrival'
  if (gapType === 'missing_car_rental') return 'add_car_rental_for_stay'
  if (gapType === 'intercity_transfer_gap') return 'add_connection_flight'
  return 'fill_missing_stay_dates'
}

const compareGapsForSuggestions = (left: TripBundlingGap, right: TripBundlingGap) => {
  const priorityOrder = getPriorityRank(left.priority) - getPriorityRank(right.priority)
  if (priorityOrder !== 0) return priorityOrder
  if (left.startDate && right.startDate && left.startDate !== right.startDate) {
    return left.startDate < right.startDate ? -1 : 1
  }
  if (left.startDate && !right.startDate) return -1
  if (!left.startDate && right.startDate) return 1
  return left.title.localeCompare(right.title)
}

const buildSuggestionCandidateMetadata = (
  gap: TripBundlingGap,
  suggestionType: TripBundlingSuggestionType,
  generatedAt: string,
) => ({
  smartBundling: {
    generatedAt,
    gapId: gap.id,
    gapType: gap.gapType,
    relatedItemIds: gap.relatedItemIds,
    suggestionType,
  },
})

const buildSuggestionKey = (candidate: TripItemCandidate) => {
  return [
    candidate.itemType,
    candidate.inventoryId,
    candidate.startDate || '',
    candidate.endDate || '',
  ].join(':')
}

const buildHotelSuggestion = async (
  gap: TripBundlingGap,
  generatedAt: string,
): Promise<TripBundlingSuggestion | null> => {
  if (!gap.cityId || !gap.startDate || !gap.endDate) return null

  const inventory = await recommendationQueryHelpers.findHotelRecommendation({
    cityId: gap.cityId,
    checkIn: gap.startDate,
    checkOut: gap.endDate,
  })
  if (!inventory) return null

  const suggestionType = toSuggestionType(gap.gapType)
  const priceDisplay = buildHotelPriceDisplay({
    currencyCode: inventory.currencyCode,
    nightlyRate: inventory.priceCents / 100,
    nights: computeNights(gap.startDate, gap.endDate),
  })
  const tripCandidate: TripItemCandidate = {
    itemType: 'hotel',
    inventoryId: inventory.inventoryId,
    startDate: gap.startDate,
    endDate: gap.endDate,
    priceCents:
      Math.round(
        (priceDisplay.baseTotalAmount ?? priceDisplay.baseAmount ?? 0) * 100,
      ) || inventory.priceCents,
    currencyCode: inventory.currencyCode,
    title: inventory.title,
    subtitle: inventory.subtitle || undefined,
    imageUrl: inventory.imageUrl || undefined,
    meta: inventory.meta,
    metadata: mergePriceDisplayMetadata(
      buildSuggestionCandidateMetadata(gap, suggestionType, generatedAt),
      'hotel',
      priceDisplay,
    ),
  }

  return {
    id: `${gap.id}:${inventory.inventoryId}`,
    gapId: gap.id,
    suggestionType,
    priority: gap.priority,
    itemType: 'hotel',
    title: gap.title,
    description: gap.description,
    ctaLabel: 'Add to trip',
    startDate: gap.startDate,
    endDate: gap.endDate,
    cityName: gap.cityName,
    inventory,
    tripCandidate,
  }
}

const buildCarSuggestion = async (
  gap: TripBundlingGap,
  generatedAt: string,
): Promise<TripBundlingSuggestion | null> => {
  if (!gap.cityId || !gap.startDate) return null

  const dropoffDate = gap.endDate || addDays(gap.startDate, 1)
  if (!dropoffDate) return null

  const inventory = await recommendationQueryHelpers.findCarRecommendation({
    cityId: gap.cityId,
    pickupDate: gap.startDate,
    dropoffDate,
    preferredLocationType: gap.gapType === 'arrival_ground_transport' ? 'airport' : undefined,
  })
  if (!inventory) return null

  const suggestionType = toSuggestionType(gap.gapType)
  const priceDisplay = buildCarPriceDisplay({
    currencyCode: inventory.currencyCode,
    dailyRate: inventory.priceCents / 100,
    days: computeDays(gap.startDate, dropoffDate),
  })
  const tripCandidate: TripItemCandidate = {
    itemType: 'car',
    inventoryId: inventory.inventoryId,
    startDate: gap.startDate,
    endDate: dropoffDate,
    priceCents:
      Math.round(
        (priceDisplay.baseTotalAmount ?? priceDisplay.baseAmount ?? 0) * 100,
      ) || inventory.priceCents,
    currencyCode: inventory.currencyCode,
    title: inventory.title,
    subtitle: inventory.subtitle || undefined,
    imageUrl: inventory.imageUrl || undefined,
    meta: inventory.meta,
    metadata: mergePriceDisplayMetadata(
      buildSuggestionCandidateMetadata(gap, suggestionType, generatedAt),
      'car',
      priceDisplay,
    ),
  }

  return {
    id: `${gap.id}:${inventory.inventoryId}`,
    gapId: gap.id,
    suggestionType,
    priority: gap.priority,
    itemType: 'car',
    title: gap.title,
    description: gap.description,
    ctaLabel: 'Add to trip',
    startDate: gap.startDate,
    endDate: dropoffDate,
    cityName: gap.cityName,
    inventory,
    tripCandidate,
  }
}

const buildFlightSuggestion = async (
  gap: TripBundlingGap,
  generatedAt: string,
): Promise<TripBundlingSuggestion | null> => {
  if (!gap.originCityId || !gap.destinationCityId || !gap.startDate) return null

  const inventory = await recommendationQueryHelpers.findFlightRecommendation({
    originCityId: gap.originCityId,
    destinationCityId: gap.destinationCityId,
    serviceDates: recommendationQueryHelpers.buildForwardDateCandidates(
      gap.startDate,
      gap.endDate,
    ),
  })
  if (!inventory) return null

  const serviceDate = inventory.serviceDate || gap.startDate
  const suggestionType = toSuggestionType(gap.gapType)
  const priceDisplay = buildFlightPriceDisplay({
    currencyCode: inventory.currencyCode,
    fare: inventory.priceCents / 100,
    travelers: 1,
  })
  const tripCandidate: TripItemCandidate = {
    itemType: 'flight',
    inventoryId: inventory.inventoryId,
    startDate: serviceDate,
    endDate: serviceDate,
    priceCents:
      Math.round(
        (priceDisplay.baseTotalAmount ?? priceDisplay.baseAmount ?? 0) * 100,
      ) || inventory.priceCents,
    currencyCode: inventory.currencyCode,
    title: inventory.title,
    subtitle: inventory.subtitle || undefined,
    meta: inventory.meta,
    metadata: mergePriceDisplayMetadata(
      buildSuggestionCandidateMetadata(gap, suggestionType, generatedAt),
      'flight',
      priceDisplay,
    ),
  }

  return {
    id: `${gap.id}:${inventory.inventoryId}`,
    gapId: gap.id,
    suggestionType,
    priority: gap.priority,
    itemType: 'flight',
    title: gap.title,
    description: gap.description,
    ctaLabel: 'Add to trip',
    startDate: serviceDate,
    endDate: serviceDate,
    cityName: gap.cityName,
    inventory,
    tripCandidate,
  }
}

const buildSuggestionForGap = async (
  gap: TripBundlingGap,
  generatedAt: string,
) => {
  if (gap.targetItemType === 'hotel') return buildHotelSuggestion(gap, generatedAt)
  if (gap.targetItemType === 'car') return buildCarSuggestion(gap, generatedAt)
  return buildFlightSuggestion(gap, generatedAt)
}

const buildEmptySummary = (generatedAt: string): TripBundlingSummary => ({
  generatedAt,
  gaps: [],
  suggestions: [],
})

const buildTripBundlingSummary = async (
  input: BuildTripBundlingSummaryInput,
): Promise<TripBundlingSummary> => {
  const generatedAt = new Date().toISOString()
  if (!input.items.length) return buildEmptySummary(generatedAt)

  const analysis = tripGapAnalyzer(input)
  if (!analysis.gaps.length) {
    return buildEmptySummary(generatedAt)
  }

  const suggestions: TripBundlingSuggestion[] = []
  const seenSuggestionKeys = new Set<string>()
  const maxSuggestions = Math.max(1, Math.min(input.maxSuggestions || 6, 8))

  for (const gap of [...analysis.gaps].sort(compareGapsForSuggestions)) {
    if (suggestions.length >= maxSuggestions) break

    const suggestion = await buildSuggestionForGap(gap, generatedAt)
    if (!suggestion) continue

    const key = buildSuggestionKey(suggestion.tripCandidate)
    if (seenSuggestionKeys.has(key)) continue

    seenSuggestionKeys.add(key)
    suggestions.push(suggestion)
  }

  return {
    generatedAt,
    gaps: analysis.gaps,
    suggestions,
  }
}

export const bundlingSuggestionService = {
  buildTripBundlingSummary,
}
