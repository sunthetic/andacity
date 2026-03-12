export const CAR_RENTALS_SORT_OPTIONS = [
  { label: "Smart rank", value: "recommended" },
  { label: "Price", value: "price-asc" },
  { label: "Value", value: "value" },
  { label: "Rating", value: "rating-desc" },
  { label: "Pickup convenience", value: "pickup-convenience" },
] as const

export type CarRentalsSortKey = (typeof CAR_RENTALS_SORT_OPTIONS)[number]["value"]

export const isCarRentalsSortKey = (value: string): value is CarRentalsSortKey => {
  return CAR_RENTALS_SORT_OPTIONS.some((option) => option.value === value);
};

export const normalizeCarRentalsSortValue = (
  value: string | null | undefined,
): CarRentalsSortKey => {
  const token = String(value || "").trim().toLowerCase();

  if (isCarRentalsSortKey(token)) return token;
  if (token === "best" || token === "smart-rank") return "recommended";
  if (token === "price" || token === "price-low-to-high") return "price-asc";
  if (token === "vehicle-class" || token === "deal") return "value";
  if (token === "rating") return "rating-desc";
  if (token === "price-desc") return "price-asc";

  return "recommended";
};
