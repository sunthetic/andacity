/**
 * CLAUDE-UI-025 — Global search results page sample data.
 *
 * DEV / DESIGN-SAMPLE ONLY. Everything in the hotels / flights / cars sections
 * below is ILLUSTRATIVE and exists only to demonstrate layout and direction at
 * /dev/ui-search. None of it is live availability, fare, supplier, or inventory
 * data.
 *
 * The card shapes intentionally mirror the production UI models in
 * src/types/search-ui.ts (HotelResultCardModel / FlightResultCardModel /
 * CarResultCardModel) so CLAUDE-UI-026 can map real results into the same layout
 * with no structural change.
 *
 * Data honesty rules baked in:
 *  - No real hotel, airline, or car-supplier names (all labels are obviously
 *    generic samples).
 *  - Every price is rendered with an "Illustrative" tag in the UI — never a live
 *    or bookable amount.
 *  - No relevance scores, "best match" claims, live availability, scarcity,
 *    "price drop", demand, guarantees, or partnership claims.
 *  - Result CTAs point at REAL Andacity search entry points (the production
 *    /hotels, /flights, /car-rentals landing forms and real /destinations
 *    guides) — they start a genuine search rather than implying a bookable
 *    illustrative offer.
 *  - The DESTINATIONS vertical uses the REAL production dataset
 *    (~/data/destinations) with real slugs, tags, and links.
 */
import { DESTINATIONS, type Destination } from '~/data/destinations'

/** Illustrative query the sample is built around. Clearly a sample value. */
export const SAMPLE_QUERY = 'Miami'

/** Verticals the global search concept spans. `cars` maps to /car-rentals. */
export type SearchVerticalKey = 'all' | 'hotels' | 'flights' | 'cars' | 'destinations'

export const VERTICALS: { key: SearchVerticalKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hotels', label: 'Hotels' },
  { key: 'flights', label: 'Flights' },
  { key: 'cars', label: 'Cars' },
  { key: 'destinations', label: 'Destinations' },
]

export const normalizeVertical = (raw: string | null | undefined): SearchVerticalKey => {
  const v = String(raw || '').trim().toLowerCase()
  if (v === 'hotels' || v === 'flights' || v === 'cars' || v === 'destinations') return v
  return 'all'
}

/* -----------------------------
   Real, always-valid search entry hrefs (start a genuine search)
----------------------------- */

const HOTELS_SEARCH_HREF = `/hotels?destination=${encodeURIComponent('Miami, FL')}`
const FLIGHTS_SEARCH_HREF = `/flights?from=${encodeURIComponent('New York')}&to=${encodeURIComponent('Miami')}`
const CARS_SEARCH_HREF = `/car-rentals?q=${encodeURIComponent('Miami, FL')}`

/* -----------------------------
   Hotel results — ILLUSTRATIVE. Mirrors HotelResultCardModel fields.
----------------------------- */

export type SampleHotelCard = {
  id: string
  hotelName: string
  cityLabel: string
  areaLabel: string
  /** Property class — structural, not a review/guest score. */
  starRating: number
  /** Structural amenity hints only — no claims of live availability. */
  amenitiesSummary: string[]
  /** Always rendered with an "Illustrative" tag in the UI. */
  priceDisplay: string
  /** Real entry point — starts a genuine /hotels search. */
  ctaHref: string
  ctaLabel: string
}

