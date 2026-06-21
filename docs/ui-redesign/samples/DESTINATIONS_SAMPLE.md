# Destinations Page Sample

CLAUDE-UI-023 — preview-only concept for `/destinations`.
Rendered at `/dev/ui-destinations`. **Not production.** The production
`/destinations` route has not been changed.

## Purpose

Propose a premium **travel-atlas** redesign of the Destinations page that shifts
the feel from a plain price-tagged city grid to an editorial, crawlable atlas —
while preserving every real destination link, the indexable `/destinations/[slug]`
guides, and the existing whole-trip booking paths.

Design thesis: **"Browse the places Andacity can help you plan around, then move
into flights, hotels, cars, and local discovery."**

## Current Destinations page observations

Reviewed `src/routes/destinations/index.tsx` and `src/data/destinations.ts`:

- Built on the legacy `Page` shell + `--color-*` tokens (not the `--ui-*` system
  used across `/`, `/hotels*`, `/flights*`, `/car-rentals*`, and `/explore`).
- Data is a static inline array: **2 destinations** today — `miami` and
  `san-diego`. Each record has `slug`, `name`, `query`, `airportCode`,
  `priceFrom`, `bestFor[]`, `neighborhoods[]`, and `faq[]`.
- **There is no region/country/continent field.** The only grouping signal in
  the data is `bestFor` (experience tags: Beach, Nightlife, Food, Waterfront,
  Family, Outdoor).
- Cards link to `/destinations/[slug]` (the detail route, which is indexable and
  carries `TouristDestination` + `FAQPage` JSON-LD). The detail page itself is a
  hotels-first landing surface ("Hotels in {name}").
- Page-level `ItemList` + `BreadcrumbList` JSON-LD is already present.
- Strengths: clean, fully crawlable, real links, structured data. Weakness:
  visually flat (grey image placeholder blocks, single price badge), no browse
  affordance, no editorial framing, no whole-trip handoff beyond a single "Start
  with hotels" button.

Shared dependencies confirmed:
- `/explore` (uses the same flight-path builder and `?destination=` handoff idea)
- `/hotels/in/[citySlug]` and `/car-rentals/in/[citySlug]` exist as dynamic
  routes; the query-param landing forms `/hotels?destination=` and
  `/car-rentals?q=` are the safe always-valid handoff used by `/explore`.
- `/destinations/[slug]` is the canonical destination guide.

## Proposed Destinations direction

An atlas-style cinematic hero, a sticky "browse by experience" filter bar,
editorial collection cards, visually rich destination cards with city name +
airport overlaid on a gradient header, and a whole-trip handoff panel — all on
the `--ui-*` system.

Section order in the sample:

1. Atlas hero (`--ui-hero` gradient, breadcrumb, browse affordance)
2. Sticky experience filter bar (tags derived from real `bestFor` data)
3. Editorial collections (grouped by real experience tags)
4. All destinations grid (real records, real links, optional experience filter)
5. Whole-trip handoff panel (Explore / Flights / Hotels / Cars)

## Atlas hero concept

Full-bleed `--ui-hero` gradient band with `--ui-hero-scrim` overlay. No image
file. Generous padding (`py-20 md:py-28`).

Default copy:
- Eyebrow: "DESTINATIONS"
- H1: **"Browse destinations"**
- Subtitle: "A travel atlas of the places Andacity can help you plan around —
  then move into flights, hotels, cars, and local discovery."

Filtered copy (when `?experience=<tag>` is active):
- Eyebrow: "DESTINATIONS · FILTERED"
- H1: **"Destinations for `<tag>` trips"**
- Subtitle names the active experience and points into the booking verticals.

Browse affordance: a "Browse all destinations" button anchors to the grid
(`#all-destinations`); a "Clear filter" button appears when a filter is active.

## Browse/search concept

The browse affordance is the **sticky experience filter bar** plus the hero
anchor button. There is no fake free-text search box — controls that don't work
were avoided per the task constraints.

- Sticky bar (`top-0 z-20`), horizontal scroll on mobile.
- "All" chip + one chip per real `bestFor` tag (currently 6: Beach, Family,
  Food, Nightlife, Outdoor, Waterfront).
