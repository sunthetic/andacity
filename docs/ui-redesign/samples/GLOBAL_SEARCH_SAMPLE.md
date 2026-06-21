# Global Search Results Page Sample

CLAUDE-UI-025 — preview-only concept for a unified, multi-vertical global search
results page. Rendered at `/dev/ui-search`. **Not production.** No production
`/search/*` route has been changed.

## Purpose

Propose a premium **global search results page (SRP)** that gracefully handles
mixed travel intent across hotels, flights, car rentals, destinations, and
discovery — and feels calm, useful, and fast rather than like a generic site
search dump.

Design thesis:

> Here are the most useful matches for your travel intent, organized by what you
> can do next.

The page is organized by **action** — Stay / Fly / Drive / Explore — so a single
query funnels naturally into the booking verticals.

## Current global search observations

Reviewed the real route tree under `src/routes/search/*` plus the per-vertical
results pages and shared search components:

- **There is no unified multi-vertical global SRP in production today.** The
  `/search/*` tree is a set of **noindex redirect shims**, not result pages:
  - `src/routes/search/layout.tsx` sets `x-robots-tag: noindex, follow` for the
    entire `/search` subtree.
  - `/search/hotels` → 301 `/hotels`; `/search/flights` → 301 `/flights`;
    `/search/car-rentals` → `/car-rentals` (preserving query string).
  - `/search/hotels/[query]/[pageNumber]`,
    `/search/car-rentals/[query]/[pageNumber]`, and
    `/search/flights/from/[from]/to/[to]/[type]/[pageNumber]` resolve the
    location(s) server-side and **redirect** to the canonical per-vertical
    results route (e.g. `/hotels/search/[citySlug]/[checkIn]/[checkOut]`), or
    fall back to the vertical landing form.
- The **real results pages** are per-vertical and still use the legacy
  `--color-*` token system (not the redesigned `--ui-*` system):
  - Hotels: `/hotels/search/[citySlug]/[checkIn]/[checkOut]`
  - Cars: `/cars/search/...` and `/car-rentals/search/...`
  - Flights: `/flights/search/[...route]`
- Shared production data models already exist in `src/types/search-ui.ts`:
  `HotelResultCardModel`, `FlightResultCardModel`, `CarResultCardModel`, plus
  per-vertical summary / empty / error / loading / pagination models. The sample
  card shapes mirror these field names so a later implementation maps real data
  with no structural change.
- The signed OG image route `/og/search/[vertical]/[query]/[pageNumber].png`
  already speaks a `[vertical]/[query]/[page]` shape (verticals: `hotels`,
  `flights`, `autos`) — useful precedent for a production global SRP URL.
- There is **no `destinations` search vertical** in the current route model;
  destinations live at the indexable `/destinations` and `/destinations/[slug]`.

Net: a global SRP is a **new surface**. This sample proposes it without
disturbing the existing per-vertical results pages or the noindex `/search`
shims.

## Proposed global search direction

A calm `--ui-hero` search-intent header, a sticky vertical switcher, an
action-grouped "All" overview, and per-vertical result columns with a concept
refinement rail — all on the `--ui-*` system inside the production global shell.

Section order in the sample:

1. Search intent header (`--ui-hero` gradient, breadcrumb, query summary)
2. Sticky vertical switcher (All / Hotels / Flights / Cars / Destinations)
3. Results body — either the mixed "All" overview or a single-vertical column
4. State previews (empty + loading concepts)
5. Whole-trip handoff panel (Explore / Flights / Hotels / Cars / Destinations)

## Search intent header concept

Full-bleed `--ui-hero` gradient band with `--ui-hero-scrim` overlay. No image
file. Breadcrumb (Home / Search). Eyebrow "Global search".

- H1: **`Results for "Miami"`** — the query is rendered as the page heading so
  the result intent is unambiguous. The query (`Miami`) is an illustrative
  sample value, tagged "sample query" in the UI.
- Subtitle restates the thesis ("organized by what you can do next").
- A **read-only query summary chip** ("Searching: Miami") plus a real **"Start a
  new search"** link to `/` (home owns the real search module). There is **no
  fake free-text input** — a non-functional search box would be a broken
  control, so the concept uses a read-only intent chip + a real entry link,
  matching how the Destinations sample avoided a dead search box.
- A small match-count summary ("N matches across 4 categories").

## Query summary concept

The parsed intent is surfaced two ways:

- In the header: the query chip + total match count.
- In the sticky switcher: each vertical chip carries its **real count** (derived
  from the sample/real sets, never invented), so the user sees the intent
  breakdown (e.g. Hotels 3 · Flights 3 · Cars 3 · Destinations 2) at a glance.

No fabricated "we found the best N results" or relevance-score language.

## Vertical tabs/switcher concept

A **sticky** bar below the header (`top-0 z-20`), horizontally scrollable on
mobile:

- Chips: **All · Hotels · Flights · Cars · Destinations**, each with its count.
- Real navigation via `?vertical=<key>` (works in the preview; server-rendered
  through `useLocation()` so the selected state is in the initial HTML).
