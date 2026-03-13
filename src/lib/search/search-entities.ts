import {
  buildCarInventoryId,
  buildFlightInventoryId,
  buildHotelInventoryId,
} from '~/lib/inventory/inventory-id'
import type { BookableEntity } from '~/types/bookable-entity'
import type { SearchEntity } from '~/types/search-entity'

export type FlightSearchEntityPayload = {
  providerInventoryId: number
  airlineCode: string
  flightNumber: string
  departDate: string
  originCode: string
  destinationCode: string
  cabinClass?: string | null
  fareCode?: string | null
}

export type HotelSearchEntityPayload = {
  providerInventoryId: number
  hotelId: string
  hotelSlug: string
  checkInDate: string
  checkOutDate: string
  roomType: string
  occupancy: string
}

export type CarSearchEntityPayload = {
  providerInventoryId: number
  providerLocationId: string
  pickupDateTime: string
  dropoffDateTime: string
  vehicleClass: string
}

export const toBookableEntity = <TPayload>(
  entity: SearchEntity<TPayload>,
): BookableEntity<TPayload> => ({
  inventoryId: entity.inventoryId,
  vertical: entity.vertical,
  price: entity.price,
  currency: entity.currency,
  payload: entity.payload,
  provider: entity.provider,
})

export const buildFlightSearchEntity = (input: {
  providerInventoryId: number
  price: number
  currency: string
  provider: string
  snapshotTimestamp: string
  airlineCode: string
  flightNumber: string
  departDate: string
  originCode: string
  destinationCode: string
  cabinClass?: string | null
  fareCode?: string | null
}): SearchEntity<FlightSearchEntityPayload> => ({
  inventoryId: buildFlightInventoryId({
    airlineCode: input.airlineCode,
    flightNumber: input.flightNumber,
    departDate: input.departDate,
    originCode: input.originCode,
    destinationCode: input.destinationCode,
  }),
  vertical: 'flight',
  price: input.price,
  currency: input.currency,
  provider: input.provider,
  snapshotTimestamp: input.snapshotTimestamp,
  payload: {
    providerInventoryId: input.providerInventoryId,
    airlineCode: input.airlineCode,
    flightNumber: input.flightNumber,
    departDate: input.departDate,
    originCode: input.originCode,
    destinationCode: input.destinationCode,
    cabinClass: input.cabinClass,
    fareCode: input.fareCode,
  },
})

export const buildHotelSearchEntity = (input: {
  providerInventoryId: number
  price: number
  currency: string
  provider: string
  snapshotTimestamp: string
  hotelId: string | number
  hotelSlug: string
  checkInDate: string
  checkOutDate: string
  roomType?: string | null
  occupancy?: string | number | null
}): SearchEntity<HotelSearchEntityPayload> => {
  const roomType = String(input.roomType || 'standard').trim() || 'standard'
  const occupancy = String(input.occupancy || '2').trim() || '2'

  return {
    inventoryId: buildHotelInventoryId({
      hotelId: input.hotelId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      roomType,
      occupancy,
    }),
    vertical: 'hotel',
    price: input.price,
    currency: input.currency,
    provider: input.provider,
    snapshotTimestamp: input.snapshotTimestamp,
    payload: {
      providerInventoryId: input.providerInventoryId,
      hotelId: String(input.hotelId),
      hotelSlug: input.hotelSlug,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      roomType,
      occupancy,
    },
  }
}

export const buildCarSearchEntity = (input: {
  providerInventoryId: number
  price: number
  currency: string
  provider: string
  snapshotTimestamp: string
  providerLocationId: string | number
  pickupDateTime: string
  dropoffDateTime: string
  vehicleClass?: string | null
}): SearchEntity<CarSearchEntityPayload> => {
  const vehicleClass = String(input.vehicleClass || 'standard').trim() || 'standard'

  return {
    inventoryId: buildCarInventoryId({
      providerLocationId: input.providerLocationId,
      pickupDateTime: input.pickupDateTime,
      dropoffDateTime: input.dropoffDateTime,
      vehicleClass,
    }),
    vertical: 'car',
    price: input.price,
    currency: input.currency,
    provider: input.provider,
    snapshotTimestamp: input.snapshotTimestamp,
    payload: {
      providerInventoryId: input.providerInventoryId,
      providerLocationId: String(input.providerLocationId),
      pickupDateTime: input.pickupDateTime,
      dropoffDateTime: input.dropoffDateTime,
      vehicleClass,
    },
  }
}
