# Hotels Landing Page Sample

> **Task ID:** CLAUDE-UI-007
> **Status:** Sample / approval-gated design preview. **No production hotels page was replaced.**
> **Prerequisites:** CLAUDE-UI-000 → CLAUDE-UI-006 (shell + home implemented) complete.
> **Preview:** [`/dev/ui-hotels`](../../../src/routes/dev/ui-hotels/index.tsx) — `noindex`, prod-gated. Renders the sample hotels body inside the **production** global shell; switch palette + light/dark from the header theme control.

---

## Purpose

Propose a premium, hotel-native, search-forward redesign of the Andacity `/hotels` landing page — one that feels calmer, more visual, and more trustworthy than Expedia/Booking.com while preserving the utility (clear dates, useful filters, scannable comparison) travelers expect.

Design thesis the page must communicate:

> **Find the right stay faster, with clear dates, useful filters, calm comparison, and destination-led confidence.**

This is a **sample for approval**. The production `/hotels` route ([src/routes/hotels/index.tsx](../../../src/routes/hotels/index.tsx)) is untouched until the user approves and CLAUDE-UI-008 implements it.

---

## Current hotels page observations

From re-inspecting [src/routes/hotels/index.tsx](../../../src/routes/hotels/index.tsx):

- **Layout:** uses [VerticalHeroSearchLayout](../../../src/components/search/VerticalHeroSearchLayout.tsx) — a legacy `--color-*` hero (`heroOverlay="hotels"`, `t-vertical-theme-hotels`) with a centered eyebrow/title/description, the search card, and "Popular:" helper links (Miami, New York, Las Vegas). Below: two prose sections and an **indexable "Browse hotel cities" grid**.
- **Search:** the **real** [HotelSearchCard](../../../src/components/hotels/search/HotelSearchCard.tsx) — destination autosuggest ([LocationAutosuggestField](../../../src/components/ui/LocationAutosuggestField.tsx)), check-in/check-out [DateField](../../../src/components/ui/DateField.tsx)s, a guests/rooms `<select>` — submitting via the **canonical hotel search flow** (`buildCanonicalHotelSearchHref` → `/hotels/search/<city>/<checkIn>/<checkOut>`). The `onGet` handler also redirects `?search=1` submissions server-side. This flow is proven and must be preserved.
- **Data/model dependency:** `useHotelsIndexPage` calls **`loadHotelCitiesFromDb()`** ([hotels-pages.server.ts](../../../src/lib/queries/hotels-pages.server.ts)) — the city grid is DB-backed (`HotelCity[]`: slug, city, region, country, `priceFrom`, `topAmenities`, `topNeighborhoods`). A `SearchEmptyState` renders when the DB returns nothing.
- **Result patterns that already exist:** [HotelResultCard](../../../src/components/hotels/search/HotelResultCard.tsx) (full result card with media, rating, amenities, policy facts, price panel, trust bar, telemetry) and [HotelFilters](../../../src/components/hotels/HotelFilters.tsx) (wraps `ResultsFilterGroups`) — both on legacy `--color-*`, used on the city/search results pages.
- **Routes/links:** city hubs at `/hotels/in/<slug>` (e.g. `/hotels/in/miami`, `/hotels/in/new-york`, `/hotels/in/las-vegas`, `/hotels/in/orlando`), `/hotels/in` (all cities), hotel detail at `/hotels/<slug>`, canonical search at `/hotels/search/...`.
- **Metadata/indexability:** `head` sets only `title: "Hotels | Andacity"` + a description — **no canonical, no Open Graph/Twitter tags** (lighter than the home page). Indexable. The city grid is explicitly framed as internal-linking/SEO surface.

**Implications:** the page is functional and SEO-aware but reads "vertical-search utility" — legacy tokens, centered hero, text-only city list, no visual stay inspiration, no results/comparison preview, no map, no explicit policy-clarity story. All addressed below, **without** touching production.

---

## Proposed hotels page direction

**Cinematic, calm, search-forward.** A hotel-native photographic hero with one obvious search module, then a fast descent through featured destinations, a **results-experience preview** (the differentiator — filters + scannable cards + a glanceable map), inspirational featured stays, an explicit policy-clarity surface, and a popular-destinations grid. Everything is on the **`--ui-*` foundation** + CLAUDE-UI-002 primitives, so it re-skins across all 12 theme states and sits natively inside the CLAUDE-UI-004 shell.

Sample components (preview-only; the basis for CLAUDE-UI-008):

- [HotelsSample.tsx](../../../src/components/dev/hotels/HotelsSample.tsx) — full composition.
- [HotelsSearchModule.tsx](../../../src/components/dev/hotels/HotelsSearchModule.tsx) — the premium hotel search surface.
- [hotelsSampleData.ts](../../../src/components/dev/hotels/hotelsSampleData.ts) — illustrative, **DB-free** sample data.

