# Hotels by City Page Implementation

## Approved direction

City hero (full-width gradient with H1, stat pills, and real date/guest search form) + sticky filter chip bar + real `HotelsResultsAdapter` for hotel results + CSS-only neighborhood map concept + data-driven city guide + related cities cross-links + trust section + mobile sticky CTA. Built on `--ui-*` theme tokens. Approved from CLAUDE-UI-011.

---

## Production files changed

**Updated:**
- `src/routes/hotels/in/[citySlug]/index.tsx` — Full visual redesign using `--ui-*` tokens; replaced old `--color-*` / `t-*` styling; added city hero, filter chip bar, neighborhood map, city guide, related cities, and trust sections; removed developer placeholder text from the guide section.

**Preserved (no changes):**
- `src/components/hotels/HotelsResultsAdapter.tsx` — full hotel results with real filter/sort/pagination, unchanged
- `src/components/hotels/HotelCitySearchCard.tsx` — preserved as-is; replaced inline in the hero with a styled equivalent using `DateField`
- `src/components/dev/hotels-city/` — sample files unchanged; remain as historical reference
- All other production routes and components

---

## Data mapping notes

| UI element | Data source | Notes |
|---|---|---|
| H1 | `c.city` | "Hotels in [city]" |
| Region context | `c.region`, `c.country` | Rendered verbatim; seed data has abbreviated state codes (e.g., "FL") |
| Hotel count | `c.hotelSlugs.length` | `HotelCity` has `hotelSlugs[]`, no `hotelCount` field |
| Price from pill | `c.priceFrom` | Formatted via `formatMoney()` (Intl.NumberFormat) |
| Area count pill | `c.topNeighborhoods.length` | Conditional — only shown if neighborhoods exist |
| Hero search form | Real `DateField` + GET form | Submits to `/hotels/in/[citySlug]` with date/guest params |
| Filter chips | `c.topAmenities.slice(0, 3)` + "4+ stars" | URL navigation links; active state from `data.searchState.filters` |
| Hotel results | `HotelsResultsAdapter` | Real filtering, sorting, pagination — unchanged |
| Neighborhood list | `c.topNeighborhoods` | Name + count; no blurb (not in production `HotelCity` type) |
| CSS map pins | `c.topNeighborhoods.slice(0, 5)` | Illustrative `PIN_POSITIONS`; no per-neighborhood pricing |
| City guide prose | `c.city`, `c.hotelSlugs.length`, `c.topNeighborhoods`, `c.topAmenities`, `c.priceFrom` | Template-generated from real data; no placeholder text |
| Key facts grid | Same city fields | 6-fact grid: Hotels, Starting from, Top area, Region, Country, Popular amenity |
| Top areas panel | `c.topNeighborhoods.slice(0, 5)` | Each links to `?neighborhoods=[name]` |
| Popular amenities panel | `c.topAmenities.slice(0, 6)` | Each links to `?amenities=[name]` |
| Related cities | `KNOWN_CITY_LINKS` (static) | New York, Las Vegas, Orlando, Miami — filtered to exclude current city |
| Mobile sticky CTA | `c.city`, `c.priceFrom`, `data.searchHref` | "Search hotels" → real searchHref |
| JSON-LD | Preserved exactly | BreadcrumbList + Place + ItemList |

---

## Hero section

Full-width `--ui-hero` gradient banner with `--ui-hero-scrim` overlay.

**Left column:**
- Breadcrumb: Home / Hotels / [City] — inline in hero (not via `Page` component, which would constrain width)
- Region/country context line (`c.region · c.country`)
- H1 — "Hotels in [city]"
- Subline with hotel count
- Stat pills: N hotels / From $X/night / N areas

**Right column — search form:**
- Real `DateField` for check-in and check-out (with `useSignal` reactive state)
- Adults/rooms inputs
- "Search [City] hotels" submit button → GET to `/hotels/in/[citySlug]`
- Confirms: "City page is indexable. Search results remain noindex."

**Layout change:** `Page` component is NOT used (it would constrain the hero to `max-w-6xl`). The root layout's `<main>` wraps everything. Each section below the hero uses `mx-auto max-w-6xl px-4` internally.

---

## Filter chip bar

Sticky below the fixed SiteHeader (`top: var(--sticky-top-offset, 0)`), `z-30`.