- Active chip: `--ui-primary` + `--ui-on-primary` + `aria-current="page"`.
- Each chip links to `/dev/ui-destinations?experience=<tag>` (real, functional
  filtering in the preview). In production these would target
  `/destinations?experience=<tag>` (a new, optional, crawlable filter param) —
  this is a **user decision** (see below).

## Region/category grouping concept

The current data model **does not support regions** (no country/continent/region
field). Rather than invent region assignments and present them as fact, the
sample groups by the one real categorical field: `bestFor` experience tags.

- "Browse by experience" filter bar — derived only from real tags.
- "Editorial collections" — three curated cards, each defined purely as a set of
  real tags (Beach & waterfront / Family-friendly / Food & nightlife) with a
  **real** destination count computed from the dataset.

No invented regions, no fake counts, no fake popularity or seasonal rankings.
What richer grouping would need is documented under *User decision needed*.

## Destination card concept

Each card uses a real `DESTINATIONS` record:

- `--ui-hero` gradient header (84px) with the city **name** in white at
  bottom-left and the real `airportCode` badge at bottom-right. The header is
  **not** `aria-hidden` — the city name is meaningful text for screen readers.
- Body: "Best for {bestFor}." + a secondary line with the real neighborhood
  count and `from {priceFrom}/night (varies by season)` — `priceFrom` is a real
  dataset field already shown on the live page, framed honestly as a "from"
  figure.
- `bestFor` tag chips (each links to the matching experience filter).
- Whole-trip quick links: Flights / Hotels / Cars (all real routes).
- Primary action: "View {name} guide →" → `/destinations/[slug]`.

## Featured/editorial collection concept

Three collection cards, each backed by real `bestFor` tags:

| Collection | Tags | Behavior |
|---|---|---|
| Beach & waterfront | Beach, Waterfront | links to the Beach experience filter |
| Family-friendly | Family, Outdoor | links to the Family experience filter |
| Food & nightlife | Food, Nightlife | links to the Food experience filter |

Each card shows the **real** count of matching destinations and uses the
`--ui-hero` gradient header band with a "Collection" badge. No fabricated
editorial claims.

## Whole-trip handoff concept

A full-width `--ui-hero` panel at the bottom (inside `max-w-6xl`) with four glass
tiles: **Explore** (`/explore`), **Flights** (`/flights`), **Hotels**
(`/hotels`), **Car rentals** (`/car-rentals`). Per-destination cards also carry
city-aware Flights/Hotels/Cars links built from the real `name`/`query` fields.

Copy: "Turn a destination into a whole-trip plan."

## Internal linking concept

Crawlable links produced by the sample:

- Breadcrumb: Home `/`
- Experience filter chips: `?experience=<tag>` (7 links incl. "All")
- Editorial collection cards: experience filter links
- Destination cards: `/destinations/[slug]` (guide), `bestFor` chips, and
  city-aware Flights / Hotels / Cars links
- Handoff tiles: `/explore`, `/flights`, `/hotels`, `/car-rentals`

All links target valid existing routes. No dev URLs would ship to production
(the `?experience=` filter is the only new scheme, and it is a documented user
decision). Flight links use `buildFlightsSearchPath`; hotel/car links use the
query-param landing forms that `/explore` already relies on.

## Empty/loading state concept

- No loader — destination data is static inline, so there is no loading state.
- Empty state: if an experience filter matches zero destinations, the grid shows
  a "No destinations match this experience yet." card with a "View all
  destinations →" reset link. (Cannot occur with the current dataset, where every
  tag maps to at least one destination, but the state is implemented for safety.)

## Photography/image strategy

No remote images, no local image files. The `--ui-hero` CSS gradient serves as
the atmospheric visual in the hero, editorial collection header bands,
destination card header bands, and handoff panel. Palette-agnostic across all
6 palettes × light/dark. The production page's current grey image placeholder
blocks are replaced by gradient bands that carry the city name — no broken image
states. Real photography could later slot behind the 80px/84px header bands
without layout changes.

## Responsive behavior

- Hero: single column, generous padding, full-bleed gradient.
- Experience bar: sticky, horizontal scroll, `whitespace-nowrap` chips.
- Editorial collections: 1 col → 2 (sm) → 3 (lg).
- Destination grid: 1 col → 2 (sm) → 3 (lg).
- Handoff tiles: 1 col → 2 (sm) → 4 (lg).
- `max-w-6xl` on all content sections; no horizontal overflow.

