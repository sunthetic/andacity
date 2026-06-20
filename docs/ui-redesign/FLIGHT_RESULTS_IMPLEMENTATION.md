# Flight Route Results Implementation

> CLAUDE-UI-016 — production implementation of the approved CLAUDE-UI-015 flight
> route results page redesign. The production `/flights/search/[...route]` route
> now uses the `--ui-*` system. The dev preview at `/dev/ui-flight-results` is
> retained as historical reference. Next: CLAUDE-UI-017 — Car Rentals Landing
> Page Sample.

## Approved direction

Promote the CLAUDE-UI-015 flight results sample to production with these decisions:

- Comparison-first premium results page with a clear single `<h1>` (the route:
  "JFK → MIA"), which the previous production page lacked.
- `--ui-hero` gradient band for the route header.
- Real URL-driven sort (Smart rank / Price / Duration / Earliest departure) and
  filters (Stops, Departure window, Arrival window, Cabin class, Price band) —
  all existing canonical behavior preserved.
- Premium three-zone result card (identity / timeline / price+CTA) on `--ui-*`.
- Progressive-load banner with a pulsing dot, not a spinner.
- All-in price strip: "taxes and carrier fees included in every total."
- Whole-trip handoff (hotels, cars, destinations) after results.
- Mobile sticky "Edit search" CTA.
- No fake urgency, seat counts, price-drop claims, or partner guarantees.

---

## Production files changed

**Added:**
- `src/components/flights/results/flightResultsData.ts` — static trip handoff
  items (hotels, car-rentals, destinations). Production-safe, not under `dev/`.
- `src/components/flights/results/FlightResultCard.tsx` — premium `--ui-*` card
  accepting the real `FlightResultCardModel`.
- `src/components/flights/results/FlightResultsSection.tsx` — `--ui-*` filter
  rail, sort bar, active-filter chips, partial-load banner, and result list.
  Contains all filter/sort logic from `CanonicalFlightResultsSection` rewritten
  on `--ui-*` tokens.
- `src/components/flights/results/FlightResultsPage.tsx` — full page body (no
  `<main>`): `FlightRouteHeader`, `FlightResultsSection`, loading/error fallback
  states, `WholeTripHandoff`, and `MobileEditCta`.

**Rewritten:**
- `src/routes/flights/search/[...route]/index.tsx` — swapped `Page` +
  `CanonicalFlightResultsSection` / `FlightResultsRenderer` for
  `FlightResultsPage`. All loader logic, progressive polling, state management,
  and `head` metadata are preserved exactly.

**Unchanged (intentionally):**
- `src/components/search/flights/CanonicalFlightResultsSection.tsx` — kept for
  reference; no longer rendered by the production route.
- `src/components/search/flights/FlightResultCard.tsx` (legacy) — kept; no
  longer rendered by the production route.
- `src/components/search/flights/FlightResultsRenderer.tsx` — kept; no longer
  rendered by the production route.
- `src/components/results/ResultsShell.tsx`, `ResultsControlBar.tsx`,
  `ResultsFilterGroups.tsx` — unchanged; still used by hotel/car results.
- All CLAUDE-UI-004/006/008/010/012/014 work, theme switching, nav, footer.
- `src/lib/db/client.server.ts` SSL error — pre-existing, out of scope.

---

## Data mapping notes

`FlightResultsPage` accepts `CanonicalFlightSearchPageResult` and a
`FlightResultsRendererModel`. All card data flows from the unchanged
`mapFlightResultCardForUi` in `src/server/search/mapFlightResultsForUi.ts`.

Fields used in the new card (`FlightResultCard`):
- `airlineLabel` — bold airline name in identity zone.
- `flightNumberLabel` — chip badge next to airline name.
- `cabinLabel` — small text below flight number.
- `departAtLabel` / `arriveAtLabel` — full formatted date-time strings from the
  mapper, displayed in the timeline zone.
- `originCode` / `destinationCode` — 3-letter codes below the times.
- `durationLabel` — above the timeline bar.
- `stopCount` / `stopSummary` — below the timeline bar; nonstop in
  `--ui-primary`, stops in `--ui-accent`.
