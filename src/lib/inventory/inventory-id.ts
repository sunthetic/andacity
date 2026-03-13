export type InventoryVertical = 'flight' | 'hotel' | 'car'

export class InventoryIdValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InventoryIdValidationError'
  }
}

export type BuildFlightInventoryIdInput = {
  carrier?: string
  airlineCode?: string
  flightNumber: string | number
  departDate: string
  origin?: string
  originCode?: string
  destination?: string
  destinationCode?: string
}

export type BuildHotelInventoryIdInput = {
  hotelId: string | number
  checkInDate: string
  checkOutDate: string
  roomType: string
  occupancy: string | number
  provider?: string | null
  providerOfferId?: string | null
  ratePlanId?: string | null
  ratePlan?: string | null
  boardType?: string | null
  cancellationPolicy?: string | null
}

export type BuildCarInventoryIdInput = {
  providerLocationId: string | number
  pickupDateTime: string
  dropoffDateTime: string
  vehicleClass: string
}

export type FlightInventoryIdInput = BuildFlightInventoryIdInput
export type HotelInventoryIdInput = BuildHotelInventoryIdInput
export type CarInventoryIdInput = BuildCarInventoryIdInput

type ParsedInventoryBase<TVertical extends InventoryVertical> = {
  vertical: TVertical
  raw: string
  inventoryId: string
}

export type ParsedFlightInventoryId = ParsedInventoryBase<'flight'> & {
  carrier: string
  airlineCode: string
  flightNumber: string
  departDate: string
  origin: string
  originCode: string
  destination: string
  destinationCode: string
}

export type ParsedHotelInventoryId = ParsedInventoryBase<'hotel'> & {
  hotelId: string
  checkInDate: string
  checkOutDate: string
  roomType: string
  occupancy: number
  provider: string | null
  providerOfferId: string | null
  ratePlanId: string | null
  boardType: string | null
  cancellationPolicy: string | null
  variantToken: string | null
  isProviderScoped: boolean
}

export type ParsedCarInventoryId = ParsedInventoryBase<'car'> & {
  providerLocationId: string
  pickupDateTime: string
  dropoffDateTime: string
  vehicleClass: string
}

export type ParsedInventoryId =
  | ParsedFlightInventoryId
  | ParsedHotelInventoryId
  | ParsedCarInventoryId

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_DATETIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2})([:\-])(\d{2})(?:(:\d{2})(?:\.\d{1,3})?)?$/
const HOTEL_PROVIDER_VARIANT_VERSION = 'v1'
const HOTEL_PROVIDER_VARIANT_PART_SEPARATOR = '.'
const DEFAULT_HOTEL_RATE_PLAN_TOKEN = 'standard-rate'
const DEFAULT_HOTEL_BOARD_TOKEN = 'room-only'
const DEFAULT_HOTEL_CANCELLATION_TOKEN = 'standard-cancel'
const DEFAULT_HOTEL_OFFER_TOKEN = 'offer'

const toDisplayValue = (value: unknown) =>
  typeof value === 'string' ? JSON.stringify(value) : String(value)

const failValidation = (message: string): never => {
  throw new InventoryIdValidationError(message)
}

const requireValue = (value: unknown, fieldName: string) => {
  const text = String(value ?? '').trim()
  if (!text) {
    failValidation(`${fieldName} is required.`)
  }

  return text
}

const selectRequiredAlias = (
  fieldName: string,
  options: Array<string | number | null | undefined>,
): string => {
  for (const option of options) {
    const text = String(option ?? '').trim()
    if (text) return text
  }

  return failValidation(`${fieldName} is required.`)
}

const normalizeSlugSource = (value: string, fieldName: string) => {
  const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]+/g, ' ')
    .replace(/[_\s-]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!slug) {
    failValidation(`${fieldName} must contain at least one alphanumeric character.`)
  }

  return slug
}

