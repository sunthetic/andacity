export const toFloatOrNull = (raw: string | null) => {
  if (!raw) return null
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n)) return null
  return n
}

export const toIntOrNull = (raw: string | null) => {
  if (raw == null) return null
  const n = Number.parseInt(String(raw), 10)
  if (!Number.isFinite(n)) return null
  return n
}

export const clampMaybeInt = (raw: string | null, min: number, max: number) => {
  if (!raw) return null
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return null
  if (n < min) return min
  if (n > max) return max
  return n
}
