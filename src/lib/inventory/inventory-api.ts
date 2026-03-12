export type InventoryRevalidationItemType = 'hotel' | 'car' | 'flight'

export type InventoryRevalidationResult = {
  itemType: InventoryRevalidationItemType
  checkedAt: string
  revalidatedCount: number
  missingIds: number[]
}

export class InventoryApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'InventoryApiError'
  }
}

export const revalidateInventoryApi = async (input: {
  itemType: InventoryRevalidationItemType
  inventoryIds: number[]
}): Promise<InventoryRevalidationResult> => {
  const response = await fetch('/api/inventory/revalidate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  const payload = await response
    .json()
    .catch(() => ({ error: `Request failed with status ${response.status}.` }))

  if (!response.ok) {
    throw new InventoryApiError(
      response.status,
      String(payload?.error || `Request failed with status ${response.status}.`),
    )
  }

  return payload.result as InventoryRevalidationResult
}
