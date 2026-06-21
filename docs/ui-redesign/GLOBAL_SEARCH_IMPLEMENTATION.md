# Global Search Results Implementation

CLAUDE-UI-026 — Production implementation of the approved CLAUDE-UI-025
global search results page direction.

## Approved direction

Approved from CLAUDE-UI-025 sample:
- Unified global SRP as a search launcher / cross-vertical overview (not ranked metasearch)
- `noindex, follow` — SRP remains internal, preserves the existing `/search/*` noindex posture
- Page coexists safely alongside existing per-vertical redirect shims
- Design thesis: "Here are the most useful matches for your travel intent, organized by what you can do next."
- Action-grouped "All" overview: Stay / Fly / Drive / Explore
- Destinations vertical uses real `~/data/destinations` data
- Hotels / flights / cars shown as honest launcher cards (no fake prices, suppliers, or availability)
- Counts shown only where real data supports them (destinations vertical only)
- Refinement delegated to per-vertical pages — no fake disabled filters in production
- Whole-trip handoff panel (Explore / Flights / Hotels / Car rentals / Destinations)

## Production files changed

- `src/components/search/GlobalSearchPage.tsx` — new production component
- `src/routes/search/all/index.tsx` — redirect `/search/all/` → `/`
- `src/routes/search/all/[query]/index.ts` — redirect `/search/all/[query]/` → `/search/all/[query]/1`
- `src/routes/search/all/[query]/[pageNumber]/index.tsx` — production global SRP route

## Route decision

**Chosen route:** `/search/all/<query>/<pageNumber>`

**Why this is safe:**
- The existing `/search/*` subtree uses three static prefixes: `hotels`, `flights`, `car-rentals`.
  The new `all` prefix is a fourth static segment — it has no overlap with dynamic routes or
  existing shims. QwikCity's router resolves static segments before dynamic ones, so there is
  no ambiguity.
- The existing `/search/layout.tsx` sets `x-robots-tag: noindex, follow` for the entire
  `/search/*` subtree. The new `/search/all/...` routes are automatically covered — no
  separate header configuration required.
- Existing `/search/hotels/`, `/search/flights/`, `/search/car-rentals/` redirect shims
  are entirely untouched.

**Redirect chain for graceful handling:**
- `/search/all/` → 302 → `/`
- `/search/all/<query>/` → 302 → `/search/all/<query>/1`
- `/search/all/<query>/0` (invalid page) → 302 → `/search/all/<query>/1`

**Alternative considered:** `/search?q=<query>` — would require converting the search layout
from path-param to query-param routing, touching existing shim logic. Rejected in favour of
the cleaner static-segment approach.

## Data mapping notes

- **Destinations**: queried from `~/data/destinations` (the production static array).
  Matching logic: case-insensitive substring on `name`, `query`, and `bestFor` tags, plus
  exact `airportCode` match (e.g., `MIA` → Miami). Returns all destinations if query is empty.
- **Hotels / Flights / Cars**: no global result data is available to this page. These verticals
  are shown as honest launcher cards that route into the real vertical search entry points.
  No prices, suppliers, airline names, or availability claims are made.
- Link builders (all point at valid existing routes):
  - Hotels: `/hotels?destination=<query>` (pre-fills the destination field)
  - Flights: `/flights?to=<query>` (pre-fills the destination field)
  - Cars: `/car-rentals?q=<query>` (pre-fills the search field)
  - Destination guides: `/destinations/<slug>` (direct guide link)
  - Destination flights: `buildFlightsSearchPath('anywhere', slugifyLocation(name), 'round-trip', 1)`
  - Destination hotels: `/hotels?destination=<query>` (real destination.query field)
  - Destination cars: `/car-rentals?q=<query>` (real destination.query field)

## Search intent header implementation

Full-bleed `--ui-hero` gradient band with `--ui-hero-scrim` overlay.
- Eyebrow: "SEARCH OVERVIEW"
- H1: `Results for "<query>"` (`id="global-search-heading"`, aria-labelledby on section)
- Subtitle: summary sentence about the page intent
- Query summary chip: shows the decoded query + destination count (if matched)
- "Start a new search" CTA → `/`
- Breadcrumb: Home `/` → Search (`aria-current="page"`)

