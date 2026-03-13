import { parseInventoryId, type ParsedCarInventoryId, type ParsedFlightInventoryId, type ParsedHotelInventoryId, type ParsedInventoryId } from '~/lib/inventory/inventory-id'
import {
  normalizeTripItemSnapshotCurrencyCode,
  normalizeTripItemSnapshotPriceCents,
} from '~/lib/trips/trip-item-snapshot'
import type {
  TripItemIssue,
  TripItemIssueCode,
  TripItemIssueSeverity,
  TripItemRevalidationResult,
  TripItemRevalidationStatus,
  TripItemType,
} from '~/types/trips/trip'

export type TripItemRevalidationCandidate = {
  itemId: number
  itemType: TripItemType
  title: string
  inventoryId: string | null
  snapshotPriceCents: number | null
  snapshotCurrencyCode: string | null
  snapshotTimestamp?: string | null
  startDate?: string | null
  endDate?: string | null
  metadata?: Record<string, unknown>
  providerInventoryId?: number | null
}

export type ResolvedTripItemCurrentInventory = {
  inventoryId: string | null
  currentPriceCents: number | null
  currentCurrencyCode: string | null
  isAvailable: boolean | null
}

export type TripItemRevalidationResolverInput<
  TParsedInventory extends ParsedInventoryId = ParsedInventoryId,
> = {
  item: TripItemRevalidationCandidate
  parsedInventory: TParsedInventory
  checkedAt: string
}

export type TripItemRevalidationResolver = {
  hotel: (
    input: TripItemRevalidationResolverInput<ParsedHotelInventoryId>,
  ) => Promise<ResolvedTripItemCurrentInventory | null>
  flight: (
    input: TripItemRevalidationResolverInput<ParsedFlightInventoryId>,
  ) => Promise<ResolvedTripItemCurrentInventory | null>
  car: (
    input: TripItemRevalidationResolverInput<ParsedCarInventoryId>,
  ) => Promise<ResolvedTripItemCurrentInventory | null>
}

type BuildTripItemRevalidationIssueInput = {
  code: TripItemIssueCode
  title: string
  severity?: TripItemIssueSeverity
  currentCurrencyCode?: string | null
  snapshotCurrencyCode?: string | null
  currentDate?: string | null
  snapshotDate?: string | null
  detail?: string | null
}

const DEFAULT_SEVERITY_BY_CODE: Record<TripItemIssueCode, TripItemIssueSeverity> = {
  inventory_missing: 'blocking',
  sold_out: 'blocking',
  price_changed: 'warning',
  currency_changed: 'warning',
  date_changed: 'warning',
  inventory_mismatch: 'blocking',
  snapshot_incomplete: 'warning',
  revalidation_failed: 'warning',
}

const normalizeInventoryIdValue = (value: string | null | undefined) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const normalizeCurrencyCode = (value: string | null | undefined) =>
  normalizeTripItemSnapshotCurrencyCode(value)

const normalizePriceCents = (value: number | null | undefined) =>
  normalizeTripItemSnapshotPriceCents(value)

