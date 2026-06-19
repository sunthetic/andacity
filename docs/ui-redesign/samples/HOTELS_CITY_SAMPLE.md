# Hotels by City Page Sample

## Purpose

CLAUDE-UI-011 creates a premium, SEO-safe **Hotels by City** page sample for `/hotels/in/[citySlug]` — the indexable city landing page that sits between the hotels hub (`/hotels`) and individual hotel detail pages (`/hotels/[slug]`).

This sample establishes the visual direction, layout structure, and editorial approach for the city-level hotel browsing experience. It is preview-only and approval-gated. The production `/hotels/in/[citySlug]` route is not changed until the user approves this direction (see "Approval gate" below).

---

## Current hotels-by-city observations

The production page at `src/routes/hotels/in/[citySlug]/index.tsx` has a solid technical foundation:

**Strengths:**
- Real DB loader (`loadHotelCityBySlugFromDb`, `loadHotelsForCityFromDb`) fetches city summary and all hotels
- City data includes: `topNeighborhoods[]`, `topAmenities[]`, `priceFrom`, `hotelCount`, `region`, `country`
- SEO: proper `BreadcrumbList`, `Place`, `ItemList` JSON-LD; indexable with `robots: index,follow`
- Uses `HotelsResultsAdapter` for full hotel results with real filtering/sorting
- `HotelCitySearchCard` for date/guest refinement
- Mobile sticky CTA

**Improvement opportunities:**
- Still uses old `--color-*` tokens and `t-badge`, `t-card`, `t-btn-primary` classes — visual inconsistency with CLAUDE-UI-006/008/010
- No city hero — page starts flat with badges and a plain H1
- Guide section contains developer placeholder text ("this section is your long-tail SEO payload")
- No neighborhood exploration beyond a flat chip list
- Search card sits in a 2-column sidebar; not ideal on mobile
- Map concept not yet implemented on the city page (it exists in CLAUDE-UI-007 hotels landing sample)
- No related cities / internal cross-link section

---

## Proposed city page direction

**Core thesis:** The city page should feel like a useful, city-specific destination guide — not just a filtered search results page. It should:

1. Arrive search-forward with a clear H1 and integrated date search
2. Immediately show hotel result options
3. Help the visitor orient within the city (neighborhoods, areas)
4. Provide light editorial city context that's crawlable and useful
5. Cross-link to related cities (internal link value)
6. Reassure with policy clarity (no fake urgency)

---

## City hero concept

**Design:** Full-width `--ui-hero` gradient banner matching the production shell and home page. No photography dependency in production (gradient-first; photography drops in via `background-image` later without structural change).

**Content:**
- Breadcrumb: Home / Hotels / [City]
- Region/country context line (e.g., "Florida · United States")
- `<h1>` — "Hotels in Miami" — single, clear, city-specific
- Subline: "[N] hotels — transparent totals, clear cancellation policies, and fast filtering..."
- Quick stat pills: "47 hotels · From $128/night · 6 areas"
- **Right column:** Integrated search card — check-in, check-out, adults, rooms — with "Search Miami hotels" CTA linking to the real city page

**Rationale:**
- Hero eliminates the "bare H1 on a white page" feel of the current production page
- Integrated search card on desktop avoids the sidebar-first pattern that hurts mobile
- Stat pills communicate inventory depth immediately without fake urgency

**Photography strategy:** See "Photography/image strategy" section below.

---

## Search/refinement concept

**Hero search card (presentational in sample, real in production):**
- Check-in / check-out date fields using real `DateField` primitive in production
- Adults / rooms number inputs
- "Search [City] hotels" primary CTA — links to the city page with dates in URL params
- Helper text: "This city page is indexable. Search results remain noindex."

**Filter bar (sticky, below hero):**
- Sticks to `--sticky-top-offset` (below the fixed SiteHeader)
- Sort chip: "Recommended ▾" (presentational in sample, real select in production)
- Quick filter chips: Free cancellation, Beachfront, 4+ stars, Pool, Under $250
- `aria-pressed` on active chip
- Scrollable on mobile with `overflow-x-auto scrollbar-none`

