# Destination Detail Page Implementation

CLAUDE-UI-028 — Production implementation of the approved CLAUDE-UI-027
destination detail page direction.

## Approved direction

Approved from CLAUDE-UI-027 sample:
- Reframe from hotel-centric "Hotels in {city}" to an editorial destination guide
- H1 = the destination name (e.g. `Miami`), not "Hotels in Miami"
- Design thesis: "Understand this destination quickly, then plan the stay,
  flight, car, and local discovery around it."
- `--ui-*` token system throughout (replacing legacy `t-card` / `--color-*`)
- Cinematic `--ui-hero` gradient band hero (no image file)
- Real destination data only — no invented neighborhoods, attractions, prices,
  weather, or seasonality claims
- `/hotels/in/<slug>` and `/car-rentals/in/<slug>` as primary handoffs with
  documented entry-route fallback
- `buildFlightsSearchPath` for flights handoff
- `/explore?destination=<slug>` for discovery handoff
- Real neighborhoods, real FAQ guide content
- Legacy empty Map card dropped (no map dependency)
- Whole-trip handoff panel + mobile sticky CTA

## Production files changed

- `src/routes/destinations/[slug]/index.tsx` — complete rewrite

No other production files were changed. The dev sample
(`src/components/dev/destinations/DestinationDetailSample.tsx`) is preserved
as historical reference and not imported from production.

## Data mapping notes

All fields come from the real `~/data/destinations` dataset:

| UI element | Data source |
|---|---|
| H1 | `d.name` |
| Hero quick-fact chips | `d.airportCode`, `d.neighborhoods.length`, `d.bestFor[]`, `d.priceFrom` |
| Editorial summary | Generated from `d.name`, `d.bestFor`, `d.airportCode`, `d.neighborhoods.length` |
| Best-for chips | `d.bestFor[]` each → `/explore?destination=<slug>` |
| Good-to-know card | `d.airportCode`, `d.neighborhoods.length`, `d.priceFrom`, `d.bestFor` |
| Neighborhoods section | `d.neighborhoods[]` (name, blurb); omitted if array is empty |
| FAQ/guide section | `d.faq[]` (q, a); omitted if array is empty |
| Related destinations | All `DESTINATIONS` where `slug !== d.slug` |
| Flights handoff | `buildFlightsSearchPath('anywhere', slugifyLocation(d.name), 'round-trip', 1)` |
| Hotels handoff | `/hotels/in/<slug>` |
| Cars handoff | `/car-rentals/in/<slug>` |
| Explore handoff | `/explore?destination=<slug>` |
| Neighborhood hotel links | `/hotels?destination=<d.query> <n.name>` |

