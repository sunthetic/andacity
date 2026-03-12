import { describe, expect, it } from "vitest";
import {
  buildPageLinks,
  buildSearchHotelsHref,
  isValidIsoDate,
  toggleCheckboxFilterHref,
  toPageHref,
} from "~/lib/search/hotels/srp-url";

// ---------------------------------------------------------------------------
// isValidIsoDate
// ---------------------------------------------------------------------------

// Fixed reference date used throughout so tests remain deterministic.
// 2026-03-12 → valid range window is [2026-03-12, 2027-03-12].
const FIXED_NOW = new Date(2026, 2, 12); // March 12 2026 (local midnight)

// Helper: format a Date as YYYY-MM-DD.
const formatDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Helper: build a YYYY-MM-DD string by offsetting `base` by `deltaDays`.
const shiftDays = (base: Date, deltaDays: number): string =>
  formatDate(new Date(base.getFullYear(), base.getMonth(), base.getDate() + deltaDays));

// Helper: build a YYYY-MM-DD string by offsetting `base` by `deltaYears`.
const shiftYears = (base: Date, deltaYears: number): string =>
  formatDate(new Date(base.getFullYear() + deltaYears, base.getMonth(), base.getDate()));

describe("isValidIsoDate — format validation", () => {
  it("rejects an empty string", () => {
    expect(isValidIsoDate("", FIXED_NOW)).toBe(false);
  });

  it("rejects the wrong field order (DD-MM-YYYY)", () => {
    expect(isValidIsoDate("12-03-2026", FIXED_NOW)).toBe(false);
  });

  it("rejects slashes as separators", () => {
    expect(isValidIsoDate("2026/03/12", FIXED_NOW)).toBe(false);
  });

  it("rejects a compact form with no separators", () => {
    expect(isValidIsoDate("20260312", FIXED_NOW)).toBe(false);
  });

  it("rejects a single-digit month", () => {
    expect(isValidIsoDate("2026-3-12", FIXED_NOW)).toBe(false);
  });

  it("rejects a single-digit day", () => {
    expect(isValidIsoDate("2026-03-2", FIXED_NOW)).toBe(false);
  });

  it("rejects non-numeral characters in the month field", () => {
    expect(isValidIsoDate("2026-XX-12", FIXED_NOW)).toBe(false);
  });

  it("rejects non-numeral characters in the day field", () => {
    expect(isValidIsoDate("2026-03-XX", FIXED_NOW)).toBe(false);
  });
});

describe("isValidIsoDate — month boundary validation", () => {
  it("rejects month 00", () => {
    expect(isValidIsoDate("2026-00-15", FIXED_NOW)).toBe(false);
  });

  it("rejects month 13", () => {
    expect(isValidIsoDate("2026-13-15", FIXED_NOW)).toBe(false);
  });

  it("accepts month 01 (January)", () => {
    expect(isValidIsoDate("2027-01-15", FIXED_NOW)).toBe(true);
  });

  it("accepts month 12 (December)", () => {
    expect(isValidIsoDate("2026-12-15", FIXED_NOW)).toBe(true);
  });
});

describe("isValidIsoDate — day boundary validation", () => {
  it("rejects day 00", () => {
    expect(isValidIsoDate("2026-04-00", FIXED_NOW)).toBe(false);
  });

  it("rejects day 32 (never valid for any month)", () => {
    expect(isValidIsoDate("2026-04-32", FIXED_NOW)).toBe(false);
  });

  it("rejects day 31 for a 30-day month (April)", () => {
    expect(isValidIsoDate("2026-04-31", FIXED_NOW)).toBe(false);
  });

  it("accepts day 30 for a 30-day month (April)", () => {
    expect(isValidIsoDate("2026-04-30", FIXED_NOW)).toBe(true);
  });

  it("rejects day 31 for a 30-day month (September)", () => {
    expect(isValidIsoDate("2026-09-31", FIXED_NOW)).toBe(false);
  });

  it("accepts day 30 for a 30-day month (September)", () => {
    expect(isValidIsoDate("2026-09-30", FIXED_NOW)).toBe(true);
  });

  it("accepts day 31 for a 31-day month (January)", () => {
    expect(isValidIsoDate("2027-01-31", FIXED_NOW)).toBe(true);
  });

  it("accepts day 31 for a 31-day month (December)", () => {
    expect(isValidIsoDate("2026-12-31", FIXED_NOW)).toBe(true);
  });
});

