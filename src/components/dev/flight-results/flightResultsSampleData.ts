/**
 * CLAUDE-UI-015 — Flight route results page sample data.
 *
 * DEV / DESIGN-SAMPLE ONLY. Every value here is ILLUSTRATIVE and exists only to
 * demonstrate layout and direction at /dev/ui-flight-results. None of it is live
 * fare, schedule, availability, or airline-inventory data.
 *
 * The card shape intentionally mirrors the production `FlightResultCardModel`
 * (src/types/search-ui.ts) so CLAUDE-UI-016 can map real results from
 * `mapFlightResultCardForUi` with no structural change.
 *
 * Safety rules baked in:
 *  - No real airline names (carrier labels are obviously generic).
 *  - Prices are clearly labeled "Illustrative" in the UI — never live fares.
 *  - No "best fare", "price drop", "only X seats left", guarantees, demand, or
 *    partnership claims.
 *  - The flexible-date strip is relative shape only (no amounts, no "cheapest
 *    day" claim) and is labeled illustrative.
 */

/** Route summary — mirrors FlightSearchSummaryModel fields. Illustrative. */
export const SAMPLE_SUMMARY = {
  originCode: "JFK",
  originCity: "New York",
  destinationCode: "MIA",
  destinationCity: "Miami",
  tripTypeLabel: "Round-trip",
  departDateLabel: "Sat, Jul 18",
  returnDateLabel: "Sat, Jul 25",
  travelersLabel: "1 traveler · Economy",
  resultCount: 28,
  /** Real edit-search target (prefills the production /flights form). */
  editSearchHref: "/flights?from=New York&to=Miami",
};

/**
 * Flexible-date strip — relative heights only (0–1), NO amounts, NO "cheapest
 * day" claim. CONCEPT-ONLY: production has no flexible-date fare dataset yet.
 */
export type FlexDay = { dow: string; date: string; relative: number; selected?: boolean };

export const SAMPLE_FLEX_DAYS: FlexDay[] = [
  { dow: "Wed", date: "Jul 15", relative: 0.7 },
  { dow: "Thu", date: "Jul 16", relative: 0.52 },
  { dow: "Fri", date: "Jul 17", relative: 0.9 },
  { dow: "Sat", date: "Jul 18", relative: 0.6, selected: true },
  { dow: "Sun", date: "Jul 19", relative: 0.74 },
  { dow: "Mon", date: "Jul 20", relative: 0.4 },
  { dow: "Tue", date: "Jul 21", relative: 0.36 },
];

/** Sort options — these MATCH real production behavior (FLIGHT_SORT_OPTIONS). */
export const SAMPLE_SORTS: { label: string; value: string; active?: boolean }[] = [
  { label: "Smart rank", value: "recommended", active: true },
  { label: "Price", value: "price-asc" },
  { label: "Duration", value: "duration" },
  { label: "Earliest departure", value: "departure-asc" },
];

/**
 * Filter groups. `supported` flags whether the production canonical results
 * route already implements the filter (true) or it is a concept-only idea
 * (false) for a future task.
 */
export type SampleFilterOption = { label: string; active?: boolean };
export type SampleFilterGroup = {
  title: string;
  supported: boolean;
  type: "single" | "multi";
  options: SampleFilterOption[];
};

export const SAMPLE_FILTER_GROUPS: SampleFilterGroup[] = [
  {
    title: "Stops",
    supported: true,
    type: "single",
    options: [
      { label: "Nonstop", active: true },
      { label: "Up to 1 stop" },
      { label: "Up to 2 stops" },
    ],
  },
  {
    title: "Departure window",
    supported: true,
    type: "multi",
    options: [
      { label: "Morning" },
      { label: "Afternoon", active: true },
      { label: "Evening" },
      { label: "Overnight" },
    ],
  },
  {
    title: "Arrival window",
    supported: true,
    type: "multi",
    options: [{ label: "Morning" }, { label: "Afternoon" }, { label: "Evening" }, { label: "Overnight" }],
  },
  {
    title: "Cabin class",
    supported: true,
    type: "single",
    options: [
      { label: "Economy" },
      { label: "Premium economy" },
      { label: "Business" },
      { label: "First" },
    ],
  },
  {
    title: "Price band",
    supported: true,
    type: "single",
    options: [
      { label: "Under $200" },
      { label: "$200–$400" },
      { label: "$400–$700" },
      { label: "$700+" },
    ],
  },
  {
    title: "Airline",
    supported: false,
    type: "multi",
    options: [
      { label: "Andacity Sample Air" },
      { label: "Demo Skyways" },
      { label: "Meridian Example Air" },
      { label: "Northwind Sample Jet" },
    ],
  },
  {
    title: "Bags included",
    supported: false,
    type: "multi",
    options: [{ label: "Carry-on" }, { label: "Checked bag" }],
  },
];

