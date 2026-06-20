# Car Rentals Landing Page Sample

> CLAUDE-UI-017 — preview-only, approval-gated. The production `/car-rentals`
> route is **not** changed by this task. Review at `/dev/ui-cars` (run
> `npm run dev`). Next after approval: CLAUDE-UI-018 — Car Rentals Landing Page
> Implementation.

## Purpose

Create a premium **Car Rentals Landing Page** direction for Andacity that makes
car-rental search feel practical, fast, calm, trustworthy, and mobility-native —
clearer and less cluttered than typical OTA rental-car pages — while preserving
the real canonical car-rental search flow and the utility travellers expect.

Design thesis:

> Pick up the right car for the trip, compare the essentials clearly, and keep
> the rest of the journey connected.

This document plus the `/dev/ui-cars` preview establish the visual direction,
layout, and editorial approach. Nothing here replaces production until approved.

---

## Current car rentals page observations

Production `src/routes/car-rentals/index.tsx`:

**Structure**
- Wraps everything in `VerticalHeroSearchLayout`
  (`src/components/search/VerticalHeroSearchLayout.tsx`) — the shared centered
  hero + search-card layout reused by the flights/hotels verticals, on legacy
  `--color-*` tokens.
- Hero: eyebrow "Car Rentals", H1 "Get the right car for where the trip takes
  you", a description line, `heroImageUrl="/images/hero/cars.svg"`, `cars` overlay.
- Search: the real `CarRentalSearchCard`
  (`src/components/car-rentals/CarRentalSearchCard.tsx`).