describe("isValidIsoDate — February and leap-year validation", () => {
  it("rejects February 30 (never valid)", () => {
    // Use a now that puts 2027-02 in range
    expect(isValidIsoDate("2027-02-30", FIXED_NOW)).toBe(false);
  });

  it("rejects February 29 in a non-leap year (2027)", () => {
    expect(isValidIsoDate("2027-02-29", FIXED_NOW)).toBe(false);
  });

  it("accepts February 28 in a non-leap year", () => {
    expect(isValidIsoDate("2027-02-28", FIXED_NOW)).toBe(true);
  });

  it("accepts February 29 in a leap year (2024)", () => {
    // Use a now that puts 2024-02-29 within the valid range
    const now2024 = new Date(2024, 0, 1); // 2024-01-01
    expect(isValidIsoDate("2024-02-29", now2024)).toBe(true);
  });

  it("rejects February 29 in a common year (2023)", () => {
    const now2023 = new Date(2023, 0, 1); // 2023-01-01
    expect(isValidIsoDate("2023-02-29", now2023)).toBe(false);
  });

  it("accepts February 29 in a century year divisible by 400 (2000)", () => {
    // 2000 is a leap year (divisible by 400)
    const now2000 = new Date(2000, 0, 1); // 2000-01-01
    expect(isValidIsoDate("2000-02-29", now2000)).toBe(true);
  });

  it("rejects February 29 in a century year not divisible by 400 (1900)", () => {
    // 1900 is NOT a leap year (divisible by 100, not by 400)
    const now1900 = new Date(1900, 0, 1); // 1900-01-01
    expect(isValidIsoDate("1900-02-29", now1900)).toBe(false);
  });
});