- "Recommended ▾" sort indicator (presentational — sort is handled within HotelsResultsAdapter)
- Quick filter chips: "4+ stars" + top 3 city amenities from `c.topAmenities`
- Each chip is an `<a>` link that adds or removes a URL filter param
- Active state detected from `data.searchState.filters`
- Accessible `aria-label` describes active/inactive state

**Filter chip URL params (understood by HotelsResultsAdapter):**
- "4+ stars" → `?starsMin=4`
- Amenity chip → `?amenities=[name]`

---

## Hotel results section

`HotelsResultsAdapter` is preserved exactly. Wrapped in `mx-auto max-w-6xl px-4 py-8`. No changes to its internal behavior, filter UI, sort, or pagination.

---

## Neighborhood map section

Conditional on `c.topNeighborhoods.length > 0`.

**Left panel:** Neighborhood list with name, count, and filter link (`?neighborhoods=[name]`).

**Right panel:** CSS-only map concept:
- Street grid via `repeating-linear-gradient`
- Radial gradient (coastal/water suggestion)
- Neighborhood name pins at `PIN_POSITIONS` illustrative coordinates
- City name center pin
- "Map layout · concept" badge (honest label)
- `role="img"` with honest `aria-label`: "Map concept showing approximate hotel areas in [city] — not a geocoded map"
- All decorative elements `aria-hidden="true"`

No geocoded maps, Mapbox, Leaflet, Google Maps, or API keys.

---

## City guide section

Replaces the developer placeholder text ("This section is your long-tail SEO payload...").

**Editorial paragraph:** Templated from real city fields — hotel count, neighborhood count, top neighborhood names, top amenity names, price from. All data-driven; no invented facts.

**6-fact grid:** Hotels / Starting from / Top area / Region / Country / Popular amenity.

**Top areas panel:** Neighborhood list with hotel counts; each links to `?neighborhoods=[name]`.

**Popular amenities panel:** Top 6 amenity chips; each links to `?amenities=[name]`.

---

## Related cities section

Conditional on `relatedCities.length > 0`.

Uses `KNOWN_CITY_LINKS` — a static array of the 4 known-safe city hub pages (New York, Las Vegas, Orlando, Miami). Current city is filtered out before display. "All hotel cities" link (`/hotels/in`) is always appended.

**Design:** 4-column grid on `lg:`, 2-column on `sm:`. Each card has a `--ui-hero` gradient mini-tile (no photography dependency), city name, and blurb.

---

## Trust section

3-card grid: "Total price, up front" / "Free cancellation, clearly marked" / "Policies before payment".

---

## Mobile sticky CTA

`fixed inset-x-0 bottom-0 z-40 lg:hidden`. Shows "Hotels in [city] · From $X/night" + "Search hotels" → `data.searchHref`. `min-height:44px` on the CTA button. `h-20 lg:hidden` spacer above prevents last section from being obscured.

---

## Removed

- Old `--color-*` tokens and `t-badge`, `t-card`, `t-btn-primary` CSS classes from the route
- Developer placeholder text: "This section is your long-tail SEO payload..."
- `Page` component import (replaced with direct layout)
- `HotelCitySearchCard` import (replaced with inline form using real `DateField`)

---

## Preserved

- `useHotelCityPage` loader — unchanged; still returns `{ slug, city, hotels, searchState, active, searchHref }`
- `head` export — all JSON-LD (BreadcrumbList, Place, ItemList), meta, og, twitter, canonical unchanged
- `buildSearchHotelsHref`, `buildHotelsInCityHref`, `buildHotelDetailHref`, `parseStayParams`, `clampMaybeInt`, `formatMoney` helper functions
- `HotelsResultsAdapter` with full filter/sort/pagination behavior
- `robots: index,follow,max-image-preview:large` — city pages remain indexable

---

## SEO notes

- **H1:** Single `<h1>` — "Hotels in [city]" ✓
- **Breadcrumb:** Inline in hero `<nav aria-label="Breadcrumb"><ol>` with real links ✓
- **JSON-LD:** BreadcrumbList (Hotels → Cities → [City]) + Place (city/region/country) + ItemList (all hotels) — unchanged ✓
- **Guide copy:** Real data-driven prose replaces dev placeholder — crawlable and useful ✓
- **Internal links:** Top areas → `?neighborhoods=`, amenities → `?amenities=`, related cities → real city hub pages ✓
- **No noindex leak:** `robots: index,follow,max-image-preview:large` unchanged ✓
- **Canonical:** `/hotels/in/[citySlug]` unchanged ✓

