export { normalizeIsoDate } from '~/lib/date/validateDate'

export const computeDays = (pickupDate: string | null, dropoffDate: string | null) => {
  if (!pickupDate || !dropoffDate) return null
  const a = Date.parse(pickupDate)
  const b = Date.parse(dropoffDate)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return null
  return Math.min(diff, 30)
}
