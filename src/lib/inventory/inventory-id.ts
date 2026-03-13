export type InventoryVertical = 'flight' | 'hotel' | 'car'

export type FlightInventoryIdInput = {
  airlineCode: string
  flightNumber: string
  departDate: string
  originCode: string
  destinationCode: string
}

export type HotelInventoryIdInput = {
  hotelId: string | number
  checkInDate: string
  checkOutDate: string
  roomType?: string | null
  occupancy?: string | number | null
}

export type CarInventoryIdInput = {
  providerLocationId: string | number
  pickupDateTime: string
  dropoffDateTime: string
  vehicleClass?: string | null
}

export type ParsedFlightInventoryId = {
  vertical: 'flight'
  inventoryId: string
  airlineCode: string
  flightNumber: string
  departDate: string
  originCode: string
  destinationCode: string
}

export type ParsedHotelInventoryId = {
  vertical: 'hotel'
  inventoryId: string
  hotelId: string
  checkInDate: string
  checkOutDate: string
  roomType: string
  occupancy: string
}

export type ParsedCarInventoryId = {
  vertical: 'car'
  inventoryId: string
  providerLocationId: string
  pickupDateTime: string
  dropoffDateTime: string
  vehicleClass: string
}

export type ParsedInventoryId =
  | ParsedFlightInventoryId
  | ParsedHotelInventoryId
  | ParsedCarInventoryId

const normalizeToken = (value: string | number | null | undefined) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '') || 'unknown'

const normalizeCode = (value: string | null | undefined) =>
  String(value ?? '')
    .trim()
    .toUpperCase() || 'UNKNOWN'

const normalizeFlightNumber = (value: string | null | undefined) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replaceAll(/\s+/g, '') || 'UNKNOWN'

const normalizeDate = (value: string | null | undefined, fallback: string) => {
  const text = String(value ?? '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : fallback
}

const normalizeDateTime = (value: string | null | undefined, fallback: string) => {
  const text = String(value ?? '').trim()
  if (!text) return fallback

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return fallback
  return text
}

const encodePart = (value: string) => encodeURIComponent(value)

const decodePart = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export const buildFlightInventoryId = (input: FlightInventoryIdInput) => {
  const airlineCode = normalizeCode(input.airlineCode)
  const flightNumber = normalizeFlightNumber(input.flightNumber)
  const departDate = normalizeDate(input.departDate, '1970-01-01')
  const originCode = normalizeCode(input.originCode)
  const destinationCode = normalizeCode(input.destinationCode)

  return [
    'flight',
    airlineCode,
    flightNumber,
    departDate,
    originCode,
    destinationCode,
  ].map(encodePart).join(':')
}

export const buildHotelInventoryId = (input: HotelInventoryIdInput) => {
  const hotelId = normalizeToken(input.hotelId)
  const checkInDate = normalizeDate(input.checkInDate, '1970-01-01')
  const checkOutDate = normalizeDate(input.checkOutDate, checkInDate)
  const roomType = normalizeToken(input.roomType || 'standard')
  const occupancy = normalizeToken(input.occupancy || '2')

  return [
    'hotel',
    hotelId,
    checkInDate,
    checkOutDate,
    roomType,
    occupancy,
  ].map(encodePart).join(':')
}

export const buildCarInventoryId = (input: CarInventoryIdInput) => {
  const providerLocationId = normalizeToken(input.providerLocationId)
  const pickupDateTime = normalizeDateTime(input.pickupDateTime, '1970-01-01T00:00')
  const dropoffDateTime = normalizeDateTime(input.dropoffDateTime, pickupDateTime)
  const vehicleClass = normalizeToken(input.vehicleClass || 'standard')

  return [
    'car',
    providerLocationId,
    pickupDateTime,
    dropoffDateTime,
    vehicleClass,
  ].map(encodePart).join(':')
}

export const parseInventoryId = (value: string | null | undefined): ParsedInventoryId | null => {
  const inventoryId = String(value ?? '').trim()
  if (!inventoryId) return null

  const parts = inventoryId.split(':').map(decodePart)
  const [vertical, ...rest] = parts

  if (vertical === 'flight' && rest.length === 5) {
    const [airlineCode, flightNumber, departDate, originCode, destinationCode] = rest
    return {
      vertical,
      inventoryId,
      airlineCode,
      flightNumber,
      departDate,
      originCode,
      destinationCode,
    }
  }

  if (vertical === 'hotel' && rest.length === 5) {
    const [hotelId, checkInDate, checkOutDate, roomType, occupancy] = rest
    return {
      vertical,
      inventoryId,
      hotelId,
      checkInDate,
      checkOutDate,
      roomType,
      occupancy,
    }
  }

  if (vertical === 'car' && rest.length >= 4) {
    const providerLocationId = rest[0]
    const vehicleClass = rest.at(-1) || 'standard'
    const dateTimeParts = rest.slice(1, -1)

    let pickupDateTime = dateTimeParts[0] || '1970-01-01T00:00'
    let dropoffDateTime = dateTimeParts[1] || pickupDateTime

    if (dateTimeParts.length === 4) {
      pickupDateTime = `${dateTimeParts[0]}:${dateTimeParts[1]}`
      dropoffDateTime = `${dateTimeParts[2]}:${dateTimeParts[3]}`
    } else if (dateTimeParts.length > 2) {
      const midpoint = Math.ceil(dateTimeParts.length / 2)
      pickupDateTime = dateTimeParts.slice(0, midpoint).join(':')
      dropoffDateTime = dateTimeParts.slice(midpoint).join(':')
    }

    return {
      vertical,
      inventoryId,
      providerLocationId,
      pickupDateTime,
      dropoffDateTime,
      vehicleClass,
    }
  }

  return null
}