## Query summary implementation

The query chip displays:
- The decoded query text
- If destinations match: `N destination(s) found` — real count, not invented
- If no destinations match: chip shows query text only; no false count is shown

The total count avoids pretending to aggregate results across verticals where no real count exists.

## Vertical switcher implementation

Sticky below the hero (`top-0 z-20`). All / Hotels / Flights / Cars / Destinations.
- Links use `?vertical=<key>` query params, server-rendered via `useLocation()`
  so filtered state is present in initial HTML
- Active chip: `--ui-primary` bg + `--ui-on-primary` text + `aria-current="page"`
- Default chip: `--ui-surface` bg + `--ui-border` border
- Count badge: shown **only** on the Destinations chip when `matched.length > 0`
  (real data). No counts on Hotels / Flights / Cars (no real global result data).
- `role="navigation"` + `aria-label="Filter results by category"` for accessibility
- Horizontal scroll on mobile (`overflow-x-auto`)

## Mixed/all overview implementation

`active === 'all'` renders four sections, each with a `SectionHeader`:

| Section | Title | Content |
|---------|-------|---------|
| Stay | "Stay" | Hotels launcher card + "Hotels →" link |
| Fly | "Fly" | Flights launcher card + "Flights →" link |
| Drive | "Drive" | Cars launcher card + "Cars →" link |
| Explore | "Explore" | Real destination cards (or empty state) |

Action-grouping sidesteps fabricated cross-vertical relevance ranking. Users see each
vertical clearly, with honest CTAs.

## Result or launcher cards by vertical

### Hotels (launcher)
No real global hotel data. Card shows:
- "Hotels" type chip
- H3: `Search hotels in <query>`
- Description: honest one-liner about pricing transparency
- CTA: "Search hotels" → `/hotels?destination=<query>`

### Flights (launcher)
No real global flight data. Card shows:
- "Flights" type chip
- H3: `Find flights to <query>`
- Description: honest one-liner about comparing routes
- CTA: "Search flights" → `/flights?to=<query>`

### Cars (launcher)
No real global car-rental data. Card shows:
- "Cars" type chip
- H3: `Compare car rentals in <query>`
- Description: honest one-liner about vehicle classes
- CTA: "Compare cars" → `/car-rentals?q=<query>`

### Destinations (real data)
Matching entries from `~/data/destinations`:
- `--ui-hero` gradient header (84px) with city name + airport code
- "Best for" list (real `bestFor` field)
- Quick-link chips: Flights / Hotels / Cars (real routes)
- Primary: "View <name> guide →" → `/destinations/<slug>`
- Count shown in switcher and summary text (real count, never invented)

## Refinement implementation

No refinement rail in production. The global SRP is a launcher — deep filtering belongs
on the per-vertical results pages where it can be meaningfully applied.

The per-vertical launcher view (`active !== 'all'`) shows:
- A focused, full-width launcher card for that vertical
- A contextual destination guide panel (if the query matches real destinations)

No disabled controls, no fake filters, no "Concept" labels.

## Empty/loading states

**Empty state** (no destinations match the query):
- H3: `No destination guides found for "<query>"`
- Honest suggestion text
- CTAs: "Browse destinations" → `/destinations`, "Explore travel ideas" → `/explore`
- Rendered in place of the Explore section (All view) or as the full destinations view

**Loading state**: not implemented — data is static (server-rendered from `~/data/destinations`),
so there is no async loading for this page. No loading skeleton is needed.

## Pagination notes

Page number is accepted via `params.pageNumber` and passed as `page` prop to the component.
The component uses it to build vertical switcher links (so page is preserved when switching tabs).

Pagination controls are **not rendered** — the current dataset is small enough that all results
fit on one page. When the dataset grows, pagination can be added by slicing `matched` using
`page` and a defined page size. The route already validates and normalises the page number.

## Whole-trip handoff implementation

`--ui-hero` gradient panel at the bottom, matching the destinations and explore pages.
Five glass tiles (real routes):
- Explore → `/explore`
- Flights → `/flights`
- Hotels → `/hotels`
- Car rentals → `/car-rentals`
- Destinations → `/destinations`

