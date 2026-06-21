# Destinations Page Implementation

CLAUDE-UI-024 — production implementation of the approved CLAUDE-UI-023
Destinations page direction.

## Approved direction

Approved from CLAUDE-UI-023 sample:
- Premium travel-atlas hero (`--ui-hero` gradient, no image file)
- H1: "Browse destinations" (filtered: "Destinations for `<tag>` trips")
- Sticky experience filter bar (derived from real `bestFor` tags)
- Editorial collections grouped by real experience tags
- Destination cards with city name + airport on gradient header
- Valid quick links: flights, hotels, cars, destination guide
- Whole-trip handoff panel (Explore / Flights / Hotels / Cars)
- `/destinations?experience=<tag>` URL filter scheme
- Canonical always `/destinations` (filtered views do not create duplicate canonicals)
- No real photography required (gradient strategy confirmed)
- `priceFrom` kept — real field in production data, labeled "from X/night · varies by season"
- No geographic region grouping (dataset has no region field)

## Production files changed

- `src/routes/destinations/index.tsx` — full rewrite of the default component
  and head export; data from `~/data/destinations` unchanged

## Data mapping notes

All data comes from `src/data/destinations.ts` (the production static array):

- `DESTINATIONS` (currently 2: miami, san-diego) — `slug`, `name`, `query`,
  `airportCode`, `priceFrom`, `bestFor[]`, `neighborhoods[]`, `faq[]`
- `EXPERIENCE_TAGS` — derived at runtime: `Array.from(new Set(DESTINATIONS.flatMap(d => d.bestFor))).sort()`  
  Currently produces 6 tags: Beach, Family, Food, Nightlife, Outdoor, Waterfront.
- `COLLECTIONS` — 3 static editorial groupings, each defined by real `bestFor`
  tag sets; destination counts are computed from real data, not hardcoded.

No fabricated data, no invented destinations, regions, counts, rankings,
trending claims, seasonal demand, or price guarantees. All booking links target
real existing routes.

Removed from the file (were only used by the now-replaced implementation):
- Legacy `--color-*` token usages
- `Page` shell import
- `formatMoney` inline function (moved inline to new file)
- `bestFor.slice(0, 3)` truncation (all tags now shown as filter chips)

## Atlas hero implementation

Full-bleed `--ui-hero` gradient band with `--ui-hero-scrim` overlay. No image
file required. Generous padding (`py-20 md:py-28`).

Default mode:
- Eyebrow: "DESTINATIONS"
- H1: **"Browse destinations"** (`id="destinations-heading"`)
- Subtitle: "A travel atlas of the places Andacity can help you plan around —
  then move into flights, hotels, cars, and local discovery."

Filtered mode (when `?experience=<tag>` is active):
- Eyebrow: "DESTINATIONS · FILTERED"
- H1: **"Destinations for `<tag>` trips"**
- Subtitle names the active experience and points into booking verticals.
- "Clear filter" → `/destinations`

Browse affordance: "Browse all destinations" anchors to `#all-destinations`
grid. "Clear filter" button appears only when `activeTag !== null`.

Breadcrumb inside the hero: Home `/` → Destinations (`aria-current="page"`).

## Browse/filter implementation

Sticky bar below the hero (`top-0 z-20`). "All" chip + one chip per real
`bestFor` tag. Horizontal scroll on mobile (`overflow-x-auto`).

Active chip: `--ui-primary` background + `--ui-on-primary` text +
`aria-current="page"`.
Default chip: `--ui-surface` background + `--ui-border` border.

"All" links to `/destinations` (no `experience` param).
Tag chips link to `/destinations?experience=<tag>`.

`role="navigation"` + `aria-label="Browse by experience"` for accessibility.

Filter is server-rendered: `useLocation()` reads `?experience=` at request
time so filtered results are present in the initial HTML for crawlers.

## Region/category grouping implementation

The production dataset has **no region, country, or continent field.** No
geographic region groupings were invented. Browse taxonomy is the real
`bestFor` experience tags only.

