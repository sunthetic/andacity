/**
 * CLAUDE-UI-014 — Flights landing page content (production).
 *
 * Static, verifiable, fabrication-free content for the production /flights
 * landing page. Promoted from the CLAUDE-UI-013 sample with the fare section
 * reworked to be structure-first (no fictional carriers or example prices).
 *
 * Safety rules:
 *  - Popular-route tiles prefill the REAL /flights form (from/to text only) and
 *    never assert a price, demand, or availability. They do not auto-submit.
 *  - The flexible-date strip uses relative shape only — no amounts, no
 *    "cheapest day" claim — and is labeled illustrative in the UI.
 *  - The cabin comparison shows the typical gap between cabins, not real prices.
 *  - No "best fare", "price drop", "only X seats left", guarantees, or airline
 *    partnership claims anywhere.
 */

/** Popular route inspiration. Links prefill the real /flights search form. */
export type PopularRoute = {
  fromCity: string;
  fromCode: string;
  toCity: string;
  toCode: string;
  /** Neutral descriptor of the prefilled search — not an availability claim. */
  tag: string;
};

export const POPULAR_ROUTES: PopularRoute[] = [
  { fromCity: "New York", fromCode: "NYC", toCity: "Miami", toCode: "MIA", tag: "Round-trip" },
  { fromCity: "Los Angeles", fromCode: "LAX", toCity: "New York", toCode: "NYC", tag: "Round-trip" },
  { fromCity: "Chicago", fromCode: "CHI", toCity: "Orlando", toCode: "MCO", tag: "Round-trip" },
  { fromCity: "San Francisco", fromCode: "SFO", toCity: "Seattle", toCode: "SEA", tag: "Round-trip" },
  { fromCity: "Boston", fromCode: "BOS", toCity: "Washington", toCode: "WAS", tag: "Round-trip" },
  { fromCity: "Atlanta", fromCode: "ATL", toCity: "Las Vegas", toCode: "LAS", tag: "Round-trip" },
];

export const popularRouteHref = (route: PopularRoute) =>
  `/flights?from=${encodeURIComponent(route.fromCity)}&to=${encodeURIComponent(route.toCity)}`;

export const popularRouteLabel = (route: PopularRoute) =>
  `${route.fromCity} to ${route.toCity}`;

/**
 * Flexible-date concept. Relative heights only (0–1) — NO dollar values, NO
 * "cheapest day" claim. Demonstrates the shape of a flexible-date view.
 */
export type FlexCell = { day: string; relative: number };

export const FLEX_WEEK: FlexCell[] = [
  { day: "Mon", relative: 0.62 },
  { day: "Tue", relative: 0.38 },
  { day: "Wed", relative: 0.34 },
  { day: "Thu", relative: 0.55 },
  { day: "Fri", relative: 0.86 },
  { day: "Sat", relative: 0.92 },
  { day: "Sun", relative: 0.7 },
];

/** Flexible entry concepts. All link to the real /flights search (safe). */
export const FLEX_ENTRIES: { label: string; hint: string }[] = [
  { label: "Whole month", hint: "Scan a calendar instead of one date" },
  { label: "Weekend trips", hint: "Fri–Sun shaped getaways" },
  { label: "± 3 days", hint: "Shift dates to compare nearby options" },
];

/**
 * Cabin comparison concept. Relative bars (0–1) describe the typical *gap*
 * between cabins, not real prices. No axis numbers are rendered.
 */
export const CABIN_COMPARISON: { cabin: string; relative: number; note: string }[] = [
  { cabin: "Economy", relative: 0.34, note: "Lowest total, most availability" },
  { cabin: "Premium economy", relative: 0.56, note: "More room, priority boarding" },
  { cabin: "Business", relative: 0.84, note: "Lie-flat on long routes" },
];

/**
 * Fare anatomy — structure-first. Explains what each real search result shows,
 * with no fabricated airline, schedule, or price. Pairs with the cabin bars.
 */
export const FARE_ANATOMY: { icon: string; title: string; body: string }[] = [
  {
    icon: "⇆",
    title: "Stops & duration",
    body: "See nonstop versus connecting options at a glance, with total travel time.",
  },
  {
    icon: "◷",
    title: "Departure & arrival",
    body: "Local times for each leg, so early starts and late arrivals are obvious.",
  },
  {
    icon: "◎",
    title: "One all-in total",
    body: "Taxes and carrier fees are included in the single total you compare.",
  },
];

/** Whole-trip handoff to the rest of Andacity. All are real, valid routes. */
export const TRIP_HANDOFF: {
  title: string;
  body: string;
  cta: string;
  href: string;
}[] = [
  {
    title: "Add a hotel",
    body: "Match your stay to your flight dates with transparent total prices.",
    cta: "Browse hotels",
    href: "/hotels",
  },
  {
    title: "Add a car",
    body: "Pick up at the airport and keep the whole trip in one place.",
    cta: "Browse car rentals",
    href: "/car-rentals",
  },
  {
    title: "Plan what to do",
    body: "Explore destinations and ideas for where you're headed next.",
    cta: "Explore destinations",
    href: "/destinations",
  },
];