const normalizeUpperToken = (value: string, fieldName: string) => {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[_\s-]+/g, '')
    .replace(/[^A-Z0-9]/g, '')

  if (!normalized) {
    failValidation(`${fieldName} must contain at least one alphanumeric character.`)
  }

  return normalized
}

const isValidDateParts = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const validateHourMinute = (hour: number, minute: number, fieldName: string) => {
  if (hour < 0 || hour > 23) {
    failValidation(`${fieldName} hour must be between 00 and 23.`)
  }

  if (minute < 0 || minute > 59) {
    failValidation(`${fieldName} minute must be between 00 and 59.`)
  }
}

const normalizePositiveIntegerToken = (value: string | number, fieldName: string) => {
  const text = requireValue(value, fieldName)
  if (!/^\d+$/.test(text)) {
    failValidation(`${fieldName} must be a positive integer.`)
  }

  const parsed = Number.parseInt(text, 10)
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    failValidation(`${fieldName} must be a positive integer.`)
  }

  return String(parsed)
}

export const normalizeInventoryToken = (value: string | number, fieldName = 'inventory token') =>
  normalizeSlugSource(requireValue(value, fieldName), fieldName)

export const normalizeProviderNameToken = (
  value: string | number,
  fieldName = 'provider',
) => normalizeInventoryToken(value, fieldName)

export const normalizeAirportCode = (value: string, fieldName = 'airport code') =>
  normalizeUpperToken(requireValue(value, fieldName), fieldName)

export const normalizeCarrierCode = (value: string, fieldName = 'carrier') =>
  normalizeUpperToken(requireValue(value, fieldName), fieldName)

export const normalizeFlightNumber = (
  value: string | number,
  fieldName = 'flight number',
) => {
  const normalized = requireValue(value, fieldName)
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '')

  if (!normalized) {
    failValidation(`${fieldName} must contain at least one alphanumeric character.`)
  }

  return normalized
}

export const normalizeDatePart = (value: string, fieldName = 'date') => {
  const text = requireValue(value, fieldName)
  const match = ISO_DATE_PATTERN.exec(text)
  if (!match) {
    failValidation(`${fieldName} must be an ISO date in YYYY-MM-DD format.`)
  }

  const [, yearText, monthText, dayText] = match as RegExpExecArray
  const year = Number.parseInt(yearText, 10)
  const month = Number.parseInt(monthText, 10)
  const day = Number.parseInt(dayText, 10)

  if (!isValidDateParts(year, month, day)) {
    failValidation(`${fieldName} must be a valid calendar date.`)
  }

  return `${yearText}-${monthText}-${dayText}`
}

export const normalizeDateTimePart = (value: string, fieldName = 'datetime') => {
  const text = requireValue(value, fieldName)
  const match = ISO_DATETIME_PATTERN.exec(text)
  if (!match) {
    failValidation(
      `${fieldName} must be an ISO-like datetime in YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH-mm format.`,
    )
  }

  const [, yearText, monthText, dayText, hourText, , minuteText, secondsText] =
    match as RegExpExecArray
  const year = Number.parseInt(yearText, 10)
  const month = Number.parseInt(monthText, 10)
  const day = Number.parseInt(dayText, 10)
  const hour = Number.parseInt(hourText, 10)
  const minute = Number.parseInt(minuteText, 10)

  if (!isValidDateParts(year, month, day)) {
    failValidation(`${fieldName} must contain a valid calendar date.`)
  }

  validateHourMinute(hour, minute, fieldName)

  if (secondsText && secondsText !== ':00') {
    failValidation(
      `${fieldName} must not include non-zero seconds because canonical inventory IDs store minute precision only.`,
    )
  }

  return `${yearText}-${monthText}-${dayText}T${hourText}-${minuteText}`
}

const buildParsedBase = <TVertical extends InventoryVertical>(
  vertical: TVertical,
  raw: string,
): ParsedInventoryBase<TVertical> => ({
  vertical,
  raw,
  inventoryId: raw,
})