## Accessibility notes

- Single `<h1>` (`id="destinations-sample-heading"`), referenced by
  `aria-labelledby` on the hero.
- Breadcrumb is a labelled `<nav><ol>` with `aria-current="page"`.
- Experience bar: `role="navigation"` + `aria-label="Browse by experience"`;
  active chip gets `aria-current="page"`.
- Destination card gradient header is **not** `aria-hidden` (city name is
  meaningful); editorial collection header band **is** `aria-hidden` (decorative
  badge only).
- Focus-visible rings on every interactive element; no colour-only meaning;
  `#all-destinations` anchor target uses `scroll-mt` for sticky-bar offset.

## SEO notes

This sample is `noindex, nofollow` and 404s on the production host via the
standard `shouldIndex(url)` gate, with `x-robots-tag: noindex, nofollow` and an
amber "not production" banner. The production `/destinations` route is unchanged
— its canonical, `ItemList`/`BreadcrumbList` JSON-LD, meta description, and
indexability are unaffected.

When the production implementation is approved, the structured data
(`ItemList`, `BreadcrumbList`) and indexable `/destinations/[slug]` links must be
preserved, and the meta description can be updated to the atlas framing.

## Implementation boundary

This task adds preview-only files:

- `src/routes/dev/ui-destinations/index.tsx`
- `src/components/dev/destinations/DestinationsSample.tsx`
- `docs/ui-redesign/samples/DESTINATIONS_SAMPLE.md`

It does **not** touch `src/routes/destinations/index.tsx`,
`src/routes/destinations/[slug]/index.tsx`, `src/data/destinations.ts`, or any
production component. The sample **imports real production data**
(`~/data/destinations`) — allowed direction (dev → production data). No
production import from `src/components/dev/`. No map dependencies, remote tiles,
API keys, or image files added. The pre-existing DB SSL TypeScript error is
untouched.

## Preview route

`/dev/ui-destinations` — travel-atlas Destinations concept, behind the standard
`/dev/ui-*` gate (`shouldIndex` → 404 on the production host) with
`x-robots-tag: noindex, nofollow` and an amber "not production" banner.

Experience filtering works in the preview:

```
/dev/ui-destinations
/dev/ui-destinations?experience=beach
/dev/ui-destinations?experience=family
/dev/ui-destinations?experience=food
```

## User decision needed

1. **Region grouping** — the dataset has no region/country field, so the sample
   groups by real `bestFor` experience tags only. Confirm experience-tag grouping
   as the model, or approve adding real `region`/`country` fields to
   `src/data/destinations.ts` (and to new destinations) to unlock true atlas
   regions.
2. **Dataset size** — there are only 2 production destinations today. Confirm
   shipping the atlas with 2 real destinations now (it scales automatically), or
   expand `DESTINATIONS` first so the grid and collections feel fuller.
3. **`?experience=` filter param** — confirm introducing a crawlable
   `/destinations?experience=<tag>` filter scheme in production, or keep the
   production page unfiltered (collections-as-links only).
4. **`priceFrom` display** — confirm keeping the real "from {price}/night
   (varies by season)" figure on cards, or drop pricing from the atlas surface.
5. **Gradient-band headers** — confirm the `--ui-hero` gradient bands as the
   image strategy (no real photography needed), or request space for real photos.

## Verification results

- `npm run build.types`: only the pre-existing `src/lib/db/client.server.ts(91,5)`
  SSL error — zero new errors. (see Verification section of the final report)
- `npx vite build`: client + SSR build succeeds.
- `/dev/ui-destinations` → 200, `x-robots-tag: noindex, nofollow` present.
- `/dev/ui-destinations?experience=beach` / `=family` → 200, grid filters.
- Production `/destinations`, `/destinations/[slug]` unchanged → 200.
- No production import from `src/components/dev/`.

---

**Destinations page sample ready for review at `/dev/ui-destinations`.**

Options:
1. Approve this direction (proceed to CLAUDE-UI-024 — Destinations Page Implementation).
2. Reject this direction and request a different concept.
3. Modify this direction with specific changes.

No production Destinations page implementation has been applied yet.

Recommended next task after approval:
CLAUDE-UI-024 — Destinations Page Implementation
