import type {
  ParsedCarInventoryId,
  ParsedFlightInventoryId,
  ParsedHotelInventoryId,
  ParsedInventoryId,
} from '~/lib/inventory/inventory-id'
import type { BookableEntity } from '~/types/bookable-entity'

export const INVENTORY_SNAPSHOT_STATUSES = ['valid', 'price_changed', 'unavailable'] as const
export type InventorySnapshotStatus = (typeof INVENTORY_SNAPSHOT_STATUSES)[number]

export type InventorySnapshot = {
  inventoryId?: string | null
  priceCents?: number | null
  currencyCode?: string | null
  snapshotTimestamp?: string | null
}

export type ResolvedInventoryRecord = {
  entity: BookableEntity
  checkedAt: string
  isAvailable: boolean | null
}

export type InventoryResolution = ResolvedInventoryRecord & {
  snapshotStatus: InventorySnapshotStatus
}

export type InventoryProviderResolverInput<
  TParsedInventory extends ParsedInventoryId = ParsedInventoryId,
> = {
  inventoryId: string
  parsedInventory: TParsedInventory
  providerInventoryId?: number | null
  checkedAt: string
}

export type InventoryProviderResolvers = {
  hotel: (
    input: InventoryProviderResolverInput<ParsedHotelInventoryId>,
  ) => Promise<ResolvedInventoryRecord | null>
  flight: (
    input: InventoryProviderResolverInput<ParsedFlightInventoryId>,
  ) => Promise<ResolvedInventoryRecord | null>
  car: (
    input: InventoryProviderResolverInput<ParsedCarInventoryId>,
  ) => Promise<ResolvedInventoryRecord | null>
}

export type ResolveInventoryRecordInput = {
  inventoryId: string
  providerInventoryId?: number | null
  checkedAt?: string | Date | null
}

export type ResolveInventoryWithSnapshotInput = ResolveInventoryRecordInput & {
  snapshot?: InventorySnapshot | null
}

export type InventorySnapshotValidationResult = {
  status: InventorySnapshotStatus
}
