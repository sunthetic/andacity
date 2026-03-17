import {
  buildCarPriceDisplay,
  buildFlightPriceDisplay,
  buildHotelPriceDisplay,
  formatMoneyFromCents,
  mergePriceDisplayMetadata,
  type PriceDisplayContract,
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
  TripBundlingExplanation,
  TripBundlingPricingContext,
  TripBundlingPricePosition,
  TripBundlingSuggestion,
  TripBundlingSuggestionType,
  TripBundlingSummary,
  TripItemCandidate,
  TripItemType,
} from '~/types/trips/trip'

type BuildTripBundlingSummaryInput = TripGapAnalyzerInput & {
  maxSuggestions?: number
  pricing?: TripBundlingPricingContext | null
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

const formatDate = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || 'dates pending'

  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10))
  const date = new Date(Date.UTC(year, month - 1, day))

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

const formatDateRange = (startDate: string | null, endDate: string | null) => {
  if (startDate && endDate && startDate !== endDate) {
    return `${formatDate(startDate)} to ${formatDate(endDate)}`
  }

  if (startDate) return formatDate(startDate)
  if (endDate) return formatDate(endDate)
  return 'dates pending'
}

const resolveDisplayedBaseCents = (
  display: PriceDisplayContract,
  fallbackPriceCents: number,
) => {
  return (
    Math.round((display.baseTotalAmount ?? display.baseAmount ?? 0) * 100) ||
    Math.max(0, Math.round(fallbackPriceCents))
  )
}

const buildComparableBaseCents = (input: {
  itemType: TripItemType
  unitPriceCents: number
  currencyCode: string
  startDate: string | null
  endDate: string | null
}) => {
  if (input.itemType === 'hotel') {
    return resolveDisplayedBaseCents(
      buildHotelPriceDisplay({
        currencyCode: input.currencyCode,
        nightlyRate: input.unitPriceCents / 100,
        nights: computeNights(input.startDate, input.endDate),
      }),
      input.unitPriceCents,
    )
  }

  if (input.itemType === 'car') {
    return resolveDisplayedBaseCents(
      buildCarPriceDisplay({
        currencyCode: input.currencyCode,
        dailyRate: input.unitPriceCents / 100,
        days:
          input.startDate && input.endDate
            ? computeDays(input.startDate, input.endDate)
            : null,
      }),
      input.unitPriceCents,
    )
  }

  return resolveDisplayedBaseCents(
    buildFlightPriceDisplay({
      currencyCode: input.currencyCode,
      fare: input.unitPriceCents / 100,
      travelers: 1,
    }),
    input.unitPriceCents,
  )
}

const buildMissingSignals = (itemType: TripItemType) => {
  if (itemType === 'hotel') return ['hotel_rank_score_breakdown']
  if (itemType === 'car') return ['car_rank_score_breakdown']
  return ['flight_rank_weight_breakdown']
}

const buildConstraintReasons = (input: {
  gap: TripBundlingGap
  itemType: TripItemType
  startDate: string | null
  endDate: string | null
  cityName: string | null
  preferredLocationType: 'airport' | 'city' | null
  selectedLocationType: 'airport' | 'city' | null
  serviceDate?: string | null
}) => {
  const reasons: string[] = []

  if (input.itemType === 'hotel') {
    reasons.push(
      `Matches the uncovered stay in ${input.cityName || 'the arrival city'} for ${formatDateRange(input.startDate, input.endDate)}.`,
    )
  } else if (input.itemType === 'car') {
    reasons.push(
      `Covers ground transport in ${input.cityName || 'the arrival city'} for ${formatDateRange(input.startDate, input.endDate)}.`,
    )

    if (input.preferredLocationType && input.selectedLocationType === input.preferredLocationType) {
      reasons.push(
        `${input.preferredLocationType === 'airport' ? 'Airport' : 'City'} pickup matches the detected transfer need.`,
      )
    }
  } else {
    reasons.push(
      `Connects ${input.gap.originCityName || 'the current city'} to ${input.gap.destinationCityName || 'the next stop'} on ${formatDate(input.serviceDate || input.startDate)}.`,
    )
  }

  if (input.gap.priority === 'high') {
    reasons.push('This fills a high-priority trip gap.')
  } else if (input.gap.priority === 'medium') {
    reasons.push('This addresses a meaningful trip gap without changing the current plan shape.')
  }

  return reasons.slice(0, 3)
}

