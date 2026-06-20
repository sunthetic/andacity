/**
 * CLAUDE-UI-017 — Car rentals landing page sample data.
 *
 * DEV / DESIGN-SAMPLE ONLY. Every value here is ILLUSTRATIVE and exists only to
 * demonstrate layout and direction at /dev/ui-cars. None of it is live price,
 * availability, supplier-inventory, mileage, or insurance data.
 *
 * Safety rules baked into this data:
 *  - No supplier/brand names (avoids implying a live partnership). Vehicle
 *    examples are described by CLASS, not by inventory.
 *  - No prices. Vehicle classes are compared on STRUCTURE (seats, bags,
 *    transmission), never on fabricated rates.
 *  - No "best deal", "only X cars left", "free shuttle", "unlimited mileage",
 *    or guarantee language.
 *  - Pickup links target real routes: city pages prefill `/car-rentals/in/{slug}`
 *    (the same slugs the production page already links), airport/city tiles
 *    prefill the real `/car-rentals` search form (text only) and never assert a
 *    price or availability, and never auto-submit.
 */

/* ------------------------------------------------------------------ */
/* Vehicle classes — structure only, no prices, no inventory          */
/* ------------------------------------------------------------------ */

export type SampleVehicleClass = {
  name: string;
  /** Plain-language description of the class, not a specific car. */
  blurb: string;
  /** Typical seat capacity for the class (structural, not inventory). */
  seats: string;
  /** Typical large-bag capacity for the class. */
  bags: string;
  /** Transmission note — descriptive of the class, not a guarantee. */
  transmission: string;
  /** Prefills the real /car-rentals search; never auto-submits. */
  href: string;
};

/** Prefills the real car-rentals search form (location text only, no submit). */
const prefillCarsHref = (location: string) =>
  `/car-rentals?q=${encodeURIComponent(location)}`;

export const SAMPLE_VEHICLE_CLASSES: SampleVehicleClass[] = [
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
    blurb: "Higher clearance and cargo space for gear, road trips, and rougher roads.",
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
    blurb: "Premium interiors and extras for special occasions and business trips.",
    seats: "Up to 5 seats",
    bags: "2–3 bags",
    transmission: "Automatic",
    href: prefillCarsHref("Los Angeles"),
  },
];

/* ------------------------------------------------------------------ */
/* Pickup locations — city pages + airport prefill (real targets)     */
/* ------------------------------------------------------------------ */

/**
 * City pickup tiles link to real `/car-rentals/in/{slug}` city pages — the same
 * slugs the production car-rentals page already trusts.
 */
export type SampleCarCity = { name: string; slug: string; note: string };

export const SAMPLE_CAR_CITIES: SampleCarCity[] = [
  { name: "Las Vegas", slug: "las-vegas", note: "Strip & airport pickups" },
  { name: "Orlando", slug: "orlando", note: "Theme-park road trips" },
  { name: "New York", slug: "new-york", note: "City & airport pickups" },
];

/**
 * Airport pickup tiles prefill the real `/car-rentals` search form with the
 * city text only. They never claim a counter, shuttle, or on-airport desk —
 * pickup details come from a live search.
 */
export type SampleAirportPickup = { code: string; city: string; href: string };

export const SAMPLE_AIRPORT_PICKUPS: SampleAirportPickup[] = [
  { code: "LAS", city: "Las Vegas", href: prefillCarsHref("Las Vegas") },
  { code: "MCO", city: "Orlando", href: prefillCarsHref("Orlando") },
  { code: "LAX", city: "Los Angeles", href: prefillCarsHref("Los Angeles") },
  { code: "MIA", city: "Miami", href: prefillCarsHref("Miami") },
];

/* ------------------------------------------------------------------ */
/* Comparison essentials — what to weigh, not fabricated values       */
/* ------------------------------------------------------------------ */

/**
 * Comparison preview describes the ESSENTIALS travellers should weigh across
 * vehicles. These are guidance labels, not data points pulled from inventory.
 */
export const SAMPLE_COMPARE_ESSENTIALS: { label: string; hint: string; icon: string }[] = [
  { label: "Seats", hint: "Match capacity to your group size.", icon: "◍" },
  { label: "Bags", hint: "Large + carry-on space for everyone.", icon: "❏" },
  { label: "Transmission", hint: "Automatic or manual, where offered.", icon: "⚙" },
  { label: "Fuel / range", hint: "Petrol, hybrid, or electric.", icon: "⛽" },
  { label: "Doors", hint: "2 or 4 doors for easy loading.", icon: "▥" },
  { label: "Pickup point", hint: "On-airport counter or city desk.", icon: "◎" },
];

/* ------------------------------------------------------------------ */
/* Policy clarity — honest, conditional phrasing                      */
/* ------------------------------------------------------------------ */

/**
 * Policy clarity copy. Every line is CONDITIONAL ("when offered") so the sample
 * never asserts a guarantee, an included insurance, or an unlimited-mileage
 * term that production data may not support.
 */
export const SAMPLE_POLICY_CLARITY: { title: string; body: string; icon: string }[] = [
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

export const SAMPLE_TRIP_HANDOFF: {
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
    body: "Book a stay near your pickup point and keep the whole trip in one place.",
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