Section order: **Hero → Featured destinations → Results experience → Featured stays → Policy clarity → Popular destinations** (+ a loading/empty-states reference appendix in the preview route).

---

## Hero concept

- **Photography-first, full-bleed:** the palette's `--ui-hero` gradient + `--ui-hero-scrim` (legibility guaranteed; gradient stands in for a real hotel/cityscape still — see _Photography_).
- **Hotel-native headline (Lexend):** **"Find a stay you'll look forward to."** Eyebrow `Hotels`; subhead names the value: _search by destination, dates, and guests — then compare calmly, with clear policies and total prices up front._
- **One obvious search module** beneath the headline, then a quiet 3-item trust row (_Total price up front · Free cancellation marked · Policies before payment_).
- Calm, left-aligned, no OTA urgency.

---

## Search module concept

[HotelsSearchModule.tsx](../../../src/components/dev/hotels/HotelsSearchModule.tsx) — simpler and more premium than OTA forms:

- **Four hotel-native fields:** Destination (widest, with a 📍 cue and "City, area, or hotel" helper), Check-in, Check-out (with a "6 nights" derived hint), Guests & rooms — one row on desktop, a clean 2-up/stacked grid on mobile, plus one primary **Search hotels** action.
- A "Popular" quick-chip row (Miami / New York / Las Vegas / Orlando → real `/hotels/in/<slug>` hubs).
- **Preserves the canonical search flow concept** and keeps default values sensible without inventing availability.
- **Sample boundary:** fields are presentational and the action is a real link to `/hotels` — **no broken submission**. In production (CLAUDE-UI-008) this surface mounts the **real `HotelSearchCard`** with `surface="plain"` + `submitBehavior="canonical-route"` — the exact proven contract the CLAUDE-UI-006 home page already uses — restoring the destination autosuggest, `DateField`s, and canonical redirect.
- Accessible: each field is a labeled control with an `aria-label`; the production version inherits `HotelSearchCard`'s existing form semantics and validation summary.

---

## Featured stays/destinations concept

Two complementary surfaces:

- **Featured hotel destinations** — image-led [`DestinationCard`](../../../src/components/ui/DestinationCard.tsx)s (Miami, New York, Las Vegas, Orlando) with tags ("Trending", "Editor's pick"), linking to the real indexable `/hotels/in/<slug>` hubs; a "All hotel cities" action → `/hotels/in`.
- **Stays travelers love this week** — a grid of [`HotelCard`](../../../src/components/ui/HotelCard.tsx) primitives (image-led, star row, rating, badges, price-anchored), carrying an explicit **"Sample rates · illustrative"** chip so nothing reads as a live quote. These are inspiration, not inventory — they link to the search hub.

---

## Result card concept

The **results-experience preview** is the heart of the sample — it shows how comparison _feels_, since that's where OTAs get cluttered:

- **`SampleResultRow`** (horizontal, scannable): media on the left (gradient placeholder + optional "Great value" badge), then star row, name, area/distance, a **rating pill** (score chip + "Exceptional · 1,204 reviews"), a quiet amenities line, and a green **policy line** ("Free cancellation until Jun 12" / "No resort fees · pay later"). Price block right-aligned with `--ui-price`, qualifier "per night · taxes & fees incl.", and a "View stay" button. Price is anchored but calm; details stay muted — deliberately less dense than Expedia rows.
- The full production page will use the existing richer [HotelResultCard](../../../src/components/hotels/search/HotelResultCard.tsx) logic (telemetry, price-display, availability confidence), restyled to `--ui-*`; this sample row demonstrates the target visual language.

---

## Filter and map/list concept

A standard, calm three-zone search layout under `max-w-6xl`:

- **Filter rail** ([`FilterRail`](../../../src/components/ui/FilterRail.tsx)) — left column on `lg+`, **sticky**; groups for Popular filters, Guest rating, Property type, Amenities, plus a price-range indicator. Below `lg` it's hidden and surfaced via the toolbar's **Filters** button (a drawer in production).
- **Result toolbar** ([`ResultToolbar`](../../../src/components/ui/ResultToolbar.tsx)) — result count ("248 stays in Lisbon"), sort ("Best value"), and removable active-filter chips. A horizontal **quick-filter chip row** (Free cancellation, 4+ stars, Breakfast, Pool, Under $250) sits above for one-tap refinement.
- **List + map split:** on `xl` the results list and a **sticky map panel** sit side by side; below `xl` the map reflows to a full-width band beneath the list (and would be a "Map" toggle on mobile).
- **Map = safe static concept:** `MapPanel` renders a CSS faux street-grid with absolutely-positioned **price pins** (one active/highlighted) and a "Map preview · concept" tag — **no remote map/tile dependency**. Production can later wire a real map library behind the same slot.

