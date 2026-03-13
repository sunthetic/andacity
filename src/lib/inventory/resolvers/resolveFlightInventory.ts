import type { ParsedFlightInventoryId } from '~/lib/inventory/inventory-id'
import {
  defaultFlightProviderClient,
} from '~/lib/providers/flight/flightProviderClient'
import { FLIGHT_PROVIDER_NAME } from '~/lib/providers/flight/constants'
import { normalizeFlightInventory } from '~/lib/providers/flight/normalizeFlightInventory'
import type { InventoryProviderResolverInput, ResolvedInventoryRecord } from '~/types/inventory'

export const resolveFlightInventory = async (
  input: InventoryProviderResolverInput<ParsedFlightInventoryId>,
): Promise<ResolvedInventoryRecord | null> => {
  try {
    const response = await defaultFlightProviderClient.resolveInventory({
      parsedInventory: input.parsedInventory,
      providerInventoryId: input.providerInventoryId,
    })
    if (!response) return null

    const entity = normalizeFlightInventory(response, input.inventoryId, {
      providerName: FLIGHT_PROVIDER_NAME,
      snapshotTimestamp: input.checkedAt,
    })
    if (!entity) return null

    return {
      entity,
      checkedAt: input.checkedAt,
      isAvailable: response.seatsRemaining == null ? true : response.seatsRemaining > 0,
    }
  } catch {
    return null
  }
}
