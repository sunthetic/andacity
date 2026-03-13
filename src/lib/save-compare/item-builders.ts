import type { CarRental } from '~/data/car-rentals'
import type { Hotel } from '~/data/hotels'
import {
  buildCarInventoryId,
  buildFlightInventoryId,
  buildHotelInventoryId,
} from '~/lib/inventory/inventory-id'
import type { AvailabilityConfidenceModel } from '~/lib/inventory/availability-confidence'
import {
  formatMoney,
  formatPriceQualifier,
  mergePriceDisplayMetadata,
  type PriceDisplayContract,
} from '~/lib/pricing/price-display'
import type { FlightResult } from '~/types/flights/search'
import type { CarRentalResult } from '~/types/car-rentals/search'
import type { SavedItem } from '~/types/save-compare/saved-item'

const HOTELS_VERTICAL = 'hotels' as const
const CARS_VERTICAL = 'cars' as const
const FLIGHTS_VERTICAL = 'flights' as const
type DateRangeLike = {
  checkIn?: string | null
  checkOut?: string | null
}
type RentalDateRangeLike = {
  pickupDate?: string | null
  dropoffDate?: string | null
}

export const buildHotelDetailHref = (hotelSlug: string) =>
  `/hotels/${encodeURIComponent(hotelSlug)}`

export const buildHotelDetailHrefWithDates = (
  hotelSlug: string,
  dates: DateRangeLike | undefined,
) => {
  const base = buildHotelDetailHref(hotelSlug)
  const sp = new URLSearchParams()

  if (dates?.checkIn) sp.set('checkIn', dates.checkIn)
  if (dates?.checkOut) sp.set('checkOut', dates.checkOut)

  const query = sp.toString()
  return query ? `${base}?${query}` : base
}

export const buildCarRentalDetailHref = (rentalSlug: string) =>
  `/car-rentals/${encodeURIComponent(rentalSlug)}`

export const buildCarRentalDetailHrefWithDates = (
  rentalSlug: string,
  dates: DateRangeLike | undefined,
  drivers: unknown,
) => {
  const base = buildCarRentalDetailHref(rentalSlug)
  const sp = new URLSearchParams()

  if (dates?.checkIn) sp.set('pickupDate', dates.checkIn)
  if (dates?.checkOut) sp.set('dropoffDate', dates.checkOut)

  const driverCount = String(drivers || '').trim()
  if (driverCount) sp.set('drivers', driverCount)

  const query = sp.toString()
  return query ? `${base}?${query}` : base
}

export const buildHotelSavedItem = (
  hotel: Hotel,
  dates: DateRangeLike | undefined,
  priceDisplay: PriceDisplayContract,
  href = buildHotelDetailHref(hotel.slug),
): SavedItem => {
  const inventoryId =
    hotel.inventoryId != null
      ? buildHotelInventoryId({
          hotelId: hotel.inventoryId,
          checkInDate: toOptionalDate(dates?.checkIn) || '1970-01-01',
          checkOutDate: toOptionalDate(dates?.checkOut) || toOptionalDate(dates?.checkIn) || '1970-01-02',
          roomType: hotel.rooms[0]?.name || 'standard',
          occupancy: '2',
        })
      : null
  const price = buildPrimaryPrice(priceDisplay, hotel.currency)
  const availability = formatAvailabilityLabel(hotel.availabilityConfidence)

  return {
    id: inventoryId || hotel.slug,
    vertical: HOTELS_VERTICAL,
    title: hotel.name,
    subtitle: `${hotel.neighborhood} · ${hotel.stars}★ · ${hotel.rating.toFixed(1)}`,
    price,
    meta: [
      buildSecondaryPrice(priceDisplay, hotel.currency),
      `${hotel.reviewCount.toLocaleString('en-US')} reviews`,
      hotel.policies.freeCancellation ? 'Free cancellation' : 'Cancellation varies',
      hotel.policies.payLater ? 'Pay later' : 'Prepay',
    ].filter(Boolean),
    href,
    image: hotel.images[0] || undefined,
    compareData: {
      price: price || 'Price unavailable',
      location: [hotel.neighborhood, hotel.city].filter(Boolean).join(' · '),
      stayType: `${hotel.stars}★ ${String(hotel.propertyType || 'Hotel').trim()}`,
      rating: `${hotel.rating.toFixed(1)} · ${hotel.reviewCount.toLocaleString('en-US')} reviews`,
      cancellation: hotel.policies.freeCancellation ? 'Free cancellation' : 'Cancellation varies',
      payment: hotel.policies.payLater ? 'Pay later available' : 'Prepay',
      amenities: hotel.amenities.slice(0, 3).join(' · ') || 'See amenities',
      availability,
    },
    tripCandidate:
      hotel.inventoryId != null && inventoryId
        ? {
            itemType: 'hotel',
            inventoryId,
            providerInventoryId: hotel.inventoryId,
            startDate: toOptionalDate(dates?.checkIn),
            endDate: toOptionalDate(dates?.checkOut),
            priceCents: Math.round((priceDisplay.baseTotalAmount ?? priceDisplay.baseAmount ?? 0) * 100),
            currencyCode: hotel.currency,
            title: hotel.name,
            subtitle: `${hotel.neighborhood} · ${hotel.stars}★`,
            imageUrl: hotel.images[0] || undefined,
            meta: [
              buildSecondaryPrice(priceDisplay, hotel.currency),
              priceDisplay.totalAmount != null
                ? `${priceDisplay.totalLabel} ${formatMoney(priceDisplay.totalAmount, hotel.currency)}`
                : '',
              availability,
            ].filter(Boolean),
            metadata: mergePriceDisplayMetadata(undefined, 'hotel', priceDisplay),
          }
        : undefined,
  }
}

