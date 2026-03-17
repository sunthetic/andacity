import type { ParsedInventoryId } from '~/lib/inventory/inventory-id'
import { resolveCarInventory } from '~/lib/inventory/resolvers/resolveCarInventory'
import { resolveFlightInventory } from '~/lib/inventory/resolvers/resolveFlightInventory'
import { resolveHotelInventory } from '~/lib/inventory/resolvers/resolveHotelInventory'
import { getProvider } from '~/lib/providers/providerRegistry'
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

const normalizeProviderName = (value: string | null | undefined) =>
  String(value || '').trim().toLowerCase()

const readParsedInventoryProvider = (parsedInventory: ParsedInventoryId) => {
  if (parsedInventory.vertical === 'hotel') {
    return parsedInventory.provider
  }

  return null
}

const resolveWithResolverOverride = async (
  input: ResolveInventoryRecordInput & {
    parsedInventory: ParsedInventoryId
    checkedAt: string
    resolvers?: Partial<InventoryProviderResolvers>
  },
): Promise<{
  matched: boolean
  result: ResolvedInventoryRecord | null
}> => {
  try {
    if (input.parsedInventory.vertical === 'hotel' && input.resolvers?.hotel) {
      return {
        matched: true,
        result: await input.resolvers.hotel({
          inventoryId: input.inventoryId,
          parsedInventory: input.parsedInventory,
          providerInventoryId: input.providerInventoryId,
          checkedAt: input.checkedAt,
        }),
      }
    }

    if (input.parsedInventory.vertical === 'flight' && input.resolvers?.flight) {
      return {
        matched: true,
        result: await input.resolvers.flight({
          inventoryId: input.inventoryId,
          parsedInventory: input.parsedInventory,
          providerInventoryId: input.providerInventoryId,
          checkedAt: input.checkedAt,
        }),
      }
    }

    if (input.parsedInventory.vertical === 'car' && input.resolvers?.car) {
      return {
        matched: true,
        result: await input.resolvers.car({
          inventoryId: input.inventoryId,
          parsedInventory: input.parsedInventory,
          providerInventoryId: input.providerInventoryId,
          checkedAt: input.checkedAt,
        }),
      }
    }

    return {
      matched: false,
      result: null,
    }
  } catch {
    return {
      matched: true,
      result: null,
    }
  }
}

const resolveWithRegisteredProvider = async (
  input: ResolveInventoryRecordInput & {
    parsedInventory: ParsedInventoryId
    checkedAt: string
  },
): Promise<{
  matched: boolean
  result: ResolvedInventoryRecord | null
}> => {
  const requestedProvider = normalizeProviderName(input.provider)
  const parsedInventoryProvider = normalizeProviderName(
    readParsedInventoryProvider(input.parsedInventory),
  )
  const provider = getProvider(
    requestedProvider || parsedInventoryProvider || input.parsedInventory.vertical,
  )

  if (!provider) {
    return {
      matched: false,
      result: null,
    }
  }

  try {
    if (provider.resolveInventoryRecord) {
      return {
        matched: true,
        result: await provider.resolveInventoryRecord({
          inventoryId: input.inventoryId,
          providerInventoryId: input.providerInventoryId,
          checkedAt: input.checkedAt,
        }),
      }
    }

    const entity = await provider.resolveInventory(input.inventoryId)
    return {
      matched: true,
      result: entity
        ? {
            entity,
            checkedAt: input.checkedAt,
            isAvailable: null,
          }
        : null,
    }
  } catch {
    return {
      matched: true,
      result: null,
    }
  }
}

export const resolveInventoryViaProvider = async (
  input: ResolveInventoryRecordInput & {
    parsedInventory: ParsedInventoryId
    checkedAt: string
    resolvers?: Partial<InventoryProviderResolvers>
  },
): Promise<ResolvedInventoryRecord | null> => {
  const override = await resolveWithResolverOverride(input)
  if (override.matched) {
    return override.result
  }

  const registeredProvider = await resolveWithRegisteredProvider(input)
  if (registeredProvider.matched) {
    return registeredProvider.result
  }

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
