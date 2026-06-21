# Car Rentals by City Implementation

CLAUDE-UI-020 — production implementation of the approved CLAUDE-UI-019
car-rentals-by-city direction.

## Approved direction

Approved from CLAUDE-UI-019 sample:
- City-specific hero with real `CarRentalSearchCard`
- Real `CarRentalsResultsAdapter` (full facets/sort/pagination preserved)
- CSS-only pickup-area concept, labelled as non-geocoded
- Local driving/travel context, trust/policy clarity
- Related city links + whole-trip handoff
- Mobile sticky CTA

## Production files changed

- `src/routes/car-rentals/in/[citySlug]/index.tsx` — full rewrite of the
  default component; all loaders, head metadata, and helpers preserved exactly

## Data mapping notes

All data comes from the existing `useCityCarRentals` loader (unchanged):
- `city.name / city.region / city.country` — hero heading, eyebrow, facts grid
- `totalCount` — stat pills, mobile CTA text, driving context facts grid
- `results[].pickupArea` — CSS map concept (up to 4 real pickup areas shown as
  pins; falls back to generic labels when empty)
- Full `results / totalCount / page / totalPages / activeSort / selectedFilters /
  facets / searchState` → `CarRentalsResultsAdapter` (unchanged)

No illustrative or fabricated data used in production. All content is either
derived from loader data, conditionally rendered on real fields, or safely generic
(driving context cards, trust cards, trip handoff links).

## City hero implementation

`--ui-hero` band with `--ui-hero-scrim` overlay. Inside:
- Breadcrumb: Home / Car Rentals / {city.name} (real `aria-current="page"`)
- Region eyebrow: `{city.region} · {city.country}` (conditional on data)
- Single H1: **"Car rentals in {city.name}"**
- Dynamic value line (total count when > 0, generic message otherwise)
- Three stat pills: rentals count, "Pickup & dropoff dates", "Mileage & policy
  terms shown"
- Real `CarRentalSearchCard` (`variant="stacked"`, `surface="plain"`) inside a
  `--ui-*` panel (`id="car-search"` for mobile CTA anchor scroll); pre-filled
  with city name, pickupDate, dropoffDate, drivers from URL params

## Search/refinement implementation

Uses the real production `CarRentalSearchCard` with all existing behaviour:
- `LocationAutosuggestField` for pickup location (city + airport kinds)
- Real `DateField` pickers (pickup min = today, dropoff min = pickup+1)
- Drivers select (1–4)
- `buildCanonicalCarSearchHref` submit routing preserved
- `BookingValidationSummary` error display preserved
- `variant="stacked"` chosen over `"hero"` (hero layout targets desktop
  horizontal layout; stacked fits the side panel better on all viewport sizes)
- Preserves city context: `destinationValue={city.name}` pre-fills the field;
  URL `?pickupDate=…&dropoffDate=…&drivers=…` params are passed through

## Vehicle results implementation

Preserves the full `CarRentalsResultsAdapter` exactly:
- Real paged results from `loadCarRentalResultsPageFromDb` (page size 6)
- `CarRentalCard` per result (real fields: vehicle name, category, seats, bags,
  transmission, pickup area, pickup type, daily rate, currency, badges)
- Price refresh, save/compare, `CompareTray`, `CompareSheet` unchanged
- `CarRentalFilters` desktop + mobile unchanged
- `ResultsShell` sort + pagination + empty/failed states unchanged
- Empty state: "No car rentals match this selection in {city}" →
  reset filters or browse rental cities

## Filter/sort implementation

Full `CarRentalsResultsAdapter` filter/sort pipeline preserved:
- Vehicle class, pickup type, transmission, seats, price band
- Sort: Recommended / Price low→high / Highest rated / Best value
- URL-serialised filter+sort state (shareable URLs)
- `aria-pressed` / `aria-current` states inside `CarRentalFilters`
- No duplicate or presentational-only filter chips added (adapter handles all)

## Airport/city pickup implementation

Two safe pickup-prefill links in the pickup context section:
- "Airport pickup" → `/car-rentals?q={cityName}` (prefills real search, no
  counter/terminal/shuttle claims)
- "City centre pickup" → `/car-rentals?q={cityName}` (same)
- "Browse all rental cities" → `/car-rentals/in`
No invented airport-specific pages, no fake distances or fees.

## Static map/pickup concept implementation

CSS-only pickup-area surface inside the pickup context section:
- Road-grid background + highway diagonal (pure CSS, `aria-hidden`)
- Pins: real `pickupArea` strings from the page's results (up to 4); falls back
  to generic labels ["Airport area", "City centre", "Downtown", "North area"]
- First pin uses `--ui-primary` (active style); rest use `--ui-surface`
- City name label at fixed centre position
- "Pickup areas · concept" label (honest, always visible)
- `role="img"` with full honest aria-label: "…approximate pickup areas…
  not a geocoded map"
- All decorative layers `aria-hidden`
- No Mapbox/Leaflet/Google Maps/remote tiles/API keys

## Local driving/travel context implementation

Three generic-but-useful cards ("Confirm pickup details", "Mileage & fuel terms",
"Protection options") that replace the old "SEO payload" placeholder. City name
is interpolated into the first card body. Honest conditional language throughout
(no "free", "guaranteed", "unlimited").

Also: a 6-cell key-facts grid derived from real loader data (city name, region,
country, rental count, pickup types, search indexability note).

