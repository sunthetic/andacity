/**
 * CLAUDE-UI-011 — Hotels by City page sample: shared data.
 *
 * DEV / DESIGN-SAMPLE ONLY. Drives the preview at /dev/ui-hotels-city.
 * Everything here is ILLUSTRATIVE — Miami-themed fictional hotel properties
 * and illustrative prices. No DB dependency. Hrefs point at real existing
 * city routes so the sample navigation feels honest.
 *
 * Field shapes intentionally mirror the production HotelCity type in
 * src/data/hotel-cities.ts so CLAUDE-UI-012 can map real loader data onto
 * the same layout without structural changes.
 */
import type { HotelCardModel } from "~/components/ui/HotelCard";

/* ------------------------------------------------------------------ */
/* City summary                                                       */
/* ------------------------------------------------------------------ */

export type SampleCityNeighborhood = {
  name: string;
  count: number;
  blurb: string;
};

export type SampleCityAmenity = {
  name: string;
  count: number;
};

export type SampleCity = {
  city: string;
  citySlug: string;
  region: string;
  country: string;
  /** Illustrative starting nightly rate (whole USD). */
  priceFrom: number;
  hotelCount: number;
  topNeighborhoods: SampleCityNeighborhood[];
  topAmenities: SampleCityAmenity[];
};

export const SAMPLE_CITY: SampleCity = {
  city: "Miami",
  citySlug: "miami",
  region: "Florida",
  country: "United States",
  priceFrom: 128,
  hotelCount: 47,
  topNeighborhoods: [
    { name: "South Beach", count: 14, blurb: "Beachfront and Art Deco" },
    { name: "Brickell", count: 8, blurb: "Urban and walkable" },
    { name: "Downtown Miami", count: 7, blurb: "Business and bay views" },
    { name: "Wynwood", count: 6, blurb: "Arts district and nightlife" },
    { name: "Mid-Beach", count: 5, blurb: "Quieter, residential" },
    { name: "Coconut Grove", count: 4, blurb: "Laid-back marina neighborhood" },
  ],
  topAmenities: [
    { name: "Free Wi-Fi", count: 47 },
    { name: "Pool", count: 38 },
    { name: "Air conditioning", count: 45 },
    { name: "Beach access", count: 22 },
    { name: "Fitness center", count: 31 },
    { name: "Restaurant", count: 29 },
    { name: "Spa", count: 18 },
    { name: "Parking", count: 24 },
  ],
};

/* ------------------------------------------------------------------ */
/* Illustrative hotel cards                                           */
/* ------------------------------------------------------------------ */

/**
 * Illustrative Miami hotel cards. imageUrl omitted — HotelCard falls back
 * to --ui-hero gradient. All hrefs point at the real city search page.
 */
export const SAMPLE_HOTELS: HotelCardModel[] = [
  {
    name: "The Reefline Hotel",
    area: "South Beach, Miami",
    rating: 9.2,
    reviewCount: 1840,
    stars: 5,
    priceTotal: "$228",
    priceQualifier: "Per night · taxes incl.",
    badges: ["Free cancellation"],
    href: "/hotels/in/miami",
  },
  {
    name: "Palm Court",
    area: "South Beach, Miami",
    rating: 8.8,
    reviewCount: 2140,
    stars: 4,
    priceTotal: "$174",
    priceQualifier: "Per night · taxes incl.",
    badges: ["Pay later"],
    href: "/hotels/in/miami",
  },
  {
    name: "The Marlin House",
    area: "North Beach, Miami",
    rating: 9.1,
    reviewCount: 612,
    stars: 5,
    priceTotal: "$252",
    priceQualifier: "Per night · taxes incl.",
    badges: ["No resort fees"],
    href: "/hotels/in/miami",
  },
  {
    name: "Castelo Boutique",
    area: "Mid-Beach, Miami",
    rating: 9.0,
    reviewCount: 980,
    stars: 4,
    priceTotal: "$196",
    priceQualifier: "Per night · taxes incl.",
    badges: ["Free cancellation"],
    href: "/hotels/in/miami",
  },
  {
    name: "Brickell Bay Hotel",
    area: "Brickell, Miami",
    rating: 8.6,
    reviewCount: 1250,
    stars: 4,
    priceTotal: "$158",
    priceQualifier: "Per night · taxes incl.",
    badges: ["Pay later"],
    href: "/hotels/in/miami",
  },
  {
    name: "Wynwood Arts Inn",
    area: "Wynwood, Miami",
    rating: 8.3,
    reviewCount: 430,
    stars: 3,
    priceTotal: "$144",
    priceQualifier: "Per night · taxes incl.",
    badges: ["Free cancellation"],
    href: "/hotels/in/miami",
  },
];

/* ------------------------------------------------------------------ */
/* Filter chips                                                       */
/* ------------------------------------------------------------------ */

export type QuickFilter = {
  label: string;
  active?: boolean;
};

export const SAMPLE_QUICK_FILTERS: QuickFilter[] = [
  { label: "Free cancellation", active: true },
  { label: "Beachfront" },
  { label: "4+ stars" },
  { label: "Pool" },
  { label: "Under $250" },
];

/* ------------------------------------------------------------------ */
/* Map pins (CSS concept — illustrative % coordinates)                */
/* ------------------------------------------------------------------ */

export type MapPin = {
  x: number;
  y: number;
  label: string;
  price: string;
  active?: boolean;
};

/** Approximate layout for a Miami city shape — illustrative only. */
export const SAMPLE_MAP_PINS: MapPin[] = [
  { x: 68, y: 72, label: "South Beach", price: "$228", active: true },
  { x: 42, y: 38, label: "Brickell", price: "$158" },
  { x: 35, y: 22, label: "Downtown", price: "$172" },
  { x: 70, y: 48, label: "Mid-Beach", price: "$196" },
  { x: 25, y: 62, label: "Coconut Grove", price: "$184" },
];

/* ------------------------------------------------------------------ */
/* Related city links                                                 */
/* ------------------------------------------------------------------ */

export type RelatedCity = {
  city: string;
  blurb: string;
  href: string;
};

/** Other city hub pages — all point to real existing routes. */
export const SAMPLE_RELATED_CITIES: RelatedCity[] = [
  { city: "New York", blurb: "Iconic city stays", href: "/hotels/in/new-york" },
  { city: "Las Vegas", blurb: "Strip resorts and suites", href: "/hotels/in/las-vegas" },
  { city: "Orlando", blurb: "Family resorts near parks", href: "/hotels/in/orlando" },
  { city: "All hotel cities", blurb: "Browse every city hub", href: "/hotels/in" },
];
