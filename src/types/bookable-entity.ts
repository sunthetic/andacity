import type { InventoryVertical } from '~/lib/inventory/inventory-id'

export type BookableEntity<TPayload = Record<string, unknown>> = {
  inventoryId: string
  vertical: InventoryVertical
  price: number
  currency: string
  payload: TPayload
  provider: string
}
