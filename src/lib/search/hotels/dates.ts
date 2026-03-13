export { normalizeIsoDate } from '~/lib/date/validateDate'

export const computeNights = (checkIn: string | null, checkOut: string | null) => {
  if (!checkIn || !checkOut) return null
  const a = Date.parse(checkIn)
  const b = Date.parse(checkOut)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return null
  return Math.min(diff, 30)
}
