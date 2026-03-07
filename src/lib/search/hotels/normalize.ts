import type { SortKey } from '~/types/hotels/search'

export const normalizeQuery = (raw: string | undefined) => {
  const q = String(raw || '').trim()
  return q.length ? q : 'anywhere'
}

export const clampInt = (raw: string | undefined, min: number, max: number) => {
  const n = Number.parseInt(String(raw || ''), 10)
  if (!Number.isFinite(n)) return min
  if (n < min) return min
  if (n > max) return max
  return n
}

export const safeTitleQuery = (q: string) => {
  try {
    const decoded = decodeURIComponent(q)
    return decoded.replaceAll(/\s+/g, ' ').trim()
  } catch {
    return q
  }
}

export const normalizeSort = (raw: string | null): SortKey => {
  const s = String(raw || '').toLowerCase()
  if (s === 'price-asc' || s === 'price-desc' || s === 'rating-desc' || s === 'reviewcount-desc') return s
  return 'relevance'
}
