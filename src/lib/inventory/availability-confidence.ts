import { computeDays } from '~/lib/search/car-rentals/dates'
import { computeNights } from '~/lib/search/hotels/dates'
import type { InventoryFreshnessModel } from '~/lib/inventory/freshness'

export const AVAILABILITY_CONFIDENCE_STATES = [
  'available_fresh',
  'available_likely',
  'partial_availability',
  'stale_unknown',
  'revalidation_failed',
  'unavailable',
] as const

export type AvailabilityConfidenceState = (typeof AVAILABILITY_CONFIDENCE_STATES)[number]

export const AVAILABILITY_MATCH_STATES = ['exact', 'partial', 'unknown'] as const

export type AvailabilityMatchState = (typeof AVAILABILITY_MATCH_STATES)[number]

export type AvailabilityConfidenceModel = {
  state: AvailabilityConfidenceState
  match: AvailabilityMatchState
  label: string
  supportText: string | null
  detailLabel: string
  checkedAt: string | null
  relativeLabel: string
  stale: boolean
  degraded: boolean
}

type AvailabilityAssessment = {
  match?: AvailabilityMatchState
  unavailable?: boolean
  revalidationFailed?: boolean
  supportText?: string | null
}

const LABELS: Record<AvailabilityConfidenceState, string> = {
  available_fresh: 'Available',
  available_likely: 'Likely available',
  partial_availability: 'Partial match',
  stale_unknown: 'Needs recheck',
  revalidation_failed: 'Revalidation failed',
  unavailable: 'Unavailable',
}

const DEFAULT_SUPPORT_TEXT: Record<AvailabilityConfidenceState, string | null> = {
  available_fresh: null,
  available_likely: null,
  partial_availability: 'Some requested conditions still match, but not all of them do.',
  stale_unknown: 'This snapshot is too old to confirm current availability.',
  revalidation_failed: 'The latest availability check could not be completed.',
  unavailable: 'Current inventory does not satisfy the selected conditions.',
}

const toUtcWeekday = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date.getUTCDay()
}

const resolveState = (input: {
  freshness?: InventoryFreshnessModel | null
  match: AvailabilityMatchState
  unavailable: boolean
  revalidationFailed: boolean
}): AvailabilityConfidenceState => {
  if (input.unavailable) return 'unavailable'
  if (input.revalidationFailed) return 'revalidation_failed'
  if (!input.freshness || input.freshness.stale) return 'stale_unknown'
  if (input.match === 'partial') return 'partial_availability'

  if (
    input.match === 'exact' &&
    (input.freshness.state === 'just_checked' ||
      input.freshness.state === 'checked_recently')
  ) {
    return 'available_fresh'
  }

  return 'available_likely'
}

export const buildAvailabilityConfidence = (input: {
  freshness?: InventoryFreshnessModel | null
} & AvailabilityAssessment): AvailabilityConfidenceModel => {
  const freshness = input.freshness || null
  const match = input.match || 'unknown'
  const unavailable = input.unavailable === true
  const revalidationFailed = input.revalidationFailed === true
  const state = resolveState({
    freshness,
    match,
    unavailable,
    revalidationFailed,
  })

  return {
    state,
    match,
    label: LABELS[state],
    supportText: input.supportText || DEFAULT_SUPPORT_TEXT[state],
    detailLabel: freshness?.detailLabel || 'Check time unavailable',
    checkedAt: freshness?.checkedAt || null,
    relativeLabel: freshness?.relativeLabel || 'time unavailable',
    stale: state === 'stale_unknown',
    degraded:
      state === 'partial_availability' ||
      state === 'stale_unknown' ||
      state === 'revalidation_failed' ||
      state === 'unavailable',
  }
}