H2: "Turn a search into a whole-trip plan"

## SEO/indexing preservation notes

- `/search/all/...` inherits `x-robots-tag: noindex, follow` from `/search/layout.tsx` —
  no separate header configuration needed.
- `head` export adds `<meta name="robots" content="noindex, follow">` as belt-and-suspenders.
- Canonical: no explicit canonical on the SRP (follows existing `/search/*` precedent).
  The page is not indexed, so canonicalization is moot.
- Existing `/search/hotels/`, `/search/flights/`, `/search/car-rentals/` shims unchanged —
  their `noindex, follow` posture is preserved.
- `/destinations`, `/destinations/[slug]`, `/hotels/in/[citySlug]`, and other indexable pages
  are not touched.
- No developer/SEO copy on the page — content is traveler-facing only.

## Accessibility notes

- Single `<h1 id="global-search-heading">`, `aria-labelledby` on the hero section
- Breadcrumb: `<nav aria-label="Breadcrumb">` with `<ol>` and `aria-current`
- Vertical switcher: `role="navigation"` + `aria-label="Filter results by category"`
- Active chips: `aria-current="page"`
- Destination card gradient header: **not** `aria-hidden` — city name is meaningful text
- Focus-visible rings on all interactive elements (`focus-visible:ring-2`)
- Launcher card H3s are real headings (not `<p>`)
- `LauncherCard` is an `<article>` for landmark semantics
- No color-only meaning

## Responsive notes

- Hero: full-bleed gradient, single column, generous padding
- Vertical switcher: sticky `top-0`, horizontal scroll (`overflow-x-auto`), `whitespace-nowrap`
- Action groups (All view): stacked vertically with `space-y-12`
- Destination cards: 1 col → 2 (sm) → 3 (lg)
- Per-vertical launcher view: 1 col → 2 (lg) for launcher + destination panel
- Handoff tiles: 1 col → 2 (sm) → 5 (lg)
- `max-w-6xl` on all content sections; no horizontal overflow

## Sample/preview cleanup

`src/components/dev/search/` kept as historical reference per convention.
**No production import from `src/components/dev/`** — verified with grep.
The production route imports only from:
- `~/components/search/GlobalSearchPage` (new production component)
- `~/data/destinations` (production data)
- `~/lib/search/flights/routing` (production helpers)

## Deferred work

- Real hotel/flight/car result data wired into the global SRP (requires a unified
  cross-vertical search API or aggregation layer — not in scope for this task)
- Per-vertical counts from real result data (currently omitted for hotels/flights/cars
  since no count is available; will become meaningful once data is wired in)
- Pagination controls (dataset is small; route already accepts `[pageNumber]`)
- A `/search/all/` global entry point that accepts a `?q=` query param and redirects
  to `/search/all/<query>/1` (useful for the global shell search pill integration)
- Shell search pill integration (wire the production search entry point to this route)

## Verification results

- `npm run build.types`: only the pre-existing `src/lib/db/client.server.ts(91,5)`
  SSL error — zero new errors ✓
- `npx vite build`: `✓ built` ✓
- `/search/all/miami/1` → 200, H1 `Results for "Miami"` ✓
- `/search/all/miami/1` → `x-robots-tag: noindex, follow` (inherited from layout) ✓
- `/search/all/miami/1` → `<meta name="robots" content="noindex, follow">` ✓
- `/search/all/orlando/1` → 200 (no destination match → empty state) ✓
- `/search/all/beach/1` → 200 (matches Miami + San Diego via bestFor) ✓
- `/search/all/miami/1?vertical=hotels` → 200, hotels launcher view ✓
- `/search/all/miami/1?vertical=destinations` → 200, destination cards ✓
- `/search/all/miami/` → 302 → `/search/all/miami/1` ✓
- `/search/all/` → 302 → `/` ✓
- Existing `/search/hotels/miami/1` → still 302 → 200 (unchanged) ✓
- Existing `/search/car-rentals/orlando/1` → still 302 → 200 (unchanged) ✓
- No import from `src/components/dev/` in production route ✓
- No fake prices or illustrative sample records in production ✓
- `/dev/ui-search` still renders correctly (dev sample unaffected) ✓
