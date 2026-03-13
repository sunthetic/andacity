import type { ParsedInventoryId } from '~/lib/inventory/inventory-id'
import { resolveCarInventory } from '~/lib/inventory/resolvers/resolveCarInventory'
import { resolveFlightInventory } from '~/lib/inventory/resolvers/resolveFlightInventory'
import { resolveHotelInventory } from '~/lib/inventory/resolvers/resolveHotelInventory'
import type {
  InventoryProviderResolvers,
  ResolveInventoryRecordInput,
  ResolvedInventoryRecord,
} from '~/types/inventory'

export const DEFAULT_INVENTORY_PROVIDER_RESOLVERS: InventoryProviderResolvers = {
  hotel: resolveHotelInventory,
  flight: resolveFlightInventory,
  car: resolveCarInventory,
}

export const resolveInventoryViaProvider = async (
  input: ResolveInventoryRecordInput & {
    parsedInventory: ParsedInventoryId
    checkedAt: string
    resolvers?: Partial<InventoryProviderResolvers>
  },
): Promise<ResolvedInventoryRecord | null> => {
  const resolvers: InventoryProviderResolvers = {
    ...DEFAULT_INVENTORY_PROVIDER_RESOLVERS,
    ...input.resolvers,
  }

  try {
    if (input.parsedInventory.vertical === 'hotel') {
      return await resolvers.hotel({
        inventoryId: input.inventoryId,
        parsedInventory: input.parsedInventory,
        providerInventoryId: input.providerInventoryId,
        checkedAt: input.checkedAt,
      })
    }

    if (input.parsedInventory.vertical === 'flight') {
      return await resolvers.flight({
        inventoryId: input.inventoryId,
        parsedInventory: input.parsedInventory,
        providerInventoryId: input.providerInventoryId,
        checkedAt: input.checkedAt,
      })
    }

    return await resolvers.car({
      inventoryId: input.inventoryId,
      parsedInventory: input.parsedInventory,
      providerInventoryId: input.providerInventoryId,
      checkedAt: input.checkedAt,
    })
  } catch {
    return null
  }
}
