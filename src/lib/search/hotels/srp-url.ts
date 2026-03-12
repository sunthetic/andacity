/**
 * Pure URL-building helpers for the Hotels SRP canonical route:
 * /hotels/in/[citySlug]/checkIn/[checkIn]/checkOut/[checkOut]/[pageNumber]
 *
 * These are extracted from the route file so they can be unit-tested independently.
 */

/** Number of days in each month for a non-leap year. Index 0 is unused. */
const MONTH_DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const maxDaysInMonth = (year: number, month: number): number =>
  month === 2 && isLeapYear(year) ? 29 : MONTH_DAYS[month];

/**
 * Validates a URL date segment (YYYY-MM-DD).
 *
 * Checks:
 * 1. Format: exactly `\d{4}-\d{2}-\d{2}` (digits only, two-digit month and day).
 * 2. Month: 01–12.
 * 3. Day: 01 through the correct maximum for that month (leap-year aware).
 * 4. Range: the date falls within [today, today + 1 year] in local time.
 *
 * @param value - The date string to validate.
 * @param now   - Reference point for "today"; defaults to the current date. Provided for testing.
 */
export const isValidIsoDate = (value: string, now: Date = new Date()): boolean => {
  // 1. Upfront regex guard — rejects non-digits, wrong separators, wrong field widths
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  // 2. Month must be 01–12
  if (month < 1 || month > 12) return false;

  // 3. Day must be 01 through the correct maximum for that month
  if (day < 1 || day > maxDaysInMonth(year, month)) return false;

  // 4. Date range: [today (local), today + 1 year (local)]
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const maxLocal = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  const inputDate = new Date(year, month - 1, day);

  return inputDate >= todayLocal && inputDate <= maxLocal;
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
