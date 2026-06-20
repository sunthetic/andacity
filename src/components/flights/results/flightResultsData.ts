/**
 * CLAUDE-UI-016 — static data for the flight results page (production).
 * Trip handoff items only — links must be real, valid production routes.
 */

export const TRIP_HANDOFF_ITEMS: {
  title: string;
  body: string;
  cta: string;
  href: string;
}[] = [
  {
    title: "Add a hotel",
    body: "Hotels near your destination, with transparent total prices and cancellation terms.",
    cta: "Browse hotels",
    href: "/hotels",
  },
  {
    title: "Add a car",
    body: "Pick up a rental at the destination airport and keep the whole trip in one place.",
    cta: "Browse car rentals",
    href: "/car-rentals",
  },
  {
    title: "Plan what to do",
    body: "Explore destination ideas and plan what's next after you land.",
    cta: "Explore destinations",
    href: "/destinations",
  },
];