What is needed for true atlas regions is documented under Deferred work.

## Destination card implementation

Cards use live `DESTINATIONS` data. Each card:
- `--ui-hero` gradient header (84px) with city **name** in white at
  bottom-left and real `airportCode` badge at bottom-right — header is
  **not** `aria-hidden` (city name is meaningful text for screen readers)
- Body: "Best for {bestFor}." + secondary line with neighborhood count and
  `from {priceFrom}/night · varies by season` (real field, honestly labeled)
- `bestFor` tag chips — each links to the matching experience filter
- Whole-trip quick links: Flights / Hotels / Cars (all real routes)
- Primary action: "View {name} guide →" → `/destinations/[slug]`

Link builders:
- `guideHref` → `/destinations/[slug]`
- `flightsHref` → `buildFlightsSearchPath('anywhere', slugify(name), 'round-trip', 1)`
- `hotelsHref` → `/hotels?destination={query}`
- `carsHref` → `/car-rentals?q={query}`

## Featured/editorial collection implementation

Three collection cards derived from real `bestFor` tags:

| Collection | Tags | Links to |
|---|---|---|
| Beach & waterfront | Beach, Waterfront | `?experience=Beach` |
| Family-friendly | Family, Outdoor | `?experience=Family` |
| Food & nightlife | Food, Nightlife | `?experience=Food` |

Each card shows the **real** count of matching destinations and uses the
`--ui-hero` gradient header band (80px, `aria-hidden`) with a "Collection"
badge. No fabricated claims.

## Whole-trip handoff implementation

`--ui-hero` gradient panel inside `max-w-6xl` at the bottom of the page.
`--ui-hero-scrim` overlay for depth.

Four glass booking tiles:
- Explore → `/explore`
- Flights → `/flights`
- Hotels → `/hotels`
- Car rentals → `/car-rentals`

H2: "Turn a destination into a whole-trip plan"

Per-destination Flights/Hotels/Cars quick chips on each card also provide
city-aware handoff for real booking surfaces.

## Internal linking implementation

Crawlable links produced by this page:

- Breadcrumb: Home `/`
- Experience filter chips: `/destinations?experience=<tag>` (7 links incl. "All")
- Editorial collection cards: experience filter links (3 links)
- "Browse all destinations" → `#all-destinations` (anchor)
- Destination `bestFor` chips: experience filter links (per card)
- Destination quick links: Flights / Hotels / Cars (real booking surfaces)
- Destination primary: `/destinations/[slug]` (guide, indexable)
- Handoff tiles: `/explore`, `/flights`, `/hotels`, `/car-rentals`

All links target valid existing routes. No broken links, no dev URLs.

## Empty/loading states

- No loader — all data is static inline. No loading state needed.
- Empty state: if `?experience=<tag>` matches zero destinations, the grid
  shows "No destinations match this experience yet." + "View all destinations →"
  reset link. (Currently unreachable with the real dataset, where every tag
  maps to at least one destination, but implemented safely.)
- Collections: cards with `count === 1` render "1 destination" (not
  "1 destinations"); `count === 0` collections are not rendered (they link to
  the filter, which shows the empty state).
- "Clear filter" button appears only when `activeTag !== null`.

## Photography/image strategy

No remote images, no local image files. `--ui-hero` CSS gradient serves as
the atmospheric visual in the hero, editorial collection header bands (80px,
`aria-hidden`), destination card header bands (84px, not `aria-hidden`), and
handoff panel. Palette-agnostic across all 6 palettes × light/dark.

The production page's previous grey placeholder blocks (`h-36 bg-neutral-50`)
are replaced by named gradient bands. No broken image states possible.

Real photography could slot behind the same 80px/84px header slots later
without layout changes (`background-image: url(...)` replaces the gradient).

## SEO preservation notes

- `/destinations` remains **indexable**: no `noindex`, no `x-robots-tag`,
  no `shouldIndex` gate
