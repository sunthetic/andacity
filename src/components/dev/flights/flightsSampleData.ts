/**
 * CLAUDE-UI-013 — Flights landing page sample data.
 *
 * DEV / DESIGN-SAMPLE ONLY. Every value here is ILLUSTRATIVE and exists only to
 * demonstrate layout and direction at /dev/ui-flights. None of it is live fare,
 * schedule, availability, or airline-inventory data.
 *
 * Safety rules baked into this data:
 *  - No real airline names (avoids implying a live partnership). Carrier labels
 *    are obviously generic ("Andacity Sample Air").
 *  - No "best fare", "price drop", "only X seats left", or guarantee language.
 *  - Popular-route links prefill the REAL /flights form (from/to text only) and
 *    never assert a price or availability. They do not auto-submit.
 *  - Relative bars in the flexible / comparison concepts carry no axis values;
 *    where amounts appear they are explicitly tagged "Illustrative".
 */

/** Popular route inspiration. Links prefill the real /flights search form. */
export type SampleRoute = {
  fromCity: string;
  fromCode: string;
  toCity: string;
  toCode: string;
  /** Neutral descriptor of the prefilled search — not an availability claim. */
  tag: string;
};

const prefillFlightsHref = (fromCity: string, toCity: string) =>
  `/flights?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}`;

export const SAMPLE_POPULAR_ROUTES: SampleRoute[] = [
  { fromCity: "New York", fromCode: "NYC", toCity: "Miami", toCode: "MIA", tag: "Round-trip" },
  { fromCity: "Los Angeles", fromCode: "LAX", toCity: "New York", toCode: "NYC", tag: "Round-trip" },
  { fromCity: "Chicago", fromCode: "CHI", toCity: "Orlando", toCode: "MCO", tag: "Round-trip" },
  { fromCity: "San Francisco", fromCode: "SFO", toCity: "Seattle", toCode: "SEA", tag: "Round-trip" },
  { fromCity: "Boston", fromCode: "BOS", toCity: "Washington", toCode: "WAS", tag: "Round-trip" },
  { fromCity: "Atlanta", fromCode: "ATL", toCity: "Las Vegas", toCode: "LAS", tag: "Round-trip" },
];

export const sampleRouteHref = (route: SampleRoute) =>
  prefillFlightsHref(route.fromCity, route.toCity);

export const sampleRouteLabel = (route: SampleRoute) =>
  `${route.fromCity} to ${route.toCity}`;

/**
 * Flexible-date concept. Relative heights only (0–1) — NO dollar values, NO
 * "cheapest day" claim. Demonstrates the shape of a flexible-date view.
 */
export type SampleFlexCell = { day: string; relative: number };

export const SAMPLE_FLEX_WEEK: SampleFlexCell[] = [
  { day: "Mon", relative: 0.62 },
  { day: "Tue", relative: 0.38 },
  { day: "Wed", relative: 0.34 },
  { day: "Thu", relative: 0.55 },
  { day: "Fri", relative: 0.86 },
  { day: "Sat", relative: 0.92 },
  { day: "Sun", relative: 0.7 },
];

/** Flexible entry concepts. All link to the real /flights search (safe). */
export const SAMPLE_FLEX_ENTRIES: { label: string; hint: string }[] = [
  { label: "Whole month", hint: "Scan a calendar instead of one date" },
  { label: "Weekend trips", hint: "Fri–Sun shaped getaways" },
  { label: "± 3 days", hint: "Shift dates to compare nearby options" },
];

/**
 * Cabin comparison concept. Relative bars (0–1) describe the typical *gap*
 * between cabins, not real prices. No axis numbers are rendered.
 */
export const SAMPLE_CABIN_COMPARISON: { cabin: string; relative: number; note: string }[] = [
  { cabin: "Economy", relative: 0.34, note: "Lowest total, most availability" },
  { cabin: "Premium economy", relative: 0.56, note: "More room, priority boarding" },
  { cabin: "Business", relative: 0.84, note: "Lie-flat on long routes" },
];

/**
 * Illustrative fare cards (comparison structure preview). Carrier names are
 * intentionally generic. Prices are clearly labeled "Illustrative" in the UI.
 */
export type SampleFareCard = {
  airline: string;
  duration: string;
  stops: string;
  departTime: string;
  departCode: string;
  arriveTime: string;
  arriveCode: string;
  price: string;
  priceQualifier: string;
};

export const SAMPLE_FARE_CARDS: SampleFareCard[] = [
  {
    airline: "Andacity Sample Air",
    duration: "3h 05m",
    stops: "Nonstop",
    departTime: "7:40a",
    departCode: "NYC",
    arriveTime: "10:45a",
    arriveCode: "MIA",
    price: "$214",
    priceQualifier: "Illustrative · round trip",
  },
  {
    airline: "Demo Skyways",
    duration: "3h 20m",
    stops: "Nonstop",
    departTime: "1:10p",
    departCode: "NYC",
    arriveTime: "4:30p",
    arriveCode: "MIA",
    price: "$238",
    priceQualifier: "Illustrative · round trip",
  },
  {
    airline: "Meridian Example Air",
    duration: "5h 55m",
    stops: "1 stop",
    departTime: "6:05p",
    departCode: "NYC",
    arriveTime: "12:00a",
    arriveCode: "MIA",
    price: "$176",
    priceQualifier: "Illustrative · round trip",
  },
];

/** Whole-trip handoff to the rest of Andacity. All are real, valid routes. */
export const SAMPLE_TRIP_HANDOFF: {
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
