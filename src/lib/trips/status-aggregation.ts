import {
  TRIP_INTELLIGENCE_STATUSES,
  TRIP_ITEM_VALIDITY_STATUSES,
  type TripIntelligenceSummary,
  type TripItem,
  type TripItemValidityStatus,
  type TripValidationIssue,
} from '~/types/trips/trip'

type BuildTripIntelligenceSummaryInput = {
  items: TripItem[]
  additionalIssues?: TripValidationIssue[]
}

const dedupeIssues = (issues: TripValidationIssue[]) => {
  const seen = new Set<string>()
  const next: TripValidationIssue[] = []

  for (const issue of issues) {
    const key = [
      issue.code,
      issue.scope,
      issue.severity,
      issue.message,
      issue.itemId || '',
      (issue.relatedItemIds || []).join(','),
    ].join('|')

    if (seen.has(key)) continue
    seen.add(key)
    next.push(issue)
  }

  return next
}

const createItemStatusCounts = (): Record<TripItemValidityStatus, number> => ({
  valid: 0,
  unavailable: 0,
  stale: 0,
  price_only_changed: 0,
})

const pickBoundaryTimestamp = (
  values: Array<string | null>,
  direction: 'min' | 'max',
) => {
  const timestamps = values
    .map((value) => (value ? Date.parse(value) : Number.NaN))
    .filter((value) => Number.isFinite(value))

  if (!timestamps.length) return null

  const selected =
    direction === 'min'
      ? Math.min(...timestamps)
      : Math.max(...timestamps)

  return new Date(selected).toISOString()
}

export const buildTripIntelligenceSummary = (
  input: BuildTripIntelligenceSummaryInput,
): TripIntelligenceSummary => {
  const itemStatusCounts = createItemStatusCounts()

  for (const item of input.items) {
    itemStatusCounts[item.availabilityStatus] += 1
  }

  const issues = dedupeIssues([
    ...input.items.flatMap((item) => item.issues),
    ...(input.additionalIssues || []),
  ])
  const issueCounts = {
    warning: issues.filter((issue) => issue.severity === 'warning').length,
    blocking: issues.filter((issue) => issue.severity === 'blocking').length,
  }

  let status: TripIntelligenceSummary['status'] = TRIP_INTELLIGENCE_STATUSES[0]

  if (itemStatusCounts.unavailable > 0 || issueCounts.blocking > 0) {
    status = 'blocking_issues_present'
  } else if (
    itemStatusCounts.stale > 0 ||
    itemStatusCounts.price_only_changed > 0 ||
    issueCounts.warning > 0
  ) {
    status = 'warnings_present'
  }

  return {
    status,
    checkedAt: pickBoundaryTimestamp(
      input.items.map((item) => item.availabilityCheckedAt),
      'min',
    ),
    expiresAt: pickBoundaryTimestamp(
      input.items.map((item) => item.availabilityExpiresAt),
      'min',
    ),
    itemStatusCounts,
    issueCounts,
    issues,
  }
}
