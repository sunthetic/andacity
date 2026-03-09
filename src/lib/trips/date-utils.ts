export const isIsoDate = (value: string | null | undefined): value is string => {
  return Boolean(value) && /^\d{4}-\d{2}-\d{2}$/.test(String(value))
}

export const toUtcDate = (value: string | null | undefined) => {
  if (!isIsoDate(value)) return null

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

export const addDays = (value: string | null | undefined, days: number) => {
  const date = toUtcDate(value)
  if (!date || !Number.isFinite(days)) return null

  date.setUTCDate(date.getUTCDate() + Math.round(days))
  return date.toISOString().slice(0, 10)
}

export const compareIsoDate = (left: string | null | undefined, right: string | null | undefined) => {
  if (!isIsoDate(left) || !isIsoDate(right)) return null
  if (left === right) return 0
  return left < right ? -1 : 1
}

export const differenceInDays = (start: string | null | undefined, end: string | null | undefined) => {
  const a = toUtcDate(start)
  const b = toUtcDate(end)
  if (!a || !b) return null

  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export const minIsoDate = (...values: Array<string | null | undefined>) => {
  const dates = values.filter(isIsoDate).sort()
  return dates[0] || null
}

export const maxIsoDate = (...values: Array<string | null | undefined>) => {
  const dates = values.filter(isIsoDate).sort()
  return dates.at(-1) || null
}