const toIsoDate = (value: string | null | undefined) => {
  const text = String(value ?? '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

const toIsoDateTimeMinute = (value: string | null | undefined) => {
  const text = String(value ?? '').trim()
  return /^\d{4}-\d{2}-\d{2}T\d{2}[-:]\d{2}$/.test(text)
    ? text.replace(':', '-')
    : null
}

const joinFieldList = (fields: string[]) => {
  if (!fields.length) return ''
  if (fields.length === 1) return fields[0]
  if (fields.length === 2) return `${fields[0]} and ${fields[1]}`
  return `${fields.slice(0, -1).join(', ')}, and ${fields.at(-1)}`
}

const dedupeIssues = (issues: TripItemIssue[]) => {
  const seen = new Set<string>()
  const next: TripItemIssue[] = []

  for (const issue of issues) {
    const key = [issue.code, issue.severity, issue.message].join('|')
    if (seen.has(key)) continue
    seen.add(key)
    next.push(issue)
  }

  return next
}

const resolveSnapshotIncompleteSeverity = (missingFields: string[]) =>
  missingFields.includes('inventoryId') ? 'blocking' : 'warning'

const compareFlightInventories = (
  snapshotInventory: ParsedFlightInventoryId,
  currentInventory: ParsedFlightInventoryId,
) => {
  if (
    snapshotInventory.carrier !== currentInventory.carrier ||
    snapshotInventory.flightNumber !== currentInventory.flightNumber ||
    snapshotInventory.origin !== currentInventory.origin ||
    snapshotInventory.destination !== currentInventory.destination
  ) {
    return {
      mismatch: true,
      dateChanged: false,
      snapshotDate: snapshotInventory.departDate,
      currentDate: currentInventory.departDate,
    }
  }

  return {
    mismatch: false,
    dateChanged: snapshotInventory.departDate !== currentInventory.departDate,
    snapshotDate: snapshotInventory.departDate,
    currentDate: currentInventory.departDate,
  }
}

const compareHotelInventories = (
  snapshotInventory: ParsedHotelInventoryId,
  currentInventory: ParsedHotelInventoryId,
) => {
  if (
    snapshotInventory.provider !== currentInventory.provider ||
    snapshotInventory.hotelId !== currentInventory.hotelId ||
    snapshotInventory.providerOfferId !== currentInventory.providerOfferId ||
    snapshotInventory.ratePlanId !== currentInventory.ratePlanId ||
    snapshotInventory.boardType !== currentInventory.boardType ||
    snapshotInventory.cancellationPolicy !== currentInventory.cancellationPolicy ||
    snapshotInventory.roomType !== currentInventory.roomType ||
    snapshotInventory.occupancy !== currentInventory.occupancy
  ) {
    return {
      mismatch: true,
      dateChanged: false,
      snapshotDate: snapshotInventory.checkInDate,
      currentDate: currentInventory.checkInDate,
    }
  }

  const snapshotDates = [
    snapshotInventory.checkInDate,
    snapshotInventory.checkOutDate,
  ].join(':')
  const currentDates = [
    currentInventory.checkInDate,
    currentInventory.checkOutDate,
  ].join(':')

  return {
    mismatch: false,
    dateChanged: snapshotDates !== currentDates,
    snapshotDate: snapshotDates,
    currentDate: currentDates,
  }
}

const compareCarInventories = (
  snapshotInventory: ParsedCarInventoryId,
  currentInventory: ParsedCarInventoryId,
) => {
  if (
    snapshotInventory.providerLocationId !== currentInventory.providerLocationId ||
    snapshotInventory.vehicleClass !== currentInventory.vehicleClass
  ) {
    return {
      mismatch: true,
      dateChanged: false,
      snapshotDate: snapshotInventory.pickupDateTime,
      currentDate: currentInventory.pickupDateTime,
    }
  }

  const snapshotDates = [
    snapshotInventory.pickupDateTime,
    snapshotInventory.dropoffDateTime,
  ].join(':')
  const currentDates = [
    currentInventory.pickupDateTime,
    currentInventory.dropoffDateTime,
  ].join(':')

  return {
    mismatch: false,
    dateChanged: snapshotDates !== currentDates,
    snapshotDate: snapshotDates,
    currentDate: currentDates,
  }
}

export const normalizeRevalidationTimestamp = (
  value: Date | string | null | undefined,
) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

export const buildTripItemRevalidationIssue = (
  input: BuildTripItemRevalidationIssueInput,
): TripItemIssue => {
  const severity = input.severity || DEFAULT_SEVERITY_BY_CODE[input.code]

  if (input.code === 'inventory_missing') {
    return {
      code: input.code,
      severity,
      message: `${input.title} is no longer available in current inventory.`,
    }
  }

  if (input.code === 'sold_out') {
    return {
      code: input.code,
      severity,
      message: `${input.title} is no longer available for the saved itinerary.`,
    }
  }

  if (input.code === 'price_changed') {
    return {
      code: input.code,
      severity,
      message: `${input.title} price changed since you added it to this trip.`,
    }
  }

  if (input.code === 'currency_changed') {
    const currentCurrency = normalizeCurrencyCode(input.currentCurrencyCode)
    const snapshotCurrency = normalizeCurrencyCode(input.snapshotCurrencyCode)

    return {
      code: input.code,
      severity,
      message:
        currentCurrency && snapshotCurrency
          ? `${input.title} now prices in ${currentCurrency} instead of ${snapshotCurrency}.`
          : `${input.title} now prices in a different currency than the saved snapshot.`,
    }
  }

  if (input.code === 'date_changed') {
    const snapshotDate = String(input.snapshotDate || '').trim()
    const currentDate = String(input.currentDate || '').trim()

    return {
      code: input.code,
      severity,
      message:
        snapshotDate && currentDate
          ? `${input.title} changed from ${snapshotDate} to ${currentDate}.`
          : `${input.title} changed dates since it was saved to this trip.`,
    }
  }

  if (input.code === 'inventory_mismatch') {
    return {
      code: input.code,
      severity,
      message:
        input.detail && input.detail.trim()
          ? `${input.title} no longer matches the saved inventory snapshot. ${input.detail.trim()}`
          : `${input.title} no longer matches the saved inventory snapshot.`,
    }
  }

  if (input.code === 'snapshot_incomplete') {
    return {
      code: input.code,
      severity,
      message:
        input.detail && input.detail.trim()
          ? `${input.title} is missing snapshot data needed for comparison. ${input.detail.trim()}`
          : `${input.title} is missing snapshot data needed for comparison.`,
    }
  }

  return {
    code: input.code,
    severity,
    message:
      input.detail && input.detail.trim()
        ? `${input.title} could not be revalidated right now. ${input.detail.trim()}`
        : `${input.title} could not be revalidated right now.`,
  }
}

export const getTripItemRevalidationStatus = (
  input: TripItemIssue[] | { issues: TripItemIssue[] },
): TripItemRevalidationStatus => {
  const issues = Array.isArray(input) ? input : input.issues
  if (issues.some((issue) => issue.severity === 'blocking')) return 'blocking'
  if (issues.length) return 'warning'
  return 'ok'
}

export const isTripItemInventoryMissing = (
  inventory: ResolvedTripItemCurrentInventory | null | undefined,
): inventory is null | undefined => inventory == null

export const isTripItemPriceChanged = (
  snapshotPriceCents: number | null | undefined,
  currentPriceCents: number | null | undefined,
) => {
  const snapshotPrice = normalizePriceCents(snapshotPriceCents)
  const currentPrice = normalizePriceCents(currentPriceCents)
  return snapshotPrice != null && currentPrice != null && snapshotPrice !== currentPrice
}

export const isTripItemCurrencyChanged = (
  snapshotCurrencyCode: string | null | undefined,
  currentCurrencyCode: string | null | undefined,
) => {
  const snapshotCurrency = normalizeCurrencyCode(snapshotCurrencyCode)
  const currentCurrency = normalizeCurrencyCode(currentCurrencyCode)
  return Boolean(
    snapshotCurrency && currentCurrency && snapshotCurrency !== currentCurrency,
  )
}

export const isTripItemAvailabilityChanged = (
  inventory: ResolvedTripItemCurrentInventory | null | undefined,
) => inventory?.isAvailable === false

export const compareSnapshotToCurrentInventory = (input: {
  item: TripItemRevalidationCandidate
  parsedInventory: ParsedInventoryId
  currentInventory: ResolvedTripItemCurrentInventory
}): TripItemIssue[] => {
  const currentInventoryId = normalizeInventoryIdValue(input.currentInventory.inventoryId)
  if (!currentInventoryId) return []

  const currentParsedInventory = parseInventoryId(currentInventoryId)
  if (!currentParsedInventory) {
    return [
      buildTripItemRevalidationIssue({
        code: 'revalidation_failed',
        title: input.item.title,
        detail: 'Resolved inventory returned a malformed canonical inventory ID.',
      }),
    ]
  }

  if (currentParsedInventory.vertical !== input.parsedInventory.vertical) {
    return [
      buildTripItemRevalidationIssue({
        code: 'inventory_mismatch',
        title: input.item.title,
      }),
    ]
  }

  const comparison =
    input.parsedInventory.vertical === 'flight' &&
      currentParsedInventory.vertical === 'flight'
      ? compareFlightInventories(input.parsedInventory, currentParsedInventory)
      : input.parsedInventory.vertical === 'hotel' &&
          currentParsedInventory.vertical === 'hotel'
        ? compareHotelInventories(input.parsedInventory, currentParsedInventory)
        : input.parsedInventory.vertical === 'car' &&
            currentParsedInventory.vertical === 'car'
          ? compareCarInventories(input.parsedInventory, currentParsedInventory)
          : {
            mismatch: true,
            dateChanged: false,
            snapshotDate: null,
            currentDate: null,
          }

  if (comparison.mismatch) {
    return [
      buildTripItemRevalidationIssue({
        code: 'inventory_mismatch',
        title: input.item.title,
      }),
    ]
  }

  if (comparison.dateChanged) {
    return [
      buildTripItemRevalidationIssue({
        code: 'date_changed',
        title: input.item.title,
        snapshotDate: comparison.snapshotDate,
        currentDate: comparison.currentDate,
      }),
    ]
  }

  return []
}

const buildSnapshotIncompleteIssue = (
  item: TripItemRevalidationCandidate,
  missingFields: string[],
) =>
  buildTripItemRevalidationIssue({
    code: 'snapshot_incomplete',
    title: item.title,
    severity: resolveSnapshotIncompleteSeverity(missingFields),
    detail: `Missing ${joinFieldList(missingFields)}.`,
  })

const buildEmptyResult = (input: {
  item: TripItemRevalidationCandidate
  checkedAt: string
  inventoryId: string | null
  snapshotPriceCents: number | null
  snapshotCurrencyCode: string | null
  currentPriceCents?: number | null
  currentCurrencyCode?: string | null
  isAvailable?: boolean | null
  issues: TripItemIssue[]
}): TripItemRevalidationResult => {
  const currentPriceCents = normalizePriceCents(input.currentPriceCents)
  const currentCurrencyCode = normalizeCurrencyCode(input.currentCurrencyCode)
  const issues = dedupeIssues(input.issues)
  const snapshotCurrencyCode = normalizeCurrencyCode(input.snapshotCurrencyCode)
  const snapshotPriceCents = normalizePriceCents(input.snapshotPriceCents)

  return {
    itemId: input.item.itemId,
    inventoryId: input.inventoryId,
    checkedAt: input.checkedAt,
    status: getTripItemRevalidationStatus(issues),
    currentPriceCents,
    currentCurrencyCode,
    snapshotPriceCents,
    snapshotCurrencyCode,
    priceDeltaCents:
      snapshotPriceCents != null &&
      currentPriceCents != null &&
      snapshotCurrencyCode &&
      currentCurrencyCode &&
      snapshotCurrencyCode === currentCurrencyCode
        ? currentPriceCents - snapshotPriceCents
        : null,
    isAvailable: input.isAvailable ?? null,
    issues,
  }
}

export const revalidateTripItem = async (
  item: TripItemRevalidationCandidate,
  resolver: TripItemRevalidationResolver,
  options: {
    checkedAt?: Date | string | null
  } = {},
): Promise<TripItemRevalidationResult> => {
  const checkedAt = normalizeRevalidationTimestamp(options.checkedAt)
  const inventoryId = normalizeInventoryIdValue(item.inventoryId)
  const snapshotPriceCents = normalizePriceCents(item.snapshotPriceCents)
  const snapshotCurrencyCode = normalizeCurrencyCode(item.snapshotCurrencyCode)
  const issues: TripItemIssue[] = []

  if (!inventoryId) {
    issues.push(buildSnapshotIncompleteIssue(item, ['inventoryId']))
    return buildEmptyResult({
      item,
      checkedAt,
      inventoryId: null,
      snapshotPriceCents,
      snapshotCurrencyCode,
      issues,
    })
  }

  const parsedInventory = parseInventoryId(inventoryId)
  if (!parsedInventory) {
    issues.push(buildSnapshotIncompleteIssue(item, ['inventoryId']))
    return buildEmptyResult({
      item,
      checkedAt,
      inventoryId,
      snapshotPriceCents,
      snapshotCurrencyCode,
      issues,
    })
  }

  if (parsedInventory.vertical !== item.itemType) {
    issues.push(
      buildTripItemRevalidationIssue({
        code: 'inventory_mismatch',
        title: item.title,
        detail: `Expected a ${item.itemType} inventory ID but received ${parsedInventory.vertical}.`,
      }),
    )

    return buildEmptyResult({
      item,
      checkedAt,
      inventoryId,
      snapshotPriceCents,
      snapshotCurrencyCode,
      issues,
    })
  }

  const incompleteFields: string[] = []
  if (snapshotPriceCents == null) incompleteFields.push('snapshotPriceCents')
  if (!snapshotCurrencyCode) incompleteFields.push('snapshotCurrencyCode')

  if (incompleteFields.length) {
    issues.push(buildSnapshotIncompleteIssue(item, incompleteFields))
  }

  try {
    const currentInventory =
      parsedInventory.vertical === 'hotel'
        ? await resolver.hotel({
          item,
          parsedInventory,
          checkedAt,
        })
        : parsedInventory.vertical === 'flight'
          ? await resolver.flight({
            item,
            parsedInventory,
            checkedAt,
          })
          : await resolver.car({
            item,
            parsedInventory,
            checkedAt,
          })

    if (isTripItemInventoryMissing(currentInventory)) {
      issues.push(
        buildTripItemRevalidationIssue({
          code: 'inventory_missing',
          title: item.title,
        }),
      )

      return buildEmptyResult({
        item,
        checkedAt,
        inventoryId,
        snapshotPriceCents,
        snapshotCurrencyCode,
        issues,
      })
    }

    const currentPriceCents = normalizePriceCents(currentInventory.currentPriceCents)
    const currentCurrencyCode = normalizeCurrencyCode(currentInventory.currentCurrencyCode)
    const comparisonIssues = compareSnapshotToCurrentInventory({
      item,
      parsedInventory,
      currentInventory,
    })
    issues.push(...comparisonIssues)

    if (!comparisonIssues.some((issue) => issue.code === 'inventory_mismatch')) {
      if (isTripItemAvailabilityChanged(currentInventory)) {
        issues.push(
          buildTripItemRevalidationIssue({
            code: 'sold_out',
            title: item.title,
          }),
        )
      }

      if (isTripItemCurrencyChanged(snapshotCurrencyCode, currentCurrencyCode)) {
        issues.push(
          buildTripItemRevalidationIssue({
            code: 'currency_changed',
            title: item.title,
            snapshotCurrencyCode,
            currentCurrencyCode,
          }),
        )
      }

      if (isTripItemPriceChanged(snapshotPriceCents, currentPriceCents)) {
        issues.push(
          buildTripItemRevalidationIssue({
            code: 'price_changed',
            title: item.title,
          }),
        )
      }
    }

    return buildEmptyResult({
      item,
      checkedAt,
      inventoryId,
      snapshotPriceCents,
      snapshotCurrencyCode,
      currentPriceCents,
      currentCurrencyCode,
      isAvailable: currentInventory.isAvailable,
      issues,
    })
  } catch (error) {
    issues.push(
      buildTripItemRevalidationIssue({
        code: 'revalidation_failed',
        title: item.title,
        detail: error instanceof Error ? error.message : null,
      }),
    )

    return buildEmptyResult({
      item,
      checkedAt,
      inventoryId,
      snapshotPriceCents,
      snapshotCurrencyCode,
      issues,
    })
  }
}

export const revalidateTripItems = async (
  items: TripItemRevalidationCandidate[],
  resolver: TripItemRevalidationResolver,
  options: {
    checkedAt?: Date | string | null
  } = {},
): Promise<TripItemRevalidationResult[]> => {
  const checkedAt = normalizeRevalidationTimestamp(options.checkedAt)

  return Promise.all(
    items.map((item) =>
      revalidateTripItem(item, resolver, {
        checkedAt,
      }),
    ),
  )
}

export const buildTripItemRevalidationIssues = (
  results: TripItemRevalidationResult[],
) => {
  const issuesByItemId = new Map<number, TripItemIssue[]>()

  for (const result of results) {
    if (!result.issues.length) continue
    issuesByItemId.set(result.itemId, result.issues)
  }

  return issuesByItemId
}

export const normalizeTripItemRevalidationDate = (value: string | null | undefined) =>
  toIsoDate(value) || toIsoDateTimeMinute(value)
