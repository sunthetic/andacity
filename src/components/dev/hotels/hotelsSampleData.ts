/**
 * CLAUDE-UI-007 — Hotels landing page sample: shared sample data.
 *
 * DEV / DESIGN-SAMPLE ONLY. Drives the preview at /dev/ui-hotels. All values
 * are illustrative placeholders — no live availability, prices, or quotes, and
 * no DB dependency (unlike the production /hotels route, which loads cities via
 * loadHotelCitiesFromDb). Hrefs point at routes that exist today so the sample
 * feels real; nothing here replaces the production /hotels page.
 */
import type { HotelCardModel } from "~/components/ui/HotelCard";
import type { FilterGroup } from "~/components/ui/FilterRail";

export type HotelSearchField = {
  label: string;
  value: string;
  hint?: string;
  /** Small leading glyph (decorative). */
  icon?: string;
};

/** Presentational search defaults (no live booking implied). */
export const HOTELS_SEARCH_FIELDS: HotelSearchField[] = [
  {
    label: "Destination",
    value: "Lisbon, Portugal",
    hint: "City, area, or hotel",
    icon: "📍",
  },
  { label: "Check-in", value: "Jun 14", hint: "Sat" },
  { label: "Check-out", value: "Jun 20", hint: "6 nights" },
  { label: "Guests & rooms", value: "2 guests · 1 room" },
];

/** Quick-fill chips under the search module — all real city routes. */
export const HOTELS_SEARCH_SUGGESTIONS: { label: string; href: string }[] = [
  { label: "Miami", href: "/hotels/in/miami" },
  { label: "New York", href: "/hotels/in/new-york" },
  { label: "Las Vegas", href: "/hotels/in/las-vegas" },
  { label: "Orlando", href: "/hotels/in/orlando" },
];

export type FeaturedCity = {
  name: string;
  meta: string;
  tag?: string;
  href: string;
};

/** Featured destination cards — link to real indexable city hub pages. */
export const HOTELS_FEATURED_CITIES: FeaturedCity[] = [
  {
    name: "Miami",
    meta: "Beachfront resorts · Art Deco",
    tag: "Trending",
    href: "/hotels/in/miami",
  },
  {
    name: "New York",
    meta: "Iconic stays · walkable",
    tag: "Editor’s pick",
    href: "/hotels/in/new-york",
  },
  {
    name: "Las Vegas",
    meta: "Strip suites · pools",
    href: "/hotels/in/las-vegas",
  },
  {
    name: "Orlando",
    meta: "Family resorts · near parks",
    href: "/hotels/in/orlando",
  },
];

/**
 * Featured stays — illustrative HotelCard models. `imageUrl` omitted so the
 * primitive falls back to the palette's --ui-hero gradient (no asset risk).
 * Links go to the search hub (these are sample properties, not real inventory).
 */
export const HOTELS_FEATURED_STAYS: HotelCardModel[] = [
  {
    name: "Memmo Alfama",
    area: "Alfama, Lisbon",
    rating: 9.4,
    reviewCount: 1204,
    stars: 5,
    priceTotal: "$214",
    priceQualifier: "Per night · taxes incl.",
    badges: ["Free cancellation"],
    href: "/hotels",
  },
  {
    name: "The Reefline Hotel",
    area: "South Beach, Miami",
    rating: 9.1,
    reviewCount: 2310,
    stars: 4,
    priceTotal: "$268",
    priceQualifier: "Per night · taxes incl.",
    badges: ["Pay later"],
    href: "/hotels",
  },
  {
    name: "Hudson & Vine",
    area: "Chelsea, New York",
    rating: 8.9,
    reviewCount: 3187,
    stars: 4,
    priceTotal: "$329",
    priceQualifier: "Per night · taxes incl.",
    badges: ["Free cancellation"],
    href: "/hotels",
  },
  {
    name: "Castelo Boutique",
    area: "Príncipe Real, Lisbon",
    rating: 9.2,
    reviewCount: 842,
    stars: 4,
    priceTotal: "$176",
    priceQualifier: "Per night · taxes incl.",
    badges: ["No resort fees"],
    href: "/hotels",
  },
];

export type SampleHotelResult = {
  name: string;
  area: string;
  rating: number;
  reviewLabel: string;
  reviewCount: number;
  stars: number;
  amenities: string[];
  /** One quiet, verifiable policy line (mirrors production policy copy). */
  policy: string;
  priceFrom: string;
  priceQualifier: string;
  badge?: string;
  href: string;
};

