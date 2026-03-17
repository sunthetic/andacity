import { toFlightSearchEntity } from '~/lib/search/search-entity'
import type { SearchParams } from '~/types/search'
import type { FlightSearchEntity } from '~/types/search-entity'
import type {
  FlightPolicySummary,
  FlightProviderMetadata,
  FlightSegmentSummary,
} from '~/types/flights/provider'
import { FLIGHT_PROVIDER_NAME } from './constants.ts'
import type { FlightProviderRawOffer } from './flightProviderClient.ts'

type NormalizeFlightSearchResultOptions = {
  providerName?: string
  departDate?: string | null
  canonicalFlightNumber?: string | number | null
  snapshotTimestamp?: string | null
}

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toFiniteInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed)
}

const formatDuration = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.round(Number(minutes || 0)))
  const hours = Math.floor(safeMinutes / 60)
  const remainingMinutes = safeMinutes % 60
  return `${hours}h ${remainingMinutes}m`
}

const cloneFlightSegments = (
  segments: FlightSegmentSummary[] | null | undefined,
): FlightSegmentSummary[] | null => {
  if (!Array.isArray(segments)) return null
  return segments.map((segment) => ({ ...segment }))
}

export const buildFlightProviderPolicy = (
  offer: Pick<
    FlightProviderRawOffer,
    'refundable' | 'changeable' | 'checkedBagsIncluded' | 'seatsRemaining'
  >,
): FlightPolicySummary => ({
  refundable: offer.refundable ?? null,
  changeable: offer.changeable ?? null,
  checkedBagsIncluded: toFiniteInteger(offer.checkedBagsIncluded),
  seatsRemaining: toFiniteInteger(offer.seatsRemaining),
})

export const buildFlightProviderMetadata = (
  offer: Pick<FlightProviderRawOffer, 'itineraryType' | 'requestedServiceDate' | 'serviceDate'>,
  providerName = FLIGHT_PROVIDER_NAME,
): FlightProviderMetadata => ({
  providerName,
  itineraryType: offer.itineraryType || null,
  requestedServiceDate: toNullableText(offer.requestedServiceDate),
  serviceDate: toNullableText(offer.serviceDate),
})

export const normalizeFlightSearchResult = (
  offer: FlightProviderRawOffer,
  params: SearchParams,
  options: NormalizeFlightSearchResultOptions = {},
): FlightSearchEntity | null => {
  try {
    const normalizedDepartDate =
      toNullableText(options.departDate) ??
      toNullableText(params.departDate) ??
      toNullableText(offer.requestedServiceDate) ??
      toNullableText(offer.serviceDate)
    const flightNumber = toNullableText(offer.flightNumber)

    const entity = toFlightSearchEntity(
      {
        itineraryId: offer.itineraryId,
        airline: offer.airlineName,
        airlineCode: offer.airlineCode,
        flightNumber,
        serviceDate: offer.serviceDate,
        requestedServiceDate: offer.requestedServiceDate,
        origin: offer.originCode,
        destination: offer.destinationCode,
        originCode: offer.originCode,
        destinationCode: offer.destinationCode,
        stops: offer.stops,
        duration: formatDuration(offer.durationMinutes),
        cabinClass: offer.cabinClass,
        fareCode: offer.fareCode,
        price: Number((offer.priceAmountCents / 100).toFixed(2)),
        currency: offer.currencyCode,
      },
      {
        departDate: normalizedDepartDate,
        canonicalFlightNumber:
          toNullableText(options.canonicalFlightNumber) ??
          (flightNumber ? null : offer.itineraryId > 0 ? String(offer.itineraryId) : null),
        priceAmountCents: offer.priceAmountCents,
        snapshotTimestamp:
          toNullableText(options.snapshotTimestamp) ??
          toNullableText(offer.freshnessTimestamp),
        durationMinutes: offer.durationMinutes,
      },
    )

    return {
      ...entity,
      payload: {
        ...entity.payload,
        departureAt: toNullableText(offer.departureAt),
        arrivalAt: toNullableText(offer.arrivalAt),
        itineraryType: offer.itineraryType || null,
        policy: buildFlightProviderPolicy(offer),
        segments: cloneFlightSegments(offer.segments),
        providerMetadata: buildFlightProviderMetadata(
          {
            itineraryType: offer.itineraryType,
            requestedServiceDate:
              toNullableText(normalizedDepartDate) ??
              toNullableText(offer.requestedServiceDate),
            serviceDate: offer.serviceDate,
          },
          options.providerName || FLIGHT_PROVIDER_NAME,
        ),
      },
    }
  } catch {
    return null
  }
}
