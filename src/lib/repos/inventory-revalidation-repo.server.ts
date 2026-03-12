import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '~/lib/db/client.server'
import {
  carInventory,
  flightFares,
  flightItineraries,
  hotelAvailabilitySnapshots,
} from '~/lib/db/schema'

export type InventoryRevalidationItemType = 'hotel' | 'car' | 'flight'

export type InventoryRevalidationResult = {
  itemType: InventoryRevalidationItemType
  checkedAt: string
  revalidatedCount: number
  missingIds: number[]
}

const normalizeInventoryIds = (ids: number[]) =>
  Array.from(
    new Set(
      ids
        .map((value) => Number.parseInt(String(value), 10))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  )

export async function revalidateInventoryFreshness(input: {
  itemType: InventoryRevalidationItemType
  inventoryIds: number[]
}): Promise<InventoryRevalidationResult> {
  const inventoryIds = normalizeInventoryIds(input.inventoryIds)
  if (!inventoryIds.length) {
    return {
      itemType: input.itemType,
      checkedAt: new Date().toISOString(),
      revalidatedCount: 0,
      missingIds: [],
    }
  }

  const checkedAtDate = new Date()
  const checkedAt = checkedAtDate.toISOString()
  const db = getDb()

  if (input.itemType === 'hotel') {
    const updatedRows = await db
      .update(hotelAvailabilitySnapshots)
      .set({
        snapshotAt: checkedAtDate,
      })
      .where(
        and(
          inArray(hotelAvailabilitySnapshots.hotelId, inventoryIds),
          eq(hotelAvailabilitySnapshots.snapshotSource, 'seed'),
        ),
      )
      .returning({
        inventoryId: hotelAvailabilitySnapshots.hotelId,
      })

    const foundIds = new Set(updatedRows.map((row) => row.inventoryId))

    return {
      itemType: input.itemType,
      checkedAt,
      revalidatedCount: foundIds.size,
      missingIds: inventoryIds.filter((id) => !foundIds.has(id)),
    }
  }

  if (input.itemType === 'car') {
    const updatedRows = await db
      .update(carInventory)
      .set({
        updatedAt: checkedAtDate,
      })
      .where(inArray(carInventory.id, inventoryIds))
      .returning({
        inventoryId: carInventory.id,
      })

    const foundIds = new Set(updatedRows.map((row) => row.inventoryId))

    return {
      itemType: input.itemType,
      checkedAt,
      revalidatedCount: foundIds.size,
      missingIds: inventoryIds.filter((id) => !foundIds.has(id)),
    }
  }

  const updatedItineraries = await db
    .update(flightItineraries)
    .set({
      updatedAt: checkedAtDate,
    })
    .where(inArray(flightItineraries.id, inventoryIds))
    .returning({
      inventoryId: flightItineraries.id,
    })

  const foundIds = Array.from(
    new Set(updatedItineraries.map((row) => row.inventoryId)),
  )

  if (foundIds.length) {
    await db
      .update(flightFares)
      .set({
        updatedAt: checkedAtDate,
      })
      .where(inArray(flightFares.itineraryId, foundIds))
  }

  const foundIdSet = new Set(foundIds)

  return {
    itemType: input.itemType,
    checkedAt,
    revalidatedCount: foundIdSet.size,
    missingIds: inventoryIds.filter((id) => !foundIdSet.has(id)),
  }
}
