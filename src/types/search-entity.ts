import type { InventoryVertical } from '~/lib/inventory/inventory-id'

export type SearchEntity<TPayload = Record<string, unknown>> = {
  inventoryId: string
  vertical: InventoryVertical
  price: number
  currency: string
  provider: string
  snapshotTimestamp: string
  payload: TPayload
}
