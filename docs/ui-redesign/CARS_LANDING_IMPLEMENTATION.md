# Car Rentals Landing Page Implementation

> CLAUDE-UI-018 — production implementation of the approved CLAUDE-UI-017 car
> rentals landing page redesign. The production `/car-rentals` route now uses the
> `--ui-*` system. The dev preview at `/dev/ui-cars` is retained as historical
> reference. Next: CLAUDE-UI-019 — Car Rentals by City Page Sample.

## Approved direction

Promote the CLAUDE-UI-017 car rentals sample to production with these decisions:

- Practical, mobility-native landing with a clear single `<h1>` ("Pick up the
  right car for the trip").
- `--ui-hero` gradient band for the hero, matching the shell/home/hotels/flights
  heroes.
- Real `CarRentalSearchCard` (`variant="hero"`, `surface="plain"`) injected via
  the `searchCard` prop — canonical search routing fully preserved.
- Vehicle class inspiration (six classes: Economy through Luxury) — structural
  only, no prices, no inventory, no supplier names.
- Airport pickup tiles (LAS/MCO/LAX/MIA) that prefill the real `/car-rentals`
  form (city text only). No counter, shuttle, or terminal claims.
- City pickup tiles linking to real `/car-rentals/in/{slug}` pages
  (las-vegas / orlando / new-york), plus "Browse all rental cities" → `/car-rentals/in`.
- Comparison essentials (six guidance items) + policy clarity (three conditional
  cards) — no unsupported guarantees, unlimited-mileage, or insurance claims.
- Whole-trip handoff: flights → `/flights`, hotels → `/hotels`, destinations →
  `/destinations`.
- Trust trio: total price up front, policies before you book, no surprise add-ons.
- Mobile sticky "Search cars" CTA.
- Inner `CarRentalSearchCard` controls stay on existing styling (shared with
  home/city pages); migration deferred as documented.

---

## Production files changed

**Added:**
- `src/components/car-rentals/landing/carRentalsLandingData.ts` — static, verifiable
  content: `VEHICLE_CLASSES`, `AIRPORT_PICKUP_TILES`, `CITY_PICKUP_TILES`,
  `COMPARE_ESSENTIALS`, `POLICY_CLARITY`, `CAR_TRIP_HANDOFF`. All content
  fabrication-free.
- `src/components/car-rentals/landing/CarRentalsLanding.tsx` — production page
  body (no `<main>`): `CarsHero`, `VehicleClasses`, `PickupLocations`,
  `ComparisonAndPolicy`, `WholeTripHandoff`, `TrustSection`, `MobileStickyCta`.
  Accepts `searchCard: JSXOutput`.

**Rewritten:**
- `src/routes/car-rentals/index.tsx` — swapped `VerticalHeroSearchLayout` +
  inline JSX for `CarRentalsLanding`. All loaders (`useCarRentalsIndexPage`,
  `useCarRentalsSearchState`), `onGet` handler, and `head` metadata are preserved
  exactly. `cityItems` from the loader is no longer used for city-grid rendering
  (static city tiles are safer and consistent with the approved sample); the
  loader still runs for the `featuredRentals` JSON-LD.

**Unchanged (intentionally):**
- `src/components/car-rentals/CarRentalSearchCard.tsx` — inner controls stay as-is;
  shared with `HomeSearchModule` (CLAUDE-UI-006) and `car-rentals/in/[citySlug]`.
  Migration deferred.
- `src/components/car-rentals/CarRentalCard.tsx`,
  `CarRentalsResultsAdapter.tsx`, `CarRentalFilters.tsx` — unchanged.
- `src/routes/car-rentals/in/[citySlug]/index.tsx` — unchanged; still uses legacy
  `Page` + `VerticalHeroSearchLayout`.
- All CLAUDE-UI-004/006/008/010/012/014/016 work, theme switching, nav, footer.
- `src/lib/db/client.server.ts` SSL error — pre-existing, out of scope.

---

## Hero implementation

- Full-width `--ui-hero` gradient + `--ui-hero-scrim` overlay band (matches all
  other `--ui-*` hero surfaces — adapts to all six palettes × light/dark).
- Breadcrumb: Home / Car Rentals (`aria-current="page"` on the last item;
  `<nav aria-label="Breadcrumb">`).
- Eyebrow "Car Rentals", `<h1>` **"Pick up the right car for the trip"** (one
  per page — confirmed one in SSR), supporting copy, three real-capability pills.
- Search panel on `--ui-surface` + `--ui-shadow-panel` + `--ui-radius-lg`,
  identical layout to the flights landing hero panel.

## Search module implementation

- `CarRentalsLanding` accepts a `searchCard: JSXOutput` prop — the route wires the
  real `CarRentalSearchCard` with all loader-prefilled values.
- Prefill: `destinationValue`, `initialPickupLocation`, `pickupDate`, `dropoffDate`,
  `drivers` — exactly as the original route wired them.
- On valid submit: `buildCanonicalCarSearchHref` → `/car-rentals/search/{…}` (the
  same canonical flow, unchanged).
- "Live rates & availability appear after you search" caption sets honest expectation.
- `id="car-search"` anchor on the panel — the mobile CTA scrolls to it.

## CarRentalSearchCard styling notes

The inner controls (`BookingSearchField`, `LocationAutosuggestField`, `DateField`,
driver `select`, submit `button`) keep their existing `BookingSearchSurface` /
`BOOKING_SEARCH_CONTROL_CLASS` styling. This is the same approach used for
`FlightsSearchCard` in the flights landing (`CLAUDE-UI-014`): the landing page
provides the `--ui-*` frame; the card's inner primitives are shared with
`HomeSearchModule` and `car-rentals/in/[citySlug]` and should migrate in a
dedicated search-primitives task.

Deferred: full `--ui-*` migration of `CarRentalSearchCard` inner controls.

## Pickup/dropoff implementation

Pickup and dropoff are entirely handled by the real `CarRentalSearchCard`:
- **Pickup location** — `LocationAutosuggestField` accepting kinds `city` and
  `airport`. Prefilled from `useCarRentalsSearchState` loader (same as before).
- **Pickup date** — real `DateField`, min = today.
- **Dropoff date** — real `DateField`, min = pickup + 1 day.
- **Drivers** — `select`, 1–4.
- **Time-of-day** — not a field in the current `CarRentalSearchCard`; no time
  affordance was added (consistent with task brief "defer unless already supported").

The landing page reinforces pickup intent through the airport and city pickup
entry points below the fold — these are pre-fill/browse links, not a duplicate
form.

## Vehicle class implementation

Six class cards (Economy, Sedan, SUV, Minivan, Convertible, Luxury):
- Each card is an `<a>` that prefills the real `/car-rentals?q={city}` form (text
  only, never auto-submits).
- Structural traits (seats, bags, transmission) shown as pill chips.
- **No prices, no specific models, no supplier names, no inventory claims.**
- Explicit footer note: "Seats, bags, and transmission describe each class in
  general — exact vehicles and rates come from a live search. No prices shown."
- `--ui-*` cards with `CarGlyph` inline SVG (no remote images, no map tiles).

## Airport/city pickup implementation

**Airport tiles** (LAS / MCO / LAX / MIA):
- Each tile is an `<a>` with `href="/car-rentals?q={city}"` — prefills the real
  search form (city text only, never auto-submits).
- Never claims a counter, shuttle, on-airport desk, or terminal — "pickup options
  load from a live search."

**City tiles** (las-vegas / orlando / new-york):
- Each tile links to the real `/car-rentals/in/{slug}` page (verified 200 for all
  three during smoke check).
- These are the same three slugs the previous production page already linked to.
- "Browse all rental cities" → `/car-rentals/in`.

## Comparison and policy clarity implementation

**Comparison essentials**: six guidance items (Seats, Bags, Transmission,
Fuel/range, Doors, Pickup point) — describes what is shown on each live rate,
with a note that actual values come from a real search. Paired with a "Start a
car search" `<a href="#car-search">` CTA.

**Policy clarity**: three cards — all phrased **conditionally**:
- "When a rate offers free cancellation, the deadline is stated up front"
- "Any insurance or damage-waiver options appear with what they cover"
- "Mileage limits and fuel policy are shown on each rate"

No guaranteed insurance, unlimited-mileage, or free-cancellation claims.

## Whole-trip handoff implementation

Three tiles after the comparison block — real existing routes:
- **Add a flight** → `/flights`
- **Add a hotel** → `/hotels`
- **Plan what to do** → `/destinations`

All targets verified 200. Placed after the comparison block so it never competes
with the primary search/compare task.

## Trust and conversion implementation

- "Booking you can read" trio: total price up front (taxes + mandatory fees in
  the compared total), policies before you book (cancellation/mileage/fuel),
  no surprise add-ons.
- Mobile sticky CTA: "Search cars" → `#car-search`. `min-height:44px` tap target;
  spacer prevents last section overlap.
- No urgency, scarcity, "best deal", or supplier guarantee language.

---

## SEO preservation notes

- `/car-rentals` remains **indexable** — no `noindex` in the response; robots meta
  defaults to indexable. Confirmed: `robots` meta reads `index,follow,…` in the
  SSR output and zero `noindex` hits.
- `head` export preserved: title "Car Rentals | Andacity Travel", updated
  description (traveller-facing, not SEO-facing), `BreadcrumbList` + `ItemList`
  JSON-LD (confirmed two `application/ld+json` scripts in SSR), self-referential
  canonical, OG/Twitter tags.
- **Single `<h1>`** present and verified (previously the `VerticalHeroSearchLayout`
  rendered one via `--color-*`; now `CarRentalsLanding` renders one on `--ui-*`).
- Breadcrumb is a crawlable `<nav><ol><li><a>` structure pointing to `/`.
- All city tiles are real `<a href="/car-rentals/in/{slug}">` links (crawlable).
- All airport tiles are real `<a href="/car-rentals?q=…">` links (crawlable).
- SEO-facing copy ("stronger internal linking across the Car Rentals vertical") is
  replaced with traveller-facing language — confirmed zero "internal linking" hits
  in SSR output.

---

## Accessibility notes

- One `<h1>` ("Pick up the right car for the trip") — verified exactly one.
- Breadcrumb `<nav aria-label="Breadcrumb">` with `aria-current="page"`.
- Vehicle-class cards: `aria-label="Search {name} car rentals"` on each `<a>`.
- Airport tiles: `aria-label="Search car rentals near {city}"` on each `<a>`.
- Decorative `CarGlyph` SVG and hero gradient tile are `aria-hidden`.
- All interactive elements use visible `--ui-ring` focus styles.
- Mobile sticky CTA: `min-height:44px` on the primary `<a>`.
- `CarRentalSearchCard` retains its own accessible labels, date pickers,
  `BookingValidationSummary`, and field validation from production.
- No horizontal overflow (all containers use `max-w-6xl` with wrapping).

---

## Responsive notes

| Breakpoint | Behavior |
|---|---|
| Mobile (< `sm`) | Single-column hero, search card stacks; vehicle classes, airport/pickup tiles, comparison, trust, handoff all stack; sticky "Search cars" CTA visible; 20px spacer prevents overlap. |
| `sm`–`lg` | Vehicle classes 2-up; airport tiles 2-up; trust/handoff 3-up. |
| Desktop (`lg:+`) | Vehicle classes 3-up; airport+city pickup split into a 2-column layout; comparison uses a `1.2fr / 1fr` essentials-vs-policy split; mobile CTA hidden. |

The real `CarRentalSearchCard` keeps its production hero grid at `md+`
(`md:grid-cols-[minmax(0,2.65fr)_…]`). No new responsive props were added to it.

---

## Sample/preview cleanup

- Production imports only from `src/components/car-rentals/landing/` and
  `src/components/car-rentals/CarRentalSearchCard` — **no production import from
  `src/components/dev/`** (verified with grep).
- The CLAUDE-UI-017 sample (`src/components/dev/cars/`,
  `src/routes/dev/ui-cars/`) is retained unchanged as historical reference;
  `/dev/ui-cars` still renders 200.

---

## Deferred work

| Item | Reason deferred |
|---|---|
| `CarRentalSearchCard` inner controls → `--ui-*` | Shared with `HomeSearchModule` (home page) and `car-rentals/in/[citySlug]` (not yet redesigned). Deferred to a dedicated search-primitives task. |
| Pickup time-of-day affordance | Not a field in the current `CarRentalSearchCard`; out of scope per task brief ("defer unless already supported"). |
| Live city grid from `loadCarRentalCitiesFromDb()` | Static featured cities are safer and consistent with the approved sample. The loader still runs for JSON-LD; the city grid itself is now the three static tiles that match the original helper links. Consider a live-driven city grid in the city-page task. |
| Hero photography | Gradient-first; a road/car image can drop in via `background-image` over the existing scrim with no structural change. |
| Airport-specific canonical routes | Airport tiles prefill the search form; no airport-specific landing page exists yet. Deferred to a future task. |
| `car-rentals/in/[citySlug]` redesign | Still uses legacy `Page` + `VerticalHeroSearchLayout`. Deferred to CLAUDE-UI-019. |
| `car-rentals/[slug]` detail page redesign | Deferred to a future task. |
| Car rental results redesign | Results page (`car-rentals/search/…`) still uses legacy UI. Deferred to a future task analogous to CLAUDE-UI-016. |

---

## Verification results

**TypeScript (`npm run build.types`):**
- One pre-existing error: `src/lib/db/client.server.ts(91,5)` — SSL property type
  error (pre-existing, unrelated to this task).
- Zero new type errors from CLAUDE-UI-018 ✓

**Production build (`npm run build`):**
- Build succeeds: `✓ built in 5.85s` ✓

**Dev smoke check (`npm run dev`, localhost:5174):**
- `/car-rentals` — 200; new landing renders: `--ui-hero` hero, `<h1>` "Pick up
  the right car for the trip", breadcrumb, real search card, vehicle classes,
  airport/city pickup, comparison+policy, whole-trip handoff, trust, mobile CTA ✓
- Exactly one `<h1>`; no `noindex` in meta; JSON-LD (×2) present; canonical
  correct; SEO-facing copy absent ✓
- No production import from `src/components/dev/` ✓
- `/` 200, `/flights` 200, `/flights/search/JFK-MIA/2026-07-18/return/2026-07-25`
  200, `/hotels` 200, `/hotels/in/miami` 200, `/hotels/miami-motel-02` 200 ✓
- `/car-rentals` 200, `/car-rentals/in/orlando` 200, `/car-rentals/in/new-york`
  200, `/explore` 200, `/destinations` 200 ✓
- Dev samples: `/dev/ui-cars`, `/dev/ui-flight-results`, `/dev/ui-flights`,
  `/dev/ui-hotels-city`, `/dev/ui-hotel-detail`, `/dev/ui-hotels`, `/dev/ui-home`,
  `/dev/ui-shell`, `/dev/ui-palettes` — all 200 ✓
