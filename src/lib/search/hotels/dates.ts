export const normalizeIsoDate = (raw: string | null) => {
  if (!raw) return null
  const s = String(raw).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  return s
}

export const computeNights = (checkIn: string | null, checkOut: string | null) => {
  if (!checkIn || !checkOut) return null
  const a = Date.parse(checkIn)
  const b = Date.parse(checkOut)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return null
  return Math.min(diff, 30)
}
