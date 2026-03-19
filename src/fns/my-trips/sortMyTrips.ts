import {
  getOwnedItineraryGroupKey,
  type OwnedItineraryGroupKey,
} from "~/fns/itinerary/groupOwnedItineraries";
import type { ItinerarySummary } from "~/types/itinerary";

export const MY_TRIPS_GROUP_ORDER: OwnedItineraryGroupKey[] = [
  "in_progress",
  "upcoming",
  "issues",
  "past",
];

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

const compareNullableNumbersAsc = (
  left: number | null,
  right: number | null,
  fallback = Number.MAX_SAFE_INTEGER,
) => {
  return (left ?? fallback) - (right ?? fallback);
};

const compareNullableNumbersDesc = (
  left: number | null,
  right: number | null,
  fallback = 0,
) => {
  return (right ?? fallback) - (left ?? fallback);
};

const compareStrings = (left: string, right: string) => {
  return left.localeCompare(right, "en-US");
};

const getIssueTemporalRank = (
  summary: ItinerarySummary,
  options: {
    now?: Date | string | null;
  } = {},
) => {
  const nowMs = getNowMs(options.now);
  const startMs = toMillis(summary.startAt);
  const endMs = toMillis(summary.endAt || summary.startAt);

  if (
    summary.status === "in_progress" ||
    (startMs != null && startMs <= nowMs && (endMs == null || endMs >= nowMs))
  ) {
    return 0;
  }

  if (
    summary.status === "completed" ||
    summary.status === "archived" ||
    summary.status === "canceled" ||
    (endMs != null && endMs < nowMs)
  ) {
    return 2;
  }

  return 1;
};

const compareWithinGroup = (
  left: ItinerarySummary,
  right: ItinerarySummary,
  groupKey: OwnedItineraryGroupKey,
  options: {
    now?: Date | string | null;
  } = {},
) => {
  if (groupKey === "past") {
    return (
      compareNullableNumbersDesc(
        toMillis(left.endAt || left.startAt),
        toMillis(right.endAt || right.startAt),
      ) ||
      compareNullableNumbersDesc(
        toMillis(left.updatedAt),
        toMillis(right.updatedAt),
      ) ||
      compareStrings(left.publicRef, right.publicRef)
    );
  }

  if (groupKey === "issues") {
    return (
      getIssueTemporalRank(left, options) -
        getIssueTemporalRank(right, options) ||
      compareNullableNumbersAsc(
        toMillis(left.startAt || left.endAt),
        toMillis(right.startAt || right.endAt),
      ) ||
      compareNullableNumbersDesc(
        toMillis(left.updatedAt),
        toMillis(right.updatedAt),
      ) ||
      compareStrings(left.publicRef, right.publicRef)
    );
  }

  return (
    compareNullableNumbersAsc(
      toMillis(left.startAt || left.endAt),
      toMillis(right.startAt || right.endAt),
    ) ||
    compareNullableNumbersDesc(
      toMillis(left.updatedAt),
      toMillis(right.updatedAt),
    ) ||
    compareStrings(left.publicRef, right.publicRef)
  );
};

export const sortMyTrips = (
  summaries: ItinerarySummary[],
  options: {
    groupKey?: OwnedItineraryGroupKey;
    now?: Date | string | null;
  } = {},
) => {
  return [...summaries].sort((left, right) => {
    const leftGroup =
      options.groupKey || getOwnedItineraryGroupKey(left, { now: options.now });
    const rightGroup =
      options.groupKey ||
      getOwnedItineraryGroupKey(right, { now: options.now });

    if (leftGroup !== rightGroup) {
      return (
        MY_TRIPS_GROUP_ORDER.indexOf(leftGroup) -
        MY_TRIPS_GROUP_ORDER.indexOf(rightGroup)
      );
    }

    return compareWithinGroup(left, right, leftGroup, options);
  });
};
