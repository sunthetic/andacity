import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatDateInput,
  formatIsoDateInputValue,
  stripDateInputDigits,
} from '~/lib/date/formatDateInput'
import { normalizeTypedDate, parseTypedDate } from '~/lib/date/parseTypedDate'
import { getTodayIsoDate, normalizeIsoDate, validateDate } from '~/lib/date/validateDate'

test('formatDateInput auto-inserts slashes for typed digits', () => {
  const steps = [
    ['0', '0'],
    ['01', '01'],
    ['012', '01/2'],
    ['0125', '01/25'],
    ['01252', '01/25/2'],
    ['012520', '01/25/20'],
    ['0125202', '01/25/202'],
    ['01252026', '01/25/2026'],
  ] as const

  for (const [raw, expected] of steps) {
    assert.equal(formatDateInput(raw), expected)
  }
})

test('stripDateInputDigits keeps only the first eight digits', () => {
  assert.equal(stripDateInputDigits('01/25/2026abc999'), '01252026')
})

test('parseTypedDate normalizes a valid typed date to ISO', () => {
  assert.deepEqual(parseTypedDate('01252026'), {
    status: 'valid',
    digits: '01252026',
    displayValue: '01/25/2026',
    isoValue: '2026-01-25',
    message: null,
  })
})

test('parseTypedDate detects incomplete and invalid dates', () => {
  const incomplete = parseTypedDate('0101')
  assert.equal(incomplete.status, 'incomplete')
  assert.equal(incomplete.displayValue, '01/01')
  assert.equal(incomplete.isoValue, null)

  const invalidMonth = parseTypedDate('13252026')
  assert.equal(invalidMonth.status, 'invalid')
  assert.equal(invalidMonth.message, 'Enter a month between 01 and 12.')

  const invalidCalendarDate = parseTypedDate('02302026')
  assert.equal(invalidCalendarDate.status, 'invalid')
  assert.equal(invalidCalendarDate.message, 'Enter a valid calendar date.')
})

test('parseTypedDate handles leap years correctly', () => {
  const leapYear = parseTypedDate('02292024')
  assert.equal(leapYear.status, 'valid')
  assert.equal(leapYear.isoValue, '2024-02-29')

  const nonLeapYear = parseTypedDate('02292025')
  assert.equal(nonLeapYear.status, 'invalid')
  assert.equal(nonLeapYear.message, 'Enter a valid calendar date.')
})

test('normalizeTypedDate returns canonical ISO dates for valid input only', () => {
  assert.equal(normalizeTypedDate('01/25/2026'), '2026-01-25')
  assert.equal(normalizeTypedDate('01252026'), '2026-01-25')
  assert.equal(normalizeTypedDate('01/25/202'), null)
  assert.equal(normalizeTypedDate('13/25/2026'), null)
})

test('normalizeIsoDate only accepts valid canonical ISO dates', () => {
  assert.equal(normalizeIsoDate('2026-01-25'), '2026-01-25')
  assert.equal(normalizeIsoDate('2026-02-30'), null)
  assert.equal(normalizeIsoDate('01/25/2026'), null)
})

test('formatIsoDateInputValue formats canonical ISO values for display', () => {
  assert.equal(formatIsoDateInputValue('2026-01-25'), '01/25/2026')
  assert.equal(formatIsoDateInputValue('2026-02-30'), '')
})

test('validateDate rejects impossible dates and accepts valid ones', () => {
  assert.equal(validateDate(2026, 1, 25).valid, true)
  assert.equal(validateDate(2026, 2, 30).valid, false)
  assert.equal(validateDate(2026, 13, 25).valid, false)
})

test('getTodayIsoDate returns a canonical ISO date for local dates', () => {
  assert.equal(getTodayIsoDate(new Date(2026, 0, 25, 12, 0, 0)), '2026-01-25')
})