const buildWhyReasons = (input: {
  gap: TripBundlingGap
  pricePosition: 'lowest_exact_match' | 'above_lowest_exact_match' | 'unknown'
  availabilityConfidence: {
    degraded: boolean
    label: string
  }
}) => {
  const reasons = [input.gap.description]

  if (!input.availabilityConfidence.degraded) {
    reasons.push(`${input.availabilityConfidence.label} for the displayed component.`)
  }

  if (input.pricePosition === 'lowest_exact_match') {
    reasons.push('It is also the lowest exact-match price found for this gap.')
  }

  return reasons.slice(0, 3)
}

const buildTradeoffs = (input: {
  itemType: TripItemType
  gap: TripBundlingGap
  pricePosition: 'lowest_exact_match' | 'above_lowest_exact_match' | 'unknown'
  deltaFromCheapestExactMatchCents: number | null
  selectedLocationType: 'airport' | 'city' | null
  preferredLocationType: 'airport' | 'city' | null
  currencyCode: string
  availabilityConfidence: {
    degraded: boolean
    supportText: string | null
  }
  missingSignals: string[]
}) => {
  const tradeoffs: string[] = []

  if (
    input.pricePosition === 'above_lowest_exact_match' &&
    input.deltaFromCheapestExactMatchCents != null &&
    input.deltaFromCheapestExactMatchCents > 0
  ) {
    tradeoffs.push(
      `Costs ${formatMoneyFromCents(input.deltaFromCheapestExactMatchCents, input.currencyCode)} more than the lowest exact match we found.`,
    )
  }

  if (
    input.itemType === 'car' &&
    input.preferredLocationType &&
    input.selectedLocationType &&
    input.selectedLocationType !== input.preferredLocationType
  ) {
    tradeoffs.push(
      `${input.selectedLocationType === 'city' ? 'City' : 'Airport'} pickup is shown because the preferred ${input.preferredLocationType} match was not available.`,
    )
  }

  if (input.availabilityConfidence.degraded && input.availabilityConfidence.supportText) {
    tradeoffs.push(input.availabilityConfidence.supportText)
  }

  if (input.gap.priority === 'low') {
    tradeoffs.push('This gap is lower priority, so the recommendation should be treated as optional.')
  }

  if (!tradeoffs.length && input.missingSignals.length) {
    tradeoffs.push('Ranking detail is limited, so treat this as a guided option rather than a definitive best pick.')
  }

  return tradeoffs.slice(0, 3)
}

const buildStrength = (input: {
  gap: TripBundlingGap
  availabilityConfidence: {
    degraded: boolean
    match: 'exact' | 'partial' | 'unknown'
  }
  pricePosition: 'lowest_exact_match' | 'above_lowest_exact_match' | 'unknown'
  preferredLocationType: 'airport' | 'city' | null
  selectedLocationType: 'airport' | 'city' | null
  missingSignals: string[]
}) => {
  let score = 0
  const reasons: string[] = []

  if (input.gap.priority === 'high') {
    score += 2
    reasons.push('high-priority gap')
  } else if (input.gap.priority === 'medium') {
    score += 1
    reasons.push('good itinerary fit')
  } else {
    reasons.push('optional gap')
  }

  if (input.availabilityConfidence.match === 'exact' && !input.availabilityConfidence.degraded) {
    score += 2
    reasons.push('exact live match')
  } else if (input.availabilityConfidence.match === 'partial') {
    reasons.push('partial availability signal')
  } else {
    reasons.push('limited availability signal')
  }

  if (input.pricePosition === 'lowest_exact_match') {
    score += 1
    reasons.push('lowest exact-match price')
  } else if (input.pricePosition === 'above_lowest_exact_match') {
    score -= 1
    reasons.push('not the lowest price')
  }

  if (
    input.preferredLocationType &&
    input.selectedLocationType &&
    input.preferredLocationType !== input.selectedLocationType
  ) {
    score -= 1
    reasons.push('preferred pickup unavailable')
  }

  if (input.missingSignals.length) {
    score -= 1
    reasons.push('limited scoring detail')
  }

  if (score >= 4) {
    return {
      level: 'strong' as const,
      label: 'Strong fit',
      reason: `Strong because of ${reasons.slice(0, 2).join(' and ')}.`,
    }
  }

  if (score >= 2) {
    return {
      level: 'moderate' as const,
      label: 'Solid fit',
      reason: `Solid because of ${reasons.slice(0, 2).join(' and ')}.`,
    }
  }

  return {
    level: 'tentative' as const,
    label: 'Tentative',
    reason: `Tentative because of ${reasons.slice(0, 2).join(' and ')}.`,
  }
}