---

## Accessibility notes

- **H1:** Single, clear, city-specific ✓
- **Breadcrumb:** `<nav aria-label="Breadcrumb"><ol>` with `aria-current="page"` on last item ✓
- **Search form:** `<label for="...">` on all inputs; real `DateField` with calendar accessible ✓
- **Filter chips:** `<a>` links with descriptive `aria-label` for active/inactive state ✓
- **Map concept:** `role="img"` + honest `aria-label`; decorative elements `aria-hidden` ✓
- **Mobile CTA:** `min-height:44px`, visible focus ring ✓
- **Color contrast:** `--ui-*` tokens target WCAG AA across all 6 palettes ✓

---

## Sample/preview cleanup

- `src/components/dev/hotels-city/` sample files are **unchanged** — kept as historical reference for the CLAUDE-UI-011 direction
- Production does not import from `src/components/dev/`
- Dev sample at `/dev/ui-hotels-city` remains functional

---

## Data notes and deviations from sample

| Item | Sample | Production |
|---|---|---|
| `hotelCount` field | `SampleCity.hotelCount` | `c.hotelSlugs.length` (no `hotelCount` in `HotelCity` type) |
| Neighborhood blurbs | `SampleCityNeighborhood.blurb` | Not available (`HotelCity.topNeighborhoods` has name + count only) |
| Map price pins | Illustrative per-neighborhood prices | Omitted — no per-neighborhood pricing in production data |
| Region value | "Florida" | Actual seed value: "FL" (abbreviated state code) |
| Filter chips source | Static SAMPLE_QUICK_FILTERS | Dynamic from `c.topAmenities.slice(0, 3)` + "4+ stars" |

---

## Deferred work

| Item | Reason deferred |
|---|---|
| Real geocoded map | No map provider in scope (Mapbox/Leaflet/Google explicitly excluded) |
| Per-neighborhood hotel counts in filter chips | Chips link to real URL params; detailed counts available in HotelsResultsAdapter |
| City photography in hero | Gradient-first; photography drops in via `background-image` later without structural change |
| City photography in related cities tiles | `--ui-hero` gradient tiles; can be swapped for real images when curated set is available |
| Full region name ("Florida" vs "FL") | Data normalisation; requires a seed data update, not a route change |
| Related cities from live DB query | Static known-safe list; a `loadRelatedCitiesFromDb()` query can replace it later |

---

## Verification results

**TypeScript (`npm run build.types`):**
- One pre-existing error: `src/lib/db/client.server.ts(91,5)` — SSL property type error (unrelated)
- Zero new type errors from CLAUDE-UI-012 changes ✓

**Production build (`npm run build`):**
- Build succeeds: `✓ built in 5.41s` ✓

**Dev smoke check (`npm run dev`):**
- `/hotels/in/miami` — loads 200 ✓
  - Hero: "Hotels in Miami" H1, "FL · United States" context, stat pills, real DateField form ✓
  - Filter chip bar: sticky, amenity chips from real city data ✓
  - Hotel results: `HotelsResultsAdapter` renders with real hotels ✓
  - "Explore by area": neighborhood list + CSS map concept ✓
  - "Staying in Miami": data-driven prose (no dev placeholder) ✓
  - "Other top destinations": New York, Las Vegas, Orlando, All hotel cities ✓
  - "Why compare on Andacity": 3 trust cards ✓
  - Mobile sticky CTA: present ✓
  - JSON-LD: BreadcrumbList + ItemList present in response ✓
- `/hotels/in/orlando` — loads 200 ✓
- `/` — home page unaffected ✓
- `/hotels` — hotels landing unaffected ✓
- `/dev/ui-hotels-city` — CLAUDE-UI-011 sample unaffected ✓

**No developer placeholder text:** "This section is your long-tail SEO payload" is gone ✓
**No `--color-*` tokens in route file:** confirmed via grep ✓
**No `src/components/dev/` imports in production route:** confirmed ✓
