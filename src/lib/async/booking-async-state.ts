import type { AvailabilityConfidenceModel } from "~/lib/inventory/availability-confidence";

export const BOOKING_ASYNC_STATES = [
  "initial_loading",
  "loaded",
  "refreshing",
  "partial",
  "stale",
  "failed",
  "empty",
] as const;

export type BookingAsyncState = (typeof BOOKING_ASYNC_STATES)[number];

export type AvailabilitySignalSummary = {
  totalCount: number;
  degradedCount: number;
  partialCount: number;
  staleCount: number;
  failedCount: number;
  unavailableCount: number;
};

export const summarizeAvailabilitySignals = (
  items: Array<{
    availabilityConfidence?: AvailabilityConfidenceModel | null;
  }>,
): AvailabilitySignalSummary => {
  const summary: AvailabilitySignalSummary = {
    totalCount: items.length,
    degradedCount: 0,
    partialCount: 0,
    staleCount: 0,
    failedCount: 0,
    unavailableCount: 0,
  };

  for (const item of items) {
    const confidence = item.availabilityConfidence;
    if (!confidence) continue;

    if (confidence.degraded) {
      summary.degradedCount += 1;
    }

    if (confidence.state === "partial_availability") {
      summary.partialCount += 1;
      continue;
    }

    if (confidence.state === "stale_unknown") {
      summary.staleCount += 1;
      continue;
    }

    if (confidence.state === "revalidation_failed") {
      summary.failedCount += 1;
      continue;
    }

    if (confidence.state === "unavailable") {
      summary.unavailableCount += 1;
    }
  }

  return summary;
};

export const resolveBookingAsyncState = (input: {
  isFailed?: boolean;
  isLoading?: boolean;
  isRefreshing?: boolean;
  isEmpty?: boolean;
  isPartial?: boolean;
  isStale?: boolean;
}): BookingAsyncState => {
  if (input.isFailed) return "failed";
  if (input.isLoading) return "initial_loading";
  if (input.isRefreshing) return "refreshing";
  if (input.isEmpty) return "empty";
  if (input.isPartial) return "partial";
  if (input.isStale) return "stale";
  return "loaded";
};

export const resolveAvailabilityAsyncState = (input: {
  itemCount: number;
  isFailed?: boolean;
  isLoading?: boolean;
  isRefreshing?: boolean;
  signals: AvailabilitySignalSummary;
}): BookingAsyncState =>
  resolveBookingAsyncState({
    isFailed: input.isFailed,
    isLoading: input.isLoading,
    isRefreshing: input.isRefreshing,
    isEmpty: input.itemCount === 0,
    isPartial: input.signals.partialCount > 0,
    isStale: input.signals.staleCount > 0 || input.signals.failedCount > 0,
  });