const validateCanonicalSegment = (
  rawSegment: string,
  normalize: (value: string) => string,
  fieldName: string,
) => {
  const canonical = normalize(rawSegment)
  if (canonical !== rawSegment) {
    failValidation(`${fieldName} segment is not canonical: ${toDisplayValue(rawSegment)}.`)
  }

  return rawSegment
}

const parseFlightInventoryId = (raw: string, segments: string[]): ParsedFlightInventoryId | null => {
  if (segments.length !== 6) return null

  try {
    const [, rawCarrier, rawFlightNumber, rawDepartDate, rawOrigin, rawDestination] = segments
    const carrier = validateCanonicalSegment(
      rawCarrier,
      (value) => normalizeCarrierCode(value, 'carrier'),
      'carrier',
    )
    const flightNumber = validateCanonicalSegment(
      rawFlightNumber,
      (value) => normalizeFlightNumber(value, 'flight number'),
      'flight number',
    )
    const departDate = validateCanonicalSegment(
      rawDepartDate,
      (value) => normalizeDatePart(value, 'depart date'),
      'depart date',
    )
    const origin = validateCanonicalSegment(
      rawOrigin,
      (value) => normalizeAirportCode(value, 'origin'),
      'origin',
    )
    const destination = validateCanonicalSegment(
      rawDestination,
      (value) => normalizeAirportCode(value, 'destination'),
      'destination',
    )

    return {
      ...buildParsedBase('flight', raw),
      carrier,
      airlineCode: carrier,
      flightNumber,
      departDate,
      origin,
      originCode: origin,
      destination,
      destinationCode: destination,
    }
  } catch (error) {
    if (error instanceof InventoryIdValidationError) {
      return null
    }

    throw error
  }
}