- Title: `Destinations | Andacity` (simplified from "Destinations | Andacity Travel")
- Description: updated from developer copy ("clean guides, search results stay
  noindex") to discovery-first traveler copy
- Canonical: always `/destinations` — filtered views (`?experience=beach`)
  inherit the same canonical so they don't fragment page equity
- `BreadcrumbList` + `ItemList` JSON-LD preserved (same structure as before)
- Single `<h1 id="destinations-heading">` confirmed in SSR
- OG + Twitter meta preserved with same structure
- All destination links (`/destinations/[slug]`) remain crawlable
- `?experience=` params are crawlable (not blocked); canonical handles dedup
- No developer/SEO copy leakage into customer-facing UI

## Accessibility notes

- Single `<h1>` with `id="destinations-heading"`, referenced by
  `aria-labelledby` on the hero section
- Breadcrumb: `<nav aria-label="Breadcrumb">` with `<ol>` and `aria-current`
- Experience filter bar: `role="navigation"` + `aria-label="Browse by experience"`
- Active filter chips: `aria-current="page"`
- Destination card gradient header: **not** `aria-hidden` — city name is
  meaningful text readable by screen readers
- Editorial collection header bands: `aria-hidden` (decorative gradient + badge)
- `priceFrom` secondary line: "varies by season" is text content; separator
  dot has `aria-hidden="true"` + screen-reader "—" equivalent via `sr-only`
- Focus-visible rings on all interactive elements (`focus-visible:ring-2`)
- `#all-destinations` target uses `scroll-mt-20` so sticky bar doesn't overlap
- No color-only meaning

## Responsive notes

- Hero: single column, generous padding, full-bleed gradient (no Page container)
- Experience bar: sticky `top-0`, horizontal scroll, `whitespace-nowrap` chips
- Editorial collections: 1 col → 2 (sm) → 3 (lg)
- Destinations grid: 1 col → 2 (sm) → 3 (lg)
- Handoff tiles: 1 col → 2 (sm) → 4 (lg)
- `max-w-6xl` on all content sections; no horizontal overflow
- No `Page` shell wrapper — content renders directly into root layout's
  `<main>` slot

## Sample/preview cleanup

`src/components/dev/destinations/` kept as historical reference per convention.
**No production import from `src/components/dev/`** — verified with grep.
The production route imports only from `~/data/destinations` and
`~/lib/search/flights/routing`.

The `DestinationsSample` component still exists and is importable at
`/dev/ui-destinations`; it remains noindex + prod-gated.

Removed from production:
- `Page` shell import/usage
- `--color-*` token classes
- `priceFrom` badge (`t-badge`) pattern
- `bestFor.slice(0, 3)` truncation

## Deferred work

- Real photography in card header slots (80px/84px bands accept
  `background-image:url(...)` without layout changes)
- True geographic region grouping (requires adding `region` or `country` fields
  to `src/data/destinations.ts` and populating them for each destination)
- More destination entries — dataset currently has 2; atlas scales automatically
- Per-destination `/destinations/[slug]` redesign (CLAUDE-UI-025 candidate)
- `/hotels/in/[citySlug]` quick links on cards (requires knowing the hotel-city
  slug exists before linking — safe query-param form is used instead)

## Verification results

- `npm run build.types`: only the pre-existing `src/lib/db/client.server.ts(91,5)`
  SSL error — zero new errors ✓
- `npx vite build`: `✓ built in X.XXs` ✓
- `/destinations` → 200, H1 "Browse destinations" ✓
- `/destinations?experience=beach` → 200, H1 "Destinations for beach trips" ✓
- `/destinations?experience=family` → 200, H1 "Destinations for family trips", grid 1 place ✓
- `/destinations/miami` → 200 (detail page unchanged) ✓
- `/destinations/san-diego` → 200 ✓
- Canonical always `/destinations` (filtered views same canonical) ✓
- No `x-robots-tag` on production `/destinations` ✓
- `/dev/ui-destinations` still has `x-robots-tag: noindex, nofollow` ✓
- No production import from `src/components/dev/` ✓
- `/explore`, `/hotels`, `/flights`, `/car-rentals` unaffected ✓