---

## Trust and conversion concept

A dedicated **"Clear policies, calm pricing"** surface, all **verifiable** (mirrors the language the product already emits via `defaultPolicies` in [hotels-pages.server.ts](../../../src/lib/queries/hotels-pages.server.ts)):

- _Total price, up front_ (taxes & property fees included in compared prices).
- _Free cancellation, clearly marked_ (deadline shown on the card when refundable).
- _Policies before payment_ (cancellation, payment timing, fees stated up front).
- Calm badges: "Taxes & fees included", "No countdown timers", "No '1 room left!' pressure" — explicitly rejecting OTA dark patterns.
- No invented review counts framed as guarantees, no star inflation, no fabricated "deals". Sample numbers are labeled illustrative wherever they appear.

---

## Photography/image strategy

No remote image dependency is introduced. Every photographic surface (hero, `DestinationCard`s, `HotelCard`s, result-row media, map) uses the palette's `--ui-hero` gradient / `--ui-surface-muted` as a safe local stand-in — intentional-looking in all 12 theme states with zero asset work. `HotelCard`/`DestinationCard` already accept an `imageUrl` and fall back to the gradient when omitted, so imagery drops in later with no structural change.

**Future imagery needs (for CLAUDE-UI-008+):**

- 1 hero still (hotel interior or destination cityscape, landscape, supports white overlay text).
- 4 featured-destination city images.
- 4 featured-stay property images (`HotelCard.imageUrl`).
- 3 result-row property images (`SampleResultRow` media).
- Optional: a real map tile provider (separate, deliberately-approved decision — the current CSP allows `img-src 'self' data: https:`, but self-hosted/first-party tiles are preferred).
  All self-hosted, responsive AVIF/WebP, hero eager / rest lazy, with descriptive `alt` text; decorative gradient layers stay `aria-hidden`.

---

## Responsive behavior

Mobile-first; every section is single-column on small screens and expands by breakpoint.

| Section                       | Mobile (<640)                                     | Tablet (640–1024) | Desktop (≥1024 / xl ≥1280)                |
| ----------------------------- | ------------------------------------------------- | ----------------- | ----------------------------------------- |
| Hero / search                 | Stacked; fields 2-up then 1-up; full-width action | Fields wrap       | Fields in a row, destination widest       |
| Featured destinations / stays | 1 col                                             | 2 col             | 4 col                                     |
| Results — filters             | Hidden; "Filters" button in toolbar (drawer)      | Hidden; button    | Sticky left rail (`lg`)                   |
| Results — list/map            | List stacked; map band below                      | List + map band   | List + **sticky map** side-by-side (`xl`) |
| Policy clarity                | 1 col                                             | 3 col             | 3 col                                     |
| Popular destinations          | 1 col                                             | 2 col             | 3 col                                     |

- Containers use the shared `max-w-6xl` rhythm; hero is a full-bleed band.
- No horizontal overflow introduced (no fixed pixel widths beyond the intentional rail/map track sizes, which sit inside `minmax(0,1fr)` tracks).

---

## Accessibility notes

- One `<h1>` (hero); sections use ordered `<h2>`/`<h3>` via `ResponsiveSection`.
- Search fields are labeled controls with descriptive `aria-label`s; quick filters use `aria-pressed`; the active quick-filter and rating chips read correctly.
- Result rows: star row has an `aria-label` (`"5 star"`); the map panel is `role="img"` with a descriptive `aria-label`; the faux grid and price pins are `aria-hidden` (the meaning is in the list).
- Every interactive element shows a visible `--ui-ring` focus ring (≥2px); tap targets ≥44px on mobile.
- Skeleton loading respects `prefers-reduced-motion` (gated in CLAUDE-UI-002 global CSS).
- **Follow-up (CLAUDE-UI-008):** the production search inherits `HotelSearchCard`'s full form/validation a11y; the mobile filter **drawer** needs focus-trap + Escape (same pattern as the shell's mobile sheet); a full multi-theme contrast pass is scheduled.

---

## SEO notes

