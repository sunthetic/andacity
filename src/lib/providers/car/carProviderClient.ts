import { and, asc, eq, inArray } from 'drizzle-orm'
import type { ParsedCarInventoryId } from '~/lib/inventory/inventory-id'
import { normalizeInventoryToken } from '~/lib/inventory/inventory-id'
import type {
  ProviderRequestOptions,
  ProviderResolveInventoryRecordInput,
} from '~/lib/providers/providerAdapter'
import { computeDays } from '~/lib/search/car-rentals/dates'
import { searchCarRentalsPage } from '~/lib/repos/car-rentals-repo.server'
import { getDb } from '~/lib/db/client.server'
import {
  carInventory,
  carInventoryImages,
  carLocations,
  carOffers,
  carProviders,
  carVehicleClasses,
  cities,
} from '~/lib/db/schema'
import {
  CAR_PROVIDER_NAME,
  DEFAULT_CAR_PROVIDER_RETRIES,
  DEFAULT_CAR_PROVIDER_SEARCH_LIMIT,
  DEFAULT_CAR_PROVIDER_TIMEOUT_MS,
} from './constants.ts'
import type { CarProviderSearchRequest } from './mapCarSearchParams.ts'

type CarProviderSearchRow = Awaited<
  ReturnType<typeof searchCarRentalsPage>
>['rows'][number]

type CarProviderResolvedRow = {
  inventoryId: number
  inventorySlug: string
  rentalCompany: string
  citySlug: string
  cityName: string
  providerLocationId: number
  pickupLocationName: string
  pickupLocationType: 'airport' | 'city'
  pickupAddressLine: string
  currencyCode: string
  freeCancellation: boolean
  payAtCounter: boolean
  securityDepositRequired: boolean
  minDriverAge: number
  fuelPolicy: string
  cancellationBlurb: string | null
  paymentBlurb: string | null
  feesBlurb: string | null
  depositBlurb: string | null
  inclusions: string[]
  availabilityStart: string
  availabilityEnd: string
  minDays: number
  maxDays: number
  blockedWeekdays: number[]
  freshnessTimestamp: Date | string | null
  offerCode: string
  vehicleName: string
  vehicleClass: string
  vehicleCategory: string
  transmission: 'automatic' | 'manual'
  seats: number
  doors: number
  luggageCapacity: string
  airConditioning: boolean
  priceDailyCents: number
  offerCurrencyCode: string
  offerFreeCancellation: boolean
  offerPayAtCounter: boolean
  badges: string[]
  features: string[]
}

export type CarProviderRawOffer = {
  provider: string
  inventoryId: number
  inventorySlug: string
  rentalCompany: string
  citySlug: string
  cityName: string
  providerLocationId: string
  pickupLocationName: string
  dropoffLocationName: string
  pickupLocationType: 'airport' | 'city' | null
  dropoffLocationType: 'airport' | 'city' | null
  pickupAddressLine: string | null
  dropoffAddressLine: string | null
  pickupDateTime: string
  dropoffDateTime: string
  driverAge: number | null
  vehicleName: string | null
  vehicleClass: string
  vehicleCategory: string | null
  transmission: 'automatic' | 'manual' | null
  seats: number | null
  doors: number | null
  luggageCapacity: string | null
  airConditioning: boolean | null
  fuelPolicy: string | null
  mileagePolicy: string | null
  ratePlanCode: string | null
  ratePlan: string | null
  freeCancellation: boolean | null
  payAtCounter: boolean | null
  securityDepositRequired: boolean | null
  minDriverAge: number | null
  cancellationBlurb: string | null
  paymentBlurb: string | null
  feesBlurb: string | null
  depositBlurb: string | null
  inclusions: string[]
  badges: string[]
  features: string[]
  currencyCode: string
  priceDailyCents: number
  totalBaseCents: number
  taxesCents: number | null
  mandatoryFeesCents: number | null
  totalPriceCents: number
  days: number
  imageUrl: string | null
  freshnessTimestamp: string | null
  href: string | null
  assumedRentalWindow: boolean
  isAvailable: boolean | null
}

