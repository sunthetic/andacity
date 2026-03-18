import { parseInventoryId } from '~/lib/inventory/inventory-id'
import { resolveInventoryRecord } from '~/lib/inventory/resolveInventory'
import { compareCheckoutSnapshotToResolvedInventory } from '~/lib/checkout/compareCheckoutSnapshotToResolvedInventory'
import type {
  CheckoutItemRevalidationResult,
  CheckoutItemSnapshot,
} from '~/types/checkout'

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const buildResult = (input: {
  snapshot: CheckoutItemSnapshot
  status: CheckoutItemRevalidationResult['status']
  message: string
}): CheckoutItemRevalidationResult => {
  return {
    tripItemId: input.snapshot.tripItemId,
    itemType: input.snapshot.itemType,
    vertical: input.snapshot.vertical,
    title: input.snapshot.title,
    subtitle: input.snapshot.subtitle,
    status: input.status,
    message: input.message,
    previousPricing: input.snapshot.pricing,
    currentPricing: null,
    previousInventory: input.snapshot.inventory,
    currentInventory: null,
    providerMetadata: input.snapshot.inventory.providerMetadata,
  }
}

export const revalidateCheckoutItem = async (
  snapshot: CheckoutItemSnapshot,
  options: {
    checkedAt?: Date | string | null
    resolveInventoryRecordFn?: typeof resolveInventoryRecord
  } = {},
): Promise<CheckoutItemRevalidationResult> => {
  const inventoryId = toNullableText(snapshot.inventory.inventoryId)
  if (!inventoryId) {
    return buildResult({
      snapshot,
      status: 'failed',
      message: 'This checkout item is missing its canonical inventory reference.',
    })
  }

  const parsedInventory = parseInventoryId(inventoryId)
  if (!parsedInventory || parsedInventory.vertical !== snapshot.vertical) {
    return buildResult({
      snapshot,
      status: 'failed',
      message: 'This checkout item has an unsupported canonical inventory shape.',
    })
  }

  const resolveInventoryRecordFn =
    options.resolveInventoryRecordFn || resolveInventoryRecord
  const checkedAt = normalizeTimestamp(options.checkedAt)
  const provider =
    toNullableText(snapshot.inventory.providerMetadata?.provider) ||
    toNullableText(snapshot.inventory.bookableEntity?.provider)

  try {
    const resolved = await resolveInventoryRecordFn({
      inventoryId,
      provider,
      providerInventoryId: snapshot.inventory.providerInventoryId,
      checkedAt,
    })

    if (!resolved) {
      return buildResult({
        snapshot,
        status: 'unavailable',
        message: 'This item is no longer available in current inventory.',
      })
    }

    return compareCheckoutSnapshotToResolvedInventory({
      snapshot,
      resolved,
    })
  } catch (error) {
    return buildResult({
      snapshot,
      status: 'failed',
      message:
        error instanceof Error && error.message.trim()
          ? `This item could not be revalidated right now. ${error.message.trim()}`
          : 'This item could not be revalidated right now.',
    })
  }
}
