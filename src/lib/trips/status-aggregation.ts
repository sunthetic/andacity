import {
  TRIP_INTELLIGENCE_STATUSES,
  TRIP_REVALIDATION_SUMMARY_STATUSES,
  type TripItemRevalidationStatus,
  type TripRevalidationSummary,
  type TripIntelligenceSummary,
  type TripItem,
  type TripItemValidityStatus,
  type TripValidationIssue,
} from '~/types/trips/trip'

type BuildTripIntelligenceSummaryInput = {
  items: TripItem[]
  additionalIssues?: TripValidationIssue[]
}

type BuildTripRevalidationSummaryInput = {
  items: TripItem[]
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

const createRevalidationStatusCounts = (): Record<TripItemRevalidationStatus, number> => ({
  valid: 0,
  price_changed: 0,
  unavailable: 0,
  error: 0,
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

const buildTripRevalidationSummaryText = (
  status: TripRevalidationSummary['status'],
  counts: TripRevalidationSummary['itemStatusCounts'],
) => {
  if (status === 'errors_present') {
    return counts.error === 1
      ? '1 trip item hit a temporary revalidation issue.'
      : `${counts.error} trip items hit temporary revalidation issues.`
  }

  if (status === 'unavailable_items_present') {
    return counts.unavailable === 1
      ? '1 trip item is no longer available.'
      : `${counts.unavailable} trip items are no longer available.`
  }

  if (status === 'price_changes_present') {
    return counts.price_changed === 1
      ? '1 trip item changed price since it was saved.'
      : `${counts.price_changed} trip items changed price since they were saved.`
  }

  return counts.valid
    ? 'All trip items still match the latest live inventory checks.'
    : 'No trip items have been revalidated yet.'
}

export const buildTripRevalidationSummary = (
  input: BuildTripRevalidationSummaryInput,
): TripRevalidationSummary => {
  const itemStatusCounts = createRevalidationStatusCounts()

  for (const item of input.items) {
    itemStatusCounts[item.revalidation.status] += 1
  }

  let status: TripRevalidationSummary['status'] =
    TRIP_REVALIDATION_SUMMARY_STATUSES[0]

  if (itemStatusCounts.error > 0) {
    status = 'errors_present'
  } else if (itemStatusCounts.unavailable > 0) {
    status = 'unavailable_items_present'
  } else if (itemStatusCounts.price_changed > 0) {
    status = 'price_changes_present'
  }

  return {
    status,
    checkedAt: pickBoundaryTimestamp(
      input.items.map((item) => item.revalidation.checkedAt),
      'min',
    ),
    expiresAt: pickBoundaryTimestamp(
      input.items.map((item) => item.availabilityExpiresAt),
      'min',
    ),
    itemStatusCounts,
    summary: buildTripRevalidationSummaryText(status, itemStatusCounts),
  }
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
