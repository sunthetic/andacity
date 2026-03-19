import { getOwnedItineraryGroupKey } from "~/fns/itinerary/groupOwnedItineraries";
import type { ItinerarySummary } from "~/types/itinerary";

export const MY_TRIPS_FILTER_VALUES = [
  "all",
  "upcoming",
  "past",
  "issues",
] as const;

export type MyTripsFilterValue = (typeof MY_TRIPS_FILTER_VALUES)[number];

export const normalizeMyTripsFilter = (value: unknown): MyTripsFilterValue => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return MY_TRIPS_FILTER_VALUES.includes(normalized as MyTripsFilterValue)
    ? (normalized as MyTripsFilterValue)
    : "all";
};

export const normalizeMyTripsSearch = (value: unknown) => {
  return String(value || "")
    .trim()
    .slice(0, 120);
};

const matchesMyTripsSearch = (summary: ItinerarySummary, search: string) => {
  const normalizedSearch = normalizeMyTripsSearch(search).toLowerCase();
  if (!normalizedSearch) return true;

  const haystack = [
    summary.title,
    summary.publicRef,
    summary.locationSummary,
    summary.tripDescription,
  ]
    .map((part) =>
      String(part || "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean)
    .join(" ");

  return haystack.includes(normalizedSearch);
};

const matchesMyTripsFilter = (
  summary: ItinerarySummary,
  filter: MyTripsFilterValue,
  options: {
    now?: Date | string | null;
  } = {},
) => {
  if (filter === "all") return true;

  const groupKey = getOwnedItineraryGroupKey(summary, options);

  if (filter === "upcoming") {
    return groupKey === "in_progress" || groupKey === "upcoming";
  }

  if (filter === "past") {
    return groupKey === "past";
  }

  return groupKey === "issues";
};

export const filterMyTrips = (
  summaries: ItinerarySummary[],
  input: {
    filter?: MyTripsFilterValue;
    search?: string | null;
    now?: Date | string | null;
  } = {},
) => {
  const filter = normalizeMyTripsFilter(input.filter);
  const search = normalizeMyTripsSearch(input.search);

  return summaries.filter((summary) => {
    return (
      matchesMyTripsFilter(summary, filter, { now: input.now }) &&
      matchesMyTripsSearch(summary, search)
    );
  });
};
