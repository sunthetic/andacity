# Car Rentals by City Page Sample

CLAUDE-UI-019 — preview-only concept for `/car-rentals/in/[citySlug]`.
Rendered at `/dev/ui-cars-city` (Orlando). **Not production.** No production
city car-rental page has been changed.

## Purpose

Propose a premium, SEO-safe redesign of the car-rentals-by-city page that makes
local rental browsing feel practical, city-specific, trustworthy, and easy to
refine — while preserving the page's role as an indexable city hub. This is an
approval gate before CLAUDE-UI-020 (production implementation).

## Current car-rentals-by-city observations

Reviewed `src/routes/car-rentals/in/[citySlug]/index.tsx`:

- Built on the legacy `Page` shell + `--color-*` tokens (not the `--ui-*` system
  now used across `/`, `/hotels*`, `/flights*`, and `/car-rentals`).
- Loader (`useCityCarRentals`) resolves the city via
  `loadCarRentalCityBySlugFromDb`, then loads a real paged result set via
  `loadCarRentalResultsPageFromDb` (sort, filters, facets, pagination — page size 6).
- Renders the real `CarRentalSearchCard` in a sticky aside and the real
  `CarRentalsResultsAdapter` for results/filters/sort/pagination.
- H1 is already correct and city-specific: `Car rentals in {city}`.
- Breadcrumbs: Home / Car Rentals / {city}. Canonical + BreadcrumbList +
  ItemList JSON-LD present. City page is indexable; search pages stay noindex.
- Two weak spots the redesign targets: the "Why book here / Popular searches"
  badge cards are filler, and the city guide section is literally labelled as an
  "SEO payload" placeholder ("This section is your SEO payload…") — developer/SEO
  copy that should never ship to users.
- Shares dependencies with `/car-rentals` (`CarRentalSearchCard`, canonical
  search routing), `/hotels/in/[citySlug]` (city-hub pattern), and
  `/destinations/[slug]` (whole-trip handoff).

## Proposed city page direction

> Here are the best ways to compare rental cars in **this city** — with clear
> pickup intent, practical vehicle guidance, and honest local context, without
> unsupported claims.

A city-specific hero with a refinement card, a scannable vehicle-results grid, a
filter/sort bar, a CSS-only pickup-area concept, honest local driving context, a
trust/policy block, and crawlable related-city + whole-trip links — all on the
`--ui-*` system and strong on mobile.

Section order in the sample:
1. City hero + refinement card
2. Sticky filter/sort bar
3. Vehicle results grid (`CarCard` primitive)
4. Pickup points + CSS-only map concept
5. Local driving context
6. Trust / policy clarity
7. Related cities + whole-trip handoff
8. Mobile sticky CTA

## City hero concept

`--ui-hero` band with scrim. Breadcrumb (Home / Car Rentals / Orlando), region
eyebrow, single city-specific H1 **"Car rentals in Orlando"**, a one-line value
summary, and three honest stat pills (vehicle count, `MCO` & city pickup, pickup
& dropoff dates). A refinement card sits to the right (pickup location, pickup +
dropoff dates, drivers) with a primary CTA back to the indexable city route.

## Search/refinement concept

In the sample the refinement card is **presentational** (labelled fields) so the
dev route ships no fake submissions. In production (CLAUDE-UI-020) it would host
the **real `CarRentalSearchCard`** — the same component the current city page and
`/car-rentals` already use — pre-filled with the city, preserving canonical
search routing, URL prefill, and validation. The card emphasises refining
pickup/dropoff/date intent for *this* city. No fake live availability.

## Vehicle results/class concept

Reuses the CLAUDE-UI-002 `CarCard` primitive in a responsive 1/2/3-column grid.
Each card is class-led (Economy, Compact SUV, Full-size Sedan, Standard SUV,
Minivan, Convertible) with seats/bags/transmission spec, a pickup note, and an
illustrative per-day price. In the sample everything is **illustrative** and
labelled as such ("Vehicle classes and prices shown are illustrative…"). In
production the grid maps directly onto `loadCarRentalResultsPageFromDb` output
(or `CarRentalsResultsAdapter`), showing real fields only.

Safety: no supplier/brand names ("or similar" follows the honest counter
convention), no fake scarcity/urgency, no fake mileage/insurance/shuttle claims.

## Airport/city pickup concept

A pickup-points list offers airport (`MCO`) and city-centre collection. Each tile
prefills the **real** `/car-rentals` search (text only) — no invented
per-terminal pages, no counter/shuttle/distance/fee claims. A "Browse all rental
cities" link points to the real `/car-rentals/in` index.

## Filter/sort concept

A sticky filter/sort bar with a sort control (Recommended / Price low→high /
Largest vehicles) and quick-filter chips (Airport pickup, SUV, Automatic, 5+
seats, Unlimited mileage, Free cancellation). Presentational in the sample; in
production these map to the existing car-rental facet/sort params already handled
by `CarRentalsResultsAdapter` and `toCarRentalsSearchStateFilters`.

## Static map/pickup concept

A **CSS-only** pickup-area surface: a faint road-grid + a highway diagonal +
labelled area pins (MCO airport, Downtown, Theme parks, Convention area) and an
explicit "Pickup areas · concept" badge. `role="img"` with an honest aria-label
("…approximate pickup areas… not a geocoded map"). **No** Google Maps, Mapbox,
Leaflet, remote tiles, or API keys. Pins are illustrative layout percentages, not
geocoded coordinates — so the surface is supportive, never implies real pin
accuracy. If a real city lacks safe coordinate data, this surface can be hidden.

