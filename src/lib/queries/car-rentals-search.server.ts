import { searchCarRentals } from '~/lib/repos/car-rentals-repo.server'
import { findTopTravelCity } from '~/seed/cities/top-100.js'
import type { CarRentalResult } from '~/types/car-rentals/search'

const normalizeToken = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()

const titleCase = (value: string) => {
  const lower = normalizeToken(value)
  if (!lower) return ''
  return `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`
}

const toPriceAmount = (cents: number) => Math.max(0, Math.round(Number(cents || 0) / 100))

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

export type LoadCarRentalResultsInput = {
  query: string
  pickupDate?: string | null
  dropoffDate?: string | null
}

export async function loadCarRentalResultsFromDb(
  input: LoadCarRentalResultsInput,
): Promise<CarRentalResult[]> {
  const city = findTopTravelCity(input.query)
  if (!city) return []

  const rows = await searchCarRentals({
    citySlug: city.slug,
    pickupDate: input.pickupDate || undefined,
    dropoffDate: input.dropoffDate || undefined,
    limit: 600,
    offset: 0,
  })

  const q = normalizeToken(input.query)

  return rows.map((row, index) => {
    const priceFrom = toPriceAmount(row.fromDailyCents)
    const rating = Number(row.rating)

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
        q && row.citySlug.includes(q) ? 'Great match' : 'Popular',
      ].slice(0, 3),
      score: toScore({
        score: row.score,
        rating,
        priceFrom,
        freeCancellation: row.freeCancellation,
        payAtCounter: row.payAtCounter,
      }),
    }
  })
}
