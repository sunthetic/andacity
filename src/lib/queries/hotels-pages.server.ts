import { asc, inArray } from 'drizzle-orm'
import { buildAvailabilityConfidence } from '~/lib/inventory/availability-confidence'
import type { HotelCity } from '~/data/hotel-cities'
import type { Hotel, Room } from '~/data/hotels'
import { getDb } from '~/lib/db/client.server'
import { hotelOffers } from '~/lib/db/schema'
import { buildInventoryFreshness } from '~/lib/inventory/freshness'
import {
  countHotels,
  getHotelCitySummaryBySlug,
  getHotelDetailBySlug,
  listHotelCitySummaries,
  listHotelSlugs,
  listHotelsByCitySlug,
  type HotelListRow,
} from '~/lib/repos/hotels-repo.server'

const toMoneyAmount = (cents: number) => Math.max(0, Math.round(Number(cents || 0) / 100))

const toStars = (value: number): 2 | 3 | 4 | 5 => {
  if (value >= 5) return 5
  if (value >= 4) return 4
  if (value >= 3) return 3
  return 2
}

const toRating = (value: string | number) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return n
}

const defaultPolicies = (input: {
  city: string
  freeCancellation: boolean
  payLater: boolean
  noResortFees: boolean
  checkInTime: string | null
  checkOutTime: string | null
  cancellationBlurb: string | null
  paymentBlurb: string | null
  feesBlurb: string | null
}) => ({
  freeCancellation: input.freeCancellation,
  payLater: input.payLater,
  noResortFees: input.noResortFees,
  checkInTime: input.checkInTime || '3:00 PM',
  checkOutTime: input.checkOutTime || '11:00 AM',
  cancellationBlurb:
    input.cancellationBlurb ||
    (input.freeCancellation
      ? `Select rates in ${input.city} may include free cancellation.`
      : 'Cancellation terms vary by room and rate.'),
  paymentBlurb:
    input.paymentBlurb ||
    (input.payLater
      ? 'Some rates support pay-later options at final confirmation.'
      : 'Most rates are prepay with final terms shown before booking.'),
  feesBlurb:
    input.feesBlurb ||
    (input.noResortFees
      ? 'No resort fees are currently listed for this property.'
      : 'Local taxes and property fees are included in the final price breakdown.'),
})

const defaultHotelFaq = (hotelName: string, city: string) => [
  {
    q: `Where is ${hotelName} located?`,
    a: `${hotelName} is located in ${city}.`,
  },
  {
    q: 'Can I cancel this hotel booking?',
    a: 'Cancellation terms depend on room and rate selection and are shown before checkout.',
  },
  {
    q: 'When is payment charged?',
    a: 'Payment timing depends on selected rate terms and is confirmed before booking.',
  },
]

const loadRoomsByHotelId = async (hotelIds: number[]) => {
  const ids = Array.from(new Set(hotelIds.filter((hotelId) => hotelId > 0)))
  if (!ids.length) return new Map<number, Room[]>()

  const db = getDb()
  const rows = await db
    .select({
      hotelId: hotelOffers.hotelId,
      externalOfferId: hotelOffers.externalOfferId,
      name: hotelOffers.name,
      sleeps: hotelOffers.sleeps,
      beds: hotelOffers.beds,
      sizeSqft: hotelOffers.sizeSqft,
      priceNightlyCents: hotelOffers.priceNightlyCents,
      refundable: hotelOffers.refundable,
      payLater: hotelOffers.payLater,
      badges: hotelOffers.badges,
      features: hotelOffers.features,
    })
    .from(hotelOffers)
    .where(inArray(hotelOffers.hotelId, ids))
    .orderBy(
      asc(hotelOffers.hotelId),
      asc(hotelOffers.priceNightlyCents),
      asc(hotelOffers.id),
    )

  const roomsByHotelId = new Map<number, Room[]>()
  for (const row of rows) {
    const room: Room = {
      id: row.externalOfferId,
      name: row.name,
      sleeps: row.sleeps,
      beds: row.beds,
      sizeSqft: row.sizeSqft,
      priceFrom: toMoneyAmount(row.priceNightlyCents),
      refundable: row.refundable,
      payLater: row.payLater,
      badges: row.badges || [],
      features: row.features || [],
    }
    const existing = roomsByHotelId.get(row.hotelId)
    if (existing) {
      existing.push(room)
      continue
    }
    roomsByHotelId.set(row.hotelId, [room])
  }

  return roomsByHotelId
}

