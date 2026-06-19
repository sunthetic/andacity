# Flight Route Results Page Sample

> CLAUDE-UI-015 — preview-only, approval-gated. No production flight results
> route is changed by this task. Review at `/dev/ui-flight-results` (run
> `npm run dev`). Next after approval: CLAUDE-UI-016 — Flight Route Results
> Implementation.

## Purpose

Create a premium **flight route results** direction that is easier to scan,
compare, and trust than typical OTA/airline result pages, while keeping the
speed and clarity of Google Flights and giving Andacity a calmer, whole-trip-aware
feel.

Thesis:

> Here are the clearest flight options for this route, with the tradeoffs that
> matter: price context, timing, stops, duration, cabin, and next steps.

The sample establishes layout, card structure, and the filter/sort treatment. It
is preview-only; the production `/flights/search/[...route]` route is unchanged
until approved.

---

## Current flight results observations

Production route: `src/routes/flights/search/[...route]/index.tsx`
(canonical path `/flights/search/{ORIGIN}-{DEST}/{departDate}[/return/{returnDate}]`).

**Architecture (solid — preserved conceptually):**
- Loader `loadCanonicalFlightSearchProgressivePage(url)` → `CanonicalFlightSearchPageResult`. The page is **progressive**: an initial batch renders, then a client `useVisibleTask$` polls an incremental endpoint (250ms) and merges batches until `metadata.status === "complete"`. States: `loading` → `partial` → `results` / `empty` / `error`.
- UI mapping is already centralized in `src/server/search/mapFlightResultsForUi.ts`:
  - `FlightSearchSummaryModel` — `routeTitle`, `originCode`/`destinationCode`, `departDateLabel`/`returnDateLabel`, `tripTypeLabel`, `resultCount`/`resultCountLabel`, `statusLabel`, `metadataBadges`.
  - `FlightResultCardModel` — `airlineLabel`, `flightNumberLabel`, `providerLabel`, `routeLabel`, `originCode`/`destinationCode`, `departAtLabel`/`arriveAtLabel`, `durationLabel`, `stopCount`/`stopSummary`, `cabinLabel`, `itinerarySummary`, `price{amount,currency,display}`, `ctaLabel`/`ctaHref`/`ctaDisabled`.
- `CanonicalFlightResultsSection` already implements **real, URL-driven sort and filtering** (via `searchStateFromUrl`/`searchStateToUrl`, `ResultsShell`, `FlightFilters`):
  - **Sort** (`FLIGHT_SORT_OPTIONS`): Smart rank, Price, Duration, Earliest departure.
  - **Filters** (faceted — only shown when present in results): Stops (`maxStops`), Departure window, Arrival window, Cabin class, Price band (Under $200 / $200–$400 / $400–$700 / $700+). Plus active filter chips + "Clear all".
- Indexability: `onRequest` sets `x-robots-tag: noindex, follow` and the head sets `robots: noindex,follow,max-image-preview:large` with a self-referential canonical. Title/description are route-derived.

**Improvement opportunities:**
- Cards + shell use legacy `--color-*`, `t-badge`, `t-btn-primary` — visually inconsistent with the shipped `--ui-*` home/hotels/flights pages.
- The result card is a fact-grid scaffold; timing/stops/price don't read as a fast, scannable flight row. No emphasized depart→arrive timeline.
- **No `<h1>`** on the page today (breadcrumbs + `ResultsShell` only) — a missed semantic/scan anchor.
- Summary `metadataBadges` expose dev-ish strings ("Search time 142ms", "Source: …", "Sorted by best available match").
- No flexible-date affordance; no whole-trip handoff after results; no fare-tier comparison.

---

## Proposed flight results direction

A comparison-first, `--ui-*` results page that keeps the real loader/model and:

1. Opens with a route header (`origin → destination`, trip type, dates, travelers, result count) + a real "Edit search" link — and a clear single `<h1>`.
2. Offers a flexible-date strip (concept, illustrative) for nearby departure dates.
3. Keeps a sticky sort/result-count toolbar (sort mirrors production) and a desktop filter rail / mobile filter sheet.
4. Renders premium, scannable result cards built on the real `FlightResultCardModel` fields with an emphasized depart→arrive timeline.
5. Adds a structure-only fare-tier comparison concept.
6. Frames price clarity (all-in totals) and a progressive "more results arriving" state calmly.
7. Hands off to the whole trip (hotels in the destination, cars, destinations) after results.

Layout order: route header → flex-date strip → sticky toolbar → (filter rail + results) → states (loading/empty) → whole-trip handoff → mobile sticky CTA.

---

## Route header concept

- Compact full-width `--ui-hero` gradient + scrim band.
- Breadcrumb Home / Flights / `JFK → MIA`.
- Trip-type pill + date/travelers context line.
- Single `<h1>`: **"New York → Miami"** (city names, with codes in the breadcrumb/toolbar) — the scan anchor production currently lacks.
- Result-count + all-in-price reassurance line.
- "Edit search" → `/flights?from=New York&to=Miami` (real prefill target verified to resolve to canonical locations).

---

## Search/refinement concept

- "Edit search" routes back to the real `/flights` form prefilled (maps to `buildFlightSearchEditorHref` in production).
- The sticky toolbar restates the route (`JFK → MIA`) and result count so context stays visible while scrolling.
- Refinement (sort + filters) is presented inline; in production these are the existing URL-driven controls — no new submission mechanics required.

---

## Date strip/flexible date concept

- A 7-cell "Nearby departure dates" strip with relative bars and a highlighted selected day. Wrapped in `role="img"` with an honest label; bars are decorative.
- Labeled **Illustrative + Concept**: production has **no flexible-date fare dataset** today, so the strip shows *relative shape only — no amounts and no "cheapest day" claim*. Footnote states real date-flexible pricing would come from a live search.
- This is the one place fare *shape* is suggested; it never asserts a price.

---

## Sort/filter concept

Clearly split into **supported now** vs **concept-only**:

**Supported in production today (mirrors `CanonicalFlightResultsSection`):**
- Sort: Smart rank · Price · Duration · Earliest departure.
- Filters: Stops (Nonstop / Up to 1 / Up to 2), Departure window, Arrival window, Cabin class, Price band.