/**
 * Result cards — shaped to mirror FlightResultCardModel. Illustrative carriers
 * and prices; production maps `airlineLabel`/`price.display`/`ctaHref` to real
 * result data.
 */
export type SampleResultCard = {
  id: string;
  airlineLabel: string;
  flightNumberLabel: string;
  departTime: string;
  departCode: string;
  arriveTime: string;
  arriveCode: string;
  durationLabel: string;
  stopCount: number;
  stopSummary: string;
  cabinLabel: string;
  priceDisplay: string;
  /** Optional second-leg note for round-trip illustration. */
  returnNote?: string;
  /** Neutral, honest tag — never urgency. */
  tag?: string;
};

export const SAMPLE_RESULT_CARDS: SampleResultCard[] = [
  {
    id: "s1",
    airlineLabel: "Andacity Sample Air",
    flightNumberLabel: "AS 418",
    departTime: "7:40a",
    departCode: "JFK",
    arriveTime: "10:45a",
    arriveCode: "MIA",
    durationLabel: "3h 05m",
    stopCount: 0,
    stopSummary: "Nonstop",
    cabinLabel: "Economy · Main",
    priceDisplay: "$214",
    returnNote: "Return Jul 25 · nonstop",
    tag: "Shortest",
  },
  {
    id: "s2",
    airlineLabel: "Demo Skyways",
    flightNumberLabel: "DS 1192",
    departTime: "1:10p",
    departCode: "JFK",
    arriveTime: "4:30p",
    arriveCode: "MIA",
    durationLabel: "3h 20m",
    stopCount: 0,
    stopSummary: "Nonstop",
    cabinLabel: "Economy · Flex",
    priceDisplay: "$238",
    returnNote: "Return Jul 25 · nonstop",
  },
  {
    id: "s3",
    airlineLabel: "Meridian Example Air",
    flightNumberLabel: "ME 77",
    departTime: "6:05p",
    departCode: "JFK",
    arriveTime: "12:00a",
    arriveCode: "MIA",
    durationLabel: "5h 55m",
    stopCount: 1,
    stopSummary: "1 stop · ATL",
    cabinLabel: "Economy · Basic",
    priceDisplay: "$176",
    returnNote: "Return Jul 25 · 1 stop",
    tag: "Lowest illustrative",
  },
  {
    id: "s4",
    airlineLabel: "Northwind Sample Jet",
    flightNumberLabel: "NW 305",
    departTime: "9:15a",
    departCode: "JFK",
    arriveTime: "1:42p",
    arriveCode: "MIA",
    durationLabel: "4h 27m",
    stopCount: 1,
    stopSummary: "1 stop · CLT",
    cabinLabel: "Premium economy",
    priceDisplay: "$352",
    returnNote: "Return Jul 25 · nonstop",
  },
  {
    id: "s5",
    airlineLabel: "Andacity Sample Air",
    flightNumberLabel: "AS 902",
    departTime: "8:55p",
    departCode: "JFK",
    arriveTime: "11:58p",
    arriveCode: "MIA",
    durationLabel: "3h 03m",
    stopCount: 0,
    stopSummary: "Nonstop",
    cabinLabel: "Business",
    priceDisplay: "$612",
    returnNote: "Return Jul 25 · nonstop",
  },
];

/**
 * Fare/cabin comparison concept — structure-only. Relative bars (0–1) describe
 * the typical gap between fare tiers on a single option, NOT real prices.
 * CONCEPT-ONLY: production results carry a single cabin label per option today.
 */
export const SAMPLE_FARE_TIERS: { tier: string; relative: number; includes: string }[] = [
  { tier: "Basic", relative: 0.34, includes: "Seat assigned at check-in" },
  { tier: "Main", relative: 0.5, includes: "Seat choice + carry-on" },
  { tier: "Comfort+", relative: 0.72, includes: "Extra legroom + checked bag" },
];

/** Whole-trip handoff after choosing a flight. All real, valid routes. */
export const SAMPLE_TRIP_HANDOFF: {
  title: string;
  body: string;
  cta: string;
  href: string;
}[] = [
  {
    title: "Stay in Miami",
    body: "Hotels that match your flight dates, with transparent total prices.",
    cta: "Browse Miami hotels",
    href: "/hotels/in/miami",
  },
  {
    title: "Add a car",
    body: "Pick up at MIA and keep the whole trip in one place.",
    cta: "Browse car rentals",
    href: "/car-rentals",
  },
  {
    title: "Plan what to do",
    body: "Explore Miami ideas and nearby destinations.",
    cta: "Explore destinations",
    href: "/destinations",
  },
];