const mapCityHotelRowToHotel = (row: HotelListRow, rooms: Room[] = []): Hotel => {
  const freshness = buildInventoryFreshness({
    checkedAt: row.freshnessTimestamp,
    profile: 'inventory_snapshot',
  })

  return {
    inventoryId: row.id,
    slug: row.slug,
    name: row.name,
    city: row.cityName,
    region: row.regionName || '',
    country: row.countryName,
    cityQuery: row.citySlug,
    neighborhood: row.neighborhood,
    propertyType: row.propertyType,
    addressLine: row.addressLine,
    currency: row.currencyCode,
    stars: toStars(row.stars),
    rating: toRating(row.rating),
    reviewCount: row.reviewCount,
    fromNightly: toMoneyAmount(row.fromNightlyCents),
    summary: row.summary,
    images: row.imageUrl ? [row.imageUrl] : [],
    amenities: row.amenities || [],
    policies: defaultPolicies({
      city: row.cityName,
      freeCancellation: row.freeCancellation,
      payLater: row.payLater,
      noResortFees: row.noResortFees,
      checkInTime: row.checkInTime,
      checkOutTime: row.checkOutTime,
      cancellationBlurb: row.cancellationBlurb,
      paymentBlurb: row.paymentBlurb,
      feesBlurb: row.feesBlurb,
    }),
    rooms,
    faq: defaultHotelFaq(row.name, row.cityName),
    availabilityConfidence: buildAvailabilityConfidence({
      freshness,
      match: 'unknown',
    }),
    freshness,
  }
}

export async function loadHotelBySlugFromDb(slug: string): Promise<Hotel | null> {
  const row = await getHotelDetailBySlug(slug)
  if (!row) return null

  const rooms: Room[] = row.offers.map((offer) => ({
    id: offer.externalOfferId,
    name: offer.name,
    sleeps: offer.sleeps,
    beds: offer.beds,
    sizeSqft: offer.sizeSqft,
    priceFrom: toMoneyAmount(offer.priceNightlyCents),
    refundable: offer.refundable,
    payLater: offer.payLater,
    badges: offer.badges || [],
    features: offer.features || [],
  }))
  const freshness = buildInventoryFreshness({
    checkedAt: row.freshnessTimestamp,
    profile: 'inventory_snapshot',
  })

  return {
    inventoryId: row.id,
    slug: row.slug,
    name: row.name,
    city: row.cityName,
    region: row.regionName || '',
    country: row.countryName,
    cityQuery: row.citySlug,
    neighborhood: row.neighborhood,
    propertyType: row.propertyType,
    addressLine: row.addressLine,
    currency: row.currencyCode,
    stars: toStars(row.stars),
    rating: toRating(row.rating),
    reviewCount: row.reviewCount,
    fromNightly: toMoneyAmount(row.fromNightlyCents),
    summary: row.summary,
    images: row.images,
    amenities: row.amenities,
    policies: defaultPolicies({
      city: row.cityName,
      freeCancellation: row.freeCancellation,
      payLater: row.payLater,
      noResortFees: row.noResortFees,
      checkInTime: row.checkInTime,
      checkOutTime: row.checkOutTime,
      cancellationBlurb: row.cancellationBlurb,
      paymentBlurb: row.paymentBlurb,
      feesBlurb: row.feesBlurb,
    }),
    rooms,
    faq: defaultHotelFaq(row.name, row.cityName),
    availabilityConfidence: buildAvailabilityConfidence({
      freshness,
      match: 'unknown',
    }),
    freshness,
    availability: row.availability
      ? {
          checkInStart: row.availability.checkInStart,
          checkInEnd: row.availability.checkInEnd,
          minNights: row.availability.minNights,
          maxNights: row.availability.maxNights,
          blockedWeekdays: row.availability.blockedWeekdays,
          pairingKey: `db:${row.slug}`,
        }
      : undefined,
  }
}