**In production:** filter chips map to the existing `HotelFilters` state model (starsMin, price, amenities, neighborhoods, propertyTypes) — the same URL params the production `HotelsResultsAdapter` already understands.

---

## Hotel results concept

**Layout:**
- Results header: "[N] hotels in [city]" + count of active filters
- 3-col card grid on `lg:`, 2-col on `sm:`, 1-col on mobile
- Uses `HotelCard` UI primitive (CLAUDE-UI-002) directly — it already uses `--ui-*` tokens
- "See all hotels in [city]" secondary CTA below grid linking to the real city route

**In sample:** 6 illustrative Miami hotel cards using `HotelCardModel` — all hrefs point to `/hotels/in/miami` (real city search page). Labeled "Sample properties for illustration."

**In production:** Replace `SAMPLE_HOTELS` with real `hotels[]` array from the loader, formatted into `HotelCardModel`-compatible objects. The `HotelCard` primitive handles:
- Real images when `imageUrl` is set; `--ui-hero` gradient fallback when absent
- Real star rating, guest rating, review count
- Real policy badges (Free cancellation, Pay later)
- Link to real hotel detail page (`/hotels/[slug]`)

**Pagination:** Show first 6–9 hotels on the city landing page. Link "See all" to the full results (current HotelsResultsAdapter behavior, which handles pagination and filtering).

---

## Filter and map/list concept

**Filter bar:** Horizontal chip row (described above). Full `FilterRail` sidebar is omitted from the city landing page — that belongs on the search results page (`/search/hotels/...`). Quick chips provide the most-used entry points without overwhelming the SEO-focused landing.

**Map/list concept:**
- Left panel: Neighborhood list — each area shows name, blurb, hotel count, links to city search
- Right panel: CSS-only static map concept — faux street grid + radial gradient (to suggest coastal Miami shape) + price pins labeled with approximate $ amounts
- Pins use `--ui-primary` for the active/featured pin, `--ui-surface` for secondary
- Honest `role="img"` label: "Map concept showing approximate hotel areas in Miami — not a geocoded map"
- "Map layout · concept" badge in top-right corner

**Deferred:** Real geocoded map (Mapbox/Leaflet/Google) is explicitly out of scope. The CSS concept demonstrates the layout without any tile dependencies, API keys, or remote assets.

---

## Neighborhood/local context concept

**Neighborhood explorer (in the map section):**
- List of top neighborhoods from `city.topNeighborhoods[]`
- Each shows: name, short blurb, hotel count badge, link to city search
- Hover → subtle translate on arrow glyph
- Accent color count badge using `--ui-accent-soft`

**City guide section:**
- Heading: "Staying in [city]"
- Descriptive paragraph using city fields: neighborhood names, property types, general character
- 6-fact stat grid: Hotels, Starting from, Top area, Region, Country, Most popular amenity
- "Top areas" panel: list of neighborhoods with hotel counts, each linked to city search
- "Popular amenities" panel: flat chip list from `city.topAmenities[]`

**In production:** The guide paragraph should be templated real copy using actual city fields, not generic placeholder. In the sample, it's labeled "Sample editorial — production copy would reflect actual city data." Replacing the current guide section's placeholder ("This section is your long-tail SEO payload") with structured real content is a key improvement.

---

## Internal linking concept

**In the sample / production:**

1. Breadcrumb: Home → Hotels → [City] (crawlable `<nav><ol>`)
2. Neighborhood links: Each neighborhood → `/hotels/in/[citySlug]` (could refine with neighborhood param in production)
3. Hotel card links: Each card → real `/hotels/[slug]` in production
4. "See all hotels in [city]" CTA → `/hotels/in/[citySlug]`
5. Related cities section: 3 other city hub pages + "All hotel cities" → `/hotels/in`
6. Filter bar sort/chips → city page URL with filter params

**SEO internal link value:**
- City pages link to hotel detail pages (hub → spoke)
- City pages link to other city pages (peer cross-linking)
- City pages link back to the hotels hub
- Hotel detail pages (CLAUDE-UI-010) already link back to city search
- This creates a clean hub-and-spoke structure: `/hotels` → `/hotels/in` → `/hotels/in/[city]` → `/hotels/[slug]`