/** Illustrative results list rows (search-forward, horizontal layout). */
export const HOTELS_SAMPLE_RESULTS: SampleHotelResult[] = [
  {
    name: "Memmo Alfama",
    area: "Alfama · 0.4 mi from center",
    rating: 9.4,
    reviewLabel: "Exceptional",
    reviewCount: 1204,
    stars: 5,
    amenities: ["Rooftop pool", "Free Wi-Fi", "Breakfast"],
    policy: "Free cancellation until Jun 12",
    priceFrom: "$214",
    priceQualifier: "per night · taxes & fees incl.",
    badge: "Great value",
    href: "/hotels",
  },
  {
    name: "Castelo Boutique",
    area: "Príncipe Real · 0.9 mi from center",
    rating: 9.2,
    reviewLabel: "Superb",
    reviewCount: 842,
    stars: 4,
    amenities: ["Garden terrace", "Free Wi-Fi", "Air conditioning"],
    policy: "No resort fees · pay later available",
    priceFrom: "$176",
    priceQualifier: "per night · taxes & fees incl.",
    href: "/hotels",
  },
  {
    name: "Tagus River House",
    area: "Cais do Sodré · riverfront",
    rating: 8.8,
    reviewLabel: "Fabulous",
    reviewCount: 1976,
    stars: 4,
    amenities: ["River view", "Bar", "24h reception"],
    policy: "Free cancellation until Jun 13",
    priceFrom: "$158",
    priceQualifier: "per night · taxes & fees incl.",
    href: "/hotels",
  },
];

/** Quick horizontal filter chips above the results. */
export const HOTELS_QUICK_FILTERS: string[] = [
  "Free cancellation",
  "4+ stars",
  "Breakfast included",
  "Pool",
  "Under $250",
];

/** Filter sidebar groups for the FilterRail primitive. */
export const HOTELS_FILTER_GROUPS: FilterGroup[] = [
  {
    title: "Popular filters",
    options: [
      { label: "Free cancellation", count: 128, checked: true },
      { label: "Breakfast included", count: 86 },
      { label: "No prepayment", count: 64 },
    ],
  },
  {
    title: "Guest rating",
    options: [
      { label: "Wonderful 9+", count: 41 },
      { label: "Very good 8+", count: 112, checked: true },
      { label: "Good 7+", count: 203 },
    ],
  },
  {
    title: "Property type",
    options: [
      { label: "Hotels", count: 184 },
      { label: "Boutique", count: 37 },
      { label: "Apartments", count: 52 },
    ],
  },
  {
    title: "Amenities",
    options: [
      { label: "Pool", count: 73 },
      { label: "Air conditioning", count: 198 },
      { label: "Pet friendly", count: 44 },
    ],
  },
];

export type MapPin = { x: number; y: number; price: string; active?: boolean };

/** Illustrative price pins for the static map concept (percent coordinates). */
export const HOTELS_MAP_PINS: MapPin[] = [
  { x: 32, y: 38, price: "$214", active: true },
  { x: 58, y: 30, price: "$176" },
  { x: 46, y: 58, price: "$158" },
  { x: 71, y: 64, price: "$262" },
  { x: 24, y: 70, price: "$189" },
];

export type TrustPolicy = { title: string; body: string; icon: string };

/**
 * Policy/trust clarity — mirrors the language the product actually surfaces
 * (see defaultPolicies in hotels-pages.server.ts). Verifiable only; no
 * guarantees, star inflation, or invented review counts.
 */
export const HOTELS_TRUST: TrustPolicy[] = [
  {
    title: "Total price, up front",
    body: "Taxes and property fees are included in the price you compare — no checkout surprises.",
    icon: "◎",
  },
  {
    title: "Free cancellation, clearly marked",
    body: "When a rate is refundable, the deadline is shown on the card before you book.",
    icon: "✓",
  },
  {
    title: "Policies before payment",
    body: "Cancellation, payment timing, and fees are stated up front, not buried after.",
    icon: "❏",
  },
];

/** Popular hotel destinations grid — real city hub routes. */
export const HOTELS_POPULAR_DESTINATIONS: {
  city: string;
  blurb: string;
  href: string;
}[] = [
  { city: "Miami", blurb: "Beachfront & nightlife", href: "/hotels/in/miami" },
  { city: "New York", blurb: "Iconic city stays", href: "/hotels/in/new-york" },
  { city: "Las Vegas", blurb: "Strip resorts", href: "/hotels/in/las-vegas" },
  { city: "Orlando", blurb: "Near the parks", href: "/hotels/in/orlando" },
  {
    city: "All hotel cities",
    blurb: "Browse every city hub",
    href: "/hotels/in",
  },
  { city: "Search hotels", blurb: "Start a fresh search", href: "/hotels" },
];