export async function loadHotelsForCityFromDb(citySlug: string): Promise<Hotel[]> {
  const rows = await listHotelsByCitySlug(citySlug)
  const roomsByHotelId = await loadRoomsByHotelId(rows.map((row) => row.id))
  return rows.map((row) => mapCityHotelRowToHotel(row, roomsByHotelId.get(row.id) || []))
}

const mapCitySummaryToHotelCity = (row: Awaited<ReturnType<typeof getHotelCitySummaryBySlug>>) => {
  if (!row) return null

  const city: HotelCity = {
    slug: row.slug,
    city: row.city,
    region: row.region || '',
    country: row.country,
    query: row.slug,
    hotelSlugs: row.hotelSlugs,
    priceFrom: toMoneyAmount(row.fromNightlyCents),
    topAmenities: row.topAmenities,
    topNeighborhoods: row.topNeighborhoods,
  }

  return city
}

export async function loadHotelCityBySlugFromDb(citySlug: string): Promise<HotelCity | null> {
  const row = await getHotelCitySummaryBySlug(citySlug)
  return mapCitySummaryToHotelCity(row)
}

export async function loadHotelCitiesFromDb(): Promise<HotelCity[]> {
  const rows = await listHotelCitySummaries()
  return rows
    .map((row) => mapCitySummaryToHotelCity(row))
    .filter((row): row is HotelCity => Boolean(row))
}

export type DestinationTopStay = {
  id: string
  slug: string
  name: string
  area: string
  rating: number
  reviewCount: number
  from: number
  currency: string
  image: string
  badges: string[]
  freshness?: import('~/lib/inventory/freshness').InventoryFreshnessModel
}

export async function loadTopDestinationStaysFromDb(
  citySlug: string,
  limit = 4,
): Promise<DestinationTopStay[]> {
  const rows = await listHotelsByCitySlug(citySlug, { limit: Math.max(8, limit) })

  return rows.slice(0, limit).map((row, index) => {
    const freshness = buildInventoryFreshness({
      checkedAt: row.freshnessTimestamp,
      profile: 'inventory_snapshot',
    })

    return {
      id: `${citySlug}-db-top-${index + 1}`,
      slug: row.slug,
      name: row.name,
      area: row.neighborhood,
      rating: toRating(row.rating),
      reviewCount: row.reviewCount,
      from: toMoneyAmount(row.fromNightlyCents),
      currency: row.currencyCode,
      image: row.imageUrl || '/img/demo/hotel-1.jpg',
      badges: [
        row.freeCancellation ? 'Free cancellation' : 'Flexible terms',
        row.payLater ? 'Pay later' : 'Book now',
      ],
      freshness,
    }
  })
}

export type HotelSitemapPage = {
  totalCount: number
  totalPages: number
  slugs: string[]
}

export async function loadHotelSitemapPageFromDb(input: {
  page: number
  pageSize: number
}): Promise<HotelSitemapPage> {
  const totalCount = await countHotels()
  const totalPages = Math.max(1, Math.ceil(totalCount / input.pageSize))
  const page = Math.max(1, Math.min(input.page, totalPages))
  const offset = (page - 1) * input.pageSize

  const slugs = await listHotelSlugs({
    limit: input.pageSize,
    offset,
  })

  return {
    totalCount,
    totalPages,
    slugs,
  }
}
