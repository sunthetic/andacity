/**
 * CLAUDE-UI-003 — Global shell sample: shared navigation data.
 *
 * DEV / DESIGN-SAMPLE ONLY. Drives the preview shell at /dev/ui-shell.
 * Hrefs point at existing production routes so the sample feels real, but
 * nothing here replaces the production SiteHeader/SiteFooter.
 */

export type ShellNavLink = { label: string; href: string };

/** Primary verticals — fast access is the header's first job. */
export const PRIMARY_NAV: ShellNavLink[] = [
  { label: "Flights", href: "/flights" },
  { label: "Hotels", href: "/hotels" },
  { label: "Cars", href: "/car-rentals" },
  { label: "Explore", href: "/explore" },
  { label: "Destinations", href: "/destinations" },
];

export const FOOTER_NAV: { title: string; links: ShellNavLink[] }[] = [
  {
    title: "Book",
    links: [
      { label: "Flights", href: "/flights" },
      { label: "Hotels", href: "/hotels" },
      { label: "Car rentals", href: "/car-rentals" },
      { label: "My trips", href: "/trips" },
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
    title: "Company",
    links: [
      { label: "About Andacity", href: "/explore" },
      { label: "How it works", href: "/explore" },
      { label: "Trust & safety", href: "/explore" },
      { label: "Support", href: "/explore" },
    ],
  },
];

export const SHELL_TRUST: string[] = [
  "Total price, no hidden fees",
  "Free cancellation on most stays",
  "24/7 traveler support",
];
