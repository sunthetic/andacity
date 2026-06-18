# Hotels Landing Page Implementation

> **Task ID:** CLAUDE-UI-008
> **Status:** Production implementation. **The production hotels landing page (`/hotels`) has been replaced.** No hotel detail or city-hub page was rewritten.
> **Prerequisites:** CLAUDE-UI-000 → CLAUDE-UI-007 (approved hotels sample) complete.

---

## Approved direction

Per the CLAUDE-UI-007 approval decisions, this task implements:

- The premium, hotel-native landing page direction.
- Headline: **"Find a stay you'll look forward to."**
- The hotel-specific hero/search layout.
- The **real production `HotelSearchCard`** mounted in the hero (not a placeholder).
- Destination/city inspiration (curated featured cities).
- A **lightweight** results/filter preview (not a full SRP) — backed by **real DB data**.
- A **static map concept only** — no map library, no tile dependency, no API key.
- Featured stays using **real existing data** (not fictional inspiration cards — see _Featured stays_ below for why real data was available and used).
- No live-rate/availability/review/guarantee/scarcity claims.
- The CLAUDE-UI-004 shell and CLAUDE-UI-006 home page, untouched.
- No hotel detail page work.

---

## Production files changed

| File                                                                                                                 | Change                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/components/hotels/landing/HotelsLandingPage.tsx](../../src/components/hotels/landing/HotelsLandingPage.tsx)     | **New.** Production page composition, promoted from the CLAUDE-UI-007 sample.                                                                                                                                                                                                                        |
| [src/components/hotels/landing/hotelsLandingContent.ts](../../src/components/hotels/landing/hotelsLandingContent.ts) | **New.** Static, non-claim-bearing content (featured-city blurbs, filter-preview labels, trust copy).                                                                                                                                                                                                |
| [src/routes/hotels/index.tsx](../../src/routes/hotels/index.tsx)                                                     | **Rewritten.** Renders `<HotelsLandingPage />`. The pre-existing `useHotelsIndexPage`, `useHotelsSearchState`, `onGet`, and `head` are **preserved exactly** (byte-for-byte for `onGet`/`head`); one new `routeLoader$` (`useHotelsFeaturedStays`) was added.                                        |
| [src/lib/queries/hotels-pages.server.ts](../../src/lib/queries/hotels-pages.server.ts)                               | **Extended (additive).** `DestinationTopStay` gained a `stars: number` field, populated via the file's existing `toStars()` helper in `loadTopDestinationStaysFromDb`. No existing field changed; verified the only other consumer (`/destinations/[slug]`) still type-checks and renders correctly. |

**Not touched:** `src/components/dev/hotels/*` and `src/routes/dev/ui-hotels/index.tsx` (left exactly as-is, historical reference — same precedent as `/dev/ui-shell` and `/dev/ui-home`); `HotelSearchCard`, `HotelResultCard`, `HotelFilters`, `VerticalHeroSearchLayout` (still used by `/flights` and `/car-rentals` — confirmed and left untouched); `/hotels/in/<slug>`, `/hotels/<slug>`, `/destinations/<slug>`; the global shell; the CLAUDE-UI-006 home page.

---

## Hero implementation

`Hero` in [HotelsLandingPage.tsx](../../src/components/hotels/landing/HotelsLandingPage.tsx):

- Full-bleed `--ui-hero` gradient + `--ui-hero-scrim`, one `<h1>` — **"Find a stay you'll look forward to."** — eyebrow `Hotels`, subhead naming destination/dates/guests + calm comparison.
- The search module is wrapped in a `--ui-*` panel (rounded surface + `--ui-shadow-panel`), inside which the **real `HotelSearchCard`** renders with `surface="plain"`.
- A "Popular" quick-chip row (Miami / New York / Las Vegas / Orlando → real `/hotels/in/<slug>` hubs) sits beneath the form, inside the same panel.
- A quiet 3-item trust row beneath the panel (_Total price up front · Free cancellation marked · Policies before payment_).

---

## Search module implementation

The hero mounts the **real, existing** [HotelSearchCard](../../src/components/hotels/search/HotelSearchCard.tsx) — unmodified:

```tsx
<HotelSearchCard
  surface="plain"
  submitBehavior="canonical-route"
  initialDestination={...}
  initialDestinationLocation={...}
  initialCheckIn={...}
  initialCheckOut={...}
  initialGuests={...}
/>
```

