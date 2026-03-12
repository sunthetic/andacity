const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const normalizeCitySlug = (raw: string) => {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]+/g, '-')
    .replaceAll(/--+/g, '-')
    .replaceAll(/(^-|-$)/g, '')
}

export const isIsoDate = (raw: string) => {
  if (!ISO_DATE_RE.test(raw)) return false
  const parsed = Date.parse(`${raw}T00:00:00Z`)
  return Number.isFinite(parsed)
}

export const isValidDateRange = (checkIn: string, checkOut: string) => {
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) return false
  return Date.parse(`${checkOut}T00:00:00Z`) > Date.parse(`${checkIn}T00:00:00Z`)
}

export const buildHotelsSrpPath = (input: {
  citySlug: string
  checkIn: string
  checkOut: string
  pageNumber?: number
}) => {
  const citySlug = normalizeCitySlug(input.citySlug)
  const pageNumber = Number.isFinite(input.pageNumber) ? Math.max(1, Math.floor(input.pageNumber as number)) : 1

  if (!citySlug || !isValidDateRange(input.checkIn, input.checkOut)) return null

  return `/hotels/in/${encodeURIComponent(citySlug)}/fromDate/${input.checkIn}/toDate/${input.checkOut}/${pageNumber}`
}
