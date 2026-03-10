import type { RequestHandler } from '@builder.io/qwik-city'
import {
  revalidateInventoryFreshness,
  type InventoryRevalidationItemType,
} from '~/lib/repos/inventory-revalidation-repo.server'

const sendJson = (
  headers: Headers,
  send: (status: number, body: string) => void,
  status: number,
  body: unknown,
) => {
  headers.set('content-type', 'application/json; charset=utf-8')
  send(status, JSON.stringify(body))
}

const parseItemType = (value: unknown): InventoryRevalidationItemType | null => {
  const itemType = String(value || '').trim().toLowerCase()
  if (itemType === 'hotel' || itemType === 'car' || itemType === 'flight') {
    return itemType
  }
  return null
}

const parseInventoryIds = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => Number.parseInt(String(entry), 10))
    .filter((entry) => Number.isFinite(entry) && entry > 0)
}

export const onPost: RequestHandler = async ({ request, headers, send }) => {
  try {
    const payload = await request.json().catch(() => ({}))
    const itemType = parseItemType(payload?.itemType)
    const inventoryIds = parseInventoryIds(payload?.inventoryIds)

    if (!itemType || !inventoryIds.length) {
      sendJson(headers, send, 400, {
        error: 'itemType and inventoryIds are required.',
      })
      return
    }

    const result = await revalidateInventoryFreshness({
      itemType,
      inventoryIds,
    })

    sendJson(headers, send, 200, { result })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to revalidate inventory.'
    sendJson(headers, send, 500, { error: message })
  }
}