- Active chip: `--ui-primary` + `--ui-on-primary` + `aria-current="page"`.
- `role="navigation"` + `aria-label="Filter results by category"`.
- `cars` is the UI label; it targets the real `/car-rentals` vertical (the OG
  route uses `autos` for the same concept — a naming decision for production).

## Mixed results concept

The default **All** view is an **action-grouped overview**, not a flat relevance
dump:

- **Stay** — top hotels (illustrative)
- **Fly** — top routes (illustrative)
- **Drive** — car rentals (illustrative)
- **Explore** — real destination guides

Each group shows up to three cards and a **"See all N →"** link that switches the
switcher into that vertical. Grouping by action communicates "what you can do
next" and sidesteps any fake cross-vertical relevance ranking (you cannot
honestly rank a hotel against a flight). Selecting a vertical drops into that
vertical's full column.

## Result card concepts by vertical

All cards share one shape (type chip, title, supporting lines, price, CTA) and
mirror the production UI models in `src/types/search-ui.ts`.

- **Hotel** (`HotelResultCardModel`-shaped, ILLUSTRATIVE): sample hotel name,
  area + city, star **class** (structural, not a guest/review score), structural
  amenity hints, nightly price **tagged "Illustrative"**. CTA "Search stays" →
  real `/hotels?destination=Miami, FL`.
- **Flight** (`FlightResultCardModel`-shaped, ILLUSTRATIVE): route label, depart–
  arrive + duration, stop summary (computed from the sample set), generic sample
  carrier, cabin, price **tagged "Illustrative"**. CTA "Search this route" →
  real `/flights?from=New York&to=Miami`.
- **Car** (`CarResultCardModel`-shaped, ILLUSTRATIVE): vehicle name, generic
  sample supplier + pickup, transmission + seats, class, daily price **tagged
  "Illustrative"**. CTA "Search cars" → real `/car-rentals?q=Miami, FL`.
- **Destination** (REAL data from `~/data/destinations`): city name + airport on
  a `--ui-hero` gradient header (not `aria-hidden` — meaningful text), `bestFor`
  tags, valid `/destinations/[slug]` guide link, and real Hotels/Cars quick
  links. Marked "Real guide" to distinguish it from the illustrative verticals.

No card invents live availability, fares, suppliers, scarcity, ratings, or
partner inventory. Result CTAs **start a genuine search** at a real entry point
rather than implying a bookable illustrative offer.

## Sort/filter/refinement concept

On a per-vertical view, a left **refinement rail** (desktop ≥ lg) is shown,
clearly badged **"Concept"**:

- A **disabled** `Sort` `<select>` (Most relevant / Price / Name) — visibly
  disabled, honest about being non-interactive, with an `sr-only` note.
- Filter groups (Result type, Price band, Free cancellation, Guest rating)
  rendered as static chips. Groups carry a `supported` flag: `Result type` and
  `Price band` are marked as already supported by the per-vertical results
  pages; `Free cancellation` and `Guest rating` are badged **"Future"**.
- On mobile, a labeled **"Refine (concept)"** affordance stands in for the rail
  (non-interactive, clearly marked) so the layout reads correctly without a
  broken control.

Real, wired-up refinement is deferred to the implementation task; this is
direction only.

## Empty/loading state concept

Both states are shown together in a labeled **"State previews"** section so a
reviewer can see them without forcing the page into those states:

- **Empty** (`concept`): "No matches for that search yet" with guidance and two
  real actions — "Explore destinations" (`/explore`) and "Start a new search"
  (`/`). Mirrors the production `*ResultsEmptyState` model shape (title,
  description, primary/secondary action).
- **Loading** (`concept`): three skeleton rows built from `--ui-*` tokens
  (`aria-hidden`), mirroring the production `*ResultsLoadingState` placeholder
  pattern. No spinner text claims.

## Pagination concept

A centered pager (`← Prev · 1 2 3 4 · Next`) on per-vertical views, with page 1
active (`aria-current="page"`) and Prev disabled. Labeled a concept preview; a
caption notes that production maps the real `[pageNumber]` route param already
used by the per-vertical results routes. `aria-label="Pagination (concept)"`.

## Whole-trip handoff concept

A full-width `--ui-hero` panel with five glass tiles → **Explore** (`/explore`),
**Flights** (`/flights`), **Hotels** (`/hotels`), **Car rentals**
(`/car-rentals`), **Destinations** (`/destinations`). Copy: "Turn a search into a
whole-trip plan." All real, valid routes.

## Responsive behavior

- Header: single column, generous padding, full-bleed gradient.
- Switcher: sticky, horizontal scroll, `whitespace-nowrap` chips.
- All view: each action group is a 1 → 2 (sm) → 3 (lg) card grid.
- Per-vertical view: `grid lg:grid-cols-[260px_1fr]` — refinement rail left,
  results right; rail hidden below `lg` and replaced by a mobile refine chip.
- Result grids: 1 → 2 (sm) columns within a vertical.
- Handoff tiles: 1 → 2 (sm) → 5 (lg).
- `max-w-6xl` on all content sections; no horizontal overflow.

## Accessibility notes

- Single `<h1 id="global-search-heading">`, referenced by `aria-labelledby` on
  the header section.
