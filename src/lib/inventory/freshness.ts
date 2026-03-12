export const INVENTORY_FRESHNESS_STATES = [
  'just_checked',
  'checked_recently',
  'aging',
  'stale',
] as const

export type InventoryFreshnessState = (typeof INVENTORY_FRESHNESS_STATES)[number]

export const INVENTORY_REFRESH_STATES = [
  'idle',
  'refreshing',
  'refreshed',
  'failed',
] as const

export type InventoryRefreshState = (typeof INVENTORY_REFRESH_STATES)[number]

export const INVENTORY_FRESHNESS_PROFILES = [
  'inventory_snapshot',
  'availability_revalidation',
] as const

export type InventoryFreshnessProfile = (typeof INVENTORY_FRESHNESS_PROFILES)[number]

export type InventoryFreshnessModel = {
  checkedAt: string | null
  ageMs: number | null
  state: InventoryFreshnessState
  label: string
  checkedLabel: string
  relativeLabel: string
  detailLabel: string
  stale: boolean
  profile: InventoryFreshnessProfile
}

type FreshnessThresholds = {
  justCheckedMs: number
  checkedRecentlyMs: number
  staleMs: number
}

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

const FRESHNESS_LABELS: Record<InventoryFreshnessState, string> = {
  just_checked: 'Just checked',
  checked_recently: 'Checked recently',
  aging: 'Aging',
  stale: 'Stale',
}

const PROFILE_THRESHOLDS: Record<InventoryFreshnessProfile, FreshnessThresholds> = {
  // Remote inventory is reseeded on an approximately daily cadence. Mark it
  // stale slightly before the 24-hour boundary so near-expiry snapshots are
  // visually distinct from the same-day "aging" state.
  inventory_snapshot: {
    justCheckedMs: 30 * MINUTE_MS,
    checkedRecentlyMs: 6 * HOUR_MS,
    staleMs: 20 * HOUR_MS,
  },
  // Trip availability already expires every 6 hours in the existing
  // revalidation architecture, so keep the freshness profile aligned.
  availability_revalidation: {
    justCheckedMs: 15 * MINUTE_MS,
    checkedRecentlyMs: 2 * HOUR_MS,
    staleMs: 6 * HOUR_MS,
  },
}

const toDate = (value: Date | string | number | null | undefined) => {
  if (value == null) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatCheckedAt = (value: Date | null) => {
  if (!value) return 'Checked time unavailable'

  return `Checked ${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)}`
}

const formatRelativeAge = (ageMs: number | null) => {
  if (ageMs == null) return 'time unavailable'
  if (ageMs < MINUTE_MS) return 'moments ago'

  const minutes = Math.round(ageMs / MINUTE_MS)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(ageMs / HOUR_MS)
  if (hours < 48) return `${hours}h ago`

  const days = Math.round(ageMs / (24 * HOUR_MS))
  return `${days}d ago`
}

const resolveFreshnessState = (
  ageMs: number | null,
  thresholds: FreshnessThresholds,
): InventoryFreshnessState => {
  if (ageMs == null) return 'stale'
  if (ageMs <= thresholds.justCheckedMs) return 'just_checked'
  if (ageMs <= thresholds.checkedRecentlyMs) return 'checked_recently'
  if (ageMs < thresholds.staleMs) return 'aging'
  return 'stale'
}

export const buildInventoryFreshness = (input: {
  checkedAt: Date | string | number | null | undefined
  profile?: InventoryFreshnessProfile
  now?: Date | string | number
}): InventoryFreshnessModel => {
  const profile = input.profile || 'inventory_snapshot'
  const checkedAtDate = toDate(input.checkedAt)
  const now = toDate(input.now || new Date()) || new Date()
  const ageMs =
    checkedAtDate == null ? null : Math.max(0, now.getTime() - checkedAtDate.getTime())
  const state = resolveFreshnessState(ageMs, PROFILE_THRESHOLDS[profile])
  const checkedLabel = formatCheckedAt(checkedAtDate)
  const relativeLabel = formatRelativeAge(ageMs)

  return {
    checkedAt: checkedAtDate ? checkedAtDate.toISOString() : null,
    ageMs,
    state,
    label: FRESHNESS_LABELS[state],
    checkedLabel,
    relativeLabel,
    detailLabel: `${checkedLabel} · ${relativeLabel}`,
    stale: state === 'stale',
    profile,
  }
}
