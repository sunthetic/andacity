export type DateValidationResult =
  | {
      valid: true
      isoValue: string
      month: number
      day: number
      year: number
    }
  | {
      valid: false
      reason: 'month' | 'day' | 'year' | 'calendar'
      message: string
    }

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export const isValidDateParts = (year: number, month: number, day: number) => {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) return false
  if (!Number.isInteger(month) || month < 1 || month > 12) return false
  if (!Number.isInteger(day) || day < 1 || day > 31) return false

  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export const validateDate = (
  year: number,
  month: number,
  day: number,
): DateValidationResult => {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    return {
      valid: false,
      reason: 'year',
      message: 'Enter a 4-digit year.',
    }
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return {
      valid: false,
      reason: 'month',
      message: 'Enter a month between 01 and 12.',
    }
  }

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return {
      valid: false,
      reason: 'day',
      message: 'Enter a day between 01 and 31.',
    }
  }

  if (!isValidDateParts(year, month, day)) {
    return {
      valid: false,
      reason: 'calendar',
      message: 'Enter a valid calendar date.',
    }
  }

  return {
    valid: true,
    isoValue: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    month,
    day,
    year,
  }
}

export const normalizeIsoDate = (raw: string | null | undefined) => {
  const text = String(raw || '').trim()
  if (!text) return null

  const match = ISO_DATE_PATTERN.exec(text)
  if (!match) return null

  const [, yearText, monthText, dayText] = match
  const year = Number.parseInt(yearText, 10)
  const month = Number.parseInt(monthText, 10)
  const day = Number.parseInt(dayText, 10)
  const validation = validateDate(year, month, day)

  return validation.valid ? validation.isoValue : null
}