const buildSavingsBreakdown = (input: {
  tripPricing: TripBundlingPricingContext | null | undefined
  itemType: TripItemType
  currencyCode: string
  addedComponentBaseCents: number
  cheapestExactMatchUnitPriceCents: number | null
  startDate: string | null
  endDate: string | null
}) => {
  const sameCurrency =
    input.tripPricing?.hasMixedCurrencies !== true &&
    input.tripPricing?.snapshotTotalCents != null &&
    input.tripPricing.currencyCode === input.currencyCode
  const currentTripBaseTotalCents = sameCurrency
    ? input.tripPricing?.snapshotTotalCents ?? null
    : null
  const projectedBundleBaseTotalCents =
    currentTripBaseTotalCents == null
      ? null
      : currentTripBaseTotalCents + input.addedComponentBaseCents
  const cheapestExactMatchBaseCents =
    input.cheapestExactMatchUnitPriceCents == null
      ? null
      : buildComparableBaseCents({
          itemType: input.itemType,
          unitPriceCents: input.cheapestExactMatchUnitPriceCents,
          currencyCode: input.currencyCode,
          startDate: input.startDate,
          endDate: input.endDate,
        })
  const deltaFromCheapestExactMatchCents =
    cheapestExactMatchBaseCents == null
      ? null
      : Math.max(0, input.addedComponentBaseCents - cheapestExactMatchBaseCents)
  const pricePosition: TripBundlingPricePosition =
    cheapestExactMatchBaseCents == null
      ? 'unknown'
      : input.addedComponentBaseCents <= cheapestExactMatchBaseCents
        ? 'lowest_exact_match'
        : 'above_lowest_exact_match'

  let summary = `Added component base total ${formatMoneyFromCents(input.addedComponentBaseCents, input.currencyCode)}.`

  if (
    currentTripBaseTotalCents != null &&
    projectedBundleBaseTotalCents != null
  ) {
    summary = `Base total trace: ${formatMoneyFromCents(currentTripBaseTotalCents, input.currencyCode)} current + ${formatMoneyFromCents(input.addedComponentBaseCents, input.currencyCode)} added = ${formatMoneyFromCents(projectedBundleBaseTotalCents, input.currencyCode)}.`
  } else if (input.tripPricing?.hasMixedCurrencies) {
    summary = `${summary} Full projected base total is withheld because this trip mixes currencies.`
  }

  if (pricePosition === 'lowest_exact_match') {
    summary = `${summary} No cheaper exact match was found.`
  } else if (
    pricePosition === 'above_lowest_exact_match' &&
    deltaFromCheapestExactMatchCents != null &&
    deltaFromCheapestExactMatchCents > 0
  ) {
    summary = `${summary} This option is ${formatMoneyFromCents(deltaFromCheapestExactMatchCents, input.currencyCode)} above the lowest exact match.`
  } else {
    summary = `${summary} No bundle-only savings claim is made.`
  }

  return {
    currencyCode: input.currencyCode,
    currentTripBaseTotalCents,
    addedComponentBaseCents: input.addedComponentBaseCents,
    projectedBundleBaseTotalCents,
    selectedComponentBaseCents: input.addedComponentBaseCents,
    cheapestExactMatchBaseCents,
    deltaFromCheapestExactMatchCents,
    pricePosition,
    summary,
  }
}

const logMissingSignals = (input: {
  gap: TripBundlingGap
  itemType: TripItemType
  missingSignals: string[]
}) => {
  if (!input.missingSignals.length) return
}