Nothing is invented. The only seasonality wording appears verbatim from `d.faq`
(e.g. Miami's "Peak season is typically winter through early spring").

## Destination hero implementation

Full-bleed `--ui-hero` gradient band + `--ui-hero-scrim` overlay. No image file.

- Breadcrumb: Home `/` → Destinations `/destinations` → {d.name}
  (`aria-current="page"` on leaf; `<nav aria-label="Breadcrumb">`)
- Eyebrow: "Destination guide"
- `<h1 id="destination-detail-heading">` = the destination name
- Editorial summary paragraph (real fields only)
- Quick-fact chips from real fields: airport code, neighborhood count, one
  per `bestFor` tag, `priceFrom` with "/night"
- CTAs: "Plan this trip" (anchors `#plan`) + "Browse stays" (→ `/hotels/in/`)

## Destination summary implementation

One paragraph generated from `d.name`, `d.bestFor` (lower-cased and joined
naturally for ≥3 items), `d.airportCode`, and `d.neighborhoods.length`. Appears
in both the hero and the Overview section. No invented copy.

## Best-for/trip-style implementation

Real `d.bestFor[]` tags rendered as chips in the Overview section. Each chip
links to `/explore?destination=<slug>` — a verified match for both real
destinations (Miami and San Diego have Explore POPULAR_DESTINATIONS keys).

## Neighborhood/area implementation

Section guarded: `{d.neighborhoods.length > 0 ? … : null}`.

When present, renders "Where to stay in {name}" area cards using the real
`neighborhoods[]` (name + blurb). Each card has a CSS-only accent band
(decorative, `aria-hidden`) and a link to
`/hotels?destination=<d.query> <n.name>` (query-param entry; safe for any
destination, no per-area city pages required). No invented neighborhood data,
blurbs, distances, or map pins.

## Plan-this-trip implementation

4-tile `#plan` section (1-col → 2-col sm → 4-col lg). Each tile is a real `<a>`
with an honest description and CTA:

| Tile | Link | Copy references |
|---|---|---|
| Flights | `buildFlightsSearchPath(...)` | Real `d.airportCode` |
| Hotels | `/hotels/in/<slug>` | Real `d.name` |
| Car rentals | `/car-rentals/in/<slug>` | Real `d.name` |
| Explore | `/explore?destination=<slug>` | Real `d.name` |

No prices, supplier names, or availability claims fabricated.

## Flights handoff implementation

`buildFlightsSearchPath('anywhere', slugifyLocation(d.name) || 'anywhere', 'round-trip', 1)`
→ `/search/flights/from/anywhere/to/<slug>/round-trip/1`

Verified 200 for both Miami and San Diego. References real `d.airportCode` in
description copy.

## Hotels handoff implementation

Primary: `/hotels/in/${encodeURIComponent(d.slug)}` (city hotels page; verified
200 for `miami` and `san-diego`).

**Future-destination fallback (documented, not currently branched in code):**
For any destination slug that does not have a DB city row, the
`/hotels/in/<slug>` route would 404. Implementation should detect this and
fall back to `/hotels?destination=<d.query>`. Both real destinations have city
pages; the guard can be added when a third destination is introduced.

`d.priceFrom` is shown with "Nightly rates vary by season. Compare total price
before booking." — not presented as a guaranteed live rate.

## Car rentals handoff implementation

Primary: `/car-rentals/in/${encodeURIComponent(d.slug)}` (city car-rentals
page; verified 200 for `miami` and `san-diego`).

Same DB-backed guard note as hotels: fall back to `/car-rentals?q=<d.query>`
for any future destination lacking a city page.

## Explore/discovery handoff implementation

`/explore?destination=${encodeURIComponent(d.slug)}` — verified 200 for both
destinations (the Explore `POPULAR_DESTINATIONS` array includes `key: 'miami'`
and `key: 'san-diego'`).

## Related/internal linking implementation

"Keep planning" section: filters `DESTINATIONS` to `slug !== d.slug`,
renders real destination guide cards → `/destinations/<slug>`. Guarded:
`{related.length > 0 ? … : null}` (hidden when only one destination exists).

Additional crawlable links: breadcrumb (Home, Destinations), hero "Browse stays",
anchor nav chips, neighborhood hotel links, Plan tiles, whole-trip handoff tiles.

## Practical guide content implementation

Section guarded: `{d.faq.length > 0 ? … : null}`.

When present, renders real `d.faq[]` as a Q&A grid (1-col → 2-col lg) under
"{name} planning guide". Dataset wording is preserved verbatim. No travel
advice added that is not in the data.

## Map removal notes

The legacy empty map placeholder (`<div class="h-56 rounded-2xl border …" />`)
has been removed entirely. Nothing replaces it — no fake map, no geocoded
layout. The neighborhoods section uses CSS editorial accent bands that are
decorative only and make no geographic accuracy claims.

No Google Maps, Mapbox, Leaflet, or tile dependencies were introduced.

## Photography/image strategy

All visual richness comes from `--ui-hero` gradient bands and CSS accent strips,
consistent with CLAUDE-UI-022 through 026. Zero image files, zero remote
image/tile/map dependencies.

Deferred image slots (future work, not deferred to future tasks by default):
- Hero background photograph (would sit behind the existing `--ui-hero-scrim`)
- Per-neighborhood card thumbnail
- Related-destination card photo

## Empty/fallback states

- **Unknown slug:** `routeLoader$` still throws 404 (behavior unchanged from
  the legacy implementation).
- **Empty `neighborhoods[]`:** section is fully omitted
  (`d.neighborhoods.length > 0` guard).
- **Empty `faq[]`:** FAQ/guide section is fully omitted
  (`d.faq.length > 0` guard).
- **Single-destination dataset:** "Keep planning" section is hidden
  (`related.length > 0` guard).
- **`priceFrom` caveat:** displayed with "Nightly rates vary by season.
  Compare total price before booking." — not presented as a live rate.

## SEO preservation notes

- Destination detail pages remain **indexable** (no `noindex` added).
- **Canonical** preserved: `new URL('/destinations/<slug>', url.origin).href`
  via `links: [{ rel: 'canonical', href: canonicalHref }]`.
- **Title** updated to `{name} — Destination Guide | Andacity Travel`
  (was `Hotels in {name} | Andacity Travel`).
- **Description** updated to guide-oriented copy referencing the destination
  name, airport code, and real `bestFor` tags.
- **OG / Twitter** meta preserved; `og:image` path unchanged
  (`/og/destination/<slug>.png`).
- **JSON-LD** preserved: `BreadcrumbList`, `TouristDestination`, and `FAQPage`
  all map cleanly to real fields. `TouristDestination.description` updated to
  match new description copy.
- **Single H1** is the destination name; all other headings are `<h2>`/`<h3>`.
- **No developer/SEO copy leakage** — the legacy "This is where you earn
  long-tail rankings" and "Keep paragraphs short" placeholder copy is removed.
- All internal links are real `<a href>` elements, server-rendered.

## Accessibility notes

- Single `<h1 id="destination-detail-heading">`, `aria-labelledby` on hero
  section.
- Breadcrumb: `<nav aria-label="Breadcrumb">` / `<ol>` / `aria-current="page"`.
- Anchor nav: `role="navigation"` + `aria-label="On this {name} guide"`.
- Decorative accent bands and hero scrim are `aria-hidden="true"`.
- "Good to know" facts use semantic `<dl>`/`<dt>`/`<dd>`.
- All interactive elements are real `<a>` with visible text and
  `focus-visible:ring-2` rings.
- Mobile sticky CTA uses `--ui-primary` / `--ui-on-primary` for AA contrast;
  main content has `mb-24` on mobile so it is not permanently obscured.
- No color-only meaning.

## Responsive notes

- Hero: full-bleed gradient, single column, `py-20 md:py-28`.
- Anchor nav: sticky `top-0 z-20`, horizontal scroll (`overflow-x-auto`).
- Overview: 1-col → `1.4fr / 0.6fr` on `lg` (summary left, good-to-know right).
- Neighborhoods: 1-col → 2-col `sm`.
- Plan tiles: 1-col → 2-col `sm` → 4-col `lg`.
- FAQ guide: 1-col → 2-col `lg`.
- Related destinations: 1-col → 2-col `sm` → 3-col `lg`.
- Handoff tiles: 1-col → 2-col `sm` → 5-col `lg`.
- Mobile sticky CTA: `fixed bottom-0 lg:hidden` with `z-30`.
- Final section: `mb-24 lg:mb-16` so content clears the sticky bar on mobile.
- `max-w-6xl` throughout; no horizontal overflow.

## Sample/preview cleanup

`src/components/dev/destinations/DestinationDetailSample.tsx` is kept as
historical reference per project convention. No production code imports from
`src/components/dev/` — verified with grep.

The production route imports only from:
- `~/data/destinations` (production data)
- `~/lib/search/flights/routing` (production helpers)

The `DateField`, `Page`, `useSignal`, `loadTopDestinationStaysFromDb`,
`getTodayIsoDate`, and `addDays` imports are removed from the production route.

## Deferred work

- City page existence check for future destinations: if a destination slug has
  no corresponding `/hotels/in/<slug>` or `/car-rentals/in/<slug>` DB city row,
  the current implementation would surface a dead link. Both current destinations
  (`miami`, `san-diego`) have city pages. When a third destination is added, the
  city-page guard fallback should be implemented (fall back to
  `/hotels?destination=<query>` and `/car-rentals?q=<query>`).
- Destination photography (hero background, per-neighborhood thumbnails) — slots
  documented above; no broken placeholders shipped.
- Per-destination long-form guide copy (the current editorial summary is
  generated from real fields; a richer editorial layer would require
  copy authoring for each destination).

## Verification results

- `npm run build.types`: only the pre-existing
  `src/lib/db/client.server.ts(91,5)` SSL error — zero new errors ✓
- `npx vite build`: `✓ built` ✓
- `/destinations/miami` → 200, single H1 = "Miami", indexable (no noindex
  header), canonical present, breadcrumb present ✓
- `/destinations/san-diego` → 200, single H1 = "San Diego", same ✓
- Legacy "Hotels in Miami" H1 → gone ✓
- Legacy empty Map card → gone ✓
- No import from `src/components/dev/` in production route (grep-verified) ✓
- No fake prices, attractions, map claims, or illustrative records ✓
- All 23 smoke URLs → 200; CLAUDE-UI-004 → 027 unaffected ✓
