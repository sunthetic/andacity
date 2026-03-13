import { and, asc, eq } from 'drizzle-orm'
import { getDb } from '~/lib/db/client.server'
import {
  carInventory,
  carInventoryImages,
  carLocations,
  carOffers,
  carProviders,
  carVehicleClasses,
} from '~/lib/db/schema'
import { computeDays } from '~/lib/search/car-rentals/dates'
import { toCarSearchEntity } from '~/lib/search/search-entity'
import { toBookableEntityFromSearchEntity } from '~/lib/booking/bookable-entity'
import type { ParsedCarInventoryId } from '~/lib/inventory/inventory-id'
import type { InventoryProviderResolverInput, ResolvedInventoryRecord } from '~/types/inventory'

const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return null
  return Math.round(parsed)
}

const toPriceAmount = (cents: number) => Math.max(0, Math.round(Number(cents || 0) / 100))

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

const buildCarHref = (slug: string, pickupDateTime: string, dropoffDateTime: string) => {
  const searchParams = new URLSearchParams({
    pickupDate: pickupDateTime.slice(0, 10),
    dropoffDate: dropoffDateTime.slice(0, 10),
  })
  return `/car-rentals/${encodeURIComponent(slug)}?${searchParams.toString()}`
}

export const resolveCarInventory = async (
  input: InventoryProviderResolverInput<ParsedCarInventoryId>,
): Promise<ResolvedInventoryRecord | null> => {
  const db = getDb()
  const locationId = toPositiveInteger(input.parsedInventory.providerLocationId)
  const inventoryId = input.providerInventoryId

  const selectInventoryRow = () =>
    db
      .select({
        id: carInventory.id,
        slug: carInventory.slug,
        providerName: carProviders.name,
        currencyCode: carInventory.currencyCode,
        fromDailyCents: carInventory.fromDailyCents,
        locationId: carInventory.locationId,
        pickupArea: carLocations.name,
        pickupType: carLocations.locationType,
        availabilityStart: carInventory.availabilityStart,
        availabilityEnd: carInventory.availabilityEnd,
        minDays: carInventory.minDays,
        maxDays: carInventory.maxDays,
        blockedWeekdays: carInventory.blockedWeekdays,
      })
      .from(carInventory)
      .innerJoin(carProviders, eq(carInventory.providerId, carProviders.id))
      .innerJoin(carLocations, eq(carInventory.locationId, carLocations.id))

  const inventoryRowById =
    inventoryId != null
      ? (
          await selectInventoryRow()
            .where(eq(carInventory.id, inventoryId))
            .limit(1)
        )[0] || null
      : null

  const inventoryRowByLocation =
    locationId != null
      ? (
          await selectInventoryRow()
            .where(eq(carInventory.locationId, locationId))
            .orderBy(asc(carInventory.fromDailyCents), asc(carInventory.id))
            .limit(1)
        )[0] || null
      : null

  const inventoryRow = inventoryRowById || inventoryRowByLocation
  if (!inventoryRow) return null

  const [imageRow] = await db
    .select({
      url: carInventoryImages.url,
    })
    .from(carInventoryImages)
    .where(eq(carInventoryImages.inventoryId, inventoryRow.id))
    .orderBy(asc(carInventoryImages.sortOrder), asc(carInventoryImages.id))
    .limit(1)

  const offerRows = await db
    .select({
      name: carOffers.name,
      transmission: carOffers.transmission,
      seats: carOffers.seats,
      bagsLabel: carOffers.bagsLabel,
      priceDailyCents: carOffers.priceDailyCents,
      currencyCode: carOffers.currencyCode,
      vehicleClassKey: carVehicleClasses.key,
      vehicleClassCategory: carVehicleClasses.category,
    })
    .from(carOffers)
    .innerJoin(carVehicleClasses, eq(carOffers.vehicleClassId, carVehicleClasses.id))
    .where(eq(carOffers.inventoryId, inventoryRow.id))
    .orderBy(asc(carOffers.priceDailyCents), asc(carOffers.id))

  const exactOffer =
    offerRows.find((offer) => offer.vehicleClassKey === input.parsedInventory.vehicleClass) || null
  const resolvedOffer = exactOffer || offerRows[0] || null

  const searchEntity = toCarSearchEntity(
    {
      inventoryId: inventoryRow.id,
      locationId: inventoryRow.locationId,
      slug: inventoryRow.slug,
      name: inventoryRow.providerName,
      pickupArea: inventoryRow.pickupArea,
      vehicleName:
        resolvedOffer?.name ||
        resolvedOffer?.vehicleClassCategory ||
        input.parsedInventory.vehicleClass,
      category:
        resolvedOffer?.vehicleClassKey ||
        resolvedOffer?.vehicleClassCategory ||
        input.parsedInventory.vehicleClass,
      transmission: resolvedOffer?.transmission || null,
      seats: resolvedOffer?.seats || null,
      priceFrom: toPriceAmount(resolvedOffer?.priceDailyCents ?? inventoryRow.fromDailyCents),
      currency: resolvedOffer?.currencyCode ?? inventoryRow.currencyCode,
      image: imageRow?.url || null,
    },
    {
      providerLocationId: inventoryRow.locationId,
      pickupDateTime: input.parsedInventory.pickupDateTime,
      dropoffDateTime: input.parsedInventory.dropoffDateTime,
      vehicleClass: resolvedOffer?.vehicleClassKey || input.parsedInventory.vehicleClass,
      priceAmountCents: resolvedOffer?.priceDailyCents ?? inventoryRow.fromDailyCents,
      snapshotTimestamp: input.checkedAt,
      imageUrl: imageRow?.url || null,
      href: buildCarHref(
        inventoryRow.slug,
        input.parsedInventory.pickupDateTime,
        input.parsedInventory.dropoffDateTime,
      ),
      assumedRentalWindow: false,
    },
  )

  return {
    entity: toBookableEntityFromSearchEntity(searchEntity),
    checkedAt: input.checkedAt,
    isAvailable: isCarInventoryAvailable(
      {
        availabilityStart: inventoryRow.availabilityStart,
        availabilityEnd: inventoryRow.availabilityEnd,
        minDays: inventoryRow.minDays,
        maxDays: inventoryRow.maxDays,
        blockedWeekdays: (inventoryRow.blockedWeekdays || []).map((value) => Number(value)),
      },
      input.parsedInventory.pickupDateTime,
      input.parsedInventory.dropoffDateTime,
    ),
  }
}