export type CarProviderSearchResponse = {
  provider: string
  request: CarProviderSearchRequest
  results: CarProviderRawOffer[]
}

export type CarProviderInventoryLookup = Pick<
  ProviderResolveInventoryRecordInput,
  'providerInventoryId'
> & {
  parsedInventory: ParsedCarInventoryId
}

export type CarProviderPriceResponse = {
  provider: string
  inventoryId: number
  currencyCode: string
  dailyBaseCents: number
  totalBaseCents: number
  taxesCents: number | null
  mandatoryFeesCents: number | null
  totalPriceCents: number
  days: number
}

export type CarProviderClient = {
  search(
    request: CarProviderSearchRequest,
    options?: ProviderRequestOptions,
  ): Promise<CarProviderSearchResponse>
  resolveInventory(
    lookup: CarProviderInventoryLookup,
    options?: ProviderRequestOptions,
  ): Promise<CarProviderRawOffer | null>
  fetchPrice(
    lookup: CarProviderInventoryLookup,
    options?: ProviderRequestOptions,
  ): Promise<CarProviderPriceResponse | null>
}

export type CarProviderClientErrorCode =
  | 'aborted'
  | 'timeout'
  | 'provider_failure'

export class CarProviderClientError extends Error {
  code: CarProviderClientErrorCode
  override cause?: unknown

  constructor(
    code: CarProviderClientErrorCode,
    message: string,
    options?: {
      cause?: unknown
    },
  ) {
    super(message)
    this.name = 'CarProviderClientError'
    this.code = code
    this.cause = options?.cause
  }
}

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return null
  return Math.round(parsed)
}

const toIsoTimestamp = (value: Date | string | null | undefined) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString()
}

const toDisplayDateTime = (value: string) =>
  String(value).replace(/T(\d{2})[-:](\d{2})$/, 'T$1:$2')

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw new CarProviderClientError('aborted', 'Car provider request was aborted.')
  }
}

const runWithTimeout = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let removeAbortListener: undefined | (() => void)

  try {
    return await new Promise<T>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new CarProviderClientError(
            'timeout',
            `Car provider ${operationName} timed out after ${DEFAULT_CAR_PROVIDER_TIMEOUT_MS}ms.`,
          ),
        )
      }, DEFAULT_CAR_PROVIDER_TIMEOUT_MS)

      if (signal) {
        const abortHandler = () => {
          reject(new CarProviderClientError('aborted', 'Car provider request was aborted.'))
        }

        signal.addEventListener('abort', abortHandler, { once: true })
        removeAbortListener = () => {
          signal.removeEventListener('abort', abortHandler)
        }
      }

      operation().then(resolve, reject)
    })
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    if (typeof removeAbortListener === 'function') {
      removeAbortListener()
    }
  }
}

const runProviderOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  options?: ProviderRequestOptions,
): Promise<T> => {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= DEFAULT_CAR_PROVIDER_RETRIES; attempt += 1) {
    throwIfAborted(options?.signal)

    try {
      return await runWithTimeout(operationName, operation, options?.signal)
    } catch (error) {
      lastError = error
      if (
        error instanceof CarProviderClientError &&
        (error.code === 'aborted' || error.code === 'timeout')
      ) {
        throw error
      }
    }
  }

  throw new CarProviderClientError(
    'provider_failure',
    `Car provider ${operationName} failed.`,
    {
      cause: lastError,
    },
  )
}

const buildCarHref = (slug: string, pickupDate: string, dropoffDate: string) => {
  const searchParams = new URLSearchParams({
    pickupDate,
    dropoffDate,
  })
  return `/car-rentals/${encodeURIComponent(slug)}?${searchParams.toString()}`
}

const buildRatePlanLabel = (input: {
  freeCancellation: boolean | null
  payAtCounter: boolean | null
}) => {
  const parts = [
    input.freeCancellation ? 'Free cancellation' : null,
    input.payAtCounter ? 'Pay at counter' : 'Prepay',
  ].filter((part): part is string => Boolean(part))

  return parts.join(' · ') || 'Standard rate'
}