export const SAMPLE_HOTELS: SampleHotelCard[] = [
  {
    id: 'h1',
    hotelName: 'Sample Bayfront Hotel',
    cityLabel: 'Miami, FL',
    areaLabel: 'Downtown',
    starRating: 4,
    amenitiesSummary: ['Pool', 'Free Wi-Fi', 'Walkable area'],
    priceDisplay: '$182',
    ctaHref: HOTELS_SEARCH_HREF,
    ctaLabel: 'Search stays',
  },
  {
    id: 'h2',
    hotelName: 'Demo South Beach Suites',
    cityLabel: 'Miami, FL',
    areaLabel: 'South Beach',
    starRating: 4,
    amenitiesSummary: ['Beachfront', 'Breakfast', 'Gym'],
    priceDisplay: '$246',
    ctaHref: HOTELS_SEARCH_HREF,
    ctaLabel: 'Search stays',
  },
  {
    id: 'h3',
    hotelName: 'Example Wynwood Inn',
    cityLabel: 'Miami, FL',
    areaLabel: 'Wynwood',
    starRating: 3,
    amenitiesSummary: ['Boutique', 'Free Wi-Fi', 'Pet-friendly'],
    priceDisplay: '$139',
    ctaHref: HOTELS_SEARCH_HREF,
    ctaLabel: 'Search stays',
  },
]

/* -----------------------------
   Flight results — ILLUSTRATIVE. Mirrors FlightResultCardModel fields.
----------------------------- */

export type SampleFlightCard = {
  id: string
  /** Obviously generic sample carrier — never a real airline. */
  airlineLabel: string
  routeLabel: string
  departTime: string
  arriveTime: string
  durationLabel: string
  /** Structural, computed from this sample set — not a live claim. */
  stopSummary: string
  cabinLabel: string
  /** Always rendered with an "Illustrative" tag in the UI. */
  priceDisplay: string
  /** Real entry point — starts a genuine /flights search. */
  ctaHref: string
  ctaLabel: string
}

export const SAMPLE_FLIGHTS: SampleFlightCard[] = [
  {
    id: 'f1',
    airlineLabel: 'Andacity Sample Air',
    routeLabel: 'JFK → MIA',
    departTime: '7:40a',
    arriveTime: '10:45a',
    durationLabel: '3h 05m',
    stopSummary: 'Nonstop',
    cabinLabel: 'Economy',
    priceDisplay: '$214',
    ctaHref: FLIGHTS_SEARCH_HREF,
    ctaLabel: 'Search this route',
  },
  {
    id: 'f2',
    airlineLabel: 'Demo Skyways',
    routeLabel: 'JFK → MIA',
    departTime: '1:10p',
    arriveTime: '4:30p',
    durationLabel: '3h 20m',
    stopSummary: 'Nonstop',
    cabinLabel: 'Economy',
    priceDisplay: '$238',
    ctaHref: FLIGHTS_SEARCH_HREF,
    ctaLabel: 'Search this route',
  },
  {
    id: 'f3',
    airlineLabel: 'Meridian Example Air',
    routeLabel: 'JFK → MIA',
    departTime: '6:05p',
    arriveTime: '12:00a',
    durationLabel: '5h 55m',
    stopSummary: '1 stop · ATL',
    cabinLabel: 'Economy',
    priceDisplay: '$176',
    ctaHref: FLIGHTS_SEARCH_HREF,
    ctaLabel: 'Search this route',
  },
]

/* -----------------------------
   Car rental results — ILLUSTRATIVE. Mirrors CarResultCardModel fields.
----------------------------- */

export type SampleCarCard = {
  id: string
  vehicleName: string
  categoryLabel: string
  /** Obviously generic sample supplier — never a real company. */
  brandLabel: string
  pickupLabel: string
  transmissionLabel: string
  passengerLabel: string
  /** Always rendered with an "Illustrative" tag in the UI. */
  priceDisplay: string
  /** Real entry point — starts a genuine /car-rentals search. */
  ctaHref: string
  ctaLabel: string
}