---

## Trust and conversion concept

**Trust section:**
3-card grid with icon + title + body:
1. "Total price, up front" — taxes and fees included
2. "Free cancellation, clearly marked" — deadline shown on card
3. "Policies before payment" — no hidden terms after selection

**Mobile sticky CTA:**
- Fixed bottom bar: "Hotels in [City] · From $N/night" + "Search hotels" button
- `lg:hidden` — not shown when desktop search card is visible in hero
- "Search hotels" → `/hotels/in/[citySlug]`
- `min-height:44px` tap target

**Conversion flow:**
1. Hero search card → city page with dates
2. Hotel card "View" → hotel detail page
3. "See all hotels" → city search (full results with filter/sort)
4. Mobile sticky CTA → city search

---

## Empty/loading state concept

**Empty state (no hotels found):**
- If `city.hotelCount === 0` or `hotels.length === 0`: show `EmptyState` component
- Title: "No hotels listed in [city] yet"
- Description: "This city is coming soon. Browse other hotel cities or start a new search."
- Primary CTA: "Browse hotel cities" → `/hotels/in`
- Secondary CTA: "Search hotels" → `/hotels`

**Loading state:**
- Skeleton tiles using `SkeletonResults` from `src/components/ui/Skeleton.tsx`
- The `HotelsResultsAdapter` in production already handles loading states — this pattern can be preserved

**404 (invalid city slug):**
- Current production throws `error(404, "Not found")` — preserve this behavior

---

## Photography/image strategy

**Hotel cards:**
- `HotelCard` already handles real images vs. `--ui-hero` gradient fallback
- In production: use `hotel.imageUrl` from the DB when available
- Missing images: gradient placeholder (no broken `<img>` states)

**Hero:**
- Sample: `--ui-hero` gradient only (no remote dependency)
- Production path: could use a city-representative photograph as `background-image` overlaying the gradient
- Implementation: add an optional `heroImageUrl` field to the city data or use a curated static city hero map

**Neighborhood cards (related cities section):**
- Sample: `--ui-hero` gradient tile
- Production: could use curated city thumbnail images
- The HotelCard pattern (`imageUrl` → gradient fallback) applies here too

**No remote image dependencies** in the sample or suggested production implementation.

---

## Responsive behavior

| Breakpoint | Layout behavior |
|---|---|
| Mobile (< 640px) | Single-column hotel grid; stacked hero (full-width search below H1); scrollable filter chips; map at full width |
| Tablet (`sm:`, 640–1024px) | 2-column hotel grid; neighborhood list + map side by side |
| Desktop (`lg:`, 1024px+) | 3-column hotel grid; hero 2-col (text + search card); filter bar sticks to header offset; map + neighborhood list side by side |

**Filter bar sticky:** Uses `--sticky-top-offset` CSS variable (same as the booking rail in CLAUDE-UI-010) so it positions correctly under the fixed SiteHeader regardless of theme/scroll state.

**Mobile sticky CTA:** `lg:hidden` — only visible when the hero search card is scrolled out of view. `min-height:44px` on the CTA button.

---

## Accessibility notes

- Single `<h1>` — "Hotels in [city]" ✓
- Breadcrumb: `<nav aria-label="Breadcrumb">` with `<ol>` ✓
- Filter chips: `aria-pressed` on active state ✓
- Map concept: `role="img"` with honest `aria-label` ✓
- Map price pins: `aria-hidden="true"` (decorative) ✓
- Search field labels: `<div>` labels are visual; in production use `<label for="...">` with real `DateField` ✓
- Mobile sticky CTA: `min-height:44px`, visible focus ring ✓
- Neighborhood links: full text content, no icon-only links ✓
- City guide fact grid: accessible `<div>` pairs (label + value) — production can upgrade to `<dl>/<dt>/<dd>` ✓
- Color contrast: `--ui-*` tokens target WCAG AA across all 6 palettes ✓

