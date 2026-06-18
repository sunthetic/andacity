/**
 * CLAUDE-UI-006 — Home page implementation: production content data.
 *
 * Promoted from the CLAUDE-UI-005 sample (src/components/dev/home/homeSampleData.ts)
 * with one functional change: the "Destinations" search intent now links to the
 * real /explore?theme=<key> filter (see src/routes/explore/index.tsx ThemeKey)
 * instead of presentational-only fields. Every href below maps to a route that
 * exists today — no placeholder pages, no invented availability or pricing.
 */

export type HomeSearchField = {
  label: string;
  value: string;
  /** Optional small helper under the value (e.g. "Round trip"). */
  hint?: string;
};

/**
 * Mirrors the `ThemeKey` union in src/routes/explore/index.tsx. Kept as a
 * small, independent literal set (rather than importing from a route module)
 * — if explore's theme keys ever change, this list needs a manual re-sync;
 * documented as a deferred follow-up in HOME_PAGE_IMPLEMENTATION.md.
 */
export type HomeDestinationVibe = {
  key: "beach" | "mountains" | "weekend-cities" | "warm-weather";
  label: string;
};

export const HOME_DESTINATION_VIBES: HomeDestinationVibe[] = [
  { key: "beach", label: "Beach escapes" },
  { key: "weekend-cities", label: "Weekend cities" },
  { key: "warm-weather", label: "Warm weather" },
  { key: "mountains", label: "Mountain getaways" },
];

export type HomeVerticalEntry = {
  id: "flights" | "hotels" | "cars" | "destinations";
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

/** Destination discovery — identical link targets to the legacy home page. */
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

/**
 * Popular routes — aspirational flavor text. Links route to the general
 * /flights hub rather than a deep-linked city pair: deep-linking requires a
 * resolved CanonicalLocation + date (see buildCanonicalFlightSearchHref),
 * which isn't available for a static marketing list without inventing a
 * specific date. This avoids implying a specific bookable fare exists.
 */
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
 * "Why Andacity" — verifiable claims only. Mirrors FOOTER_TRUST in
 * src/components/site/siteNav.ts so the home page and footer never disagree.
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