## Internal linking implementation

Crawlable links:
- Breadcrumb: Home → Car Rentals → {city}
- Pickup tiles: `/car-rentals?q={city}` (prefill search)
- "Browse all rental cities": `/car-rentals/in`
- Related rental cities: up to 3 from `KNOWN_RENTAL_CITIES` (las-vegas, orlando,
  new-york, miami), filtered to exclude current city, plus "All rental cities"
- Trip handoff: `/flights`, `/hotels/in/{citySlug}`, `/destinations`
- Result cards link to real `/car-rentals/{slug}` detail pages via
  `buildCarRentalDetailHrefWithDates`

All links point to valid existing routes.

## Trust and conversion implementation

Three conditional-phrasing policy cards ("Total price, up front", "Cancellation,
when offered", "No surprise add-ons"). No guarantees, no included-insurance
claims, no unlimited-mileage promises.

Mobile sticky CTA: "Refine search" → `#car-search` (the hero search panel).
Shows real total count when available. 44px minimum height.

## Empty/loading states

- 0 results: `CarRentalsResultsAdapter` renders its standard empty state
  ("No car rentals match this selection in {city}" + reset/browse actions)
- Pagination: `CarRentalsResultsAdapter` handles page clamping and rendering
- Hero stat pills: conditional on `totalCount > 0` (generic fallback copy)
- Mobile CTA text: "Search to compare rates" when `totalCount === 0`
- Map pins: fallback to generic area labels when no `pickupArea` fields in results

## Photography/image strategy

No remote images. Related-city thumbnail tiles use `--ui-hero` gradient as a
safe local stand-in (same as hotels-by-city). `CarRentalCard` uses real images
from results (or `/img/demo/car-1.jpg` fallback, already present in the DB
mapper). No new image dependencies introduced.

## SEO preservation notes

- City page remains **indexable**: no `noindex` in metadata, no
  `x-robots-tag` on the production route, no `shouldIndex` gate
- Title: `Car rentals in {cityName} | Andacity Travel` (unchanged pattern)
- Description: updated from developer copy to traveller copy ("Compare car rental
  options in {cityName}. Search by pickup date…")
- Canonical: `/car-rentals/in/{citySlug}` (unchanged)
- BreadcrumbList JSON-LD: preserved with same three items
- ItemList JSON-LD: preserved (maps all results slugs)
- Single `<h1>` confirmed in SSR
- Crawlable result and related-city links
- No "SEO payload" placeholder copy or developer-facing language

## Accessibility notes

- Single `<h1>` with clear city-specific label
- `<nav aria-label="Breadcrumb">` with `<ol>` and `aria-current="page"`
- `CarRentalSearchCard`: `LocationAutosuggestField` has `ariaLabel`; `DateField`
  has icon labels and overlay labels; all controls keyboard-accessible
- `CarRentalsResultsAdapter`: `CarRentalFilters` uses `aria-pressed` / focus
  management (unchanged); `ResultsShell` sort/pagination accessible (unchanged)
- Pickup tile links have descriptive `aria-label="Search car rentals — {label} in
  {city}"`
- CSS map: `role="img"` with honest non-geocoded label; all decoration
  `aria-hidden`; "concept" badge always visible
- Trust/context icon glyphs: `aria-hidden`
- Mobile sticky CTA: 44px min-height; `focus-visible:ring-2`
- `--ui-ring` focus ring on all interactive elements

## Responsive notes

- Hero collapses from two-column (heading + search card) to stacked at mobile
- Results grid: handled by `CarRentalsResultsAdapter` (unchanged)
- Pickup list + map: stacked on mobile, side-by-side on lg
- Related cities grid: 1 col → 2 (sm) → 4 (lg, with "All cities" as 4th card)
- Trip handoff: 1 col → 3 (sm)
- Driving context: 1 col → 3 (sm)
- Mobile sticky CTA: `lg:hidden`, covered by 20-spacer `h-20`
- `max-w-6xl` on all sections; no horizontal overflow

## Sample/preview cleanup

`src/components/dev/cars-city/` kept as historical reference per convention.
**No production import from `src/components/dev/`** — verified with grep. The
route imports only from `~/components/car-rentals/`, `~/components/ui/`,
`~/lib/`, and `~/types/`.

## Deferred work

- `CarRentalSearchCard` inner controls → `--ui-*` migration (shared with home
  page and `/car-rentals`)
- Per-city driving-context copy (currently generic; could be enriched from a
  `cityGuide` field if added to the car-rental city data model)
- Real geocoded pickup coordinates (would enable an accurate map; deferred until
  data exists)
- `/car-rentals/[slug]` detail page redesign
- Car rental search results (`/car-rentals/search/…`) redesign
- `/car-rentals/in` index page redesign

## Verification results

- `npm run build.types`: only the pre-existing `src/lib/db/client.server.ts(91,5)`
  SSL error — zero new errors ✓
- `npm run build`: `✓ built in 5.45s` ✓
- Dev smoke: all 18 routes 200 ✓
- `/car-rentals/in/orlando`: single H1 ("Car rentals in Orlando"), no `noindex`
  meta, no `x-robots-tag` on production route, `--ui-hero` in use, real search
  card present, JSON-LD BreadcrumbList + ItemList ✓
- `/car-rentals/in/new-york`: same ✓
- No production import from `src/components/dev/` ✓
