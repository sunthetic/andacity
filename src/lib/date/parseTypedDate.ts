import { formatDateInput, stripDateInputDigits } from '~/lib/date/formatDateInput'
import { validateDate } from '~/lib/date/validateDate'

export type ParsedTypedDate =
  | {
      status: 'empty'
      digits: ''
      displayValue: ''
      isoValue: null
      message: null
    }
  | {
      status: 'incomplete'
      digits: string
      displayValue: string
      isoValue: null
      message: string
    }
  | {
      status: 'invalid'
      digits: string
      displayValue: string
      isoValue: null
      message: string
    }
  | {
      status: 'valid'
      digits: string
      displayValue: string
      isoValue: string
      message: null
    }

export const parseTypedDate = (value: string | null | undefined): ParsedTypedDate => {
  const digits = stripDateInputDigits(value)
  const displayValue = formatDateInput(digits)

  if (!digits.length) {
    return {
      status: 'empty',
      digits: '',
      displayValue: '',
      isoValue: null,
      message: null,
    }
  }

  if (digits.length < 8) {
    return {
      status: 'incomplete',
      digits,
      displayValue,
      isoValue: null,
      message: 'Finish the date as MM/DD/YYYY.',
    }
  }

  const month = Number.parseInt(digits.slice(0, 2), 10)
  const day = Number.parseInt(digits.slice(2, 4), 10)
  const year = Number.parseInt(digits.slice(4, 8), 10)
  const validation = validateDate(year, month, day)

  if (!validation.valid) {
    return {
      status: 'invalid',
      digits,
      displayValue,
      isoValue: null,
      message: validation.message,
    }
  }

  return {
    status: 'valid',
    digits,
    displayValue,
    isoValue: validation.isoValue,
    message: null,
  }
}

export const normalizeTypedDate = (value: string | null | undefined) => {
  const parsed = parseTypedDate(value)
  return parsed.status === 'valid' ? parsed.isoValue : null
}
