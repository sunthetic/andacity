export const FLIGHT_SORT_OPTIONS = [
  { label: "Smart rank", value: "recommended" },
  { label: "Price", value: "price-asc" },
  { label: "Duration", value: "duration" },
  { label: "Earliest departure", value: "departure-asc" },
] as const

export type FlightSortKey = (typeof FLIGHT_SORT_OPTIONS)[number]["value"]

export const isFlightSortKey = (value: string): value is FlightSortKey => {
  return FLIGHT_SORT_OPTIONS.some((option) => option.value === value);
};

export const normalizeFlightSortValue = (
  value: string | null | undefined,
): FlightSortKey => {
  const token = String(value || "").trim().toLowerCase();

  if (isFlightSortKey(token)) return token;
  if (token === "best" || token === "relevance" || token === "smart-rank") {
    return "recommended";
  }
  if (token === "price" || token === "price-low-to-high" || token === "price-desc") {
    return "price-asc";
  }
  if (token === "earliest-departure" || token === "departure") {
    return "departure-asc";
  }

  return "recommended";
};