---

## SEO notes

**What the sample preserves/improves:**

- `<h1>` — "Hotels in [city]" — single, clear, crawlable ✓
- Breadcrumb nav with real links → crawlable ✓
- Hotel card links → internal link value to detail pages ✓
- Neighborhood links → internal link value ✓
- Related city links → cross-linking between city hubs ✓
- City guide copy → real crawlable content (vs. current "this section is your SEO payload" placeholder) ✓
- City stat grid → structured data signals ✓

**Structured data (preserve from production):**
- `BreadcrumbList` JSON-LD: Home → Hotels → [City] ✓ (3 items, already correct)
- `Place` JSON-LD: city + region + country ✓
- `ItemList` JSON-LD: first N hotels with name + URL ✓

**No changes to:**
- `robots: index,follow,max-image-preview:large` — city pages remain indexable
- Canonical: `/hotels/in/[citySlug]` — unchanged
- Title/description: `Hotels in [CityName] | Andacity Travel` — unchanged

**No spammy keyword stuffing.** The guide copy uses city name and neighborhood names naturally in prose, not as a repeating keyword block.

---

## Implementation boundary

**This task creates (sample only):**
- `src/components/dev/hotels-city/hotelsCitySampleData.ts`
- `src/components/dev/hotels-city/HotelsCitySample.tsx`
- `src/routes/dev/ui-hotels-city/index.tsx`
- `docs/ui-redesign/samples/HOTELS_CITY_SAMPLE.md` (this file)

**This task does NOT change:**
- `src/routes/hotels/in/[citySlug]/index.tsx` — production unchanged
- Any other production route or component
- CLAUDE-UI-004 global shell
- CLAUDE-UI-006 home page
- CLAUDE-UI-008 hotels landing
- CLAUDE-UI-010 hotel detail

---

## Preview route

```
/dev/ui-hotels-city
```

- `noindex, nofollow` via `x-robots-tag` response header
- 404s on the production host via `shouldIndex(url)` gate (same pattern as all other `/dev/ui-*` routes)
- Renders the `HotelsCitySample` component inside the production global shell
- Uses Miami illustrative data (47 illustrative hotels, 6 neighborhoods)
- Theme switcher in the SiteHeader works on this sample (all `--ui-*` tokens respond to palette/mode changes)

---

## User decision needed

**Review the sample at** `/dev/ui-hotels-city` **(run `npm run dev` to access).**

Evaluate:
1. Does the city hero communicate city-specific value and search intent clearly?
2. Is the filter bar the right level of refinement for a city landing page (vs. pushing to search)?
3. Is the 3-column hotel card grid the right density, or should it be a list/row layout?
4. Is the neighborhood + map concept worth the space, or should one panel be dropped?
5. Is the city guide section useful at this length, or should it be shorter?
6. Should the related cities section use city photography or stay as gradient tiles?
7. Are there additional sections that should be in scope for CLAUDE-UI-012?

---

## Verification results

**TypeScript (`npm run build.types`):**
- One pre-existing error: `src/lib/db/client.server.ts(91,5)` — SSL property type error (pre-existing, unrelated)
- Zero new type errors from CLAUDE-UI-011 ✓

**Production build (`npm run build`):**
- Build succeeds ✓

**Dev smoke check (`npm run dev`):**
- `/dev/ui-hotels-city` — sample renders with all sections ✓
- `/` — home page unaffected ✓
- `/hotels` — hotels landing unaffected ✓
- `/hotels/in/miami` — production city page unaffected ✓
- `/hotels/in/orlando` — production city page unaffected ✓
- `/hotels/miami-motel-02` (or equivalent slug) — hotel detail unaffected ✓
- `/dev/ui-hotel-detail` — CLAUDE-UI-009 sample unaffected ✓
- `/dev/ui-hotels` — CLAUDE-UI-007 sample unaffected ✓
- `/dev/ui-home` — CLAUDE-UI-005 sample unaffected ✓
- `/dev/ui-shell` — shell sample unaffected ✓
- `/dev/ui-palettes` — palette preview unaffected ✓