export const buildSuggestionExplanation = (input: {
  gap: TripBundlingGap
  itemType: TripItemType
  startDate: string | null
  endDate: string | null
  cityName: string | null
  tripPricing: TripBundlingPricingContext | null | undefined
  inventory: {
    currencyCode: string
    serviceDate?: string | null
    availabilityConfidence: {
      degraded: boolean
      match: 'exact' | 'partial' | 'unknown'
      label: string
      supportText: string | null
    }
    explainability: {
      cheapestExactMatchPriceCents: number | null
      preferredLocationType: 'airport' | 'city' | null
      selectedLocationType: 'airport' | 'city' | null
    }
  }
  displayedBaseCents: number
}): TripBundlingExplanation => {
  const missingSignals = buildMissingSignals(input.itemType)
  const savings = buildSavingsBreakdown({
    tripPricing: input.tripPricing,
    itemType: input.itemType,
    currencyCode: input.inventory.currencyCode,
    addedComponentBaseCents: input.displayedBaseCents,
    cheapestExactMatchUnitPriceCents:
      input.inventory.explainability.cheapestExactMatchPriceCents,
    startDate: input.startDate,
    endDate: input.endDate,
  })
  const tradeoffs = buildTradeoffs({
    itemType: input.itemType,
    gap: input.gap,
    pricePosition: savings.pricePosition,
    deltaFromCheapestExactMatchCents: savings.deltaFromCheapestExactMatchCents,
    selectedLocationType: input.inventory.explainability.selectedLocationType,
    preferredLocationType: input.inventory.explainability.preferredLocationType,
    currencyCode: input.inventory.currencyCode,
    availabilityConfidence: input.inventory.availabilityConfidence,
    missingSignals,
  })
  const strength = buildStrength({
    gap: input.gap,
    availabilityConfidence: input.inventory.availabilityConfidence,
    pricePosition: savings.pricePosition,
    preferredLocationType: input.inventory.explainability.preferredLocationType,
    selectedLocationType: input.inventory.explainability.selectedLocationType,
    missingSignals,
  })

  logMissingSignals({
    gap: input.gap,
    itemType: input.itemType,
    missingSignals,
  })

  return {
    summary:
      strength.level === 'tentative'
        ? `Likely fills this gap, but the ranking signal is limited.`
        : `Fits this gap with price math that traces back to displayed component totals.`,
    why: buildWhyReasons({
      gap: input.gap,
      pricePosition: savings.pricePosition,
      availabilityConfidence: input.inventory.availabilityConfidence,
    }),
    savings,
    constraints: buildConstraintReasons({
      gap: input.gap,
      itemType: input.itemType,
      startDate: input.startDate,
      endDate: input.endDate,
      cityName: input.cityName,
      preferredLocationType: input.inventory.explainability.preferredLocationType,
      selectedLocationType: input.inventory.explainability.selectedLocationType,
      serviceDate: input.inventory.serviceDate,
    }),
    tradeoffs,
    strength,
    missingSignals,
  }
}