- `price.display` / `price.currency` — in `--ui-price` with "incl. taxes & fees"
  note.
- `ctaLabel` / `ctaHref` / `ctaDisabled` — "View flight" button wired to the
  real detail href.
- `itinerarySummary` — shown as a footer line on multi-segment flights only.

---

## Route header implementation

- Full-width `--ui-hero` gradient + `--ui-hero-scrim` overlay band (matches
  shell/home/hotels/flights landing heroes).
- Breadcrumb: Home / Flights / `{ORIGIN} → {DEST}` (`aria-current="page"` on
  the last item; `<nav aria-label="Breadcrumb">`).
- Trip-type pill and date context line, both outside the `<h1>`.
- Single `<h1>`: **"{ORIGIN} → {DEST}"** (e.g., "JFK → MIA") — the scan anchor
  the previous production page lacked. Confirmed exactly one `<h1>` in the SSR
  output.
- Result count and all-in-price reassurance below the heading.
- "Edit search" link → `buildFlightSearchEditorHref(request)` (the real prefill
  href, unchanged from the existing implementation).

---

## Search/refinement implementation

- "Edit search" in the header routes back to the real `/flights` form prefilled
  via `buildFlightSearchEditorHref`.
- The sticky sort/filter toolbar restates the result count so context stays
  visible while scrolling.
- Sort and filter state is fully URL-driven via the existing
  `searchStateFromUrl` / `searchStateToUrl` utilities — no new submission
  mechanics.

---

## Date strip/flexible date implementation

The flexible-date strip concept from CLAUDE-UI-015 is **not** promoted to
production in this task. The production flight data model has no flexible-fare
dataset. The route header shows the exact departure and return dates from the
search, which is the honest and correct display.

Deferred to a future task when a real flexible-fare data source is available.

---

## Sort/filter implementation

**Sort** (4 options — real URL toggles, match `FLIGHT_SORT_OPTIONS`):
- Smart rank · Price · Duration · Earliest departure.
- Rendered as `<a>` links with `aria-current="page"` on the active option.
- Sort chips are in the sticky toolbar.

**Filters** (5 groups — all real URL-driven facets):
- Stops (Nonstop / Up to 1 stop / Up to 2 stops) — `maxStops` param.
- Departure window (Morning / Afternoon / Evening / Overnight) — `departureWindow` param.
- Arrival window (Morning / Afternoon / Evening / Overnight) — `arrivalWindow` param.
- Cabin class (Economy / Premium Economy / Business / First) — `cabin` param.
- Price band (Under $200 / $200–$400 / $400–$700 / $700+) — `priceBand` param.

All groups are only shown when at least one option is present in the facets.

**Desktop**: sticky left rail (`260px`) with `--ui-*` filter chips (anchors).
**Mobile**: "Filters" toggle button in the toolbar opens a drawer below the
toolbar; "Filters" button shows active-filter count badge.

Active filter chips are shown below the sort bar with individual remove links
and a "Clear all" link. All filter logic is identical to `CanonicalFlightResultsSection`.

---

## Flight result card implementation

Three-zone responsive grid (`md:grid-cols-[1fr_1.5fr_auto]`):

| Zone | Content |
|---|---|
| Identity | Airline glyph (decorative, `--ui-accent-soft` circle), `airlineLabel` in bold, `flightNumberLabel` chip, `cabinLabel` |
| Timeline | `departAtLabel` + `originCode` / duration above timeline bar + stop dots + stop summary / `arriveAtLabel` + `destinationCode` |
| Price + CTA | "Total price" eyebrow, `price.display` in `--ui-price`, "incl. taxes & fees", View flight `<a>` or disabled `<button>` |

The timeline line has dots at depart (primary) and arrive (accent) ends; stop
flights get an additional mid-line dot. Nonstop summary is `--ui-primary`;
stop summary is `--ui-accent`.

Multi-segment itinerary (`itinerarySummary`) is shown as a footer line when
present, separated by a `--ui-divider` rule.

