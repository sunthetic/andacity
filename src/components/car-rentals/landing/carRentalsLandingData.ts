/**
 * CLAUDE-UI-018 — Car rentals landing page content (production).
 *
 * Static, verifiable, fabrication-free content for the production /car-rentals
 * landing page. Promoted from the CLAUDE-UI-017 sample.
 *
 * Safety rules:
 *  - Vehicle classes describe structure only (seats, bags, transmission). No
 *    prices, no specific models, no supplier names, no inventory claims.
 *  - Airport tiles prefill the real /car-rentals form (city text only) and
 *    never assert a counter, shuttle, desk, or live supplier coverage.
 *  - City tiles link to real /car-rentals/in/{slug} pages — the same three
 *    slugs the production car-rentals page already trusts.
 *  - Policy clarity uses conditional phrasing ("when offered") throughout —
 *    no guaranteed insurance, unlimited mileage, or free-cancellation claims.
 *  - No "best deal", "only X cars left", scarcity, or urgency language.
 */

/* ------------------------------------------------------------------ */
/* Vehicle classes — structure only, no prices, no inventory          */
/* ------------------------------------------------------------------ */

export type VehicleClass = {
  name: string;
  blurb: string;
  seats: string;
  bags: string;
  transmission: string;
  /** Prefills the real /car-rentals search; never auto-submits. */
  href: string;
};

const prefillCarsHref = (location: string) =>
  `/car-rentals?q=${encodeURIComponent(location)}`;

export const VEHICLE_CLASSES: VehicleClass[] = [
  {
    name: "Economy",
    blurb: "Small, efficient, easy to park — built for city trips and solo travel.",
    seats: "Up to 4 seats",
    bags: "1–2 bags",
    transmission: "Automatic",
    href: prefillCarsHref("Las Vegas"),
  },
  {
    name: "Sedan",
    blurb: "More room and a smoother ride for highway miles and small groups.",
    seats: "Up to 5 seats",
    bags: "2–3 bags",
    transmission: "Automatic",
    href: prefillCarsHref("Orlando"),
  },
  {
    name: "SUV",
    blurb: "Higher clearance and cargo space for gear, road trips, and rougher terrain.",
    seats: "Up to 5 seats",
    bags: "3–4 bags",
    transmission: "Automatic",
    href: prefillCarsHref("Denver"),
  },
  {
    name: "Minivan",
    blurb: "Three rows for families and larger groups travelling together.",
    seats: "Up to 7 seats",
    bags: "4–5 bags",
    transmission: "Automatic",
    href: prefillCarsHref("Orlando"),
  },
  {
    name: "Convertible",
    blurb: "Open-top driving for scenic routes and warm-weather getaways.",
    seats: "Up to 4 seats",
    bags: "1–2 bags",
    transmission: "Automatic",
    href: prefillCarsHref("Miami"),
  },
  {
    name: "Luxury",
    blurb: "Premium interiors and features for special occasions and business travel.",
    seats: "Up to 5 seats",
    bags: "2–3 bags",
    transmission: "Automatic",
    href: prefillCarsHref("Los Angeles"),
  },
];

/* ------------------------------------------------------------------ */
/* Airport pickup tiles — prefill only, no counter/shuttle claims     */
/* ------------------------------------------------------------------ */

export type AirportPickupTile = {
  code: string;
  city: string;
  /** Prefills the real /car-rentals form (city text only). */
  href: string;
};

export const AIRPORT_PICKUP_TILES: AirportPickupTile[] = [
  { code: "LAS", city: "Las Vegas", href: prefillCarsHref("Las Vegas") },
  { code: "MCO", city: "Orlando", href: prefillCarsHref("Orlando") },
  { code: "LAX", city: "Los Angeles", href: prefillCarsHref("Los Angeles") },
  { code: "MIA", city: "Miami", href: prefillCarsHref("Miami") },
];

/* ------------------------------------------------------------------ */
/* City pickup tiles — real /car-rentals/in/{slug} pages only         */
/* ------------------------------------------------------------------ */

export type CityPickupTile = { name: string; slug: string; note: string };

export const CITY_PICKUP_TILES: CityPickupTile[] = [
  { name: "Las Vegas", slug: "las-vegas", note: "Strip & airport pickups" },
  { name: "Orlando", slug: "orlando", note: "Theme-park road trips" },
  { name: "New York", slug: "new-york", note: "City & airport pickups" },
];

/* ------------------------------------------------------------------ */
/* Comparison essentials — guidance labels, not fabricated values     */
/* ------------------------------------------------------------------ */

export const COMPARE_ESSENTIALS: { label: string; hint: string; icon: string }[] = [
  { label: "Seats", hint: "Match capacity to your group size.", icon: "◍" },
  { label: "Bags", hint: "Large + carry-on space for everyone.", icon: "❏" },
  { label: "Transmission", hint: "Automatic or manual, where offered.", icon: "⚙" },
  { label: "Fuel / range", hint: "Petrol, hybrid, or electric.", icon: "⛽" },
  { label: "Doors", hint: "2 or 4 doors for easy loading.", icon: "▥" },
  { label: "Pickup point", hint: "On-airport counter or city desk.", icon: "◎" },
];

/* ------------------------------------------------------------------ */
/* Policy clarity — conditional phrasing throughout                   */
/* ------------------------------------------------------------------ */

export const POLICY_CLARITY: { title: string; body: string; icon: string }[] = [
  {
    icon: "↻",
    title: "Cancellation, shown before you book",
    body: "When a rate offers free cancellation, the deadline is stated up front — not buried at checkout.",
  },
  {
    icon: "⛨",
    title: "Protection options, clearly listed",
    body: "Any insurance or damage-waiver options appear with what they cover, so you can decide before you reserve.",
  },
  {
    icon: "≡",
    title: "Mileage & fuel terms, up front",
    body: "Mileage limits and fuel policy are shown on each rate, so there are no surprises at the counter.",
  },
];

/* ------------------------------------------------------------------ */
/* Whole-trip handoff — real, valid routes                            */
/* ------------------------------------------------------------------ */

export const CAR_TRIP_HANDOFF: {
  title: string;
  body: string;
  cta: string;
  href: string;
}[] = [
  {
    title: "Add a flight",
    body: "Line up your car pickup with your arrival — search flights to the same city.",
    cta: "Search flights",
    href: "/flights",
  },
  {
    title: "Add a hotel",
    body: "Book a stay near your pickup point and keep the whole trip together.",
    cta: "Browse hotels",
    href: "/hotels",
  },
  {
    title: "Plan what to do",
    body: "Map out drives and day trips with destination ideas for where you're headed.",
    cta: "Explore destinations",
    href: "/destinations",
  },
];
