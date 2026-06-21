/**
 * CLAUDE-UI-019 — Car rentals by City page sample: shared data.
 *
 * DEV / DESIGN-SAMPLE ONLY. Drives the preview at /dev/ui-cars-city.
 * Everything here is ILLUSTRATIVE — an Orlando-themed concept with illustrative
 * vehicle classes and illustrative per-day prices. No DB dependency, no live
 * availability, no real supplier inventory.
 *
 * Field shapes intentionally mirror the production car-rentals-by-city data
 * (city summary + vehicle results) so CLAUDE-UI-020 can map the real
 * loadCarRentalCityBySlugFromDb / loadCarRentalResultsPageFromDb output onto the
 * same layout without structural changes.
 *
 * Safety rules baked into this data:
 *  - Vehicles are described by CLASS, never by supplier/brand name.
 *  - Prices are clearly illustrative per-day figures, never live rates.
 *  - No "best deal", "only X left", scarcity, urgency, free-shuttle, unlimited-
 *    mileage, included-insurance, or guarantee language.
 *  - Airport/city tiles prefill the real /car-rentals search (text only) or link
 *    to real /car-rentals/in/{slug} pages — never invented airport pages.
 *  - Map coordinates are illustrative layout percentages, not geocoded pins.
 */
import type { CarCardModel } from "~/components/ui/CarCard";

/* ------------------------------------------------------------------ */
/* City summary — mirrors production car-rental city shape            */
/* ------------------------------------------------------------------ */

export type SampleCarCitySummary = {
  city: string;
  citySlug: string;
  region: string;
  country: string;
  /** Illustrative starting per-day rate (whole USD). */
  priceFrom: number;
  /** Illustrative count of vehicles for layout only. */
  vehicleCount: number;
  /** Primary airport code travellers fly into for this city. */
  airportCode: string;
};

export const SAMPLE_CAR_CITY: SampleCarCitySummary = {
  city: "Orlando",
  citySlug: "orlando",
  region: "Florida",
  country: "United States",
  priceFrom: 29,
  vehicleCount: 38,
  airportCode: "MCO",
};

/* ------------------------------------------------------------------ */
/* Illustrative vehicle results — class-led, no supplier names        */
/* ------------------------------------------------------------------ */

/** Links every result to the real Orlando car-rentals city page. */
const cityHref = `/car-rentals/in/${SAMPLE_CAR_CITY.citySlug}`;

/**
 * Illustrative Orlando vehicle results. Named by CLASS ("or similar" follows the
 * industry-standard honest convention — the exact car is assigned at the
 * counter). imageUrl omitted — CarCard falls back to a local glyph. Prices are
 * illustrative per-day figures, clearly labelled in the UI.
 */
export const SAMPLE_CAR_RESULTS: CarCardModel[] = [
  {
    name: "Economy",
    spec: "Up to 4 seats · 2 bags · Automatic",
    pickup: "MCO airport · or similar",
    pricePerDay: "$29",
    href: cityHref,
  },
  {
    name: "Compact SUV",
    spec: "Up to 5 seats · 3 bags · Automatic",
    pickup: "MCO airport · or similar",
    pricePerDay: "$38",
    href: cityHref,
  },
  {
    name: "Full-size Sedan",
    spec: "Up to 5 seats · 3 bags · Automatic",
    pickup: "City desk · or similar",
    pricePerDay: "$41",
    href: cityHref,
  },
  {
    name: "Standard SUV",
    spec: "Up to 5 seats · 4 bags · Automatic",
    pickup: "MCO airport · or similar",
    pricePerDay: "$47",
    href: cityHref,
  },
  {
    name: "Minivan",
    spec: "Up to 7 seats · 5 bags · Automatic",
    pickup: "MCO airport · or similar",
    pricePerDay: "$58",
    href: cityHref,
  },
  {
    name: "Convertible",
    spec: "Up to 4 seats · 2 bags · Automatic",
    pickup: "City desk · or similar",
    pricePerDay: "$63",
    href: cityHref,
  },
];

/* ------------------------------------------------------------------ */
/* Filter / sort chips — presentational concept only                  */
/* ------------------------------------------------------------------ */

export type CarQuickFilter = { label: string; active?: boolean };

export const SAMPLE_CAR_SORTS: string[] = [
  "Recommended",
  "Price: low to high",
  "Largest vehicles",
];

export const SAMPLE_CAR_FILTERS: CarQuickFilter[] = [
  { label: "Airport pickup", active: true },
  { label: "SUV" },
  { label: "Automatic" },
  { label: "5+ seats" },
  { label: "Unlimited mileage" },
  { label: "Free cancellation" },
];