const buildSuggestionCandidateMetadata = (
  gap: TripBundlingGap,
  suggestionType: TripBundlingSuggestionType,
  generatedAt: string,
  explanation: TripBundlingExplanation,
  providerInventoryId: number,
) => ({
  smartBundling: {
    generatedAt,
    gapId: gap.id,
    gapType: gap.gapType,
    relatedItemIds: gap.relatedItemIds,
    suggestionType,
    selectionMode: 'recommended',
    originalInventoryId: providerInventoryId,
    currentInventoryId: providerInventoryId,
    context: {
      priority: gap.priority,
      itemType: gap.targetItemType,
      title: gap.title,
      description: gap.description,
      startDate: gap.startDate,
      endDate: gap.endDate,
      cityId: gap.cityId,
      cityName: gap.cityName,
      originCityId: gap.originCityId,
      originCityName: gap.originCityName,
      destinationCityId: gap.destinationCityId,
      destinationCityName: gap.destinationCityName,
    },
    explanation,
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
  tripPricing: TripBundlingPricingContext | null | undefined,
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
  const displayedBaseCents = resolveDisplayedBaseCents(
    priceDisplay,
    inventory.priceCents,
  )
  const explanation = buildSuggestionExplanation({
    gap,
    itemType: 'hotel',
    startDate: gap.startDate,
    endDate: gap.endDate,
    cityName: gap.cityName,
    tripPricing,
    inventory,
    displayedBaseCents,
  })
  const tripCandidate: TripItemCandidate = {
    itemType: 'hotel',
    inventoryId: inventory.inventoryId,
    providerInventoryId: inventory.providerInventoryId,
    startDate: gap.startDate,
    endDate: gap.endDate,
    priceCents: displayedBaseCents,
    currencyCode: inventory.currencyCode,
    title: inventory.title,
    subtitle: inventory.subtitle || undefined,
    imageUrl: inventory.imageUrl || undefined,
    meta: inventory.meta,
    metadata: mergePriceDisplayMetadata(
      buildSuggestionCandidateMetadata(
        gap,
        suggestionType,
        generatedAt,
        explanation,
        inventory.providerInventoryId,
      ),
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
    ctaLabel:
      explanation.strength.level === 'tentative' ? 'Review option' : 'Add to trip',
    startDate: gap.startDate,
    endDate: gap.endDate,
    cityName: gap.cityName,
    explanation,
    inventory,
    tripCandidate,
  }
}

const buildCarSuggestion = async (
  gap: TripBundlingGap,
  generatedAt: string,
  tripPricing: TripBundlingPricingContext | null | undefined,
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
  const displayedBaseCents = resolveDisplayedBaseCents(
    priceDisplay,
    inventory.priceCents,
  )
  const explanation = buildSuggestionExplanation({
    gap,
    itemType: 'car',
    startDate: gap.startDate,
    endDate: dropoffDate,
    cityName: gap.cityName,
    tripPricing,
    inventory,
    displayedBaseCents,
  })
  const tripCandidate: TripItemCandidate = {
    itemType: 'car',
    inventoryId: inventory.inventoryId,
    providerInventoryId: inventory.providerInventoryId,
    startDate: gap.startDate,
    endDate: dropoffDate,
    priceCents: displayedBaseCents,
    currencyCode: inventory.currencyCode,
    title: inventory.title,
    subtitle: inventory.subtitle || undefined,
    imageUrl: inventory.imageUrl || undefined,
    meta: inventory.meta,
    metadata: mergePriceDisplayMetadata(
      buildSuggestionCandidateMetadata(
        gap,
        suggestionType,
        generatedAt,
        explanation,
        inventory.providerInventoryId,
      ),
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
    ctaLabel:
      explanation.strength.level === 'tentative' ? 'Review option' : 'Add to trip',
    startDate: gap.startDate,
    endDate: dropoffDate,
    cityName: gap.cityName,
    explanation,
    inventory,
    tripCandidate,
  }
}

const buildFlightSuggestion = async (
  gap: TripBundlingGap,
  generatedAt: string,
  tripPricing: TripBundlingPricingContext | null | undefined,
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
  const displayedBaseCents = resolveDisplayedBaseCents(
    priceDisplay,
    inventory.priceCents,
  )
  const explanation = buildSuggestionExplanation({
    gap,
    itemType: 'flight',
    startDate: serviceDate,
    endDate: serviceDate,
    cityName: gap.cityName,
    tripPricing,
    inventory,
    displayedBaseCents,
  })
  const tripCandidate: TripItemCandidate = {
    itemType: 'flight',
    inventoryId: inventory.inventoryId,
    providerInventoryId: inventory.providerInventoryId,
    startDate: serviceDate,
    endDate: serviceDate,
    priceCents: displayedBaseCents,
    currencyCode: inventory.currencyCode,
    title: inventory.title,
    subtitle: inventory.subtitle || undefined,
    meta: inventory.meta,
    metadata: mergePriceDisplayMetadata(
      buildSuggestionCandidateMetadata(
        gap,
        suggestionType,
        generatedAt,
        explanation,
        inventory.providerInventoryId,
      ),
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
    ctaLabel:
      explanation.strength.level === 'tentative' ? 'Review option' : 'Add to trip',
    startDate: serviceDate,
    endDate: serviceDate,
    cityName: gap.cityName,
    explanation,
    inventory,
    tripCandidate,
  }
}

const buildSuggestionForGap = async (
  gap: TripBundlingGap,
  generatedAt: string,
  tripPricing: TripBundlingPricingContext | null | undefined,
) => {
  if (gap.targetItemType === 'hotel') {
    return buildHotelSuggestion(gap, generatedAt, tripPricing)
  }
  if (gap.targetItemType === 'car') {
    return buildCarSuggestion(gap, generatedAt, tripPricing)
  }
  return buildFlightSuggestion(gap, generatedAt, tripPricing)
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

    const suggestion = await buildSuggestionForGap(gap, generatedAt, input.pricing)
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
