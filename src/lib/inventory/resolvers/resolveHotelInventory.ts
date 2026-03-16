import { asc, desc, eq } from 'drizzle-orm'
import { getDb } from '~/lib/db/client.server'
import {
  cities,
  hotelAvailabilitySnapshots,
  hotelAmenityLinks,
  hotelAmenities,
  hotelBrands,
  hotelImages,
  hotelOffers,
  hotels,
} from '~/lib/db/schema'
import { normalizeInventoryToken } from '~/lib/inventory/inventory-id'
import { toBookableEntityFromSearchEntity } from '~/lib/booking/bookable-entity'
import { computeNights } from '~/lib/search/hotels/dates'
import { toHotelSearchEntity } from '~/lib/search/search-entity'
import type { ParsedHotelInventoryId } from '~/lib/inventory/inventory-id'
import type { InventoryProviderResolverInput, ResolvedInventoryRecord } from '~/types/inventory'

const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return null
  return Math.round(parsed)
}

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const cloneStringArray = (value: string[] | null | undefined) =>
  Array.isArray(value) ? value.map((entry) => String(entry)) : null

const toPriceAmount = (cents: number) => Math.max(0, Math.round(Number(cents || 0) / 100))

const toUtcWeekday = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date.getUTCDay()
}

const isHotelInventoryAvailable = (
  availability:
    | {
        checkInStart: string
        checkInEnd: string
        minNights: number
        maxNights: number
        blockedWeekdays: number[]
      }
    | null,
  checkInDate: string,
  checkOutDate: string,
) => {
  if (!availability) return null

  const nights = computeNights(checkInDate, checkOutDate)
  if (nights == null) return null

  if (checkInDate < availability.checkInStart || checkInDate > availability.checkInEnd) {
    return false
  }

  if (nights < availability.minNights || nights > availability.maxNights) {
    return false
  }

  const weekday = toUtcWeekday(checkInDate)
  if (weekday != null && availability.blockedWeekdays.includes(weekday)) {
    return false
  }

  return true
}

const buildHotelHref = (slug: string, checkInDate: string, checkOutDate: string) => {
  const searchParams = new URLSearchParams({
    checkIn: checkInDate,
    checkOut: checkOutDate,
  })
  return `/hotels/${encodeURIComponent(slug)}?${searchParams.toString()}`
}