/* ------------------------------------------------------------------ */
/* Airport & city pickup — real targets only                          */
/* ------------------------------------------------------------------ */

/** Prefills the real /car-rentals search form (text only, no submit). */
const prefillCarsHref = (location: string) =>
  `/car-rentals?q=${encodeURIComponent(location)}`;

export type SampleCarPickupPoint = {
  label: string;
  note: string;
  href: string;
};

/**
 * Pickup points within the city. The airport tile prefills the real search; the
 * city-centre tile prefills the real search too. No invented per-terminal pages,
 * no counter/shuttle/distance claims.
 */
export const SAMPLE_PICKUP_POINTS: SampleCarPickupPoint[] = [
  {
    label: "Orlando International (MCO)",
    note: "Pick up on arrival",
    href: prefillCarsHref("Orlando"),
  },
  {
    label: "Orlando city centre",
    note: "Closer to your stay",
    href: prefillCarsHref("Orlando"),
  },
];

/* ------------------------------------------------------------------ */
/* Map / pickup concept (CSS only — illustrative % coordinates)       */
/* ------------------------------------------------------------------ */

export type CarMapPin = {
  x: number;
  y: number;
  label: string;
  active?: boolean;
};

/** Approximate layout for an Orlando pickup-area concept — illustrative only. */
export const SAMPLE_CAR_MAP_PINS: CarMapPin[] = [
  { x: 64, y: 70, label: "MCO airport", active: true },
  { x: 38, y: 40, label: "Downtown" },
  { x: 24, y: 64, label: "Theme parks" },
  { x: 72, y: 34, label: "Convention area" },
];

/* ------------------------------------------------------------------ */
/* Local driving / travel context                                     */
/* ------------------------------------------------------------------ */

export const SAMPLE_DRIVING_CONTEXT: { title: string; body: string; icon: string }[] = [
  {
    icon: "⛽",
    title: "Getting around",
    body: "Orlando is spread out and car-friendly — most theme parks, outlets, and resorts sit off the I-4 corridor with large free parking lots.",
  },
  {
    icon: "◎",
    title: "Airport pickup",
    body: "Most rentals are collected at or near Orlando International (MCO). Confirm the exact pickup point on each rate before you book.",
  },
  {
    icon: "❏",
    title: "Good to know",
    body: "Toll roads are common around the city — ask whether a transponder is included or how tolls are billed when you collect the car.",
  },
];

/* ------------------------------------------------------------------ */
/* Trust / policy clarity — conditional phrasing throughout           */
/* ------------------------------------------------------------------ */

export const SAMPLE_CAR_POLICY: { title: string; body: string; icon: string }[] = [
  {
    icon: "◎",
    title: "Total price, up front",
    body: "Taxes and mandatory fees are included in the totals you compare — the per-day figure is the basis, not a teaser.",
  },
  {
    icon: "↻",
    title: "Cancellation, when offered",
    body: "When a rate offers free cancellation, the deadline is shown on the rate before you book — not buried at checkout.",
  },
  {
    icon: "≡",
    title: "Mileage & fuel, clearly listed",
    body: "Mileage limits and fuel policy appear on each rate so there are no surprises at the counter.",
  },
];

/* ------------------------------------------------------------------ */
/* Internal links — related cities + whole-trip handoff               */
/* ------------------------------------------------------------------ */

export type RelatedCarCity = { city: string; blurb: string; href: string };

/** Other car-rental city hubs + the all-cities index — all real routes. */
export const SAMPLE_RELATED_CAR_CITIES: RelatedCarCity[] = [
  { city: "Las Vegas", blurb: "Strip & airport pickups", href: "/car-rentals/in/las-vegas" },
  { city: "New York", blurb: "City & airport pickups", href: "/car-rentals/in/new-york" },
  { city: "All rental cities", blurb: "Browse every city hub", href: "/car-rentals/in" },
];

export const SAMPLE_CAR_CITY_HANDOFF: {
  title: string;
  body: string;
  cta: string;
  href: string;
}[] = [
  {
    title: "Flights to Orlando",
    body: "Line up your pickup with your arrival — search flights to MCO.",
    cta: "Search flights",
    href: "/flights",
  },
  {
    title: "Hotels in Orlando",
    body: "Stay near your pickup point and keep the whole trip together.",
    cta: "Browse hotels",
    href: "/hotels/in/orlando",
  },
  {
    title: "Things to do",
    body: "Plan drives and day trips with destination ideas for the area.",
    cta: "Explore destinations",
    href: "/destinations",
  },
];
