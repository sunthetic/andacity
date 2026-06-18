/**
 * CLAUDE-UI-005 — Home page sample: shared sample data.
 *
 * DEV / DESIGN-SAMPLE ONLY. Drives the preview at /dev/ui-home. All values are
 * illustrative placeholders — no live availability, prices, or quotes. Hrefs
 * point at routes that exist today so the sample feels real; nothing here
 * replaces the production home page (src/routes/index.tsx).
 */

export type HomeSearchField = {
  label: string;
  value: string;
  /** Optional small helper under the value (e.g. "Round trip"). */
  hint?: string;
};

export type HomeSearchVerticalId =
  | "flights"
  | "hotels"
  | "cars"
  | "destinations";

export type HomeSearchVertical = {
  id: HomeSearchVerticalId;
  label: string;
  /** One-line summary shown under the tab row. */
  summary: string;
  fields: HomeSearchField[];
  actionLabel: string;
  /** Where the canonical search flow would route (existing hubs today). */
  href: string;
};

/**
 * Four first-class verticals. Flights/Hotels/Cars mirror the existing
 * GlobalSearchEntry; Destinations is the discovery-first entry the home page
 * should anticipate. Fields are presentational placeholders.
 */
export const HOME_SEARCH_VERTICALS: HomeSearchVertical[] = [
  {
    id: "flights",
    label: "Flights",
    summary: "Route-first planning with departure and return dates.",
    fields: [
      { label: "From", value: "New York (JFK)" },
      { label: "To", value: "Lisbon (LIS)" },
      { label: "When", value: "Jun 14 – 20", hint: "Round trip" },
      { label: "Travelers", value: "1 adult" },
    ],
    actionLabel: "Search flights",
    href: "/flights",
  },
  {
    id: "hotels",
    label: "Hotels",
    summary: "Stay-first search by destination, dates, and guests.",
    fields: [
      { label: "Where to", value: "Lisbon, Portugal" },
      { label: "Dates", value: "Jun 14 – 20", hint: "6 nights" },
      { label: "Guests", value: "2 guests · 1 room" },
    ],
    actionLabel: "Search hotels",
    href: "/hotels",
  },
  {
    id: "cars",
    label: "Cars",
    summary: "Pick-up-first search with normalized locations and rental dates.",
    fields: [
      { label: "Pick-up", value: "Lisbon Airport (LIS)" },
      { label: "Dates", value: "Jun 14 – 20" },
      { label: "Driver age", value: "30+" },
    ],
    actionLabel: "Search cars",
    href: "/car-rentals",
  },
  {
    id: "destinations",
    label: "Destinations",
    summary: "Not sure yet? Start from a mood and a month.",
    fields: [
      { label: "Vibe", value: "Warm · coastal" },
      { label: "When", value: "This summer" },
      { label: "Budget", value: "Comfortable" },
    ],
    actionLabel: "Explore destinations",
    href: "/explore",
  },
];

/** Popular quick-fill chips shown beneath the search module. */
export const HOME_SEARCH_SUGGESTIONS: { label: string; href: string }[] = [
  { label: "Lisbon", href: "/hotels/in/new-york" },
  { label: "New York", href: "/hotels/in/new-york" },
  { label: "Miami beaches", href: "/destinations/miami" },
  { label: "Orlando parks", href: "/car-rentals/in/orlando" },
];

export type HomeVerticalEntry = {
  id: HomeSearchVerticalId;
  title: string;
  description: string;
  cta: string;
  href: string;
};

/** Multi-vertical intent row: every part of a trip is a first-class start. */
export const HOME_VERTICAL_ENTRIES: HomeVerticalEntry[] = [
  {
    id: "flights",
    title: "Flights",
    description: "Compare routes, times, and fares with a focused search flow.",
    cta: "Search flights",
    href: "/flights",
  },
  {
    id: "hotels",
    title: "Hotels",
    description: "Find stays by destination and dates, or browse city guides.",
    cta: "Search hotels",
    href: "/hotels",
  },
  {
    id: "cars",
    title: "Car rentals",
    description: "Pick-up-friendly rentals with city-by-city availability.",
    cta: "Search cars",
    href: "/car-rentals",
  },
  {
    id: "destinations",
    title: "Destinations",
    description: "Discover where to go by season, mood, or budget.",
    cta: "Start exploring",
    href: "/explore",
  },
];

export type HomeDestination = {
  name: string;
  meta: string;
  tag?: string;
  href: string;
};

/** Destination discovery — links use routes that exist today. */
export const HOME_DESTINATIONS: HomeDestination[] = [
  {
    name: "Miami",
    meta: "Beach stays · nonstop routes",
    tag: "Trending",
    href: "/destinations/miami",
  },
  {
    name: "San Diego",
    meta: "Coastal calm · easy drives",
    tag: "Editor’s pick",
    href: "/destinations/san-diego",
  },
  {
    name: "New York",
    meta: "Iconic stays · city transit",
    href: "/hotels/in/new-york",
  },
  {
    name: "Orlando",
    meta: "Rental-friendly · park trips",
    href: "/car-rentals/in/orlando",
  },
];

/** Popular routes — link to the flights hub (canonical params resolve there). */
export const HOME_POPULAR_ROUTES: { from: string; to: string; href: string }[] =
  [
    { from: "New York", to: "Lisbon", href: "/flights" },
    { from: "Los Angeles", to: "Tokyo", href: "/flights" },
    { from: "Miami", to: "San Juan", href: "/flights" },
    { from: "Chicago", to: "Cancún", href: "/flights" },
    { from: "Seattle", to: "Reykjavík", href: "/flights" },
    { from: "Boston", to: "Dublin", href: "/flights" },
  ];

export type HomeValueProp = { title: string; body: string; icon: string };

/**
 * "Why Andacity" — verifiable claims only. No guarantees, review counts, or
 * partnership claims the product doesn't back today. Mirrors footer trust copy.
 */
export const HOME_VALUE_PROPS: HomeValueProp[] = [
  {
    title: "The whole trip, together",
    body: "Flights, hotels, and cars in one place — move between them without restarting.",
    icon: "◇",
  },
  {
    title: "Transparent total pricing",
    body: "The price you see includes taxes and fees, so there are no surprises at checkout.",
    icon: "◎",
  },
  {
    title: "Clear policies up front",
    body: "Cancellation and fee terms are stated before you book, not buried after.",
    icon: "✓",
  },
  {
    title: "Save and compare",
    body: "Keep options side by side and decide at your own pace — no pressure timers.",
    icon: "❏",
  },
];

export type HomeEditorial = {
  kicker: string;
  title: string;
  excerpt: string;
  href: string;
};

/** Editorial inspiration — aspirational, honest, links to discovery surfaces. */
export const HOME_EDITORIAL: HomeEditorial[] = [
  {
    kicker: "City break",
    title: "48 unhurried hours in Lisbon",
    excerpt:
      "Trams, miradouros, and pastéis — a shoulder-season weekend that fits one carry-on.",
    href: "/explore",
  },
  {
    kicker: "Warm weather",
    title: "Where to chase the sun this summer",
    excerpt: "Coastlines worth the flight, sorted by how far you want to go.",
    href: "/explore",
  },
  {
    kicker: "Road trip",
    title: "Coastlines worth renting a car for",
    excerpt: "Drives that pair a great stay with an even better view.",
    href: "/car-rentals",
  },
];