export const resolveHotelInventory = async (
  input: InventoryProviderResolverInput<ParsedHotelInventoryId>,
): Promise<ResolvedInventoryRecord | null> => {
  const hotelId = input.providerInventoryId || toPositiveInteger(input.parsedInventory.hotelId)
  if (!hotelId) return null

  const db = getDb()
  const hotelRows = await db
    .select({
      id: hotels.id,
      slug: hotels.slug,
      name: hotels.name,
      cityName: cities.name,
      neighborhood: hotels.neighborhood,
      addressLine: hotels.addressLine,
      propertyType: hotels.propertyType,
      stars: hotels.stars,
      rating: hotels.rating,
      reviewCount: hotels.reviewCount,
      summary: hotels.summary,
      fromNightlyCents: hotels.fromNightlyCents,
      currencyCode: hotels.currencyCode,
      freeCancellation: hotels.freeCancellation,
      payLater: hotels.payLater,
      noResortFees: hotels.noResortFees,
      checkInTime: hotels.checkInTime,
      checkOutTime: hotels.checkOutTime,
      cancellationBlurb: hotels.cancellationBlurb,
      paymentBlurb: hotels.paymentBlurb,
      feesBlurb: hotels.feesBlurb,
      brandName: hotelBrands.name,
    })
    .from(hotels)
    .innerJoin(cities, eq(hotels.cityId, cities.id))
    .leftJoin(hotelBrands, eq(hotels.brandId, hotelBrands.id))
    .where(eq(hotels.id, hotelId))
    .limit(1)

  const hotelRow = hotelRows[0]
  if (!hotelRow) return null

  const [imageRow] = await db
    .select({
      url: hotelImages.url,
    })
    .from(hotelImages)
    .where(eq(hotelImages.hotelId, hotelRow.id))
    .orderBy(asc(hotelImages.sortOrder), asc(hotelImages.id))
    .limit(1)

  const amenityRows = await db
    .select({
      label: hotelAmenities.label,
    })
    .from(hotelAmenityLinks)
    .innerJoin(hotelAmenities, eq(hotelAmenityLinks.amenityId, hotelAmenities.id))
    .where(eq(hotelAmenityLinks.hotelId, hotelRow.id))
    .orderBy(asc(hotelAmenities.label))

  const offerRows = await db
    .select({
      externalOfferId: hotelOffers.externalOfferId,
      name: hotelOffers.name,
      sleeps: hotelOffers.sleeps,
      beds: hotelOffers.beds,
      sizeSqft: hotelOffers.sizeSqft,
      priceNightlyCents: hotelOffers.priceNightlyCents,
      currencyCode: hotelOffers.currencyCode,
      refundable: hotelOffers.refundable,
      payLater: hotelOffers.payLater,
      badges: hotelOffers.badges,
      features: hotelOffers.features,
    })
    .from(hotelOffers)
    .where(eq(hotelOffers.hotelId, hotelRow.id))
    .orderBy(asc(hotelOffers.priceNightlyCents), asc(hotelOffers.id))

  const requestedRoomType = input.parsedInventory.roomType
  const exactOffer =
    (input.parsedInventory.providerOfferId
      ? offerRows.find(
          (offer) =>
            normalizeInventoryToken(offer.externalOfferId, 'provider offer') ===
              input.parsedInventory.providerOfferId &&
            normalizeInventoryToken(offer.name, 'hotel offer name') === requestedRoomType,
        )
      : null) ||
    offerRows.find(
      (offer) =>
        normalizeInventoryToken(offer.name, 'hotel offer name') === requestedRoomType &&
        offer.sleeps >= input.parsedInventory.occupancy,
    ) ||
    offerRows.find(
      (offer) => normalizeInventoryToken(offer.name, 'hotel offer name') === requestedRoomType,
    ) ||
    null
  const resolvedOffer = exactOffer || offerRows[0] || null

  const [availabilityRow] = await db
    .select({
      checkInStart: hotelAvailabilitySnapshots.checkInStart,
      checkInEnd: hotelAvailabilitySnapshots.checkInEnd,
      minNights: hotelAvailabilitySnapshots.minNights,
      maxNights: hotelAvailabilitySnapshots.maxNights,
      blockedWeekdays: hotelAvailabilitySnapshots.blockedWeekdays,
    })
    .from(hotelAvailabilitySnapshots)
    .where(eq(hotelAvailabilitySnapshots.hotelId, hotelRow.id))
    .orderBy(desc(hotelAvailabilitySnapshots.snapshotAt), desc(hotelAvailabilitySnapshots.id))
    .limit(1)

  const nights = computeNights(
    input.parsedInventory.checkInDate,
    input.parsedInventory.checkOutDate,
  )
  const nightlyBaseCents = resolvedOffer?.priceNightlyCents ?? hotelRow.fromNightlyCents
  const totalBaseCents = nights != null ? nightlyBaseCents * nights : nightlyBaseCents
  const amenityLabels = amenityRows
    .map((row) => toNullableText(row.label))
    .filter((value): value is string => Boolean(value))
  const propertyNotes = [
    toNullableText(hotelRow.paymentBlurb),
    toNullableText(hotelRow.feesBlurb),
    hotelRow.noResortFees ? 'No resort fees' : null,
  ].filter((value): value is string => Boolean(value))

  const searchEntity = toHotelSearchEntity(
    {
      inventoryId: hotelRow.id,
      slug: hotelRow.slug,
      name: hotelRow.name,
      neighborhood: hotelRow.neighborhood,
      stars: hotelRow.stars,
      rating: Number(hotelRow.rating),
      reviewCount: hotelRow.reviewCount,
      priceFrom: toPriceAmount(totalBaseCents),
      currency: resolvedOffer?.currencyCode ?? hotelRow.currencyCode,
      image: imageRow?.url || null,
    },
    {
      checkInDate: input.parsedInventory.checkInDate,
      checkOutDate: input.parsedInventory.checkOutDate,
      occupancy: input.parsedInventory.occupancy,
      roomType: resolvedOffer?.name || input.parsedInventory.roomType,
      providerName: input.parsedInventory.provider,
      providerOfferId: input.parsedInventory.providerOfferId,
      ratePlanId: input.parsedInventory.ratePlanId,
      boardType: input.parsedInventory.boardType,
      cancellationPolicy: input.parsedInventory.cancellationPolicy,
      policy: {
        refundable: resolvedOffer?.refundable ?? null,
        freeCancellation:
          resolvedOffer?.refundable != null
            ? hotelRow.freeCancellation || resolvedOffer.refundable
            : hotelRow.freeCancellation,
        payLater:
          resolvedOffer?.payLater != null
            ? hotelRow.payLater || resolvedOffer.payLater
            : hotelRow.payLater,
        cancellationLabel:
          toNullableText(hotelRow.cancellationBlurb) ||
          (resolvedOffer?.refundable ? 'Free cancellation' : 'Non-refundable'),
      },
      priceSummary: {
        nightlyBaseCents,
        totalBaseCents,
        taxesCents: null,
        mandatoryFeesCents: null,
        totalPriceCents: totalBaseCents,
        nights,
      },
      propertySummary: {
        brandName: toNullableText(hotelRow.brandName),
        propertyType: toNullableText(hotelRow.propertyType),
        cityName: toNullableText(hotelRow.cityName),
        neighborhood: toNullableText(hotelRow.neighborhood),
        addressLine: toNullableText(hotelRow.addressLine),
        stars: hotelRow.stars,
        rating: Number(hotelRow.rating),
        reviewCount: hotelRow.reviewCount,
        checkInTime: toNullableText(hotelRow.checkInTime),
        checkOutTime: toNullableText(hotelRow.checkOutTime),
        summary: toNullableText(hotelRow.summary),
        amenities: cloneStringArray(amenityLabels),
        notes: cloneStringArray(propertyNotes),
      },
      roomSummary: {
        roomName: toNullableText(resolvedOffer?.name) || input.parsedInventory.roomType,
        beds: toNullableText(resolvedOffer?.beds),
        sizeSqft: resolvedOffer?.sizeSqft ?? null,
        sleeps: resolvedOffer?.sleeps ?? null,
        features: cloneStringArray(resolvedOffer?.features),
        badges: cloneStringArray(resolvedOffer?.badges),
      },
      inclusions: cloneStringArray([
        ...((resolvedOffer?.badges || []).map((entry) => String(entry))),
        ...((resolvedOffer?.features || []).map((entry) => String(entry))),
      ]),
      providerMetadata: input.parsedInventory.provider
        ? {
            providerName: input.parsedInventory.provider,
            providerHotelId: String(hotelRow.id),
            providerOfferId: input.parsedInventory.providerOfferId,
            ratePlanId: input.parsedInventory.ratePlanId,
            boardType: input.parsedInventory.boardType,
            cancellationPolicy: input.parsedInventory.cancellationPolicy,
            checkInDate: input.parsedInventory.checkInDate,
            checkOutDate: input.parsedInventory.checkOutDate,
            occupancy: input.parsedInventory.occupancy,
          }
        : undefined,
      priceAmountCents: totalBaseCents,
      snapshotTimestamp: input.checkedAt,
      imageUrl: imageRow?.url || null,
      href: buildHotelHref(
        hotelRow.slug,
        input.parsedInventory.checkInDate,
        input.parsedInventory.checkOutDate,
      ),
      provider: hotelRow.brandName || null,
      assumedStayDates: false,
      assumedOccupancy: false,
    },
  )

  return {
    entity: toBookableEntityFromSearchEntity(searchEntity),
    checkedAt: input.checkedAt,
    isAvailable: isHotelInventoryAvailable(
      availabilityRow
        ? {
            checkInStart: availabilityRow.checkInStart,
            checkInEnd: availabilityRow.checkInEnd,
            minNights: availabilityRow.minNights,
            maxNights: availabilityRow.maxNights,
            blockedWeekdays: (availabilityRow.blockedWeekdays || []).map((value) => Number(value)),
          }
        : null,
      input.parsedInventory.checkInDate,
      input.parsedInventory.checkOutDate,
    ),
  }
}