describe("isValidIsoDate — date range validation", () => {
  it("accepts today's date (lower bound inclusive)", () => {
    expect(isValidIsoDate(shiftDays(FIXED_NOW, 0), FIXED_NOW)).toBe(true);
  });

  it("rejects yesterday (one day before today)", () => {
    expect(isValidIsoDate(shiftDays(FIXED_NOW, -1), FIXED_NOW)).toBe(false);
  });

  it("accepts a date 6 months from today", () => {
    expect(isValidIsoDate(shiftDays(FIXED_NOW, 183), FIXED_NOW)).toBe(true);
  });

  it("accepts a date exactly 1 year from today (upper bound inclusive)", () => {
    expect(isValidIsoDate(shiftYears(FIXED_NOW, 1), FIXED_NOW)).toBe(true);
  });

  it("rejects a date 1 year and 1 day from today (just beyond upper bound)", () => {
    const oneYearPlusOneDay = shiftDays(new Date(FIXED_NOW.getFullYear() + 1, FIXED_NOW.getMonth(), FIXED_NOW.getDate()), 1);
    expect(isValidIsoDate(oneYearPlusOneDay, FIXED_NOW)).toBe(false);
  });

  it("rejects a date far in the past", () => {
    expect(isValidIsoDate("2020-01-01", FIXED_NOW)).toBe(false);
  });

  it("rejects a date more than 1 year in the future", () => {
    expect(isValidIsoDate("2028-01-01", FIXED_NOW)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toPageHref
// ---------------------------------------------------------------------------

describe("toPageHref", () => {
  const base = "/hotels/in/miami/checkIn/2025-06-15/checkOut/2025-06-20";

  it("returns basePath/page when search params are empty", () => {
    expect(toPageHref(base, 3, new URLSearchParams())).toBe(`${base}/3`);
  });

  it("appends a query string when search params are present", () => {
    const sp = new URLSearchParams({ sort: "price_asc" });
    expect(toPageHref(base, 2, sp)).toBe(`${base}/2?sort=price_asc`);
  });

  it("does not append a '?' when search params are empty", () => {
    const href = toPageHref(base, 1, new URLSearchParams());
    expect(href).not.toContain("?");
  });
});

// ---------------------------------------------------------------------------
// buildPageLinks
// ---------------------------------------------------------------------------

describe("buildPageLinks", () => {
  it("marks the current page as active", () => {
    const links = buildPageLinks(3, 10, (p) => `/page/${p}`);
    const active = links.filter((l) => l.active);
    expect(active).toHaveLength(1);
    expect(active[0].label).toBe("3");
  });

  it("returns at most 5 links", () => {
    const links = buildPageLinks(5, 100, (p) => `/page/${p}`);
    expect(links.length).toBeLessThanOrEqual(5);
  });

  it("starts at page 1 when current page is near the beginning", () => {
    const links = buildPageLinks(1, 10, (p) => `/page/${p}`);
    expect(links[0].label).toBe("1");
  });

  it("does not exceed totalPages at the end", () => {
    const links = buildPageLinks(10, 10, (p) => `/page/${p}`);
    const max = Math.max(...links.map((l) => Number(l.label)));
    expect(max).toBe(10);
  });

  it("returns a single link when totalPages is 1", () => {
    const links = buildPageLinks(1, 1, (p) => `/page/${p}`);
    expect(links).toHaveLength(1);
    expect(links[0].active).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// toggleCheckboxFilterHref
// ---------------------------------------------------------------------------

describe("toggleCheckboxFilterHref", () => {
  const base = "/hotels/in/miami/checkIn/2025-06-15/checkOut/2025-06-20";

  it("adds a filter value when it is not already set", () => {
    const href = toggleCheckboxFilterHref(
      base,
      new URLSearchParams(),
      "starRating",
      "4",
    );
    expect(href).toBe(`${base}/1?starRating=4`);
  });

  it("removes a filter value when it is already set", () => {
    const sp = new URLSearchParams({ starRating: "4,5" });
    const href = toggleCheckboxFilterHref(base, sp, "starRating", "4");
    expect(href).toBe(`${base}/1?starRating=5`);
  });

  it("removes the query param entirely when the last value is toggled off", () => {
    const sp = new URLSearchParams({ starRating: "4" });
    const href = toggleCheckboxFilterHref(base, sp, "starRating", "4");
    expect(href).toBe(`${base}/1`);
    expect(href).not.toContain("starRating");
  });

  it("always resets to page 1", () => {
    const sp = new URLSearchParams({ starRating: "3" });
    const href = toggleCheckboxFilterHref(base, sp, "starRating", "5");
    expect(href).toMatch(/\/1(\?|$)/);
  });

  it("preserves other filters when toggling one", () => {
    const sp = new URLSearchParams({ starRating: "4", priceRange: "150-300" });
    const href = toggleCheckboxFilterHref(base, sp, "starRating", "5");
    expect(href).toContain("priceRange=150-300");
    expect(href).toContain("starRating=4%2C5"); // "4,5" URL-encoded
  });
});

// ---------------------------------------------------------------------------
// buildSearchHotelsHref
// ---------------------------------------------------------------------------

describe("buildSearchHotelsHref", () => {
  it("builds the canonical path-segment URL when both dates are present", () => {
    const href = buildSearchHotelsHref({
      citySlug: "miami",
      page: 1,
      checkIn: "2025-06-15",
      checkOut: "2025-06-20",
      adults: null,
      rooms: null,
    });
    expect(href).toBe(
      "/hotels/in/miami/checkIn/2025-06-15/checkOut/2025-06-20/1",
    );
  });

  it("includes adults and rooms as query params when provided", () => {
    const href = buildSearchHotelsHref({
      citySlug: "paris",
      page: 2,
      checkIn: "2025-09-01",
      checkOut: "2025-09-07",
      adults: 2,
      rooms: 1,
    });
    expect(href).toBe(
      "/hotels/in/paris/checkIn/2025-09-01/checkOut/2025-09-07/2?adults=2&rooms=1",
    );
  });

  it("falls back to city-guide URL when checkIn is null", () => {
    const href = buildSearchHotelsHref({
      citySlug: "tokyo",
      page: 1,
      checkIn: null,
      checkOut: "2025-09-07",
      adults: null,
      rooms: null,
    });
    expect(href).toBe("/hotels/in/tokyo");
  });

  it("falls back to city-guide URL when checkOut is null", () => {
    const href = buildSearchHotelsHref({
      citySlug: "london",
      page: 1,
      checkIn: "2025-08-01",
      checkOut: null,
      adults: null,
      rooms: null,
    });
    expect(href).toBe("/hotels/in/london");
  });

  it("falls back to city-guide URL when both dates are null", () => {
    const href = buildSearchHotelsHref({
      citySlug: "berlin",
      page: 1,
      checkIn: null,
      checkOut: null,
      adults: 2,
      rooms: 1,
    });
    expect(href).toBe("/hotels/in/berlin");
  });

  it("URL-encodes a city slug that contains special characters", () => {
    const href = buildSearchHotelsHref({
      citySlug: "new york",
      page: 1,
      checkIn: "2025-07-04",
      checkOut: "2025-07-08",
      adults: null,
      rooms: null,
    });
    expect(href).toContain("/hotels/in/new%20york/");
  });

  it("omits the query string entirely when adults and rooms are both null", () => {
    const href = buildSearchHotelsHref({
      citySlug: "miami",
      page: 1,
      checkIn: "2025-06-15",
      checkOut: "2025-06-20",
      adults: null,
      rooms: null,
    });
    expect(href).not.toContain("?");
  });

  it("reflects the page number in the URL path", () => {
    const href = buildSearchHotelsHref({
      citySlug: "miami",
      page: 5,
      checkIn: "2025-06-15",
      checkOut: "2025-06-20",
      adults: null,
      rooms: null,
    });
    expect(href.endsWith("/5")).toBe(true);
  });
});