export const buildCarResultSavedItem = (
  result: CarRentalResult,
  dates: DateRangeLike | undefined,
  priceDisplay: PriceDisplayContract,
  href = buildCarRentalDetailHref(result.slug),
): SavedItem => {
  const resolvedHref = result.searchEntity?.href || href
  const title = result.searchEntity?.title || result.name
  const subtitle =
    result.searchEntity?.subtitle || result.vehicleName || result.category || 'Standard car'
  const inventoryId =
    result.searchEntity?.inventoryId ||
    (result.inventoryId != null
      ? buildCarInventoryId({
          providerLocationId: result.inventoryId,
          pickupDateTime: toPickupDateTime(dates?.checkIn),
          dropoffDateTime: toPickupDateTime(dates?.checkOut, dates?.checkIn),
          vehicleClass: result.category || result.vehicleName || 'standard',
        })
      : null)
  const price = buildPrimaryPrice(priceDisplay, result.currency)
  const availability = formatAvailabilityLabel(result.availabilityConfidence)
  const pickupType =
    result.pickupType ||
    (result.pickupArea.toLowerCase().includes('airport') ? 'Airport pickup' : 'City pickup')

  return {
    id: inventoryId || result.slug,
    vertical: CARS_VERTICAL,
    title,
    subtitle,
    price,
    meta: [
      buildSecondaryPrice(priceDisplay, result.currency),
      result.pickupArea,
      result.transmission || '',
      result.seats != null ? `${result.seats} seats` : '',
      result.bags || '',
    ].filter(Boolean),
    href: resolvedHref,
    image: result.searchEntity?.imageUrl || result.image || undefined,
    compareData: {
      price: price || 'Price unavailable',
      vehicleClass: result.category || result.vehicleName || 'Standard rental',
      capacity: [result.seats != null ? `${result.seats} seats` : '', result.bags || '']
        .filter(Boolean)
        .join(' · ') || 'Capacity varies',
      transmission: result.transmission || 'Varies',
      pickup: `${result.pickupArea} · ${pickupType}`,
      cancellation: result.freeCancellation ? 'Free cancellation' : 'Cancellation varies',
      payment: result.payAtCounter ? 'Pay at counter' : 'Prepay',
      inclusions: result.inclusions.slice(0, 3).join(' · ') || 'See inclusions',
      rating:
        result.rating > 0
          ? `${result.rating.toFixed(1)} · ${result.reviewCount.toLocaleString('en-US')} reviews`
          : 'Rating unavailable',
      availability,
    },
    tripCandidate:
      result.inventoryId != null && inventoryId
        ? {
            itemType: 'car',
            inventoryId,
            providerInventoryId: result.inventoryId,
            startDate: toOptionalDate(dates?.checkIn),
            endDate: toOptionalDate(dates?.checkOut),
            priceCents: Math.round((priceDisplay.baseTotalAmount ?? priceDisplay.baseAmount ?? 0) * 100),
            currencyCode: result.currency,
            title,
            subtitle,
            imageUrl: result.searchEntity?.imageUrl || result.image || undefined,
            meta: [
              buildSecondaryPrice(priceDisplay, result.currency),
              result.pickupArea,
              availability,
            ].filter(Boolean),
            metadata: mergePriceDisplayMetadata(undefined, 'car', priceDisplay),
          }
        : undefined,
  }
}

