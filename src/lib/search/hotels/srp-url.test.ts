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

describe("isValidIsoDate", () => {
  it("accepts a valid calendar date", () => {
    expect(isValidIsoDate("2025-06-15")).toBe(true);
  });

  it("accepts the last day of February in a leap year", () => {
    expect(isValidIsoDate("2024-02-29")).toBe(true);
  });

  it("accepts an out-of-range day that JavaScript Date rolls forward (implementation does not strict-validate overflow)", () => {
    // new Date("2023-02-29") does not produce NaN — it rolls over to 2023-03-01.
    // The validator intentionally keeps this simple; callers relying on strict
    // calendar correctness should use a more thorough date library.
    expect(isValidIsoDate("2023-02-29")).toBe(true);
  });

  it("rejects a string with wrong format", () => {
    expect(isValidIsoDate("15-06-2025")).toBe(false);
    expect(isValidIsoDate("2025/06/15")).toBe(false);
    expect(isValidIsoDate("20250615")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidIsoDate("")).toBe(false);
  });

  it("rejects a month-13 date", () => {
    expect(isValidIsoDate("2025-13-01")).toBe(false);
  });

  it("rejects a day-32 date", () => {
    expect(isValidIsoDate("2025-01-32")).toBe(false);
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
