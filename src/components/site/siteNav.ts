/**
 * Shared global-shell navigation + trust copy.
 *
 * CLAUDE-UI-004: production data for the rebuilt SiteHeader/SiteFooter.
 * Every href maps to a route that exists today; no placeholder pages.
 */

export type SiteNavLink = { label: string; href: string };

/** Primary verticals — flat, top-level, no nested menus. */
export const PRIMARY_NAV: SiteNavLink[] = [
  { label: "Flights", href: "/flights" },
  { label: "Hotels", href: "/hotels" },
  { label: "Cars", href: "/car-rentals" },
  { label: "Explore", href: "/explore" },
  { label: "Destinations", href: "/destinations" },
];

export const SEARCH_HREF = "/#global-search-entry";
export const SEARCH_LABEL = "Search flights, hotels, and cars";

export const FOOTER_NAV: { title: string; links: SiteNavLink[] }[] = [
  {
    title: "Book",
    links: [
      { label: "Flights", href: "/flights" },
      { label: "Hotels", href: "/hotels" },
      { label: "Car rentals", href: "/car-rentals" },
      { label: "My Trips", href: "/my-trips" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Explore", href: "/explore" },
      { label: "Destinations", href: "/destinations" },
      { label: "Hotel city guides", href: "/hotels/in" },
      { label: "Rental cities", href: "/car-rentals/in" },
    ],
  },
  {
    title: "Plan",
    links: [
      { label: "Start a search", href: SEARCH_HREF },
      { label: "Current trip", href: "/trips" },
      { label: "Saved Travelers", href: "/travelers" },
      { label: "Sitemap", href: "/sitemap.xml" },
    ],
  },
];

/**
 * Quiet, verifiable trust copy only — no guarantees, review counts, or
 * partnership claims that the product doesn't actually back today.
 */
export const FOOTER_TRUST: string[] = [
  "Transparent total pricing",
  "Clear cancellation and fee policies",
  "Flights, hotels, and cars in one place",
];