export const buildCarDetailSavedItem = (
  rental: CarRental,
  dates: RentalDateRangeLike | undefined,
  priceDisplay: PriceDisplayContract,
  href = buildCarRentalDetailHref(rental.slug),
): SavedItem => {
  const headlineOffer = rental.offers[0] || null
  const inventoryId =
    rental.inventoryId != null
      ? buildCarInventoryId({
          providerLocationId: rental.inventoryId,
          pickupDateTime: toPickupDateTime(dates?.pickupDate),
          dropoffDateTime: toPickupDateTime(dates?.dropoffDate, dates?.pickupDate),
          vehicleClass: headlineOffer?.category || 'standard',
        })
      : null
  const price = buildPrimaryPrice(priceDisplay, rental.currency)
  const availability = formatAvailabilityLabel(rental.availabilityConfidence)

  return {
    id: inventoryId || rental.slug,
    vertical: CARS_VERTICAL,
    title: rental.name,
    subtitle: headlineOffer?.category || rental.pickupArea,
    price,
    meta: [
      buildSecondaryPrice(priceDisplay, rental.currency),
      rental.pickupArea,
      headlineOffer?.transmission || '',
      headlineOffer ? `${headlineOffer.seats} seats` : '',
      headlineOffer?.bags || '',
    ].filter(Boolean),
    href,
    image: rental.images[0] || undefined,
    compareData: {
      price: price || 'Price unavailable',
      vehicleClass: headlineOffer?.category || 'Vehicle class varies',
      capacity:
        headlineOffer != null
          ? `${headlineOffer.seats} seats · ${headlineOffer.bags}`
          : 'Offer-specific',
      transmission: headlineOffer?.transmission || 'Varies by offer',
      pickup: rental.pickupArea,
      cancellation: rental.policies.freeCancellation ? 'Free cancellation' : 'Cancellation varies',
      payment: rental.policies.payAtCounter ? 'Pay at counter' : 'Prepay',
      inclusions: rental.inclusions.slice(0, 3).join(' · ') || 'See inclusions',
      rating: `${rental.rating.toFixed(1)} · ${rental.reviewCount.toLocaleString('en-US')} reviews`,
      availability,
    },
    tripCandidate:
      rental.inventoryId != null && inventoryId
        ? {
            itemType: 'car',
            inventoryId,
            providerInventoryId: rental.inventoryId,
            startDate: toOptionalDate(dates?.pickupDate),
            endDate: toOptionalDate(dates?.dropoffDate),
            priceCents: Math.round((priceDisplay.baseTotalAmount ?? priceDisplay.baseAmount ?? 0) * 100),
            currencyCode: rental.currency,
            title: rental.name,
            subtitle: headlineOffer?.category || rental.pickupArea,
            imageUrl: rental.images[0] || undefined,
            meta: [
              buildSecondaryPrice(priceDisplay, rental.currency),
              rental.pickupArea,
              availability,
            ].filter(Boolean),
            metadata: mergePriceDisplayMetadata(undefined, 'car', priceDisplay),
          }
        : undefined,
  }
}

