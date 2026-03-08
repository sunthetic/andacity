import { searchFlights } from '~/lib/repos/flights-repo.server'
import { findTopTravelCity } from '~/seed/cities/top-100.js'
import type { FlightCabinClass, FlightResult, FlightTimeWindow } from '~/types/flights/search'

const toClock = (totalMinutes: number) => {
  const minutes = ((Math.round(totalMinutes) % 1440) + 1440) % 1440
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

const toStopsLabel = (stops: number) => {
  if (stops <= 0) return 'Nonstop'
  if (stops === 1) return '1 stop'
  return '2+ stops'
}

const clampStops = (stops: number): 0 | 1 | 2 => {
  if (stops <= 0) return 0
  if (stops === 1) return 1
  return 2
}

const toPriceAmount = (cents: number) => Math.max(0, Math.round(Number(cents || 0) / 100))

export type LoadFlightResultsInput = {
  fromLocationSlug: string
  toLocationSlug: string
  itineraryType: 'one-way' | 'round-trip'
  departDate?: string
}

export async function loadFlightResultsFromDb(
  input: LoadFlightResultsInput,
): Promise<FlightResult[]> {
  const fromCity = findTopTravelCity(input.fromLocationSlug)
  const toCity = findTopTravelCity(input.toLocationSlug)
  if (!fromCity || !toCity) return []

  const originIata = fromCity.airportCodes[0]
  const destinationIata = toCity.airportCodes[0]
  if (!originIata || !destinationIata) return []

  const rows = await searchFlights({
    originIata,
    destinationIata,
    serviceDate: input.departDate,
    itineraryType: input.itineraryType,
    limit: 240,
    offset: 0,
  })

  return rows.map((row) => {
    const stops = clampStops(Number(row.stops))

    return {
      id: row.seedKey || `flight-${row.id}`,
      airline: row.airline,
      origin: `${fromCity.name} (${row.originIata})`,
      destination: `${toCity.name} (${row.destinationIata})`,
      departureTime: toClock(row.departureMinutes),
      arrivalTime: toClock(row.arrivalMinutes),
      departureMinutes: row.departureMinutes,
      arrivalMinutes: row.arrivalMinutes,
      departureWindow: row.departureWindow as FlightTimeWindow,
      arrivalWindow: row.arrivalWindow as FlightTimeWindow,
      stops,
      stopsLabel: toStopsLabel(stops),
      duration: formatDuration(row.durationMinutes),
      cabinClass: row.cabinClass as FlightCabinClass,
      price: toPriceAmount(row.priceCents),
      currency: row.currencyCode,
    }
  })
}