- The sample is **presentational** and changes no routing, canonical/robots logic, JSON-LD, or sitemaps.
- The preview route is `noindex, nofollow` and **404s on the production host**, so it can't leak into the index (verified).
- **For the production rewrite (CLAUDE-UI-008):** keep `/hotels` indexable; preserve the existing `head` (and consider _adding_ canonical + OG to match the home page's completeness — an improvement, not a regression); keep a single `<h1>`; **retain the DB-backed indexable city grid** (`/hotels/in/<slug>` internal links) — it's the page's core SEO equity and must survive the visual redesign; keep content server-rendered.

---

## Implementation boundary

**This task added (preview-only):**

- `src/components/dev/hotels/` — [HotelsSample.tsx](../../../src/components/dev/hotels/HotelsSample.tsx), [HotelsSearchModule.tsx](../../../src/components/dev/hotels/HotelsSearchModule.tsx), [hotelsSampleData.ts](../../../src/components/dev/hotels/hotelsSampleData.ts).
- `src/routes/dev/ui-hotels/index.tsx` — noindex, prod-gated preview (+ loading/empty-state reference appendix).
- This doc.

**Reused (unchanged):** CLAUDE-UI-002 primitives (`HotelCard`, `DestinationCard`, `FilterRail`, `ResultToolbar`, `Badge`, `Button`, `ResponsiveSection`, `EmptyState`, `Skeleton`).

**Not touched (await approval → CLAUDE-UI-008):** production `/hotels` route, `HotelSearchCard`, `HotelResultCard`, `HotelFilters`, `VerticalHeroSearchLayout`, the DB loaders, the CLAUDE-UI-004 shell, and the CLAUDE-UI-006 home page.

**On approval, CLAUDE-UI-008 will:** rebuild `/hotels` from this composition on `--ui-*`, mount the **real `HotelSearchCard`** (`surface="plain"`, `submitBehavior="canonical-route"`), restyle `HotelResultCard`/`HotelFilters` to `--ui-*`, keep the DB-backed indexable city grid, wire a real (or first-party) map behind the `MapPanel` slot, add the mobile filter drawer, and preserve/extend SEO.

---

## Preview route

[`/dev/ui-hotels`](../../../src/routes/dev/ui-hotels/index.tsx) — run `npm run dev`, open the route (301-redirects to the trailing-slash form). `noindex, nofollow`; 404s on the production host. Renders the sample inside the **production** shell, plus a "Design states" appendix showing the **loading skeleton** (`SkeletonResults`) and **empty state** (`EmptyState`). Use the header theme control to check Skyglass Luxe and Andacity Meridian in light + dark.

---

## User decision needed

1. **Direction:** approve / reject / modify the cinematic, search-forward hotels concept.
2. **Results-experience preview on the landing page:** confirm including the filters + list + **map** preview _on the landing page_ (vs. keeping the landing page lighter and reserving that layout for the actual results route).
3. **Map:** confirm the static "concept" map for now, with a real/first-party map library wired in CLAUDE-UI-008 — or omit the map entirely.
4. **Search module:** confirm mounting the **real `HotelSearchCard`** in production (legacy `--color-*` form inside the `--ui-*` page, same trade-off accepted on the home page) vs. a fuller `--ui-*` form rebuild.
5. **Featured stays:** confirm including illustrative "sample rates" inspiration cards, or defer until real top-stay data is wired (`loadTopDestinationStaysFromDb` already exists).
6. **Headline/voice:** confirm "Find a stay you'll look forward to." or supply preferred copy.

---

## Verification results

- **`npm run build.types`** → exits non-zero with **one** error only: the **pre-existing** `TS2353` `ssl` in [src/lib/db/client.server.ts:91](../../../src/lib/db/client.server.ts#L91) — unrelated, **not fixed** (per instructions). New sample code adds **zero** type errors.
- **`npm run build`** (Vite client) → compiles cleanly: **926 modules transformed** (up from 908 at CLAUDE-UI-006). A JSX/Qwik error in any new file would fail the transform.
- **ESLint** on the three new components + the route → **clean**.
- **Dev smoke (`npm run dev`):**
  - `/dev/ui-hotels/` → `200` + `x-robots-tag: noindex, nofollow`; SSR contains the hero headline, `id="hotels-search-entry"`, all sample sections, the `FilterRail` (`aria-label="Filters"`), the map (`role="img"` "Map preview…"), the skeleton primitive (`ui-skeleton` ×6) and empty state, exactly **one `<h1>`**, and **583** `var(--ui-*)` references, wrapped by the production header/footer.
  - `/` and `/hotels` → `200`, **indexable** (no robots header); `/hotels` still renders the legacy "Find stays that fit the trip…" layout — **untouched**.
  - `/dev/ui-home/`, `/dev/ui-shell/`, `/dev/ui-palettes/` → `200` + `noindex` — unaffected.
- **Token purity:** the new sample files use **0** legacy `var(--color-*)` references (only `--ui-*`), so the page themes across all 12 states.
- **Net:** only blocker is the documented pre-existing DB SSL error; this task introduces no new regressions and replaced no production page.