export const SAMPLE_CARS: SampleCarCard[] = [
  {
    id: 'c1',
    vehicleName: 'Sample Midsize SUV',
    categoryLabel: 'SUV',
    brandLabel: 'Sample Rentals',
    pickupLabel: 'Miami (MIA)',
    transmissionLabel: 'Automatic',
    passengerLabel: '5 seats',
    priceDisplay: '$41/day',
    ctaHref: CARS_SEARCH_HREF,
    ctaLabel: 'Search cars',
  },
  {
    id: 'c2',
    vehicleName: 'Demo Compact',
    categoryLabel: 'Economy',
    brandLabel: 'Demo Mobility',
    pickupLabel: 'Miami (MIA)',
    transmissionLabel: 'Automatic',
    passengerLabel: '4 seats',
    priceDisplay: '$29/day',
    ctaHref: CARS_SEARCH_HREF,
    ctaLabel: 'Search cars',
  },
  {
    id: 'c3',
    vehicleName: 'Example Convertible',
    categoryLabel: 'Premium',
    brandLabel: 'Example Auto',
    pickupLabel: 'Miami (MIA)',
    transmissionLabel: 'Automatic',
    passengerLabel: '4 seats',
    priceDisplay: '$78/day',
    ctaHref: CARS_SEARCH_HREF,
    ctaLabel: 'Search cars',
  },
]

/* -----------------------------
   Destination results — REAL production data + real links.
----------------------------- */

export const SAMPLE_DESTINATIONS: Destination[] = DESTINATIONS

export const destinationGuideHref = (d: Destination) =>
  `/destinations/${encodeURIComponent(d.slug)}`
export const destinationHotelsHref = (d: Destination) =>
  `/hotels?destination=${encodeURIComponent(d.query)}`
export const destinationCarsHref = (d: Destination) =>
  `/car-rentals?q=${encodeURIComponent(d.query)}`

/* -----------------------------
   Per-vertical counts — derived from the sample/real sets, never invented.
----------------------------- */

export const VERTICAL_COUNTS: Record<Exclude<SearchVerticalKey, 'all'>, number> = {
  hotels: SAMPLE_HOTELS.length,
  flights: SAMPLE_FLIGHTS.length,
  cars: SAMPLE_CARS.length,
  destinations: SAMPLE_DESTINATIONS.length,
}

export const TOTAL_COUNT =
  VERTICAL_COUNTS.hotels +
  VERTICAL_COUNTS.flights +
  VERTICAL_COUNTS.cars +
  VERTICAL_COUNTS.destinations

/* -----------------------------
   Refinement (sort + filters) — CONCEPT-ONLY scaffolding.
   `supported` flags whether the matching per-vertical production results page
   already implements an equivalent control today.
----------------------------- */

export type SampleSortOption = { label: string; value: string; active?: boolean }

export const SAMPLE_SORTS: SampleSortOption[] = [
  { label: 'Most relevant', value: 'relevant', active: true },
  { label: 'Price (low to high)', value: 'price-asc' },
  { label: 'Name (A–Z)', value: 'name-asc' },
]

export type SampleFilterGroup = {
  title: string
  supported: boolean
  options: string[]
}

export const SAMPLE_FILTER_GROUPS: SampleFilterGroup[] = [
  { title: 'Result type', supported: true, options: ['Hotels', 'Flights', 'Cars', 'Destinations'] },
  { title: 'Price band', supported: true, options: ['$', '$$', '$$$'] },
  { title: 'Free cancellation', supported: false, options: ['Refundable only'] },
  { title: 'Guest rating', supported: false, options: ['Any', '8+', '9+'] },
]

/** Pagination concept — mirrors the real `[pageNumber]` route param. */
export const SAMPLE_PAGINATION = { page: 1, totalPages: 4 }

/* -----------------------------
   Whole-trip handoff — all real, valid routes.
----------------------------- */

export const SAMPLE_TRIP_HANDOFF: { label: string; href: string; sub: string }[] = [
  { label: 'Explore', href: '/explore', sub: 'Discover where to go next' },
  { label: 'Flights', href: '/flights', sub: 'Routes and nonstop options' },
  { label: 'Hotels', href: '/hotels', sub: 'Stays with clear totals' },
  { label: 'Car rentals', href: '/car-rentals', sub: 'Flexible pickup and classes' },
  { label: 'Destinations', href: '/destinations', sub: 'Browse the travel atlas' },
]