- Breadcrumb is a labeled `<nav><ol>` with `aria-current="page"`.
- Switcher: `role="navigation"` + `aria-label`; active chip `aria-current="page"`.
- Destination gradient header is **not** `aria-hidden` (city name is meaningful);
  the loading skeleton **is** `aria-hidden`; star class has an `sr-only`
  "N-star class" label.
- The disabled sort control has an `sr-only` "Concept preview, not interactive"
  description; the mobile refine affordance is plainly labeled.
- Focus-visible rings on all interactive elements; no color-only meaning.

## SEO/indexing notes

This sample is `noindex, nofollow` and 404s on the production host via the
standard `shouldIndex(url)` gate, with `x-robots-tag: noindex, nofollow` and an
amber "not production" banner.

Intended production behavior (to preserve in CLAUDE-UI-026):

- A production global SRP should remain **noindex, follow**, consistent with the
  existing `src/routes/search/layout.tsx` (the whole `/search` tree is already
  `noindex, follow`). A unified SRP placed under `/search` inherits this
  automatically.
- **Do not** make internal SRPs indexable; **do** keep `/destinations`,
  `/destinations/[slug]`, `/hotels/in/[citySlug]`, and the vertical landing pages
  indexable and distinct from the SRP. The destination cards here link to those
  indexable pages — link equity flows to canonical pages, not to the SRP.
- Preserve canonical behavior: an SRP should not advertise itself as canonical
  for vertical/destination content. No customer-facing SEO copy.

## Implementation boundary

This task adds **preview-only** files:

- `src/routes/dev/ui-search/index.tsx`
- `src/components/dev/search/GlobalSearchSample.tsx`
- `src/components/dev/search/searchSampleData.ts`
- `docs/ui-redesign/samples/GLOBAL_SEARCH_SAMPLE.md`

It does **not** touch any `src/routes/search/*` route, any per-vertical results
page, the `/search/layout.tsx` noindex behavior, or any production component. The
sample **imports real production data** (`~/data/destinations`) — allowed
direction (dev → production data). **No production import from
`src/components/dev/`.** No map dependencies, remote tiles, API keys, or image
files added. The pre-existing DB SSL TypeScript error is untouched.

## Preview route

`/dev/ui-search` — global search results concept, behind the standard
`/dev/ui-*` gate (`shouldIndex` → 404 on the production host) with
`x-robots-tag: noindex, nofollow` and an amber banner.

The vertical switcher works in the preview:

```
/dev/ui-search                  (All — mixed, action-grouped overview)
/dev/ui-search?vertical=hotels
/dev/ui-search?vertical=flights
/dev/ui-search?vertical=cars
/dev/ui-search?vertical=destinations
```

## User decision needed

1. **Should a unified global SRP exist at all?** Production has no multi-vertical
   SRP today — only per-vertical results pages and noindex `/search` redirect
   shims. Confirm building a unified global search surface, or keep search
   strictly per-vertical.
2. **Production route + URL scheme.** Options: (a) a new `/search?q=<query>`
   unified SRP, (b) a `/search/all/<query>/<page>` path mirroring the existing
   `[vertical]/[query]/[page]` precedent (and the OG route), or (c) make the
   `/search/<vertical>/...` shims render results instead of redirecting.
   Recommendation: (a) or (b), kept **noindex, follow** under the existing
   `/search` layout.
3. **Real data source for the verticals.** The sample hotels/flights/cars are
   illustrative. Confirm wiring the implementation to the real per-vertical
   search services (`searchService` / canonical loaders), or keep the SRP as an
   aggregating launcher that links into each vertical's own results page.
4. **Destinations as a search vertical.** Confirm including `/destinations`
   guides as a global search vertical (sample does, using real data), or keep
   destinations out of global search.
5. **Refinement scope.** Confirm whether the first production version ships with
   wired sort/filter on the SRP, or defers refinement to the per-vertical pages
   (SRP stays an overview + handoff).

## Verification results

- `npm run build.types`: only the pre-existing `src/lib/db/client.server.ts(91,5)`
  SSL error — zero new errors.
- `npx vite build`: client + SSR build succeeds (`✓ built`).
- `/dev/ui-search` and all four `?vertical=` views → 200; `x-robots-tag:
  noindex, nofollow` present on the final response; robots meta `noindex,
  nofollow` in the HTML; H1 `Results for "Miami"`.
- All other `/dev/ui-*` previews and production `/`, `/hotels`, `/flights`,
  `/car-rentals`, `/explore`, `/destinations` → 200 (unaffected).
- Production `/search/*` shims unchanged: `/search/hotels/miami/1` and
  `/search/car-rentals/orlando/1` still 302-redirect (then 200) and still carry
  `x-robots-tag: noindex, follow`.
- No production import from `src/components/dev/` (grep-verified).

---

**Global search results page sample ready for review at `/dev/ui-search`.**

Options:
1. Approve this direction.
2. Reject this direction and request a different concept.
3. Modify this direction with specific changes.

No production global search implementation has been applied yet.

Recommended next task after approval:
CLAUDE-UI-026 — Global Search Results Implementation
