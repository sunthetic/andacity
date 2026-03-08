import type { CarRentalCity } from '~/data/car-rental-cities'
import type { CarOffer, CarRental } from '~/data/car-rentals'
import {
  getCarRentalCityBySlug,
  getCarRentalDetailBySlug,
  listCarRentalCities,
  listCarRentals,
  searchCarRentals,
} from '~/lib/repos/car-rentals-repo.server'
import type { CarRentalResult } from '~/types/car-rentals/search'

const toMoneyAmount = (cents: number) => Math.max(0, Math.round(Number(cents || 0) / 100))

const toRating = (value: string | number) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return n
}

const titleCase = (value: string) => {
  const lower = String(value || '')
    .trim()
    .toLowerCase()
  if (!lower) return ''
  return `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`
}

const defaultFaq = (name: string, city: string) => [
  {
    q: `Where do I pick up ${name} in ${city}?`,
    a: 'Pickup details are shown on each offer and can vary by provider location.',
  },
  {
    q: 'Can I cancel this car rental?',
    a: 'Cancellation policies vary by offer and are shown before checkout.',
  },
  {
    q: 'When do I pay for the rental?',
    a: 'Payment timing depends on offer terms and is confirmed during checkout.',
  },
]

const toScore = (input: {
  score: string | null
  rating: number
  priceFrom: number
  freeCancellation: boolean
  payAtCounter: boolean
}) => {
  const raw = Number(input.score)
  if (Number.isFinite(raw)) return raw

  return (
    input.rating * 0.6 +
    (input.freeCancellation ? 0.25 : 0) +
    (input.payAtCounter ? 0.18 : 0) +
    (Math.max(0, 120 - input.priceFrom) / 120) * 0.35
  )
}

const toResult = (
  row: Awaited<ReturnType<typeof searchCarRentals>>[number],
  index: number,
): CarRentalResult => {
  const priceFrom = toMoneyAmount(row.fromDailyCents)
  const rating = toRating(row.rating)

  return {
    id: `car-${row.slug}-${index}`,
    slug: row.slug,
    name: row.providerName,
    city: row.cityName,
    pickupArea: row.pickupArea,
    vehicleName: row.vehicleName,
    category: row.category,
    transmission: row.transmission ? titleCase(row.transmission) : null,
    seats: row.seats,
    bags: row.bagsLabel,
    pickupType: row.pickupType,
    rating,
    reviewCount: row.reviewCount,
    priceFrom,
    currency: row.currencyCode,
    freeCancellation: row.freeCancellation,
    payAtCounter: row.payAtCounter,
    inclusions: (row.inclusions || []).slice(0, 8),
    image: row.imageUrl || '/img/demo/car-1.jpg',
    badges: [
      row.freeCancellation ? 'Free cancellation' : 'Flexible',
      row.payAtCounter ? 'Pay at counter' : 'Deal',
      'Popular',
    ],
    score: toScore({
      score: row.score,
      rating,
      priceFrom,
      freeCancellation: row.freeCancellation,
      payAtCounter: row.payAtCounter,
    }),
  }
}