const parseHotelInventoryId = (raw: string, segments: string[]): ParsedHotelInventoryId | null => {
  const parseLegacyHotelInventoryId = () => {
    if (segments.length !== 6) return null

    const [, rawHotelId, rawCheckInDate, rawCheckOutDate, rawRoomType, rawOccupancy] = segments
    const hotelId = validateCanonicalSegment(
      rawHotelId,
      (value) => normalizeInventoryToken(value, 'hotel token'),
      'hotel token',
    )
    const checkInDate = validateCanonicalSegment(
      rawCheckInDate,
      (value) => normalizeDatePart(value, 'check-in date'),
      'check-in date',
    )
    const checkOutDate = validateCanonicalSegment(
      rawCheckOutDate,
      (value) => normalizeDatePart(value, 'check-out date'),
      'check-out date',
    )
    const roomType = validateCanonicalSegment(
      rawRoomType,
      (value) => normalizeInventoryToken(value, 'room type'),
      'room type',
    )
    const occupancyToken = validateCanonicalSegment(
      rawOccupancy,
      (value) => normalizePositiveIntegerToken(value, 'occupancy'),
      'occupancy',
    )

    return {
      ...buildParsedBase('hotel', raw),
      hotelId,
      checkInDate,
      checkOutDate,
      roomType,
      occupancy: Number.parseInt(occupancyToken, 10),
      provider: null,
      providerOfferId: null,
      ratePlanId: null,
      boardType: null,
      cancellationPolicy: null,
      variantToken: null,
      isProviderScoped: false,
    } satisfies ParsedHotelInventoryId
  }

  const parseProviderScopedHotelInventoryId = () => {
    if (segments.length !== 3) return null

    const [, rawProvider, rawVariantToken] = segments
    const provider = validateCanonicalSegment(
      rawProvider,
      (value) => normalizeProviderNameToken(value, 'hotel provider'),
      'hotel provider',
    )

    const variantParts = rawVariantToken.split(HOTEL_PROVIDER_VARIANT_PART_SEPARATOR)
    if (variantParts.length !== 10) {
      return null
    }

    const [
      version,
      rawHotelId,
      rawCheckInDate,
      rawCheckOutDate,
      rawRoomType,
      rawOccupancy,
      rawRatePlanId,
      rawBoardType,
      rawCancellationPolicy,
      rawProviderOfferId,
    ] = variantParts

    if (version !== HOTEL_PROVIDER_VARIANT_VERSION) {
      return null
    }

    const hotelId = validateCanonicalSegment(
      rawHotelId,
      (value) => normalizeInventoryToken(value, 'hotel token'),
      'hotel token',
    )
    const checkInDate = validateCanonicalSegment(
      rawCheckInDate,
      (value) => normalizeDatePart(value, 'check-in date'),
      'check-in date',
    )
    const checkOutDate = validateCanonicalSegment(
      rawCheckOutDate,
      (value) => normalizeDatePart(value, 'check-out date'),
      'check-out date',
    )
    const roomType = validateCanonicalSegment(
      rawRoomType,
      (value) => normalizeInventoryToken(value, 'room type'),
      'room type',
    )
    const occupancyToken = validateCanonicalSegment(
      rawOccupancy,
      (value) => normalizePositiveIntegerToken(value, 'occupancy'),
      'occupancy',
    )
    const ratePlanId = validateCanonicalSegment(
      rawRatePlanId,
      (value) => normalizeInventoryToken(value, 'rate plan'),
      'rate plan',
    )
    const boardType = validateCanonicalSegment(
      rawBoardType,
      (value) => normalizeInventoryToken(value, 'board type'),
      'board type',
    )
    const cancellationPolicy = validateCanonicalSegment(
      rawCancellationPolicy,
      (value) => normalizeInventoryToken(value, 'cancellation policy'),
      'cancellation policy',
    )
    const providerOfferId = validateCanonicalSegment(
      rawProviderOfferId,
      (value) => normalizeInventoryToken(value, 'provider offer'),
      'provider offer',
    )

    const canonicalVariantToken = [
      HOTEL_PROVIDER_VARIANT_VERSION,
      hotelId,
      checkInDate,
      checkOutDate,
      roomType,
      occupancyToken,
      ratePlanId,
      boardType,
      cancellationPolicy,
      providerOfferId,
    ].join(HOTEL_PROVIDER_VARIANT_PART_SEPARATOR)

    if (canonicalVariantToken !== rawVariantToken) {
      return null
    }

    return {
      ...buildParsedBase('hotel', raw),
      hotelId,
      checkInDate,
      checkOutDate,
      roomType,
      occupancy: Number.parseInt(occupancyToken, 10),
      provider,
      providerOfferId,
      ratePlanId,
      boardType,
      cancellationPolicy,
      variantToken: canonicalVariantToken,
      isProviderScoped: true,
    } satisfies ParsedHotelInventoryId
  }

  try {
    return parseLegacyHotelInventoryId() || parseProviderScopedHotelInventoryId()
  } catch (error) {
    if (error instanceof InventoryIdValidationError) {
      return null
    }

    throw error
  }
}

const parseCarInventoryId = (raw: string, segments: string[]): ParsedCarInventoryId | null => {
  if (segments.length !== 5) return null

  try {
    const [, rawProviderLocationId, rawPickupDateTime, rawDropoffDateTime, rawVehicleClass] = segments
    const providerLocationId = validateCanonicalSegment(
      rawProviderLocationId,
      (value) => normalizeInventoryToken(value, 'provider location'),
      'provider location',
    )
    const pickupDateTime = validateCanonicalSegment(
      rawPickupDateTime,
      (value) => normalizeDateTimePart(value, 'pickup datetime'),
      'pickup datetime',
    )
    const dropoffDateTime = validateCanonicalSegment(
      rawDropoffDateTime,
      (value) => normalizeDateTimePart(value, 'dropoff datetime'),
      'dropoff datetime',
    )
    const vehicleClass = validateCanonicalSegment(
      rawVehicleClass,
      (value) => normalizeInventoryToken(value, 'vehicle class'),
      'vehicle class',
    )

    return {
      ...buildParsedBase('car', raw),
      providerLocationId,
      pickupDateTime,
      dropoffDateTime,
      vehicleClass,
    }
  } catch (error) {
    if (error instanceof InventoryIdValidationError) {
      return null
    }

    throw error
  }
}