const resolveMileagePolicy = (parts: string[]) => {
  const mileage = parts.find((entry) => /mileage/i.test(String(entry)))
  return toNullableText(mileage)
}

const toIsoDate = (value: string) => {
  const text = String(value || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

const toUtcWeekday = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date.getUTCDay()
}

const isCarInventoryAvailable = (
  availability: {
    availabilityStart: string
    availabilityEnd: string
    minDays: number
    maxDays: number
    blockedWeekdays: number[]
  },
  pickupDateTime: string,
  dropoffDateTime: string,
) => {
  const pickupDate = toIsoDate(pickupDateTime.slice(0, 10))
  const dropoffDate = toIsoDate(dropoffDateTime.slice(0, 10))
  const days = computeDays(pickupDate, dropoffDate)
  if (!pickupDate || !dropoffDate || days == null) return null

  if (pickupDate < availability.availabilityStart || pickupDate > availability.availabilityEnd) {
    return false
  }

  if (days < availability.minDays || days > availability.maxDays) {
    return false
  }

  const weekday = toUtcWeekday(pickupDate)
  if (weekday != null && availability.blockedWeekdays.includes(weekday)) {
    return false
  }

  return true
}

const buildPriceTotals = (priceDailyCents: number, days: number) => {
  const safeDays = Math.max(1, Math.round(Number(days || 0)))
  const dailyBaseCents = Math.max(0, Math.round(Number(priceDailyCents || 0)))
  const totalBaseCents = dailyBaseCents * safeDays

  return {
    dailyBaseCents,
    totalBaseCents,
    taxesCents: null,
    mandatoryFeesCents: null,
    totalPriceCents: totalBaseCents,
    days: safeDays,
  }
}

const buildSearchOffer = (
  row: CarProviderSearchRow,
  request: CarProviderSearchRequest,
): CarProviderRawOffer | null => {
  const vehicleClassSource = row.category || row.vehicleName || 'standard'
  const vehicleClass = normalizeInventoryToken(vehicleClassSource, 'vehicle class')
  const days = computeDays(request.pickupDate, request.dropoffDate)
  if (days == null) return null

  const totals = buildPriceTotals(row.fromDailyCents, days)
  const inclusions = Array.isArray(row.inclusions)
    ? row.inclusions.map((entry) => String(entry))
    : []
  const freeCancellation = row.freeCancellation
  const payAtCounter = row.payAtCounter

  return {
    provider: CAR_PROVIDER_NAME,
    inventoryId: row.id,
    inventorySlug: row.slug,
    rentalCompany: row.providerName,
    citySlug: row.citySlug,
    cityName: row.cityName,
    providerLocationId: String(row.locationId),
    pickupLocationName: row.pickupArea,
    dropoffLocationName: row.pickupArea,
    pickupLocationType: row.pickupType,
    dropoffLocationType: row.pickupType,
    pickupAddressLine: null,
    dropoffAddressLine: null,
    pickupDateTime: request.pickupDateTime,
    dropoffDateTime: request.dropoffDateTime,
    driverAge: request.driverAge,
    vehicleName: row.vehicleName,
    vehicleClass,
    vehicleCategory: row.category,
    transmission: row.transmission,
    seats: row.seats,
    doors: null,
    luggageCapacity: row.bagsLabel,
    airConditioning: null,
    fuelPolicy: null,
    mileagePolicy: resolveMileagePolicy(inclusions),
    ratePlanCode: null,
    ratePlan: buildRatePlanLabel({
      freeCancellation,
      payAtCounter,
    }),
    freeCancellation,
    payAtCounter,
    securityDepositRequired: null,
    minDriverAge: null,
    cancellationBlurb: null,
    paymentBlurb: null,
    feesBlurb: null,
    depositBlurb: null,
    inclusions,
    badges: [
      freeCancellation ? 'Free cancellation' : 'Flexible terms',
      payAtCounter ? 'Pay at counter' : 'Prepay',
    ],
    features: inclusions,
    currencyCode: row.currencyCode,
    priceDailyCents: row.fromDailyCents,
    totalBaseCents: totals.totalBaseCents,
    taxesCents: totals.taxesCents,
    mandatoryFeesCents: totals.mandatoryFeesCents,
    totalPriceCents: totals.totalPriceCents,
    days: totals.days,
    imageUrl: row.imageUrl,
    freshnessTimestamp: toIsoTimestamp(row.freshnessTimestamp),
    href: buildCarHref(row.slug, request.pickupDate, request.dropoffDate),
    assumedRentalWindow: false,
    isAvailable: true,
  }
}

const loadSearchDriverAgeMap = async (inventoryIds: number[]) => {
  if (!inventoryIds.length) {
    return new Map<number, number>()
  }

  const db = getDb()
  const rows = await db
    .select({
      inventoryId: carInventory.id,
      minDriverAge: carInventory.minDriverAge,
    })
    .from(carInventory)
    .where(inArray(carInventory.id, inventoryIds))

  return new Map(rows.map((row) => [row.inventoryId, row.minDriverAge]))
}

const loadInventoryImageUrl = async (inventoryId: number) => {
  const db = getDb()
  const rows = await db
    .select({
      url: carInventoryImages.url,
    })
    .from(carInventoryImages)
    .where(eq(carInventoryImages.inventoryId, inventoryId))
    .orderBy(asc(carInventoryImages.sortOrder), asc(carInventoryImages.id))
    .limit(1)

  return rows[0]?.url || null
}

const loadResolvedOfferRow = async (
  lookup: CarProviderInventoryLookup,
): Promise<CarProviderResolvedRow | null> => {
  const db = getDb()

  const selectBase = () =>
    db
      .select({
        inventoryId: carInventory.id,
        inventorySlug: carInventory.slug,
        rentalCompany: carProviders.name,
        citySlug: cities.slug,
        cityName: cities.name,
        providerLocationId: carInventory.locationId,
        pickupLocationName: carLocations.name,
        pickupLocationType: carLocations.locationType,
        pickupAddressLine: carLocations.addressLine,
        currencyCode: carInventory.currencyCode,
        freeCancellation: carInventory.freeCancellation,
        payAtCounter: carInventory.payAtCounter,
        securityDepositRequired: carInventory.securityDepositRequired,
        minDriverAge: carInventory.minDriverAge,
        fuelPolicy: carInventory.fuelPolicy,
        cancellationBlurb: carInventory.cancellationBlurb,
        paymentBlurb: carInventory.paymentBlurb,
        feesBlurb: carInventory.feesBlurb,
        depositBlurb: carInventory.depositBlurb,
        inclusions: carInventory.inclusions,
        availabilityStart: carInventory.availabilityStart,
        availabilityEnd: carInventory.availabilityEnd,
        minDays: carInventory.minDays,
        maxDays: carInventory.maxDays,
        blockedWeekdays: carInventory.blockedWeekdays,
        freshnessTimestamp: carInventory.updatedAt,
        offerCode: carOffers.offerCode,
        vehicleName: carOffers.name,
        vehicleClass: carVehicleClasses.key,
        vehicleCategory: carVehicleClasses.category,
        transmission: carOffers.transmission,
        seats: carOffers.seats,
        doors: carOffers.doors,
        luggageCapacity: carOffers.bagsLabel,
        airConditioning: carOffers.airConditioning,
        priceDailyCents: carOffers.priceDailyCents,
        offerCurrencyCode: carOffers.currencyCode,
        offerFreeCancellation: carOffers.freeCancellation,
        offerPayAtCounter: carOffers.payAtCounter,
        badges: carOffers.badges,
        features: carOffers.features,
      })
      .from(carInventory)
      .innerJoin(carProviders, eq(carInventory.providerId, carProviders.id))
      .innerJoin(cities, eq(carInventory.cityId, cities.id))
      .innerJoin(carLocations, eq(carInventory.locationId, carLocations.id))
      .innerJoin(carOffers, eq(carOffers.inventoryId, carInventory.id))
      .innerJoin(carVehicleClasses, eq(carOffers.vehicleClassId, carVehicleClasses.id))

  const targetVehicleClass = lookup.parsedInventory.vehicleClass
  const providerInventoryId = toPositiveInteger(lookup.providerInventoryId)

  if (providerInventoryId != null) {
    const rows = await selectBase()
      .where(
        and(
          eq(carInventory.id, providerInventoryId),
          eq(carVehicleClasses.key, targetVehicleClass),
        ),
      )
      .orderBy(asc(carOffers.priceDailyCents), asc(carOffers.id))
      .limit(1)

    const resolved = rows[0] || null
    if (!resolved) return null

    const parsedLocationId = toPositiveInteger(lookup.parsedInventory.providerLocationId)
    if (
      parsedLocationId != null &&
      resolved.providerLocationId !== parsedLocationId
    ) {
      return null
    }

    return resolved
  }

  const locationId = toPositiveInteger(lookup.parsedInventory.providerLocationId)
  if (locationId == null) return null

  const rows = await selectBase()
    .where(
      and(
        eq(carInventory.locationId, locationId),
        eq(carVehicleClasses.key, targetVehicleClass),
      ),
    )
    .orderBy(asc(carOffers.priceDailyCents), asc(carInventory.id), asc(carOffers.id))
    .limit(1)

  return rows[0] || null
}

const buildResolvedOffer = async (
  row: CarProviderResolvedRow,
  lookup: CarProviderInventoryLookup,
): Promise<CarProviderRawOffer | null> => {
  const pickupDateTime = toDisplayDateTime(lookup.parsedInventory.pickupDateTime)
  const dropoffDateTime = toDisplayDateTime(lookup.parsedInventory.dropoffDateTime)
  const days = computeDays(pickupDateTime.slice(0, 10), dropoffDateTime.slice(0, 10))
  if (days == null) return null

  const totals = buildPriceTotals(row.priceDailyCents, days)
  const imageUrl = await loadInventoryImageUrl(row.inventoryId)
  const isAvailable = isCarInventoryAvailable(
    {
      availabilityStart: row.availabilityStart,
      availabilityEnd: row.availabilityEnd,
      minDays: row.minDays,
      maxDays: row.maxDays,
      blockedWeekdays: (row.blockedWeekdays || []).map((value) => Number(value)),
    },
    lookup.parsedInventory.pickupDateTime,
    lookup.parsedInventory.dropoffDateTime,
  )

  return {
    provider: CAR_PROVIDER_NAME,
    inventoryId: row.inventoryId,
    inventorySlug: row.inventorySlug,
    rentalCompany: row.rentalCompany,
    citySlug: row.citySlug,
    cityName: row.cityName,
    providerLocationId: String(row.providerLocationId),
    pickupLocationName: row.pickupLocationName,
    dropoffLocationName: row.pickupLocationName,
    pickupLocationType: row.pickupLocationType,
    dropoffLocationType: row.pickupLocationType,
    pickupAddressLine: row.pickupAddressLine,
    dropoffAddressLine: row.pickupAddressLine,
    pickupDateTime,
    dropoffDateTime,
    driverAge: null,
    vehicleName: row.vehicleName,
    vehicleClass: row.vehicleClass,
    vehicleCategory: row.vehicleCategory,
    transmission: row.transmission,
    seats: row.seats,
    doors: row.doors,
    luggageCapacity: row.luggageCapacity,
    airConditioning: row.airConditioning,
    fuelPolicy: row.fuelPolicy,
    mileagePolicy: resolveMileagePolicy([...(row.features || []), ...(row.inclusions || [])]),
    ratePlanCode: row.offerCode,
    ratePlan: buildRatePlanLabel({
      freeCancellation: row.offerFreeCancellation || row.freeCancellation,
      payAtCounter: row.offerPayAtCounter || row.payAtCounter,
    }),
    freeCancellation: row.offerFreeCancellation || row.freeCancellation,
    payAtCounter: row.offerPayAtCounter || row.payAtCounter,
    securityDepositRequired: row.securityDepositRequired,
    minDriverAge: row.minDriverAge,
    cancellationBlurb: row.cancellationBlurb,
    paymentBlurb: row.paymentBlurb,
    feesBlurb: row.feesBlurb,
    depositBlurb: row.depositBlurb,
    inclusions: (row.inclusions || []).map((entry) => String(entry)),
    badges: (row.badges || []).map((entry) => String(entry)),
    features: (row.features || []).map((entry) => String(entry)),
    currencyCode: row.offerCurrencyCode || row.currencyCode,
    priceDailyCents: row.priceDailyCents,
    totalBaseCents: totals.totalBaseCents,
    taxesCents: totals.taxesCents,
    mandatoryFeesCents: totals.mandatoryFeesCents,
    totalPriceCents: totals.totalPriceCents,
    days: totals.days,
    imageUrl,
    freshnessTimestamp: toIsoTimestamp(row.freshnessTimestamp),
    href: buildCarHref(
      row.inventorySlug,
      pickupDateTime.slice(0, 10),
      dropoffDateTime.slice(0, 10),
    ),
    assumedRentalWindow: false,
    isAvailable,
  }
}

export const defaultCarProviderClient: CarProviderClient = {
  async search(request, options) {
    return runProviderOperation(
      'search',
      async () => {
        const limit =
          request.filters.freeCancellationOnly || request.filters.payAtCounterOnly
            ? DEFAULT_CAR_PROVIDER_SEARCH_LIMIT * 3
            : DEFAULT_CAR_PROVIDER_SEARCH_LIMIT

        const carSearch = await searchCarRentalsPage({
          citySlug: request.citySlug,
          pickupDate: request.pickupDate,
          dropoffDate: request.dropoffDate,
          sort: request.sort,
          limit,
          offset: 0,
          filters: {
            vehicleClassKeys: request.filters.vehicleClassKeys,
            pickupType: request.filters.pickupType,
            transmission: request.filters.transmission,
            seatsMin: request.filters.seatsMin,
            priceBand: request.filters.priceBand,
          },
        })

        let rows = carSearch.rows

        if (request.driverAge != null && rows.length) {
          const driverAgeByInventoryId = await loadSearchDriverAgeMap(rows.map((row) => row.id))
          rows = rows.filter((row) => {
            const minDriverAge = driverAgeByInventoryId.get(row.id)
            return minDriverAge == null || minDriverAge <= request.driverAge!
          })
        }

        if (request.filters.freeCancellationOnly) {
          rows = rows.filter((row) => row.freeCancellation)
        }

        if (request.filters.payAtCounterOnly) {
          rows = rows.filter((row) => row.payAtCounter)
        }

        return {
          provider: CAR_PROVIDER_NAME,
          request,
          results: rows
            .map((row) => buildSearchOffer(row, request))
            .filter((offer): offer is CarProviderRawOffer => Boolean(offer))
            .slice(0, DEFAULT_CAR_PROVIDER_SEARCH_LIMIT),
        }
      },
      options,
    )
  },

  async resolveInventory(lookup, options) {
    return runProviderOperation(
      'resolveInventory',
      async () => {
        const row = await loadResolvedOfferRow(lookup)
        if (!row) return null
        return buildResolvedOffer(row, lookup)
      },
      options,
    )
  },

  async fetchPrice(lookup, options) {
    return runProviderOperation(
      'fetchPrice',
      async () => {
        const offer = await defaultCarProviderClient.resolveInventory(lookup, options)
        if (!offer || offer.isAvailable === false) return null

        return {
          provider: CAR_PROVIDER_NAME,
          inventoryId: offer.inventoryId,
          currencyCode: offer.currencyCode,
          dailyBaseCents: offer.priceDailyCents,
          totalBaseCents: offer.totalBaseCents,
          taxesCents: offer.taxesCents,
          mandatoryFeesCents: offer.mandatoryFeesCents,
          totalPriceCents: offer.totalPriceCents,
          days: offer.days,
        }
      },
      options,
    )
  },
}
