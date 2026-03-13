export const BOOKABLE_VERTICALS = ['flight', 'hotel', 'car'] as const
export type BookableVertical = (typeof BOOKABLE_VERTICALS)[number]

export const BOOKABLE_ENTITY_SOURCES = ['search', 'trip_item', 'saved_item'] as const
export type BookableEntitySource = (typeof BOOKABLE_ENTITY_SOURCES)[number]

export const BOOKABLE_PRICE_SOURCES = ['live', 'snapshot', 'display_only'] as const
export type BookablePriceSource = (typeof BOOKABLE_PRICE_SOURCES)[number]

export type BookableEntityPrice = {
  amountCents: number | null
  currency: string | null
  displayText?: string | null
}

export type BookableEntityBase<
  TVertical extends BookableVertical,
  TBookingContext extends Record<string, unknown>,
  TPayload extends Record<string, unknown>,
> = {
  inventoryId: string
  vertical: TVertical
  provider: string | null
  title: string
  subtitle: string | null
  imageUrl: string | null
  href: string | null
  snapshotTimestamp: string | null
  price: BookableEntityPrice
  bookingContext: TBookingContext
  payload: TPayload
}

export type FlightBookableEntityPayload = {
  source: BookableEntitySource
  priceSource: BookablePriceSource
  providerInventoryId: number | null
  cabinClass: string | null
  fareCode: string | null
}

export type HotelBookableEntityPayload = {
  source: BookableEntitySource
  priceSource: BookablePriceSource
  providerInventoryId: number | null
  hotelSlug: string | null
  assumedStayDates?: boolean
  assumedOccupancy?: boolean
}

export type CarBookableEntityPayload = {
  source: BookableEntitySource
  priceSource: BookablePriceSource
  providerInventoryId: number | null
  assumedRentalWindow?: boolean
}

export type FlightBookableEntity = BookableEntityBase<
  'flight',
  {
    carrier: string | null
    flightNumber: string | null
    origin: string | null
    destination: string | null
    departDate: string | null
  },
  FlightBookableEntityPayload
>

export type HotelBookableEntity = BookableEntityBase<
  'hotel',
  {
    hotelId: string | null
    checkInDate: string | null
    checkOutDate: string | null
    roomType: string | null
    occupancy: number | null
  },
  HotelBookableEntityPayload
>

export type CarBookableEntity = BookableEntityBase<
  'car',
  {
    providerLocationId: string | null
    pickupDateTime: string | null
    dropoffDateTime: string | null
    vehicleClass: string | null
  },
  CarBookableEntityPayload
>

export type BookableEntity =
  | FlightBookableEntity
  | HotelBookableEntity
  | CarBookableEntity