export const buildFlightInventoryId = (input: BuildFlightInventoryIdInput) => {
  const carrier = normalizeCarrierCode(
    selectRequiredAlias('carrier', [input.carrier, input.airlineCode]),
  )
  const flightNumber = normalizeFlightNumber(input.flightNumber)
  const departDate = normalizeDatePart(input.departDate, 'depart date')
  const origin = normalizeAirportCode(
    selectRequiredAlias('origin', [input.origin, input.originCode]),
    'origin',
  )
  const destination = normalizeAirportCode(
    selectRequiredAlias('destination', [input.destination, input.destinationCode]),
    'destination',
  )

  return ['flight', carrier, flightNumber, departDate, origin, destination].join(':')
}

export const buildHotelInventoryId = (input: BuildHotelInventoryIdInput) => {
  const hotelId = normalizeInventoryToken(input.hotelId, 'hotel token')
  const checkInDate = normalizeDatePart(input.checkInDate, 'check-in date')
  const checkOutDate = normalizeDatePart(input.checkOutDate, 'check-out date')
  const roomType = normalizeInventoryToken(input.roomType, 'room type')
  const occupancy = normalizePositiveIntegerToken(input.occupancy, 'occupancy')

  const provider = String(input.provider || '').trim()
  if (provider) {
    const providerToken = normalizeProviderNameToken(provider, 'hotel provider')
    const ratePlanId = normalizeInventoryToken(
      input.ratePlanId || input.ratePlan || DEFAULT_HOTEL_RATE_PLAN_TOKEN,
      'rate plan',
    )
    const boardType = normalizeInventoryToken(
      input.boardType || DEFAULT_HOTEL_BOARD_TOKEN,
      'board type',
    )
    const cancellationPolicy = normalizeInventoryToken(
      input.cancellationPolicy || DEFAULT_HOTEL_CANCELLATION_TOKEN,
      'cancellation policy',
    )
    const providerOfferId = normalizeInventoryToken(
      input.providerOfferId || input.ratePlanId || input.ratePlan || DEFAULT_HOTEL_OFFER_TOKEN,
      'provider offer',
    )

    const variantToken = [
      HOTEL_PROVIDER_VARIANT_VERSION,
      hotelId,
      checkInDate,
      checkOutDate,
      roomType,
      occupancy,
      ratePlanId,
      boardType,
      cancellationPolicy,
      providerOfferId,
    ].join(HOTEL_PROVIDER_VARIANT_PART_SEPARATOR)

    return ['hotel', providerToken, variantToken].join(':')
  }

  return ['hotel', hotelId, checkInDate, checkOutDate, roomType, occupancy].join(':')
}

export const buildCarInventoryId = (input: BuildCarInventoryIdInput) => {
  const providerLocationId = normalizeInventoryToken(
    input.providerLocationId,
    'provider location',
  )
  const pickupDateTime = normalizeDateTimePart(input.pickupDateTime, 'pickup datetime')
  const dropoffDateTime = normalizeDateTimePart(input.dropoffDateTime, 'dropoff datetime')
  const vehicleClass = normalizeInventoryToken(input.vehicleClass, 'vehicle class')

  return [
    'car',
    providerLocationId,
    pickupDateTime,
    dropoffDateTime,
    vehicleClass,
  ].join(':')
}

export const parseInventoryId = (value: string | null | undefined): ParsedInventoryId | null => {
  const raw = String(value ?? '').trim()
  if (!raw || /\s/.test(raw)) {
    return null
  }

  const segments = raw.split(':')
  const vertical = segments[0]

  if (vertical === 'flight') {
    return parseFlightInventoryId(raw, segments)
  }

  if (vertical === 'hotel') {
    return parseHotelInventoryId(raw, segments)
  }

  if (vertical === 'car') {
    return parseCarInventoryId(raw, segments)
  }

  return null
}

export const isInventoryId = (value: unknown): value is string =>
  typeof value === 'string' && parseInventoryId(value) !== null
