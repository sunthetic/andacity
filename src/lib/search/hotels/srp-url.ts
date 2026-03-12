/**
 * Pure URL-building helpers for the Hotels SRP canonical route:
 * /hotels/in/[citySlug]/checkIn/[checkIn]/checkOut/[checkOut]/[pageNumber]
 *
 * These are extracted from the route file so they can be unit-tested independently.
 */

/** ISO-8601 date validation: YYYY-MM-DD */
export const isValidIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

/**
 * Builds a page URL: `{basePath}/{page}` optionally followed by a query string.
 */
export const toPageHref = (
  basePath: string,
  page: number,
  searchParams: URLSearchParams,
): string => {
  const qs = searchParams.toString();
  return qs ? `${basePath}/${page}?${qs}` : `${basePath}/${page}`;
};

/**
 * Generates an array of pagination link descriptors centred around `page`,
 * showing at most 5 consecutive page numbers.
 */
export const buildPageLinks = (
  page: number,
  totalPages: number,
  makeHref: (pageNumber: number) => string,
): { label: string; href: string; active?: boolean }[] => {
  const links: { label: string; href: string; active?: boolean }[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);

  for (let value = start; value <= end; value += 1) {
    links.push({
      label: String(value),
      href: makeHref(value),
      active: value === page,
    });
  }

  return links;
};

/**
 * Toggles a comma-separated checkbox filter value on/off in the query params
 * and returns the resulting page-1 URL.
 */
export const toggleCheckboxFilterHref = (
  basePath: string,
  searchParams: URLSearchParams,
  sectionId: string,
  optionValue: string,
): string => {
  const params = new URLSearchParams(searchParams);
  const current = new Set(
    String(params.get(sectionId) || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  if (current.has(optionValue)) {
    current.delete(optionValue);
  } else {
    current.add(optionValue);
  }

  if (!current.size) {
    params.delete(sectionId);
  } else {
    params.set(sectionId, Array.from(current).join(","));
  }

  return toPageHref(basePath, 1, params);
};

/**
 * Builds the canonical Hotels SRP href.
 *
 * When both `checkIn` and `checkOut` are provided the URL follows the
 * path-segment structure:
 *   /hotels/in/{citySlug}/checkIn/{checkIn}/checkOut/{checkOut}/{page}
 *
 * Falls back to the city-guide URL when either date is absent.
 */
export const buildSearchHotelsHref = (d: {
  citySlug: string;
  page: number;
  checkIn: string | null;
  checkOut: string | null;
  adults: number | null;
  rooms: number | null;
}): string => {
  if (!d.checkIn || !d.checkOut) {
    return `/hotels/in/${encodeURIComponent(d.citySlug)}`;
  }
  const base = `/hotels/in/${encodeURIComponent(d.citySlug)}/checkIn/${encodeURIComponent(d.checkIn)}/checkOut/${encodeURIComponent(d.checkOut)}/${d.page}`;
  const sp = new URLSearchParams();

  if (d.adults != null) sp.set("adults", String(d.adults));
  if (d.rooms != null) sp.set("rooms", String(d.rooms));

  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
};