**Concept-only (not in production — flagged with a "Concept" badge in the rail):**
- Airline filter (production facets don't build an airline list yet).
- "Bags included" filter (no baggage field on the card model).
- Duration as a *filter* (it exists only as a *sort* today).

- Desktop: sticky left filter rail. Mobile: a "Filters" button in the toolbar opens a filter-sheet (concept). The rail notes "Illustrative in this preview" and which groups are supported.
- In the sample the chips are presentational; in production the supported ones are the existing URL-param toggles.

---

## Flight result card concept

Premium, scannable card built on the **real** `FlightResultCardModel` fields:

- **Identity** — `airlineLabel` (bold) + `flightNumberLabel` chip + `cabinLabel`.
- **Timeline** — `departAtLabel` time + `originCode` → an emphasized line with `durationLabel` above and `stopSummary` below (nonstop in `--ui-primary`, stops in `--ui-accent`) → `arriveAtLabel` time + `destinationCode`.
- **Price + CTA** — `price.display` in `--ui-price`, "Total · round-trip", "incl. taxes & fees", and a "View flight" button.
- **Footer** — `returnNote` (round-trip leg) + an optional neutral tag ("Shortest", "Lowest illustrative") — never urgency or "best fare".

Mapping for CLAUDE-UI-016: every field above is already produced by `mapFlightResultCardForUi`. Sample CTAs anchor to the route header (`#route-header`) so nothing 404s; production wires `ctaHref` (the real flight detail href) and `ctaDisabled`.

Avoided entirely: fake urgency, fake seat counts, fake "best fare", price-drop, partnership, guarantee, or review claims.

---

## Fare/cabin comparison concept

- A structure-only "Compare fare options on a flight" panel (dashed border, **Illustrative + Concept** badges): three fare tiers (Basic / Main / Comfort+) as relative bars with an "includes" line each.
- Explicitly labeled: *structure only — relative gaps between tiers, not real prices; production results carry one cabin per option today.* This demonstrates a branded-fare comparison pattern without inventing fare ladders.
- If/when real fare-family data exists, this becomes a per-option expandable; until then it stays a clearly-marked concept.

---

## Price clarity and trust concept

- A persistent "Every total is all-in" strip above results: taxes and carrier fees included before you choose; sample prices labeled illustrative.
- Per-card "incl. taxes & fees" under each price.
- The progressive-load state ("More results still arriving — current options stay filterable while the search finishes") mirrors production's real partial→complete behavior, framed calmly with a pulsing dot rather than a spinner-heavy UI.
- No countdowns, scarcity, or "X people viewing" patterns.

---

## Empty/loading state concept

Both are rendered as labeled concept demos in a "States" section so reviewers can see them:

- **Loading** — skeleton result rows (avatar + line + CTA placeholders) using `--ui-surface-muted` pulses, matching the production `loading`/`partial` states and `placeholderCount`.
- **No matches** — mirrors production's filter-aware empty model: title "No flights match these filters", description to widen filters/dates, primary "Clear filters" + secondary "Edit search" (→ real prefill). The non-filtered empty ("No flights were found for this search") is the other production variant.
- **Error** (described, not rendered): production already maps `INVALID_LOCATION_CODE` / `INVALID_DATE` / route errors to specific copy with retry + revise-search — preserve as-is, restyled to `--ui-*`.

---

## Whole-trip handoff concept

After results: "Picked a flight? Build the rest of Miami." Three cards with `--ui-hero` tiles:
- **Stay in Miami** → `/hotels/in/miami` (real city hub).
- **Add a car** → `/car-rentals`.
- **Plan what to do** → `/destinations`.

In production these targets are destination-derived from the search `request.destination`. The handoff is placed after the result list so it never competes with comparison.

---

## Responsive behavior

| Breakpoint | Behavior |
|---|---|
| Mobile (< 640px) | Single-column result stack; cards reflow to identity → timeline → price/CTA; toolbar shows a "Filters" sheet button + horizontally scrollable sort chips; mobile sticky "Edit search" CTA; flex strip stays 7-across but compact. |
| Tablet (`sm:`–`lg:`) | Wider cards; filter rail still collapses to the sheet until `lg`; handoff/states go 2–3 col. |
| Desktop (`lg:`+) | Two-column `300px` sticky filter rail + results; cards use a 3-zone `identity / timeline / price` grid; sticky toolbar under the header offset; mobile CTA hidden. |

Sticky elements use `--sticky-top-offset` so they sit under the fixed SiteHeader. Containers are `max-w-6xl` with wrapping rows to avoid horizontal overflow.

---

## Accessibility notes

- Single, clear `<h1>` (the route) — verified exactly one on the sample.
- Breadcrumb `<nav aria-label="Breadcrumb"><ol>` with `aria-current="page"`.
- Sort/filter controls are real buttons with `aria-pressed`; "Filters" sheet trigger has an `aria-label`.
- Result timelines are decorative (`aria-hidden`) but the same data is present as readable text (times, codes, duration, stop summary).
- Flex strip + fare bars are `aria-hidden` decorative bars inside honestly-labeled `role="img"` containers; nothing is conveyed by color alone.
- "View flight" links have descriptive `aria-label`s; CTA tap targets are 44px min; visible `--ui-ring` focus styles throughout.
- Mobile sticky CTA doesn't cover content (a spacer reserves space); `--ui-*` pairs target WCAG AA across the six palettes.

---

## SEO/indexing notes

- This preview is `noindex, nofollow` (header + meta) and 404s on the production host via `shouldIndex(url)`.
- For production (CLAUDE-UI-016): **keep the existing `noindex, follow`** on `/flights/search/...` — result pages should not be indexed but links should be followed. The sample does not change that posture.
- Improvement to carry forward: introduce a single `<h1>` (the route) which the current production page lacks, improving semantics/scan without affecting indexability.
- Keep the route-derived `<title>`/description, self-referential canonical, and crawlable breadcrumb. Replace the dev-ish `metadataBadges` with calmer status text.

---

## Implementation boundary

**This task creates (sample only):**
- `src/components/dev/flight-results/flightResultsSampleData.ts`
- `src/components/dev/flight-results/FlightResultsSample.tsx`
- `src/routes/dev/ui-flight-results/index.tsx`
- `docs/ui-redesign/samples/FLIGHT_RESULTS_SAMPLE.md` (this file)

**This task does NOT change:**
- `src/routes/flights/search/[...route]/index.tsx`, `CanonicalFlightResultsSection`, `FlightResultCard`, `FlightResultsList`, `FlightFilters`, `mapFlightResultsForUi`, or the loader — production flight results unchanged.
- CLAUDE-UI-004 shell, CLAUDE-UI-006 home, CLAUDE-UI-008 hotels, CLAUDE-UI-010 hotel detail, CLAUDE-UI-012 hotels-by-city, CLAUDE-UI-014 flights landing.
- Theme switching, nav, footer, `/flights` search behavior.
- The pre-existing DB SSL TypeScript error — out of scope.

No map dependencies, remote tiles, or API keys added.

---

## Preview route

```
/dev/ui-flight-results
```

- `noindex, nofollow` via `x-robots-tag` header + meta robots.
- 404s on the production host via `shouldIndex(url)` (same gate as every `/dev/ui-*` route).
- Renders `FlightResultsSample` inside the production global shell; theme control drives all `--ui-*` tokens (responds to every palette + light/dark/auto).
- Uses illustrative static data (JFK→MIA, 5 sample options) shaped to the real card model.

---

## User decision needed

Review `/dev/ui-flight-results` across Skyglass Luxe Light/Dark and Andacity Meridian Light/Dark. Evaluate:

1. Result card layout — is the 3-zone identity / timeline / price row the right density, or do you prefer a more compact single-line row (Google-Flights-style) or a larger editorial card?
2. Route header as a `--ui-hero` band vs. a lighter non-gradient header (results pages are utility-first — gradient may be too heavy).
3. Flexible-date strip — keep as a labeled concept now, or omit until real flexible-fare data exists?
4. Fare-tier comparison — keep the structure-only concept, or drop it until branded-fare data exists?
5. Filter rail vs. a top filter bar (chips) on desktop — which matches the comparison-first intent better?
6. Should production add the single `<h1>` (route) the current page lacks?
7. Whole-trip handoff after results — right placement/weight, or move it to a slimmer inline strip?

---

## Verification results

**TypeScript (`npm run build.types`):**
- One pre-existing error: `src/lib/db/client.server.ts(91,5)` — SSL property type error (pre-existing, unrelated).
- Zero new type errors from CLAUDE-UI-015 ✓

**Production build (`npm run build`):**
- Build succeeds: `✓ built in 7.37s` ✓

**Dev smoke check (`npm run dev`, localhost:5173):**
- `/dev/ui-flight-results` — 200; all sections render: route header, flex-date strip, sticky toolbar (real sort labels), filter rail (supported + concept groups), result cards, fare-compare concept, price-clarity + partial-load strip, states (loading/empty), whole-trip handoff, mobile CTA ✓
- Exactly one `<h1>` on the sample; `x-robots-tag: noindex, nofollow` present ✓
- Real sort labels present (Smart rank, Price, Duration, Earliest departure) ✓
- **Real production results route** `/flights/search/JFK-MIA/2026-07-18/return/2026-07-25` — 200, still `x-robots-tag: noindex, follow`, renders (unaffected) ✓
- `/` 200, `/flights` 200, `/flights?from=New York&to=Miami` 200 (prefill) ✓
- Unaffected dev samples: `/dev/ui-flights`, `/dev/ui-hotels-city`, `/dev/ui-hotel-detail`, `/dev/ui-hotels`, `/dev/ui-home`, `/dev/ui-shell`, `/dev/ui-palettes` — all 200 ✓
