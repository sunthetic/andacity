import { parseInventoryId } from '~/lib/inventory/inventory-id'
import { resolveInventoryViaProvider } from '~/lib/inventory/providerResolver'
import { validateSnapshot } from '~/lib/inventory/validateSnapshot'
import type {
  InventoryProviderResolvers,
  ResolveInventoryRecordInput,
  ResolveInventoryWithSnapshotInput,
  ResolvedInventoryRecord,
  InventoryResolution,
} from '~/types/inventory'
import type { BookableEntity } from '~/types/bookable-entity'

const normalizeResolutionTimestamp = (value: string | Date | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

export const resolveInventoryRecord = async (
  input: ResolveInventoryRecordInput,
  options: {
    resolvers?: Partial<InventoryProviderResolvers>
  } = {},
): Promise<ResolvedInventoryRecord | null> => {
  const inventoryId = String(input.inventoryId || '').trim()
  if (!inventoryId) return null

  const parsedInventory = parseInventoryId(inventoryId)
  if (!parsedInventory) return null

  return resolveInventoryViaProvider({
    inventoryId,
    provider: input.provider,
    parsedInventory,
    providerInventoryId: input.providerInventoryId,
    checkedAt: normalizeResolutionTimestamp(input.checkedAt),
    resolvers: options.resolvers,
  })
}

export const resolveInventoryWithSnapshot = async (
  input: ResolveInventoryWithSnapshotInput,
  options: {
    resolvers?: Partial<InventoryProviderResolvers>
  } = {},
): Promise<InventoryResolution | null> => {
  const record = await resolveInventoryRecord(input, options)
  if (!record) return null

  return {
    ...record,
    snapshotStatus: validateSnapshot({
      snapshot: input.snapshot,
      live: record,
    }).status,
  }
}

export async function resolveInventory(
  inventoryId: string,
  provider?: string | null,
): Promise<BookableEntity | null> {
  const record = await resolveInventoryRecord({ inventoryId, provider })
  return record?.entity || null
}
