# Destination Detail Page Sample

CLAUDE-UI-027 — Preview-only direction for the redesigned
`/destinations/[slug]` destination detail page. Not production.

Preview route: `/dev/ui-destination-detail` (Miami) ·
`/dev/ui-destination-detail?destination=san-diego` (San Diego).

## Purpose

Define an approved direction for a premium, editorial **city guide** version of
the destination detail page that helps a visitor understand a place quickly and
then move into concrete trip planning — flights, hotels, car rentals,
neighborhoods, and Explore.

Design thesis:

> Understand this destination quickly, then plan the stay, flight, car, and
> local discovery around it.

This task produces a sample for review only. It does **not** replace the
production `/destinations/[slug]` route until the user approves.

## Current destination detail observations

The current production route is `src/routes/destinations/[slug]/index.tsx`:

- Loads the destination from the real dataset via `DESTINATIONS_BY_SLUG`
  (`routeLoader$ useDestinationPage`), 404s on unknown slug.
- Also loads `topStays` from the DB (`loadTopDestinationStaysFromDb`).
- **It is hotel-centric, not a true city guide.** The H1 is literally
  "Hotels in {name}" and the primary module is a hotel search form. It reads
  as a hotels landing page scoped to a city rather than a destination guide.
- Uses the **legacy** `t-card` / `t-panel` / `--color-*` token system, not the
  new `--ui-*` system used by CLAUDE-UI-004 → 026.
- Contains developer/SEO placeholder copy in the body, e.g. _"This is where you
  earn long-tail rankings…"_ and _"Keep paragraphs short and
  information-dense."_ — leaked guidance copy that should not ship.
- Has an empty **Map** card (`h-56` placeholder div) — a visual dead zone.
- Real, usable fields already present per destination: `name`, `query`,
  `airportCode`, `priceFrom`, `bestFor[]`, `neighborhoods[]` (slug/name/blurb),
  `faq[]` (q/a).
- SEO is already strong: canonical, OG/Twitter, and JSON-LD
  (`BreadcrumbList` + `TouristDestination` + `FAQPage`). This must be preserved.
- Shared dependencies: `~/data/destinations` (also used by `/destinations`,
  `/dev/ui-destinations`, and the global search overview),
  `~/lib/search/flights/routing` (flights links), and the DB hotels-pages
  queries. `/hotels/in/[citySlug]`, `/car-rentals/in/[citySlug]`, and
  `/explore` are sibling routes the page should hand off to.

## Proposed destination detail direction

Reframe the page from "Hotels in {city}" to a **destination guide** whose job is
orientation → planning:

1. Cinematic destination hero (name as H1, real quick-facts).
2. Sticky in-page anchor nav (Overview / Neighborhoods / Plan / Guide).
3. Overview: editorial summary + best-for chips + a real "good to know" card.
4. Neighborhoods: real `neighborhoods[]` as "where to stay" area cards.
5. "Plan this trip": Flights / Hotels / Cars / Explore handoff tiles.
6. Practical guide: real `faq[]` rendered as planning Q&A.
7. Related destinations (other real destinations only).
8. Whole-trip handoff panel + mobile sticky CTA.

Built entirely on `--ui-*` tokens, inside the production global shell, with no
invented data and no map/remote-image dependencies.

## Destination hero concept

- Full-bleed `--ui-hero` gradient band + `--ui-hero-scrim` overlay (no image
  file).
- Breadcrumb: Home / Destinations / {name} (`<nav aria-label="Breadcrumb">`,
  `aria-current="page"` on the leaf).
- Eyebrow: "Destination guide".
- Single **H1 = the destination name** (`Miami`), not "Hotels in Miami".
- Editorial summary sentence (real fields only — see below).
- Quick-fact chips from real fields: `{airportCode} airport`,
  `{n} neighborhoods`, `Best for {tag}` (one per real `bestFor`),
  `From {priceFrom}/night`.
- Primary CTAs: "Plan this trip" (anchors to `#plan`) and "Browse stays"
  (→ city hotels page).

## Destination summary concept

- One editorial paragraph generated **only** from real fields: the destination
  name, its `bestFor` tags (lower-cased and joined naturally), the airport code,
  and the real neighborhood count. No invented attractions, history, weather, or
  superlatives.
- Repeated in the Overview section beside a "Good to know" card.

## Best-for/trip-style concept

- The real `bestFor[]` tags are rendered as trip-style chips in the Overview.
- Each chip links to `/explore?destination=<slug>` (a real, verified Explore
  entry — the slug matches an Explore `POPULAR_DESTINATIONS` key for both real
  destinations), letting a visitor pivot from "what is this place good for" into
  guided discovery.
- No invented trip styles — chips are exactly the dataset's `bestFor` values.

## Neighborhood/area concept

