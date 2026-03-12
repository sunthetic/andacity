export const HOTEL_SORT_OPTIONS = [
  { label: "Smart rank", value: "recommended" },
  { label: "Price", value: "price-asc" },
  { label: "Value", value: "value" },
  { label: "Rating", value: "rating-desc" },
] as const;

export type HotelSortKey = (typeof HOTEL_SORT_OPTIONS)[number]["value"];

export const isHotelSortKey = (value: string): value is HotelSortKey => {
  return HOTEL_SORT_OPTIONS.some((option) => option.value === value);
};

export const normalizeHotelSort = (
  value: string | null | undefined,
): HotelSortKey => {
  const token = String(value || "").trim().toLowerCase();

  if (isHotelSortKey(token)) return token;
  if (token === "relevance" || token === "best" || token === "smart-rank") {
    return "recommended";
  }
  if (token === "price" || token === "price-low-to-high") {
    return "price-asc";
  }
  if (token === "rating") {
    return "rating-desc";
  }
  if (token === "deal" || token === "best-value") {
    return "value";
  }

  return "recommended";
};