- **Submission behavior is unchanged**: destination autosuggest, `DateField` check-in/check-out, guests/rooms select, submitting via `buildCanonicalHotelSearchHref` → the canonical hotel search route. The route's existing `onGet` handler (server-side `?search=1` redirect) is preserved verbatim.
- Initial values are still resolved exactly as before via `useHotelsSearchState` (destination location from the URL) and the URL's `destination`/`checkIn`/`checkOut`/`guests` params — same resolution logic, just passed through as a `search` prop instead of inline JSX.
- Verified live: SSR output contains the real form fields (`LocationAutosuggest`, `name="destinationLocation"`, `hotel-check-in`, `hotel-check-out`, `hotel-guests`) — confirming the actual production search card is rendering, not a placeholder.
- Accessible: inherits `HotelSearchCard`'s existing labeled fields and `BookingValidationSummary`.

---

## Destination/stay inspiration implementation

Two complementary, clearly-distinguished surfaces:

- **Featured hotel destinations** (curated, editorial): four [`DestinationCard`](../../src/components/ui/DestinationCard.tsx)s (Miami, New York, Las Vegas, Orlando) with non-claim-bearing blurbs ("Beachfront resorts · Art Deco") and tags ("Trending", "Editor's pick"), linking to real `/hotels/in/<slug>` hubs. No price/availability/review claims — these are place descriptions, not inventory claims.
- **Popular hotel destinations** (the page's SEO/internal-linking surface, restyled): the **full, real DB-backed city list** from `useHotelsIndexPage`/`loadHotelCitiesFromDb` — every city the database returns (verified live: 79+ cities from Abu Dhabi through more, not a curated subset), each card showing the **real** `formatMoney(priceFrom, "USD")` and top amenity. Falls back to the `--ui-*` [`EmptyState`](../../src/components/ui/EmptyState.tsx) (swapped in for the legacy `SearchEmptyState` for token consistency — same UX, same two actions) if the DB returns zero cities.

---

## Results/filter preview implementation

This is the section that required the most care to keep honest. The CLAUDE-UI-007 sample used three fictional Lisbon properties ("Memmo Alfama," etc.) with invented prices — not acceptable for a live, indexable page per this task's "no fake live-rate" instruction. Instead, `ResultsPreview` is backed by **real data**:

- A new `routeLoader$` in [src/routes/hotels/index.tsx](../../src/routes/hotels/index.tsx), `useHotelsFeaturedStays`, calls the existing `loadTopDestinationStaysFromDb(slug, 1)` once per featured city (Miami, New York, Las Vegas, Orlando) in parallel and flattens the results.
- Verified live: real hotel slugs (`las-vegas-hotel-03`, `miami-motel-02`, `new-york-hotel-08`, `orlando-motel-07`), real prices ($107–$129/night range observed), and **real, varied star ratings** (`aria-label="4 star"` and `"5 star"` both observed — not a hardcoded default).
- **Why a `stars` field had to be added:** `DestinationTopStay` didn't expose `stars`, and the `HotelCard`/display logic defaults to a misleading hardcoded 5 stars when `stars` is omitted. Rather than ship that default for real data (a false claim), `stars: number` was added to `DestinationTopStay` and populated from `row.stars` via the file's existing `toStars()` helper — a one-line, additive change. Confirmed via `tsc` and a live route check that the only other consumer (`/destinations/[slug]`) is unaffected.
- **Each stay row** shows: real star count, real name/area, a real rating pill (`rating.toFixed(1)` + real review count), a real green policy line drawn directly from the loader's existing `badges[0]` (`"Free cancellation"` or `"Flexible terms"`, computed from the real `freeCancellation` column), a secondary badge (`badges[1]`), and the real nightly price via `formatMoney`. "View stay" links to the real `/hotels/<slug>` detail route.
- **Image fallback safety:** the shared loader's existing fallback path (`/img/demo/hotel-1.jpg`) has no asset on disk (a pre-existing, unrelated issue also present today on `/destinations/[slug]`, which is **not fixed here** — out of scope). `HotelsLandingPage` defensively detects that sentinel and falls back to the `--ui-hero` gradient instead of rendering a broken image reference.
- **Quick-filter chips** are rendered as inert [`Badge`](../../src/components/ui/Badge.tsx)s (not buttons) with an explicit caption — _"Preview only — available once you start a search"_ — so nothing implies a working filter that silently does nothing when clicked. The [`FilterRail`](../../src/components/ui/FilterRail.tsx) sidebar is the existing display-only foundation primitive (no interactivity claimed).
- **No `ResultToolbar` "result count"/"sort" framing** was carried over from the sample — that metaphor implies a live search happened against a specific destination/date, which is not true here. A plain disclosure line replaces it: _"Real top-rated stays from today's listings — not a live search of a specific destination or dates. Search above for full results."_
- **Graceful degradation:** if all four cities return zero stays, `ResultsPreview` renders `null` — no broken layout, no empty cards.

---

## Static map concept implementation

Exactly per the approved constraint — **CSS/static only, no map library, no tiles, no API key**:

- `MapPanel` renders the same CSS faux-street-grid as the sample, with absolutely-positioned price pins.
- **Pin prices are real** — drawn from the same `featuredStays` array rendered in the list (`formatMoney(stay.from, stay.currency)`), so the few numbers shown are consistent with the real results above them.
- **Pin positions remain decorative/non-geocoded** (no lat/lng data exists in this dataset to plot honestly), so the panel keeps an explicit `role="img"` `aria-label="Map preview concept showing illustrative pin positions with real sample prices — not a geocoded map"` and a visible **"Map preview · concept"** tag — satisfying the instruction that any map-like surface must be labeled a preview/concept unless it maps real current records (the positions don't; the prices do; the label says so).

---

## Trust and conversion implementation

Unchanged from the approved sample — three verifiable policy statements (mirroring `defaultPolicies` in [hotels-pages.server.ts](../../src/lib/queries/hotels-pages.server.ts)): total price up front, free cancellation clearly marked, policies before payment. Calm badges explicitly reject OTA dark patterns ("No countdown timers," "No '1 room left!' pressure"). No claims beyond what the product already does.

---

## Photography/image strategy

No remote image dependency introduced. Hero, featured-destination cards, and any real stay lacking a usable DB image use the `--ui-hero` gradient placeholder. Real stay images (`DestinationTopStay.image`) are used when present and not the broken sentinel path.

**Future imagery needs (unchanged from CLAUDE-UI-007, still deferred):** 1 hero still, 4 featured-destination images, real per-hotel photos for any property still missing a DB image row (a data/seed task, not a UI task). All self-hosted, responsive, hero eager / rest lazy.

---

## SEO preservation notes

- `head: DocumentHead` is **byte-for-byte unchanged**: `title: "Hotels | Andacity"` + the same description. Verified live: `<title q:head>Hotels | Andacity</title>`.
- `RouterHead`'s existing behavior of mirroring `description` into `og:description`/`twitter:description` when no explicit OG/Twitter tags are set is unchanged (this is pre-existing `RouterHead` logic, not something added here) — confirmed all three description-bearing meta tags render identically to before.
- Exactly **one `<h1>`** on the page (verified by count).
- **City links remain fully crawlable**: the "Popular hotel destinations" grid now renders the **complete** real city list as plain server-rendered `<a href="/hotels/in/<slug>">` — confirmed 20+ distinct cities in the SSR output (alphabetically: Abu Dhabi, Accra, Addis Ababa, Adelaide, Amman, Amsterdam, Athens, Atlanta, Auckland, Austin, Bangkok, Barcelona, Beijing, Bengaluru, Berlin, Bogota, Boston, Brisbane, Brussels, Bucharest, and more) — internal-linking equity preserved and unchanged in scope from before.
- No `noindex` introduced; `/hotels` remains indexable exactly as before.
- One change from the sample/legacy page: the visual breadcrumb band (`Home > Hotels`, previously rendered by `VerticalHeroSearchLayout`) was **not carried into the new design** — it had no structured-data value (`Breadcrumbs.tsx` is presentation-only; the page's `head` has never emitted `BreadcrumbList` JSON-LD), and the approved CLAUDE-UI-007 sample didn't include one either. Flagged here for transparency; can be added back as a small follow-up if desired.

---

## Accessibility notes

- One `<h1>`; sections step through `<h2>`/`<h3>` via `ResponsiveSection`.
- The real `HotelSearchCard` inherits its existing labeled-field and validation-summary accessibility, unchanged.
- Quick-filter preview chips are non-interactive `Badge`s (not buttons), avoiding a false "this does something" affordance; the caption makes the preview nature explicit to screen-reader users too.
- The map panel is `role="img"` with a full descriptive `aria-label` explaining both what it is and that it isn't a real geocoded map; decorative grid lines and pins are `aria-hidden`.
- Star ratings carry `aria-label="N star"`; rating pills are inline text, readable in document order.
- Every interactive element (cards, buttons, search fields) carries a visible `focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]` or inherits the existing form's focus styling.
- No fixed-pixel-width elements were introduced (checked: zero `w-[Npx]`/`min-w-[Npx]` patterns in the new files); all grids use responsive Tailwind utilities.

---

## Responsive notes

Mobile-first, matching the CLAUDE-UI-007 breakpoints:

| Section                    | Mobile                                          | Tablet      | Desktop (xl ≥1280)       |
| -------------------------- | ----------------------------------------------- | ----------- | ------------------------ |
| Hero / search              | Stacked; real search card's own responsive grid | Fields wrap | Full row                 |
| Featured destinations      | 1 col                                           | 2 col       | 4 col                    |
| Results preview — filters  | Hidden (rail)                                   | Hidden      | Sticky left rail (`lg`)  |
| Results preview — list/map | Stacked                                         | Stacked     | List + sticky map (`xl`) |
| Trust                      | 1 col                                           | 3 col       | 3 col                    |
| Popular destinations       | 1 col                                           | 2 col       | 3 col                    |

The CLAUDE-UI-004 header/footer wrap the page unchanged; no overlap or overflow observed.

---

## Sample/preview cleanup

Per the precedent established in CLAUDE-UI-004 and CLAUDE-UI-006 (where `/dev/ui-shell` and `/dev/ui-home` were left untouched after their production counterparts shipped):

- **Left `src/components/dev/hotels/*` and `/dev/ui-hotels` completely untouched** — a stable, frozen historical reference of the approved CLAUDE-UI-007 direction.
- **Built fresh production files** in `src/components/hotels/landing/` rather than moving/renaming the dev files.
- Production never imports from `src/components/dev/` (confirmed by grep — zero matches).
- No production component became orphaned by this task (unlike `GlobalSearchEntry` in CLAUDE-UI-006): `HotelSearchCard`, `HotelResultCard`, `HotelFilters`, and `VerticalHeroSearchLayout` all remain in active use (the latter by `/flights` and `/car-rentals`, confirmed), so nothing was deleted.

---

## Deferred work

1. **Real hotel/destination photography.** Documented above; gradient placeholders remain for any stay/destination without a usable image.
2. **Breadcrumb band.** Dropped from the legacy page (no SEO value); could be re-added as a small `--ui-*` follow-up if desired for visual/navigational parity with other vertical pages.
3. **`HotelResultCard`/`HotelFilters` visual migration.** The actual hotel search-results pages (`/hotels/search/...`, `/hotels/in/<slug>`) still render on legacy `--color-*` tokens — out of scope for a landing-page-only task. Recommended as a focused follow-up once results-page migration is scheduled.
4. **Real map integration.** Explicitly deferred per this task's constraints; the static concept panel can be replaced with a first-party map behind the same `MapPanel` slot in a future, separately-approved task.
5. **`/img/demo/hotel-1.jpg` fallback.** Pre-existing, unrelated bug in `loadTopDestinationStaysFromDb` (the fallback path has no asset on disk); defensively handled in this task's new component only, not fixed at the source (would also affect `/destinations/[slug]`, out of scope here).

---

## Verification results

- **`npm run build.types`** → exits non-zero with **exactly one** error: the **pre-existing** `TS2353` `ssl` in [src/lib/db/client.server.ts:91](../../src/lib/db/client.server.ts#L91) — unrelated, **not fixed** (per instructions). All new/changed files, including the additive `stars` field on `DestinationTopStay`, type-check cleanly; confirmed the other consumer (`/destinations/[slug]`) still compiles.
- **`npm run build`** (Vite client) → compiles cleanly: **938 modules transformed** (up from 926 at CLAUDE-UI-007).
- **ESLint** on all new/changed files → clean (one pre-existing, unrelated ignore-pattern warning on `*.server.ts`, not an error).
- **Dev smoke (`npm run dev`)** — all required routes `200`:
  - `/`, `/hotels`, `/hotels/in/orlando`, `/hotels/in/new-york`, `/flights`, `/car-rentals`, `/explore`, `/destinations` — all `200`, indexable (no robots header).
  - `/hotels`: exact preserved title (`Hotels | Andacity`), exactly one `<h1>` ("Find a stay you'll look forward to."), real `HotelSearchCard` form fields present, real city grid (20+ real cities confirmed in SSR), real featured-stay slugs/prices/star ratings, 1,559 `var(--ui-*)` references, production header/footer present.
  - `/hotels/in/orlando` and `/hotels/in/new-york` — unaffected, still render their existing `<h1>Hotels in …</h1>` layout.
  - `/destinations/miami` (the other consumer of the modified `loadTopDestinationStaysFromDb`) — `200`, "Top stays in …" section still renders correctly.
  - `/dev/ui-hotels/`, `/dev/ui-home/`, `/dev/ui-shell/`, `/dev/ui-palettes/` — all `200` + `noindex, nofollow` — unaffected.
- **Token audit:** zero `var(--color-*)` references in the two new production chrome files (`HotelsLandingPage.tsx`, `hotelsLandingContent.ts`); the embedded real `HotelSearchCard` form is the only legacy-token content, by design (same boundary as the home page's search tabs).
- **Net:** the only blocker is the documented pre-existing DB SSL error; this task introduces no new type/build/lint regressions and touches no page beyond `/hotels` (plus the additive, verified-safe `stars` field in the shared data loader).