export const formatAvailabilityDate = (value: string | null | undefined) => {
  const text = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text || 'unknown date'

  const [year, month, day] = text.split('-').map((part) => Number.parseInt(part, 10))
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export const evaluateHotelAvailabilityContext = (input: {
  availability?: {
    checkInStart: string
    checkInEnd: string
    minNights: number
    maxNights: number
    blockedWeekdays: number[]
  } | null
  checkIn?: string | null
  checkOut?: string | null
}): AvailabilityAssessment => {
  const checkIn = input.checkIn || null
  const checkOut = input.checkOut || null

  if (!checkIn && !checkOut) {
    return { match: 'unknown' }
  }

  if (!checkIn || !checkOut) {
    return {
      match: 'unknown',
      supportText: 'Add both check-in and check-out dates to confirm exact availability.',
    }
  }

  const nights = computeNights(checkIn, checkOut)
  if (nights == null) {
    return {
      unavailable: true,
      supportText: 'The selected stay dates are invalid.',
    }
  }

  if (!input.availability) {
    return {
      revalidationFailed: true,
      supportText: 'This property is missing a live stay window, so those dates could not be rechecked.',
    }
  }

  const weekday = toUtcWeekday(checkIn)

  if (checkIn < input.availability.checkInStart) {
    return {
      unavailable: true,
      supportText: `This stay now opens after ${formatAvailabilityDate(checkIn)}.`,
    }
  }

  if (checkIn > input.availability.checkInEnd) {
    return {
      unavailable: true,
      supportText: `This property no longer supports check-in on ${formatAvailabilityDate(checkIn)}.`,
    }
  }

  if (nights < input.availability.minNights || nights > input.availability.maxNights) {
    return {
      unavailable: true,
      supportText: 'The selected stay length is no longer available for this property.',
    }
  }

  if (weekday != null && input.availability.blockedWeekdays.includes(weekday)) {
    return {
      unavailable: true,
      supportText: `Check-in is blocked for ${formatAvailabilityDate(checkIn)}.`,
    }
  }

  return { match: 'exact' }
}

export const evaluateCarAvailabilityContext = (input: {
  availability?: {
    pickupStart: string
    pickupEnd: string
    minDays: number
    maxDays: number
    blockedWeekdays: number[]
  } | null
  pickupDate?: string | null
  dropoffDate?: string | null
}): AvailabilityAssessment => {
  const pickupDate = input.pickupDate || null
  const dropoffDate = input.dropoffDate || null

  if (!pickupDate && !dropoffDate) {
    return { match: 'unknown' }
  }

  if (!pickupDate || !dropoffDate) {
    return {
      match: 'unknown',
      supportText: 'Add both pickup and dropoff dates to confirm exact availability.',
    }
  }

  const days = computeDays(pickupDate, dropoffDate)
  if (days == null) {
    return {
      unavailable: true,
      supportText: 'The selected rental dates are invalid.',
    }
  }

  if (!input.availability) {
    return {
      revalidationFailed: true,
      supportText: 'This rental is missing a live availability window, so those dates could not be rechecked.',
    }
  }

  const weekday = toUtcWeekday(pickupDate)

  if (pickupDate < input.availability.pickupStart) {
    return {
      unavailable: true,
      supportText: `This rental now starts after ${formatAvailabilityDate(pickupDate)}.`,
    }
  }

  if (pickupDate > input.availability.pickupEnd) {
    return {
      unavailable: true,
      supportText: `This rental no longer supports pickup on ${formatAvailabilityDate(pickupDate)}.`,
    }
  }

  if (days < input.availability.minDays || days > input.availability.maxDays) {
    return {
      unavailable: true,
      supportText: 'The selected rental length is no longer available.',
    }
  }

  if (weekday != null && input.availability.blockedWeekdays.includes(weekday)) {
    return {
      unavailable: true,
      supportText: `Pickup is blocked for ${formatAvailabilityDate(pickupDate)}.`,
    }
  }

  return { match: 'exact' }
}

export const evaluateFlightAvailabilityContext = (input: {
  requestedServiceDate?: string | null
  actualServiceDate?: string | null
}): AvailabilityAssessment => {
  const requestedServiceDate = input.requestedServiceDate || null
  const actualServiceDate = input.actualServiceDate || null

  if (!requestedServiceDate) {
    return { match: 'unknown' }
  }

  if (!actualServiceDate) {
    return {
      revalidationFailed: true,
      supportText: 'This itinerary is missing a live service date, so it could not be rechecked.',
    }
  }

  if (requestedServiceDate !== actualServiceDate) {
    return {
      match: 'partial',
      supportText: `Requested ${formatAvailabilityDate(requestedServiceDate)}. Closest stored option is ${formatAvailabilityDate(actualServiceDate)}.`,
    }
  }

  return { match: 'exact' }
}

export const availabilityConfidenceBadgeClass = (state: AvailabilityConfidenceState) => {
  if (state === 'available_fresh') {
    return 'rounded-full border border-[color:var(--color-success,#0f766e)] bg-[color:rgba(15,118,110,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-success,#0f766e)]'
  }

  if (state === 'available_likely') {
    return 'rounded-full border border-[color:var(--color-action)] bg-[color:rgba(14,116,144,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-action)]'
  }

  if (state === 'partial_availability') {
    return 'rounded-full border border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-warning,#92400e)]'
  }

  if (state === 'stale_unknown') {
    return 'rounded-full border border-[color:var(--color-text-muted)] bg-[color:rgba(15,23,42,0.05)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-text-muted)]'
  }

  if (state === 'revalidation_failed') {
    return 'rounded-full border border-[color:var(--color-warning,#b45309)] bg-[color:rgba(120,53,15,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-warning,#92400e)]'
  }

  return 'rounded-full border border-[color:var(--color-error,#b91c1c)] bg-[color:rgba(185,28,28,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-error,#b91c1c)]'
}