- Uses the **real** `neighborhoods[]` data (Miami: South Beach, Downtown,
  Wynwood, Coconut Grove; San Diego: Gaslamp Quarter, La Jolla, Mission Beach,
  Little Italy), each with its real `blurb`.
- Rendered as "Where to stay in {name}" area cards with a CSS-only accent band
  (decorative, `aria-hidden`).
- Each card links to `/hotels?destination=<query> <area>` — the hotels landing
  page accepts the `destination` param and pre-fills the search (returns 200;
  no fabricated availability).
- **Data gap note:** neighborhoods are real but shallow (name + one-line blurb,
  no geo, no per-area imagery). This is enough for a "pick a base" section but
  not for a map or per-neighborhood subpages. No neighborhoods are invented; if
  a future destination has an empty `neighborhoods[]`, the section is omitted in
  favor of the Plan/Guide sections.

## Plan-this-trip concept

- The conversion core: a 4-tile panel (`#plan`) with Flights / Hotels / Cars /
  Explore.
- Each tile has an honest, destination-specific description and a real CTA link.
  No prices, supplier names, or availability claims are fabricated.
- Tiles are real `<a>` cards (keyboard-reachable, focus-visible ring), 1-col on
  mobile → 4-col on desktop.

## Flights handoff concept

- Link: `buildFlightsSearchPath('anywhere', slugifyLocation(name), 'round-trip', 1)`
  → `/search/flights/from/anywhere/to/<slug>/round-trip/1` (verified 200 for
  both real destinations).
- Copy references the real `airportCode` ("Compare routes into MIA"). No fare
  amounts or airline names invented.

## Hotels handoff concept

- Primary link: `/hotels/in/<slug>` (the production city hotels page; verified
  200 for `miami` and `san-diego`).
- **Implementation guard:** the city page is DB-backed, so a future destination
  slug without a matching city row would 404. Implementation must fall back to
  the always-valid entry route `/hotels?destination=<query>` when no city page
  exists. Documented here so it is not lost.
- No nightly prices beyond the real `priceFrom` (shown with a "varies by season"
  caveat), no fabricated hotel names or counts.

## Car rentals handoff concept

- Primary link: `/car-rentals/in/<slug>` (production city car-rentals page;
  verified 200 for `miami` and `san-diego`).
- Same DB-backed guard as hotels: fall back to `/car-rentals?q=<query>` when no
  city page exists.
- No vehicle prices or supplier names invented.

## Explore/discovery handoff concept

- Link: `/explore?destination=<slug>` (verified 200; slug matches an Explore
  `POPULAR_DESTINATIONS` key for both real destinations).
- Lets a visitor move from a single destination back into mood/season/budget
  discovery without a dead end.

## Related destinations/internal linking concept

- "Keep planning" section renders the **other real destinations** only
  (`DESTINATIONS` minus the current slug), each linking to its real
  `/destinations/<slug>` guide.
- With the current 2-destination dataset this shows exactly one related card;
  the grid scales to more without change. If the dataset ever holds a single
  destination, the section is omitted (guarded by `related.length > 0`).
- Additional internal links: breadcrumb → `/destinations`, hero/handoff →
  flights/hotels/cars/explore, neighborhoods → hotels. All crawlable `<a href>`.

## Practical guide content concept