## Local driving/travel context concept

Three honest, practical cards (Getting around, Airport pickup, Good to know /
tolls). This replaces the current "SEO payload" placeholder with real
traveller-useful copy that still carries crawlable city context. Production copy
would be city-specific.

## Internal linking concept

- Breadcrumb: Home → Car Rentals → {city} (crawlable).
- Related rental cities: `/car-rentals/in/las-vegas`, `/car-rentals/in/new-york`,
  and the `/car-rentals/in` index (all real routes).
- Whole-trip handoff: `/flights`, `/hotels/in/orlando`, `/destinations`.
- Pickup tiles prefill `/car-rentals`; results/CTA link to the real city route.

All links target real existing routes — no invented URLs.

## Trust and conversion concept

A three-card policy block using **conditional** phrasing throughout: total price
up front (taxes/fees included), cancellation *when offered*, mileage & fuel terms
clearly listed. Plus a mobile sticky CTA ("See rentals") for fast conversion. No
guarantees, no included-insurance claims, no unlimited-mileage promises.

## Empty/loading state concept

Production would keep the existing `CarRentalsResultsAdapter` empty state
(primary "Search car rentals again" → `/car-rentals`, secondary "Browse rental
cities" → `/car-rentals/in`). Loading: the hero, refinement card, filter bar, and
context sections are static and render immediately; only the results grid depends
on the loader, so a skeleton of `CarCard` placeholders can fill the grid while
results resolve. The sample renders the populated state.

## Photography/image strategy

No remote images. All media tiles (related-city thumbnails) use the palette's
`--ui-hero` gradient as a safe local stand-in; vehicle cards use the local
`CarCard` glyph fallback. Production could later introduce real vehicle/city
imagery behind the same slots without layout change.

## Responsive behavior

- Hero collapses from two-column (content + refinement card) to stacked.
- Results grid: 1 col (mobile) → 2 (sm) → 3 (lg).
- Filter bar scrolls horizontally on mobile, sticky under the global header.
- Pickup list + map concept stack on mobile; map is `min-h` constrained.
- Mobile sticky CTA appears < lg with a 20-spacer so it never overlaps content.
- All tap targets ≥ 44px; `max-w-6xl` containers prevent horizontal overflow.

## Accessibility notes

- Single `<h1>`; sections use `<h2>`/`<h3>` in order.
- Breadcrumb is a labelled `<nav><ol>` with `aria-current="page"`.
- Map concept is `role="img"` with an honest non-geocoded aria-label; decorative
  layers are `aria-hidden`.
- Filter chips use `aria-pressed`; pickup/vehicle links have descriptive labels.
- Focus-visible rings via `--ui-ring` on every interactive element.
- No colour-only meaning; icons are decorative (`aria-hidden`).

## SEO notes

- One clear city H1; crawlable city context copy (no "SEO payload" leakage).
- Crawlable related-city and whole-trip links; canonical + BreadcrumbList +
  ItemList JSON-LD preserved in production (unchanged from current route).
- City page stays **indexable**; search/results stay noindex. The dev preview is
  `noindex, nofollow` and prod-gated.
- No keyword stuffing; copy reads for travellers, not crawlers.
- No generic duplicate-page feel — content is city-specific.

## Implementation boundary

This task adds **preview-only** files:
- `src/routes/dev/ui-cars-city/index.tsx`
- `src/components/dev/cars-city/CarsCitySample.tsx`
- `src/components/dev/cars-city/carsCitySampleData.ts`
- `docs/ui-redesign/samples/CARS_CITY_SAMPLE.md`

It does **not** touch `src/routes/car-rentals/in/[citySlug]/index.tsx` or any
production component, loader, or route. No production import from
`src/components/dev/`. No map deps, remote tiles, or API keys added. The
pre-existing DB SSL TypeScript error is untouched.

## Preview route

`/dev/ui-cars-city` — Orlando concept, behind the standard `/dev/ui-*` gate
(`shouldIndex` → 404 on the production host) with `x-robots-tag: noindex,
nofollow` and an amber "not production / illustrative" banner.

## User decision needed

1. **City for production first pass** — sample uses Orlando (`MCO`). Keep
   Orlando, or lead with another seeded city?
2. **Vehicle results source** — wire the **real** `CarRentalsResultsAdapter`
   (full facets/sort/pagination, page size 6, as today) into the new `--ui-*`
   frame, or use the lighter `CarCard` grid shown here mapped to real data?
3. **Map concept** — keep the CSS-only pickup-area surface, or drop it until real
   per-city pickup coordinates exist?
4. **Refinement card** — confirm production uses the real `CarRentalSearchCard`
   (as the current city page already does) inside the `--ui-*` hero.

## Verification results

- `npm run build.types`: only the pre-existing
  `src/lib/db/client.server.ts(91,5)` SSL error — zero new errors from this task.
- `npm run build`: succeeds (client + SSR).
- Dev smoke: `/dev/ui-cars-city` renders 200 with a single `<h1>` "Car rentals in
  Orlando", noindex header present, no production routes affected. Production
  routes (`/`, `/car-rentals`, `/car-rentals/in/orlando`, `/hotels*`, `/flights*`)
  remain unchanged and 200.

---

**Car rentals by city page sample ready for review.**

Options:
1. Approve this direction.
2. Reject this direction and request a different concept.
3. Modify this direction with specific changes.

No production car-rentals-by-city page implementation has been applied yet.

Recommended next task after approval:
CLAUDE-UI-020 — Car Rentals by City Implementation
