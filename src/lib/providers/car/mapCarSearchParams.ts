import { normalizeDatePart, normalizeDateTimePart } from '~/lib/inventory/inventory-id'
import { normalizeCarRentalsSortValue, type CarRentalsSortKey } from '~/lib/search/car-rentals/car-sort-options'
import type {
  CarRentalsPickupType,
  CarRentalsPriceBand,
  CarRentalsTransmission,
} from '~/lib/search/car-rentals/filter-types'
import type { SearchParams } from '~/types/search'
import { findTopTravelCity } from '~/seed/cities/top-100.js'
import type { CanonicalLocation } from '~/types/location'

export type CarProviderSearchRequest = {
  citySlug: string
  cityName: string | null
  pickupDate: string
  dropoffDate: string
  pickupDateTime: string
  dropoffDateTime: string
  driverAge: number | null
  sort: CarRentalsSortKey
  filters: {
    vehicleClassKeys: string[]
    pickupType: CarRentalsPickupType | ''
    transmission: CarRentalsTransmission | ''
    seatsMin: number | null
    priceBand: CarRentalsPriceBand | ''
    freeCancellationOnly: boolean
    payAtCounterOnly: boolean
  }
}

export class CarSearchParamsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CarSearchParamsError'
  }
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toInteger = (value: unknown) => {
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value ?? '').trim(), 10)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed)
}

const clampDriverAge = (value: unknown) => {
  const age = toInteger(value)
  if (age == null) return null
  return Math.max(18, Math.min(85, age))
}

const normalizeTokenList = (value: unknown) =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : [value])
        .flatMap((entry) => String(entry ?? '').split(','))
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  )

const toVehicleClassKeys = (value: unknown) => normalizeTokenList(value)

const toPickupType = (value: unknown): CarRentalsPickupType | '' => {
  const token = toNullableText(value)?.toLowerCase()
  return token === 'airport' || token === 'city' ? token : ''
}

const toTransmission = (value: unknown): CarRentalsTransmission | '' => {
  const token = normalizeTokenList(value)[0]
  return token === 'automatic' || token === 'manual' ? token : ''
}

const toSeatsMin = (value: unknown) => {
  const parsed = toInteger(value)
  if (parsed == null || parsed < 1) return null
  return parsed
}

const toPriceBand = (value: unknown): CarRentalsPriceBand | '' => {
  const token = normalizeTokenList(value)[0]
  return token === 'under-50' ||
    token === '50-100' ||
    token === '100-150' ||
    token === '150-plus'
    ? token
    : ''
}

const resolveCity = (
  value: unknown,
  location: CanonicalLocation | null | undefined,
  fieldName: string,
) => {
  if (location?.citySlug) {
    return {
      citySlug: location.citySlug,
      cityName: location.cityName,
    }
  }

  const text = toNullableText(value)
  if (!text) {
    throw new CarSearchParamsError(`${fieldName} is required for car provider search.`)
  }

  const city = findTopTravelCity(text)
  if (!city) {
    throw new CarSearchParamsError(
      `${fieldName} "${text}" could not be mapped to a supported car rental city.`,
    )
  }

  return {
    citySlug: city.slug,
    cityName: city.name,
  }
}

const toDisplayDateTime = (value: string) =>
  value.replace(/T(\d{2})-(\d{2})$/, 'T$1:$2')

const resolveDateTime = (value: unknown, fieldName: string) => {
  const text = toNullableText(value)
  if (!text) {
    throw new CarSearchParamsError(`${fieldName} is required for car provider search.`)
  }

  if (ISO_DATE_PATTERN.test(text)) {
    try {
      const date = normalizeDatePart(text, fieldName)
      return {
        date,
        dateTime: `${date}T10:00`,
      }
    } catch {
      throw new CarSearchParamsError(`${fieldName} must be a valid ISO date.`)
    }
  }

  try {
    const dateTime = normalizeDateTimePart(text, fieldName)
    return {
      date: dateTime.slice(0, 10),
      dateTime: toDisplayDateTime(dateTime),
    }
  } catch {
    throw new CarSearchParamsError(
      `${fieldName} must be a valid ISO date or datetime.`,
    )
  }
}

export const mapCarSearchParams = (
  params: SearchParams,
): CarProviderSearchRequest => {
  if (params.vertical !== 'car') {
    throw new CarSearchParamsError(
      `Car provider cannot search the "${params.vertical}" vertical.`,
    )
  }

  const pickupCity = resolveCity(
    params.pickupLocation || params.destination || params.origin,
    params.pickupLocationData || params.destinationLocation || params.originLocation,
    'pickupLocation',
  )
  const dropoffCity = resolveCity(
    params.dropoffLocation ||
      params.pickupLocation ||
      params.destination ||
      params.origin,
    params.dropoffLocationData ||
      params.pickupLocationData ||
      params.destinationLocation ||
      params.originLocation,
    'dropoffLocation',
  )

  if (pickupCity.citySlug !== dropoffCity.citySlug) {
    throw new CarSearchParamsError(
      'Car provider search currently supports same-city pickup and dropoff only.',
    )
  }

  const pickup = resolveDateTime(
    params.pickupDate || params.departDate || params.checkInDate,
    'pickupDate',
  )
  const dropoff = resolveDateTime(
    params.dropoffDate || params.returnDate || params.checkOutDate,
    'dropoffDate',
  )

  if (dropoff.date <= pickup.date) {
    throw new CarSearchParamsError(
      'Car provider search requires dropoffDate to be after pickupDate.',
    )
  }

  return {
    citySlug: pickupCity.citySlug,
    cityName: pickupCity.cityName,
    pickupDate: pickup.date,
    dropoffDate: dropoff.date,
    pickupDateTime: pickup.dateTime,
    dropoffDateTime: dropoff.dateTime,
    driverAge: clampDriverAge(params.driverAge),
    sort: normalizeCarRentalsSortValue(params.filters?.sort),
    filters: {
      vehicleClassKeys: toVehicleClassKeys(params.filters?.vehicleClass),
      pickupType: toPickupType(params.filters?.pickupType),
      transmission: toTransmission(params.filters?.transmission),
      seatsMin: toSeatsMin(params.filters?.seatsMin),
      priceBand: toPriceBand(params.filters?.priceRange),
      freeCancellationOnly: params.filters?.refundableOnly === true,
      payAtCounterOnly: params.filters?.payAtCounterOnly === true,
    },
  }
}