export async function loadCarRentalBySlugFromDb(slug: string): Promise<CarRental | null> {
  const row = await getCarRentalDetailBySlug(slug)
  if (!row) return null

  const offers: CarOffer[] = row.offers.map((offer) => ({
    id: offer.offerCode,
    name: offer.name,
    category: offer.category,
    seats: offer.seats,
    bags: offer.bagsLabel,
    transmission: titleCase(offer.transmission) as CarOffer['transmission'],
    doors: offer.doors as CarOffer['doors'],
    ac: offer.airConditioning,
    priceFrom: toMoneyAmount(offer.priceDailyCents),
    freeCancellation: offer.freeCancellation,
    payAtCounter: offer.payAtCounter,
    badges: offer.badges || [],
    features: offer.features || [],
  }))

  const score = Number(row.score)

  return {
    slug: row.slug,
    name: row.providerName,
    city: row.cityName,
    region: row.regionName || '',
    country: row.countryName,
    cityQuery: row.citySlug,
    pickupArea: row.pickupArea,
    pickupAddressLine: row.pickupAddressLine,
    currency: row.currencyCode,
    rating: toRating(row.rating),
    reviewCount: row.reviewCount,
    fromDaily: toMoneyAmount(row.fromDailyCents),
    summary: row.summary,
    images: row.images,
    inclusions: row.inclusions || [],
    policies: {
      freeCancellation: row.freeCancellation,
      payAtCounter: row.payAtCounter,
      securityDepositRequired: row.securityDepositRequired,
      minDriverAge: row.minDriverAge,
      fuelPolicy: row.fuelPolicy,
      cancellationBlurb:
        row.cancellationBlurb ||
        (row.freeCancellation
          ? 'Free cancellation may be available depending on selected offer.'
          : 'Cancellation terms vary by offer.'),
      paymentBlurb:
        row.paymentBlurb ||
        (row.payAtCounter
          ? 'Many offers support pay-at-counter terms.'
          : 'Prepay may be required depending on the offer.'),
      feesBlurb:
        row.feesBlurb ||
        'Local taxes, surcharges, and optional extras are shown before checkout.',
      depositBlurb:
        row.depositBlurb ||
        (row.securityDepositRequired
          ? 'A security deposit may be required at pickup.'
          : 'Deposit terms vary by provider and offer.'),
    },
    offers,
    faq: defaultFaq(row.providerName, row.cityName),
    availability: {
      pickupStart: row.availabilityStart,
      pickupEnd: row.availabilityEnd,
      minDays: row.minDays,
      maxDays: row.maxDays,
      blockedWeekdays: row.blockedWeekdays || [],
      pairingKey: `db:${row.slug}`,
    },
    seedMeta: Number.isFinite(score)
      ? {
          id: `db:${row.slug}`,
          score,
        }
      : undefined,
  }
}

const mapCityRowToCity = (
  row: Awaited<ReturnType<typeof getCarRentalCityBySlug>>,
): CarRentalCity | null => {
  if (!row) return null
  return {
    slug: row.slug,
    name: row.name,
    region: row.region || '',
    country: row.country,
  }
}

export async function loadCarRentalCityBySlugFromDb(citySlug: string): Promise<CarRentalCity | null> {
  const row = await getCarRentalCityBySlug(citySlug)
  return mapCityRowToCity(row)
}

export async function loadCarRentalCitiesFromDb(): Promise<CarRentalCity[]> {
  const rows = await listCarRentalCities()
  return rows
    .map((row) => mapCityRowToCity(row))
    .filter((row): row is CarRentalCity => Boolean(row))
}

export type FeaturedCarRental = {
  slug: string
  name: string
}

export async function loadFeaturedCarRentalsFromDb(limit = 24): Promise<FeaturedCarRental[]> {
  const rows = await listCarRentals({
    limit,
    offset: 0,
  })

  return rows.map((row) => ({
    slug: row.slug,
    name: row.providerName,
  }))
}

export type CarRentalCityPageData = {
  city: CarRentalCity
  results: CarRentalResult[]
  items: { slug: string; name: string }[]
}

export async function loadCarRentalCityPageFromDb(input: {
  citySlug: string
  pickupDate?: string | null
  dropoffDate?: string | null
}): Promise<CarRentalCityPageData | null> {
  const city = await loadCarRentalCityBySlugFromDb(input.citySlug)
  if (!city) return null

  const rows = await searchCarRentals({
    citySlug: input.citySlug,
    pickupDate: input.pickupDate || undefined,
    dropoffDate: input.dropoffDate || undefined,
    limit: 500,
    offset: 0,
  })

  const results = rows.map((row, index) => toResult(row, index))
  const items = results.map((result) => ({
    slug: result.slug,
    name: result.name,
  }))

  return {
    city,
    results,
    items,
  }
}