- Body: a short "Stay flexible on the ground" section, then a "Browse car rental
  cities" grid built from `loadCarRentalCitiesFromDb()`, with a `SearchEmptyState`
  fallback. Some copy is SEO-facing ("stronger internal linking across the Car
  Rentals vertical").

**Search flow (solid — preserved as-is conceptually)**
- `CarRentalSearchCard` holds pickup location via `LocationAutosuggestField`
  (kinds `city` + `airport`), pickup/dropoff via the real `DateField`, and a
  drivers select (1–4).
- Client-side validation via `validateSnapshot` (pickup location required and of
  an allowed kind; pickup today-or-later; dropoff at least one day after pickup).
- On valid submit it navigates to the canonical route from
  `buildCanonicalCarSearchHref` → `/car-rentals/search/{AIRPORT}/{pickup}/{dropoff}`
  (or the city/canonical equivalent).
- The route's `onGet` also server-redirects when `search=1` with a resolvable
  pickup location, so deep links work.
- `useCarRentalsSearchState` resolves the pickup location from URL values
  (`pickupLocation` / `pickupLocationId` / `q`), enabling **prefill via
  `/car-rentals?q=…`**.

**Metadata / indexability**
- `/car-rentals` is indexable: self-referential canonical, `BreadcrumbList` +
  `ItemList` JSON-LD over `loadFeaturedCarRentalsFromDb(24)`. Search result
  routes remain noindex; detail/city pages earn rankings. This sample preserves
  that posture (the landing page stays indexable; only the dev preview is noindex).

**Shared dependencies**
- `CarRentalSearchCard`, `VerticalHeroSearchLayout`, `SearchEmptyState`,
  `loadCarRentalCitiesFromDb`, `loadFeaturedCarRentalsFromDb`,
  `buildCanonicalCarSearchHref`. `/car-rentals/in/[citySlug]` reuses the same
  search card and city-page queries.

---

## Proposed car rentals page direction

A full-width `--ui-hero` band with a clear single `<h1>`, the **real**
`CarRentalSearchCard` embedded in a `--ui-*` panel, then calm, scannable sections:
vehicle classes → airport/city pickup → comparison essentials + policy clarity →
whole-trip handoff → trust. Editorial, mobility-native, less cluttered than OTA
rental pages, and honest about what is live vs. illustrative.

Section order (top to bottom):

1. Hero + real search module
2. Find the right class (vehicle classes)
3. Pick up where it suits the trip (airport + city pickup)
4. Compare the essentials + policy clarity
5. Got the car? Connect the trip (whole-trip handoff)
6. Booking you can read (trust)
7. Mobile sticky "Search cars" CTA

---

## Hero concept

- Full-bleed `--ui-hero` gradient + `--ui-hero-scrim` overlay (matches the
  shell/home/hotels/flights heroes), so it adapts across all six palettes ×
  light/dark.
- Breadcrumb `Home / Car Rentals` (`aria-current="page"` on the leaf).
- Eyebrow "Car Rentals", single `<h1>` **"Pick up the right car for the trip"**,
  one supporting line, and three capability pills — **real capabilities only**
  ("Airport & city pickup", "Pickup & dropoff dates", "1–4 drivers"), no
  fabricated stats.
- The search panel sits inside the hero on a `--ui-surface` card with
  `--ui-shadow-panel`, mirroring the approved flights landing layout.
- Photography-ready: a road/car image can drop into `background-image` over the
  existing scrim with no structural change.

## Search module concept

- Embeds the **real** `CarRentalSearchCard` with `variant="hero"` and
  `surface="plain"` inside a `--ui-*` frame — so submissions follow the genuine
  canonical car-rental search flow (location → pickup/dropoff dates → drivers →
  validated submit → `buildCanonicalCarSearchHref`). No fake or broken submits.
- A small caption ("Live rates & availability appear after you search") sets the
  honest expectation; no prices or availability are asserted on the landing page.
- The card keeps its own accessible labels, `DateField` pickers, and
  `BookingValidationSummary`. No developer/SEO copy.

## Pickup/dropoff concept

- Pickup and dropoff are handled entirely by the real search card's
  `LocationAutosuggestField` (city + airport) and two `DateField` pickers
  (pickup min = today, dropoff min = pickup + 1 day), exactly as production.
- The landing page reinforces pickup intent through two complementary entry
  points below the fold: **airport pickup** (prefill by city) and **city pickup**
  (real city guide pages). Time-of-day affordance is deferred to the search card
  /results, where a real time field belongs; the sample does not fake a time
  control.

## Vehicle class concept

- Six **class** cards (Economy, Sedan, SUV, Minivan, Convertible, Luxury) — each
  with a plain-language blurb and three structural traits (seats / bags /
  transmission) shown as chips.
- **No prices, no supplier names, no inventory.** Traits describe the class in
  general ("Up to 5 seats", "3–4 bags", "Automatic"), explicitly captioned: exact
  vehicles and rates come from a live search.
- Each card is an `<a>` that **prefills the real `/car-rentals?q=…` form** (text
  only) and never auto-submits — so the inspiration always lands on a real search.

## Airport/city pickup concept

- **Airport pickup**: a 2×2 tile grid (LAS / MCO / LAX / MIA) that prefills the
  real `/car-rentals?q={city}` form. Tiles never claim a counter, on-airport
  desk, or shuttle — "pickup desks load from a live search."
- **City pickup**: links to the real, already-trusted `/car-rentals/in/{slug}`
  city guide pages (las-vegas, orlando, new-york — the same slugs production
  links today) plus a "Browse all rental cities" link to `/car-rentals/in`.
- This separates the two genuine pickup intents (arrive-and-drive vs.
  stay-and-drive) without inventing supplier data.

## Comparison and policy clarity concept

- **Comparison essentials**: a six-item guidance grid (Seats, Bags, Transmission,
  Fuel/range, Doors, Pickup point) describing *what to weigh on every rate* — not
  fabricated data points. Captioned: actual values load from a real search.
- **Policy clarity**: three cards on cancellation, protection options, and
  mileage/fuel terms — all phrased **conditionally** ("when a rate offers free
  cancellation…", "any insurance or damage-waiver options appear with what they
  cover…"). No guarantee, no "included insurance", no "unlimited mileage" claim.

## Whole-trip handoff concept

- Three cards after the comparison block, on real routes:
  - **Add a flight** → `/flights`
  - **Add a hotel** → `/hotels`
  - **Plan what to do** → `/destinations`
- Placed after the comparison so it never competes with the primary search/compare
  task. All targets verified 200.

## Trust and conversion concept

- A "Booking you can read" trio: total price up front (taxes + mandatory fees in
  the compared total), policies before you book (cancellation/mileage/fuel shown
  on each rate), and no surprise add-ons.
- A mobile sticky CTA ("Search cars" → `#car-search`) keeps the primary action one
  tap away on small screens.
- **No** fake urgency, "only X cars left", "best deal", supplier guarantees, or
  shuttle/unlimited-mileage claims anywhere.

## Loading/empty state concept

- The landing page itself has no async result list, so no skeletons are needed at
  this level. The real search card owns its own validation summary and field
  states.
- For the implementation task, the production city grid's existing
  `SearchEmptyState` fallback (shown when `loadCarRentalCitiesFromDb()` returns
  empty) should be re-skinned on `--ui-*` and retained — the sample documents this
  rather than rendering a live DB grid in the dev preview.
- Result-page loading/empty/error states (the canonical search flow) are out of
  scope here; they belong to a future car-results task analogous to CLAUDE-UI-016.

## Photography/image strategy

- Gradient-first via `--ui-hero` / `--ui-hero-scrim`, so the page is complete with
  zero image dependencies and adapts to every palette/mode.
- A hero road/car photo can drop into the hero `background-image` over the scrim
  later with no layout change.
- Vehicle-class cards use a lightweight inline car glyph (no remote images, no map
  tiles, no external dependencies), consistent with the standing constraints.

## Responsive behavior

| Breakpoint | Behavior |
|---|---|
| Mobile (< `sm`) | Single-column hero, search card, and all section grids stack; vehicle/pickup/handoff tiles are full-width; sticky "Search cars" CTA visible; 20px spacer prevents overlap. |
| `sm`–`lg` | Vehicle classes 2-up; airport tiles 2-up; trust/handoff 3-up. |
| Desktop (`lg:+`) | Vehicle classes 3-up; pickup split into a 2-column airport/city layout; comparison uses a `1.2fr / 1fr` essentials-vs-policy split; sticky CTA hidden. |

All containers use `max-w-6xl` with wrapping to avoid horizontal overflow. The
real search card keeps its production hero grid at `md+`.

## Accessibility notes

- Exactly one `<h1>` (verified one in SSR output).
- Breadcrumb `<nav aria-label="Breadcrumb">` with `aria-current="page"`.
- All pickup/class/handoff tiles are real `<a href>` with descriptive
  `aria-label`s; decorative glyphs are `aria-hidden`.
- The embedded `CarRentalSearchCard` retains its accessible labels, date-picker
  controls, and validation summary.
- Interactive elements use visible `--ui-ring` focus styles; the search submit and
  mobile CTA meet the 44px tap-target minimum.
- Color roles come from `--ui-*` tokens (primary/accent/text/muted) tuned for
  contrast across all palette/mode pairs.

## SEO notes

- The **dev preview** at `/dev/ui-cars` is `noindex, nofollow` and 404/gated on
  the production host (via `shouldIndex(url)`), matching all other `/dev/ui-*`
  routes. Confirmed `x-robots-tag: noindex, nofollow`.
- The **implementation** task should preserve the production landing page's
  indexable posture: self-referential canonical, `BreadcrumbList` + `ItemList`
  JSON-LD, indexable landing while search-result routes stay noindex.
- No developer/SEO placeholder copy in the customer-facing sample; the production
  "internal linking" copy is replaced with traveller-facing language.

## Implementation boundary

This task creates **preview-only** assets and does not touch production:

- `src/components/dev/cars/carsSampleData.ts` (illustrative data)
- `src/components/dev/cars/CarsLandingSample.tsx` (sample body)
- `src/routes/dev/ui-cars/index.tsx` (noindex, prod-gated preview route)
- `docs/ui-redesign/samples/CARS_SAMPLE.md` (this doc)

It does **not** modify `src/routes/car-rentals/index.tsx`,
`CarRentalSearchCard`, `VerticalHeroSearchLayout`, or any shared results
component. No production import from `src/components/dev/`. The pre-existing DB
SSL TypeScript error in `src/lib/db/client.server.ts` is left untouched
(out of scope).

## Preview route

```txt
/dev/ui-cars
```

- Renders inside the production global shell (SiteHeader/SiteFooter), so palette +
  light/dark can be switched from the header theme control.
- `noindex, nofollow`; 404/gated on the production host.
- The search module is the **real** car-rental search.

## User decision needed

Approve, reject, or modify this car rentals landing direction before any
production implementation (CLAUDE-UI-018) begins. Specific open choices worth a
decision:

1. **Vehicle-class set** — is the six-class lineup (Economy, Sedan, SUV, Minivan,
   Convertible, Luxury) the right inspiration set, or should it map to whatever
   real classes the production data exposes?
2. **Airport tiles** — keep airport pickup as prefill-only tiles, or wire them to
   real airport canonical routes once date defaults are decided?
3. **Pickup time affordance** — leave time-of-day to the search card/results, or
   surface a time control on the landing page in implementation?

## Verification results

**TypeScript (`npm run build.types`):**
- One pre-existing error: `src/lib/db/client.server.ts(91,5)` — SSL property type
  error (pre-existing, unrelated to this task).
- Zero new type errors from CLAUDE-UI-017 ✓

**Production build (`npm run build`):**
- Build succeeds: `✓ built in 5.81s` ✓

**Dev smoke check (`npm run dev`, localhost:5174):**
- `/dev/ui-cars` — 200; renders hero, real search card (`action="/car-rentals"`,
  `#car-search` anchor), vehicle classes, airport/city pickup, comparison +
  policy clarity, whole-trip handoff, trust, mobile CTA, dev banner ✓
- Exactly one `<h1>` ("Pick up the right car for the trip");
  `x-robots-tag: noindex, nofollow`; gated/blocked on the production host ✓
- City link `/car-rentals/in/las-vegas` present ✓
- `/` 200, `/flights` 200, `/flights/search/JFK-MIA/2026-07-18/return/2026-07-25`
  200, `/hotels` 200, `/hotels/in/miami` 200, `/hotels/miami-motel-02` 200,
  `/car-rentals` 200 ✓
- Dev samples: `/dev/ui-flight-results`, `/dev/ui-flights`, `/dev/ui-hotels-city`,
  `/dev/ui-hotel-detail`, `/dev/ui-hotels`, `/dev/ui-home`, `/dev/ui-shell`,
  `/dev/ui-palettes` — all 200 ✓