export const buildFlightSavedItem = (
  result: FlightResult,
  priceDisplay: PriceDisplayContract,
  href: string,
): SavedItem => {
  const resolvedHref = result.searchEntity?.href || href
  const title = result.searchEntity?.title || result.airline
  const subtitle = result.searchEntity?.subtitle || `${result.origin} → ${result.destination}`
  const inventoryId =
    result.searchEntity?.inventoryId ||
    (result.itineraryId != null
      ? buildFlightInventoryId({
          airlineCode: result.airlineCode || result.airline,
          flightNumber: result.flightNumber || String(result.itineraryId),
          departDate: result.requestedServiceDate || result.serviceDate || '1970-01-01',
          originCode: result.originCode || result.origin,
          destinationCode: result.destinationCode || result.destination,
        })
      : null)
  const price = buildPrimaryPrice(priceDisplay, result.currency)
  const availability = formatAvailabilityLabel(result.availabilityConfidence)

  return {
    id: inventoryId || result.id,
    vertical: FLIGHTS_VERTICAL,
    title,
    subtitle,
    price,
    meta: [
      buildSecondaryPrice(priceDisplay, result.currency),
      `Depart ${result.departureTime}`,
      `Arrive ${result.arrivalTime}`,
      result.duration,
      result.stopsLabel,
      result.cabinClass ? titleCaseFlightToken(result.cabinClass) : '',
    ].filter(Boolean),
    href: resolvedHref,
    compareData: {
      price: price || 'Price unavailable',
      airline: result.airline,
      route: `${result.origin} → ${result.destination}${result.requestedServiceDate ? ` · ${formatFlightDate(result.requestedServiceDate)}` : ''}`,
      schedule: `${result.departureTime} → ${result.arrivalTime}`,
      duration: result.duration,
      stops: result.stopsLabel,
      cabin: result.cabinClass ? titleCaseFlightToken(result.cabinClass) : 'See fare rules',
      availability,
    },
    tripCandidate:
      result.itineraryId != null && inventoryId
        ? {
            itemType: 'flight',
            inventoryId,
            providerInventoryId: result.itineraryId,
            startDate: result.requestedServiceDate || result.serviceDate,
            endDate: result.requestedServiceDate || result.serviceDate,
            priceCents: Math.round((priceDisplay.baseTotalAmount ?? priceDisplay.baseAmount ?? 0) * 100),
            currencyCode: result.currency,
            title,
            subtitle,
            meta: [
              `${result.departureTime} → ${result.arrivalTime}`,
              result.duration,
              result.stopsLabel,
              availability,
            ].filter(Boolean),
            metadata: mergePriceDisplayMetadata(undefined, 'flight', priceDisplay),
          }
        : undefined,
  }
}

const buildPrimaryPrice = (priceDisplay: PriceDisplayContract, currency: string) => {
  if (priceDisplay.baseTotalAmount != null) {
    return `${priceDisplay.baseTotalLabel} ${formatMoney(priceDisplay.baseTotalAmount, currency)}`
  }

  if (priceDisplay.baseAmount == null) return undefined
  return `${priceDisplay.baseLabel} ${formatMoney(priceDisplay.baseAmount, currency)} ${formatPriceQualifier(priceDisplay.baseQualifier)}`.trim()
}

const buildSecondaryPrice = (priceDisplay: PriceDisplayContract, currency: string) => {
  if (priceDisplay.baseAmount == null) return ''
  return `${priceDisplay.baseLabel} ${formatMoney(priceDisplay.baseAmount, currency)} ${formatPriceQualifier(priceDisplay.baseQualifier)}`.trim()
}

const formatAvailabilityLabel = (confidence: AvailabilityConfidenceModel | undefined) => {
  if (!confidence) return 'Check availability'
  const detail = String(confidence.detailLabel || '').trim()
  return detail ? `${confidence.label} · ${detail}` : confidence.label
}

const titleCaseFlightToken = (value: string) => {
  return String(value || '')
    .split('-')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

const formatFlightDate = (value: string | undefined) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || ''
  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10))
  const date = new Date(Date.UTC(year, month - 1, day))

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

const toOptionalDate = (value: string | null | undefined) => {
  const text = String(value || '').trim()
  return text || undefined
}

const toPickupDateTime = (
  value: string | null | undefined,
  fallbackDate?: string | null | undefined,
) => {
  const date = toOptionalDate(value) || toOptionalDate(fallbackDate) || '1970-01-01'
  return `${date}T10:00`
}