- Renders the **real** `faq[]` as a "{name} planning guide" Q&A grid.
- This is the only place seasonality wording appears, and it comes verbatim from
  the dataset (e.g. Miami's "Peak season is typically winter through early
  spring") — not invented by the sample.
- A "Good to know" card in the Overview surfaces real structured facts (airport,
  neighborhood count, stays-from price, best-for) as a `<dl>`.

## Photography/image strategy

- The sample ships **zero image files and zero remote image/tile/map
  dependencies**. All visual richness comes from `--ui-hero` gradient bands and
  CSS accent strips, consistent with CLAUDE-UI-022/023/026.
- Future image slots (deferred to implementation, documented so they are not
  forgotten):
  - Hero background photograph (would sit behind the existing scrim).
  - Per-neighborhood thumbnail on each area card.
  - Optional related-destination card photo (currently the gradient band).
- No broken `<img>` placeholders are rendered; the empty "Map" card from the
  legacy page is intentionally dropped (no map dependency permitted).

## Empty/fallback state concept

- **Unknown destination slug (preview):** the preview route falls back to Miami
  (or the first valid destination) rather than erroring. The production
  implementation should keep the existing `routeLoader$` 404 on unknown slugs.
- **Empty `neighborhoods[]`:** omit the neighborhoods section; Plan + Guide
  still carry the page.
- **Single-destination dataset:** the "Keep planning" related section is hidden.
- **Missing city hotels/cars page:** fall back to the `?destination=` / `?q=`
  entry routes (see hotels/cars handoff above).
- No empty fields are rendered as blanks or fabricated to fill space.

## Responsive behavior

- Mobile-first. Hero stacks; quick-fact chips wrap; anchor nav is a horizontal
  scroll strip (`overflow-x-auto`, `whitespace-nowrap`), sticky `top-0`.
- Overview: single column on mobile → `1.4fr / 0.6fr` (content / good-to-know)
  on `lg`.
- Neighborhoods: 1 → 2 columns. Plan tiles: 1 → 2 → 4 columns. Guide: 1 → 2
  columns. Related: 1 → 2 → 3 columns. Handoff tiles: 1 → 2 → 5 columns.
- Mobile sticky CTA bar (`lg:hidden`) pinned bottom; the final handoff section
  reserves extra bottom margin on mobile (`mb-24 lg:mb-16`) so it isn't covered.
- `max-w-6xl` content width throughout; no horizontal overflow.

## Accessibility notes

- Exactly one `<h1>` (the destination name); section `aria-labelledby` ties to
  it. All other headings are `<h2>`/`<h3>` in order.
- Breadcrumb is a real `<nav aria-label="Breadcrumb">` / `<ol>` with
  `aria-current="page"`.
- Anchor nav is `role="navigation"` with an `aria-label`.
- Decorative gradient/accent bands are `aria-hidden="true"`; meaningful text
  (city name, airport code) is never hidden.
- Every interactive element is a real `<a>` with visible text and a
  `focus-visible:ring-2` ring. No color-only meaning.
- "Good to know" facts use a semantic `<dl>`/`<dt>`/`<dd>`.

## SEO notes

- The **preview** route is `noindex, nofollow` and 404s on the production host
  (`shouldIndex(url)` gate + `x-robots-tag` header + robots meta), matching all
  other `/dev/ui-*` routes. It must never be indexable.
- The **production** page's existing SEO must be preserved on implementation:
  indexable, canonical to `/destinations/<slug>`, OG/Twitter tags, and the
  `BreadcrumbList` + `TouristDestination` + `FAQPage` JSON-LD. The new layout
  keeps real breadcrumbs and real FAQ content, so the existing JSON-LD maps
  cleanly with no new claims.
- Single H1, server-rendered content, crawlable internal links, no
  developer/SEO copy leakage (the legacy "earn long-tail rankings" copy is
  removed), no keyword stuffing.

## Implementation boundary

- This task adds only:
  - `src/components/dev/destinations/DestinationDetailSample.tsx` (preview component)
  - `src/routes/dev/ui-destination-detail/index.tsx` (preview route)
  - this document
- It does **not** modify `src/routes/destinations/[slug]/index.tsx` or any other
  production route, component, data file, or theme.
- No production code imports from `src/components/dev/`.
- CLAUDE-UI-004 → 026 work, theme switching, mobile nav, and footer are
  untouched. The pre-existing DB SSL TypeScript error is out of scope.

## Preview route

- `/dev/ui-destination-detail` → Miami (default / required destination).
- `/dev/ui-destination-detail?destination=san-diego` → San Diego.
- Unknown slug → falls back to Miami.
- Non-production banner shown at top; `noindex, nofollow`; prod-gated 404.
- Renders inside the production global shell, so the header theme control drives
  all palette + light/dark combinations.

## User decision needed

Approve, reject, or modify this destination detail direction — specifically:

1. The reframe from "Hotels in {city}" to a **destination guide** (name as H1,
   planning-oriented rather than hotel-search-first).
2. Using `/hotels/in/<slug>` and `/car-rentals/in/<slug>` as the primary
   hotels/cars handoffs (with the documented `?destination=` / `?q=` fallback).
3. Dropping the legacy empty "Map" card (no map dependency) in favor of the
   neighborhoods + plan sections.

## Verification results

- `npm run build.types`: only the pre-existing
  `src/lib/db/client.server.ts(91,5)` SSL error — zero new errors from this task.
- `npx vite build`: succeeds (`✓ built`).
- Dev smoke (`:5174`):
  - `/dev/ui-destination-detail` → 200, single `<h1>` = "Miami",
    `x-robots-tag: noindex, nofollow`, robots meta present.
  - `/dev/ui-destination-detail?destination=san-diego` → 200, H1 = "San Diego".
  - `/dev/ui-destination-detail?destination=nope` → 200, H1 = "Miami" (fallback).
  - Real handoff links present and resolving: `/hotels/in/miami`,
    `/car-rentals/in/miami`, `/explore?destination=miami`,
    `/search/flights/from/anywhere/to/miami/round-trip/1`,
    `/destinations/san-diego`.
  - Production routes unaffected: `/`, `/destinations`, `/destinations/miami`,
    `/destinations/san-diego`, `/explore`, `/search/all/miami/1`,
    `/hotels/in/miami`, `/car-rentals/in/orlando`, and all other `/dev/ui-*`
    samples → 200.
