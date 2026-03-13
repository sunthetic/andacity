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
    hotelId: string
    checkInDate: string
    checkOutDate: string
    roomType: string
    occupancy: string
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
      inventoryId: parsed.inventoryId,
      providerQuery: {
        airlineCode: parsed.airlineCode,
        flightNumber: parsed.flightNumber,
        departDate: parsed.departDate,
        originCode: parsed.originCode,
        destinationCode: parsed.destinationCode,
      },
    }
  }

  if (parsed.vertical === 'hotel') {
    return {
      vertical: parsed.vertical,
      inventoryId: parsed.inventoryId,
      providerQuery: {
        hotelId: parsed.hotelId,
        checkInDate: parsed.checkInDate,
        checkOutDate: parsed.checkOutDate,
        roomType: parsed.roomType,
        occupancy: parsed.occupancy,
      },
    }
  }

  return {
    vertical: parsed.vertical,
    inventoryId: parsed.inventoryId,
    providerQuery: {
      providerLocationId: parsed.providerLocationId,
      pickupDateTime: parsed.pickupDateTime,
      dropoffDateTime: parsed.dropoffDateTime,
      vehicleClass: parsed.vehicleClass,
    },
  }
}
