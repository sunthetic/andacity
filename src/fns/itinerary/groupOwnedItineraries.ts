import { hasItineraryRecoveryIssue } from "~/lib/itinerary/buildItinerarySummary";
import type { ItinerarySummary } from "~/types/itinerary";

export const OWNED_ITINERARY_GROUP_KEYS = [
  "in_progress",
  "upcoming",
  "issues",
  "past",
] as const;

export type OwnedItineraryGroupKey =
  (typeof OWNED_ITINERARY_GROUP_KEYS)[number];

const toMillis = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const getNowMs = (value?: Date | string | null) => {
  if (!value) return Date.now();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
};

const hasTemporalIssue = (summary: ItinerarySummary) => {
  return Boolean(
    summary.hasRecoveryIssue ?? hasItineraryRecoveryIssue(summary),
  );
};

export const getOwnedItineraryGroupKey = (
  summary: ItinerarySummary,
  options: {
    now?: Date | string | null;
  } = {},
): OwnedItineraryGroupKey => {
  const nowMs = getNowMs(options.now);
  const startMs = toMillis(summary.startAt);
  const endMs = toMillis(summary.endAt || summary.startAt);

  if (hasTemporalIssue(summary) || summary.hasNotificationIssue) {
    return "issues";
  }

  if (summary.status === "in_progress") {
    return "in_progress";
  }

  if (
    startMs != null &&
    startMs <= nowMs &&
    (endMs == null || endMs >= nowMs)
  ) {
    return "in_progress";
  }

  if (
    summary.status === "completed" ||
    summary.status === "archived" ||
    summary.status === "canceled"
  ) {
    return "past";
  }

  if (endMs != null && endMs < nowMs) {
    return "past";
  }

  return "upcoming";
};

export const groupOwnedItineraries = (
  summaries: ItinerarySummary[],
  options: {
    now?: Date | string | null;
  } = {},
): Record<OwnedItineraryGroupKey, ItinerarySummary[]> => {
  const grouped: Record<OwnedItineraryGroupKey, ItinerarySummary[]> = {
    in_progress: [],
    upcoming: [],
    issues: [],
    past: [],
  };

  for (const summary of summaries) {
    grouped[getOwnedItineraryGroupKey(summary, options)].push(summary);
  }

  return grouped;
};