---

## Fare/cabin comparison implementation

The fare-tier comparison concept from CLAUDE-UI-015 is **not** promoted to
production. Production flight results carry one `cabinLabel` per option; no
fare-tier or branded-fare comparison data is available from the card model
today. The cabin class is shown plainly in the card identity zone.

Deferred until real fare-family/fare-tier data is available per option.

---

## Price clarity and trust implementation

- Persistent "Every total includes taxes and carrier fees" line above the results
  column (visible on all result states except loading).
- Per-card "incl. taxes & fees" note under each price.
- Progressive-load state ("More results arriving — current options stay
  filterable while the search finishes") shown as a calm banner with a pulsing
  dot when `progress.status === "partial"`.
- No countdowns, scarcity, urgency, or "X people viewing" patterns.

---

## Empty/loading states

**Loading state** (rendered while `rendererModel.state === "loading"`):
- `--ui-*` styled panel with a pulsing flight glyph icon, heading, description,
  and three animated skeleton rows.
- Shown during initial page navigation (`isNavigating && status === "complete"`)
  per `resolveFlightResultsRendererModel` logic (unchanged).

**Empty state** (rendered when cards.length === 0 after filtering):
- Inline within `FlightResultsSection`; shows filter-aware copy ("No flights
  match these filters" vs "No flights were found").
- Primary action: "Clear filters" (when filters active) or "Revise search".
- Secondary action: "Edit search" or "Start a new search".
- All action hrefs are real, valid routes.

**Error state** (rendered while `rendererModel.state === "error"`):
- `--ui-*` styled panel with the mapped error copy from `buildErrorCopy` (error
  codes: `INVALID_LOCATION_CODE`, `INVALID_DATE`, `INVALID_DATE_RANGE`, route
  errors). Retry + back-to-search actions.

**Partial state**: filter-state shows a pulsing progressive-load banner above
the result cards (already-arrived cards remain filterable).

---

## Whole-trip handoff implementation

Three cards with `--ui-hero` gradient tiles after the results column, separated
by a `--ui-divider`:
- **Add a hotel** → `/hotels`
- **Add a car** → `/car-rentals`
- **Plan what to do** → `/destinations`

All targets are real, existing routes (verified 200). The handoff is placed
after the result list so it never competes with comparison.

Note: The production data model has destination as a 3-letter airport code (e.g.
"MIA") with no city resolver. Using generic links (not `/hotels/in/miami`) keeps
this safe across all routes without a lookup table.

---

## SEO/indexing preservation notes

- `/flights/search/...` keeps `x-robots-tag: noindex, follow` (verified via
  `curl -sIL`) — result pages are not indexed but links are followed.
- `head` export is unchanged: `noindex,follow,max-image-preview:large`, route-
  derived title/description (`{ORIGIN} -> {DEST} flights | Andacity`), self-
  referential canonical, OG/Twitter tags. Zero changes to metadata logic.
- **Single `<h1>`** is now present and verified (previously absent from the
  production results page) — this improves semantics without changing indexability.
- Breadcrumb is a crawlable `<nav><ol><li><a>` structure pointing to `/` and
  `/flights`.
- CTA links use real `ctaHref` from the card model; all internal navigation is
  real `<a href>` elements.
- No developer/SEO placeholder copy leaks to customer-facing output.

---

## Accessibility notes

- One clear `<h1>` (the route) — verified exactly one in SSR HTML.
- Breadcrumb `<nav aria-label="Breadcrumb">` with `aria-current="page"`.
- Sort links use `aria-current="page"` on the active option.
- Filter option links use `aria-current="page"` on active options.
- "Filters" toggle button uses `aria-expanded` and a descriptive `aria-label`
  with active count.
- Result cards have descriptive `aria-label` on the `<article>` element (airline,
  route, duration, stop summary, price).
- "View flight" `<a>` has a descriptive `aria-label` per card. Disabled CTA uses
  `aria-disabled="true"`.
- Timeline decorative elements are `aria-hidden`; all info is also present as
  readable text.
- Loading skeleton is `aria-hidden`; loading container uses `aria-busy="true"`.
- Error state uses `role="alert"`.
- All interactive elements have visible `--ui-ring` focus styles and 44px min
  tap targets.
- Mobile sticky CTA uses `min-height:44px`; spacer prevents last section overlap.

---

## Responsive notes

| Breakpoint | Behavior |
|---|---|
| Mobile (< `lg`) | Single-column results; filter drawer slides in below toolbar; sort chips scroll horizontally; identity/timeline/price stack vertically in card; mobile sticky "Edit search" CTA visible. |
| Desktop (`lg:+`) | Two-column `260px` sticky filter rail + results; cards use 3-zone grid; sort bar inline; mobile sticky CTA hidden. |

Toolbar is sticky at `var(--sticky-top-offset)` (respects fixed SiteHeader
height). Filter rail is sticky at `calc(var(--sticky-top-offset) + 3.5rem)`.
All containers use `max-w-6xl` with wrapping to avoid horizontal overflow.

---

## Sample/preview cleanup

- Production imports only from `src/components/flights/results/` and
  `src/components/search/flights/` (model/renderer model helpers) — **no
  production import from `src/components/dev/`** (verified with grep).
- The CLAUDE-UI-015 sample (`src/components/dev/flight-results/*`,
  `src/routes/dev/ui-flight-results/*`) is retained unchanged as historical
  reference; `/dev/ui-flight-results` still renders 200.

---

## Deferred work

| Item | Reason deferred |
|---|---|
| Flexible-date strip | No live flexible-fare dataset; strip from the sample is concept-only. Revisit when a real source exists. |
| Fare-tier/branded-fare comparison | Production card model has one `cabinLabel` per option; no fare-family data. Revisit when real fare-family data is in the card model. |
| Hero photography | Gradient-first; a sky/aerial image can drop in via `background-image` over the existing scrim with no structural change. |
| Destination-specific hotel links | `request.destination` is an airport code; a city resolver would be needed to link to `/hotels/in/{city}`. Deferred to avoid a hardcoded lookup table. |
| Airline filter | Airline facet not yet built in production; filter group would need a new facet builder in the results mapper. |
| "Bags included" filter | No baggage field on `FlightResultCardModel`. |
| MigrateFlightsSearchCard inner controls to `--ui-*` | Shared with home/hotels/cars; deferred to a dedicated search-primitive task. |

---

## Verification results

**TypeScript (`npm run build.types`):**
- One pre-existing error: `src/lib/db/client.server.ts(91,5)` — SSL property
  type error (pre-existing, unrelated to this task).
- Zero new type errors from CLAUDE-UI-016 ✓

**Production build (`npm run build`):**
- Build succeeds: `✓ built in 5.54s` ✓

**Dev smoke check (`npm run dev`, localhost:5175):**
- `/flights/search/JFK-MIA/2026-07-18/return/2026-07-25` — 200; new results
  page renders: `--ui-hero` route header, H1 "JFK → MIA", breadcrumb, trip
  context, result count, "Edit search" link, sort chips, filter rail, price
  clarity strip, whole-trip handoff, mobile CTA ✓
- Exactly one `<h1>` (`JFK → MIA`); `x-robots-tag: noindex, follow`; title
  "JFK -> MIA flights | Andacity"; `robots: noindex,follow` in head ✓
- No production import from `src/components/dev/` (verified with grep) ✓
- `/` 200, `/flights` 200, `/flights?from=New York&to=Miami` 200 ✓
- `/hotels` 200, `/hotels/in/miami` 200, `/hotels/miami-motel-02` 200 ✓
- `/car-rentals` 200, `/explore` 200, `/destinations` 200 ✓
- Dev samples: `/dev/ui-flight-results`, `/dev/ui-flights`, `/dev/ui-hotels-city`,
  `/dev/ui-hotel-detail`, `/dev/ui-hotels`, `/dev/ui-home`, `/dev/ui-shell`,
  `/dev/ui-palettes` — all 200 ✓
