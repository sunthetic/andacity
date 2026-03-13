import { parseInventoryId } from '~/lib/inventory/inventory-id'

export type ResolvedFlightInventory = {
  vertical: 'flight'
  inventoryId: string
  providerQuery: {
    airlineCode: string
    flightNumber: string
    departDate: string
    originCode: string
    destinationCode: string
  }
}

export type ResolvedHotelInventory = {
  vertical: 'hotel'
  inventoryId: string
  providerQuery: {
    provider?: string | null
    hotelId: string
    checkInDate: string
    checkOutDate: string
    roomType: string
    occupancy: number
    providerOfferId?: string | null
    ratePlanId?: string | null
    boardType?: string | null
    cancellationPolicy?: string | null
  }
}

export type ResolvedCarInventory = {
  vertical: 'car'
  inventoryId: string
  providerQuery: {
    providerLocationId: string
    pickupDateTime: string
    dropoffDateTime: string
    vehicleClass: string
  }
}

export type ResolvedInventory =
  | ResolvedFlightInventory
  | ResolvedHotelInventory
  | ResolvedCarInventory

export const resolveInventory = (inventoryId: string): ResolvedInventory | null => {
  const parsed = parseInventoryId(inventoryId)
  if (!parsed) return null

  if (parsed.vertical === 'flight') {
    return {
      vertical: parsed.vertical,
      inventoryId: parsed.raw,
      providerQuery: {
        airlineCode: parsed.carrier,
        flightNumber: parsed.flightNumber,
        departDate: parsed.departDate,
        originCode: parsed.origin,
        destinationCode: parsed.destination,
      },
    }
  }

  if (parsed.vertical === 'hotel') {
    return {
      vertical: parsed.vertical,
      inventoryId: parsed.raw,
      providerQuery: {
        provider: parsed.provider,
        hotelId: parsed.hotelId,
        checkInDate: parsed.checkInDate,
        checkOutDate: parsed.checkOutDate,
        roomType: parsed.roomType,
        occupancy: parsed.occupancy,
        providerOfferId: parsed.providerOfferId,
        ratePlanId: parsed.ratePlanId,
        boardType: parsed.boardType,
        cancellationPolicy: parsed.cancellationPolicy,
      },
    }
  }

  return {
    vertical: parsed.vertical,
    inventoryId: parsed.raw,
    providerQuery: {
      providerLocationId: parsed.providerLocationId,
      pickupDateTime: parsed.pickupDateTime,
      dropoffDateTime: parsed.dropoffDateTime,
      vehicleClass: parsed.vehicleClass,
    },
  }
}
