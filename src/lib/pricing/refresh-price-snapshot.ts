import { buildPriceChange, type PriceChange } from '~/lib/pricing/price-display'

export type RefreshPriceSnapshotEntry = {
  id: string
  amount: number
  currencyCode: string | null
}

const storageKey = (snapshotId: string) => `price-refresh:${snapshotId}`

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export const storeRefreshPriceSnapshot = (
  snapshotId: string,
  entries: RefreshPriceSnapshotEntry[],
) => {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(storageKey(snapshotId), JSON.stringify(entries))
  } catch {
    // Ignore session storage failures for refresh hints.
  }
}

export const consumeRefreshPriceSnapshot = (snapshotId: string) => {
  if (typeof window === 'undefined') return [] as RefreshPriceSnapshotEntry[]

  try {
    const raw = window.sessionStorage.getItem(storageKey(snapshotId))
    window.sessionStorage.removeItem(storageKey(snapshotId))
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((entry) => {
        if (!isRecord(entry)) return null
        const id = String(entry.id || '').trim()
        const amount = Math.round(Number(entry.amount))
        const currencyCode = String(entry.currencyCode || '').trim().toUpperCase() || null

        if (!id || !Number.isFinite(amount) || amount < 0) return null
        return {
          id,
          amount,
          currencyCode,
        }
      })
      .filter((entry): entry is RefreshPriceSnapshotEntry => Boolean(entry))
  } catch {
    return []
  }
}

export const buildRefreshPriceChangeMap = (
  previousEntries: RefreshPriceSnapshotEntry[],
  currentEntries: RefreshPriceSnapshotEntry[],
  label: string,
) => {
  const previousById = new Map(previousEntries.map((entry) => [entry.id, entry]))
  const changes: Record<string, PriceChange> = {}

  for (const currentEntry of currentEntries) {
    const previousEntry = previousById.get(currentEntry.id)
    if (!previousEntry) continue
    if (
      previousEntry.currencyCode &&
      currentEntry.currencyCode &&
      previousEntry.currencyCode !== currentEntry.currencyCode
    ) {
      continue
    }

    changes[currentEntry.id] = buildPriceChange({
      label,
      previousAmount: previousEntry.amount,
      currentAmount: currentEntry.amount,
    })
  }

  return changes
}
