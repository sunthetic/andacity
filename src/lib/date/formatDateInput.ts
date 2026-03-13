import { normalizeIsoDate } from '~/lib/date/validateDate'

export const DATE_INPUT_MAX_DIGITS = 8

export const stripDateInputDigits = (value: string | null | undefined) =>
  String(value || '')
    .replace(/\D+/g, '')
    .slice(0, DATE_INPUT_MAX_DIGITS)

export const formatDateInput = (value: string | null | undefined) => {
  const digits = stripDateInputDigits(value)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export const formatIsoDateInputValue = (value: string | null | undefined) => {
  const isoValue = normalizeIsoDate(value)
  if (!isoValue) return ''

  const [year, month, day] = isoValue.split('-')
  return `${month}/${day}/${year}`
}
