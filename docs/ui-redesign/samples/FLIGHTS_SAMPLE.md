# Flights Landing Page Sample

> CLAUDE-UI-013 — preview-only, approval-gated. The production `/flights` route is
> **not** changed by this task. Review at `/dev/ui-flights` (run `npm run dev`).
> Next after approval: CLAUDE-UI-014 — Flights Landing Page Implementation.

## Purpose

Create a premium **Flights Landing Page** direction for Andacity that makes flight
search feel faster, calmer, clearer, and more premium than typical OTA flight
products — while preserving the utility and scanability users expect from Google
Flights, Kayak, Expedia, and airline flows.

Design thesis:

> Search flights quickly, compare the trip clearly, and move from route intent to
> whole-trip planning without clutter.

This document plus the `/dev/ui-flights` preview establish the visual direction,
layout, and editorial approach. Nothing here replaces production until approved.

---

## Current flights page observations

Production `src/routes/flights/index.tsx`:

**Structure**
- Wraps everything in `VerticalHeroSearchLayout` (`src/components/search/VerticalHeroSearchLayout.tsx`) — a shared centered hero + search-card layout reused by hotels/cars verticals.
- Hero: eyebrow "Flights", H1 "Find smarter flights with flexible planning", a description line, and `heroImageUrl="/images/hero/flights.svg"` with a `flights` overlay theme class.
- Search: the real `FlightsSearchCard` (`src/components/flights/search/FlightsSearchCard.tsx`).
- Body: a single short `<section>` ("Plan air travel with clarity") with two lines of generic copy.

**Search flow (solid — preserved as-is conceptually)**
- `FlightsSearchCard` holds trip type (round-trip / one-way), origin/destination via `LocationAutosuggestField`, depart/return via the real `DateField`, travelers (1–4) and cabin (economy / premium-economy / business / first).
- Client-side validation via `validateFlightSubmit` (origin ≠ destination, dates today-or-later, return after depart for round-trip).
- On valid submit it navigates to the canonical route from `buildCanonicalFlightSearchHref` → `/flights/search/{FROM}-{TO}/{depart}[/return/{return}]?...`.
- The route's `onGet` also server-redirects when `search=1` with resolvable locations, so deep links work.
- `useFlightsIndexPage` loader resolves `fromLocation`/`toLocation` from URL params (`fromLocationId` / `from` text), enabling **prefill via `/flights?from=…&to=…`**.

**Improvement opportunities**
- Still on the legacy `--color-*` token system + `t-btn-primary` — visually inconsistent with the shipped `--ui-*` home / hotels / hotel-detail / hotels-city pages (CLAUDE-UI-006/008/010/012).
- The centered hero is generic; not flight-native and not emotionally distinct from a hotel hero.
- No popular-route inspiration, no flexible-date affordance, no fare-clarity framing, and no whole-trip handoff.
- Body copy ("Plan air travel with clarity") is filler, not useful content.
- Mobile: one big centered card; no sticky search affordance after scroll.

---

## Proposed flights page direction

A flight-native, `--ui-*`-themed landing that:

1. Opens with a left-aligned, flight-native hero and an integrated **real** search module (not a presentational stand-in).
2. Offers **popular routes** that prefill the real search form (pick dates → compare live).
3. Surfaces a **flexible-date** concept for travelers who aren't fixed on dates.
4. Frames **fare clarity** — total price including taxes/fees — as the comparison advantage, with clearly-illustrative examples.
5. Hands off to the **whole trip** (hotels, cars, destinations).
6. Reassures with **trust/policy clarity** — no fake urgency, no invented inventory.
7. Is mobile-first with a sticky "Search flights" CTA that jumps to the search module.

Section order: Hero + search → Popular routes → Flexible travel → Fare clarity/comparison → Whole-trip handoff → Trust → (mobile sticky CTA).

---

## Hero concept

- Full-width `--ui-hero` gradient with a `--ui-hero-scrim` overlay (matches the shipped shell/home/hotels heroes). No photography dependency; a city/sky image can drop in later via `background-image` with no structural change.
- Breadcrumb: Home / Flights (crawlable `<nav><ol>`).
- Eyebrow "Flights", H1 **"Find your flight. Plan the whole trip."**, supporting line about comparing the trip clearly and moving to a whole itinerary.
- Value pills (real capabilities, **no fabricated stats**): "Round-trip & one-way", "Compare by total price", "Flexible date views".
- The search module lives directly under the headline in a `--ui-surface` panel (`--ui-shadow-panel`), so the hero is search-forward rather than decorative.

---

## Search module concept

**The sample embeds the real `FlightsSearchCard` (`surface="plain"`) inside a `--ui-*` frame.** This is deliberate:

- It preserves the existing canonical flight search flow exactly — submissions go to the real `/flights/search/...` route. No broken or fake submissions.
- All affordances are real: trip type (round-trip/one-way), origin/destination autosuggest, depart/return `DateField`, travelers, cabin, client-side validation, and the validation summary.
- `autoResolveOriginLocation={false}` in the sample so the preview never triggers a geolocation permission prompt.
- Frame adds a premium header ("Search flights") and an honest helper: "Live prices & schedules appear after you search."

**For CLAUDE-UI-014 (implementation):** the inner control classes inside `FlightsSearchCard`/`SearchFormPrimitives` still use `--color-*` + `t-btn-primary`. Production work should migrate those control styles to `--ui-*` (or introduce `--ui-*`-aware search primitives) so the controls match the frame. The frame, hero, and all surrounding sections are already `--ui-*`-native.

---

## Popular routes concept

- A responsive grid (1 / 2 / 3 cols) of well-known U.S. city pairs shown as `FROM → TO` with an airline glyph, city names, and a neutral "Round-trip" tag.
- Each tile links to **`/flights?from={City}&to={City}`**, which prefills the real search form (text only). It does **not** include `search=1`, so it never auto-submits or asserts a fare — the user picks dates and runs a live search.
- No prices, no "from $X", no availability claims. Routes are inspiration + a fast path into a real search.

---

## Flexible travel concept

- **"A week at a glance"** — a 7-bar relative strip (Mon–Sun) with an "Illustrative" badge. Bars encode *relative* shape only (0–1); **no dollar amounts and no "cheapest day" claim** are rendered. `role="img"` with an honest label.
- Three flexible-entry tiles — "Whole month", "Weekend trips", "± 3 days" — each linking to `/flights` (safe real target). These are concepts for flexible-date views to be wired to real flexible search in implementation.
- Honest footnote: "Real fare trends load from a live search."

---

## Fare clarity/comparison concept

- Section headline: **"Compare the whole price, not just the headline"** — taxes and carrier fees included so cabins/times compare on equal footing. Section carries a prominent "Illustrative" badge.
- **Cabin comparison**: Economy / Premium economy / Business as relative progress bars (no axis numbers), each with a plain-language note ("Lowest total, most availability", etc.). Footnote: "Bars show the typical gap between cabins, not real prices."
- **Illustrative fare cards**: three `FlightCard` primitives using **generic, obviously-fictional carriers** ("Andacity Sample Air", "Demo Skyways", "Meridian Example Air") with prices labeled "Illustrative · round trip". Card CTAs point to `#flight-search` (back to the real search). Footnote states these are sample carriers/prices for layout only — not live fares, schedules, or airline partnerships.

This satisfies the deliverable's "fare comparison preview" while honoring every fare-safety rule (see below).

---

## Whole-trip handoff concept

Three cards — **Add a hotel** → `/hotels`, **Add a car** → `/car-rentals`, **Plan what to do** → `/destinations` — each with a `--ui-hero` gradient tile, a one-line value prop, and a secondary Button. All targets are real, existing routes. This is the "route intent → whole-trip planning" bridge the thesis calls for, kept visually quiet so it doesn't distract from flight search.

---

## Trust and conversion concept

- **"Booking you can read"** — three cards: "Total price, up front", "Change rules, clearly marked", "No surprise fees at checkout". Language describes Andacity's clarity posture; **no guarantees, no urgency, no inventory claims**.
- **Mobile sticky CTA** (`lg:hidden`, `z-40`): "Find your flight / Round-trip & one-way" + a "Search flights" button linking to `#flight-search` (the in-page search module). 44px min tap target; a spacer prevents the last section from being obscured.

---

## Loading/empty state concept

The landing page itself has no data fetch to "load" — the hero search is interactive immediately, and popular routes/flexible/fare sections are static concept content. Relevant states live downstream and are unchanged by this task:

- **Submitting a search**: handled by the real `FlightsSearchCard` → canonical `/flights/search/...` route, which owns its own loading/empty/error states (`FlightResultsLoadingState`, `FlightResultsEmptyState`, `FlightResultsErrorState`).
- **Invalid/blank submit**: the real card's `validateFlightSubmit` blocks submission and renders `BookingValidationSummary` inline.
- **Flexible/fare concept blocks**: in implementation, any block backed by live data should use `SkeletonResults` (`src/components/ui/Skeleton.tsx`) while loading and a neutral empty message if no data — never a fabricated value.

---

## Photography/image strategy

- Hero: `--ui-hero` gradient only in the sample (no remote dependency). Production can overlay a sky/aerial/city photograph via `background-image` with the existing scrim, no structural change.
- Whole-trip tiles: `--ui-hero` gradient tiles as safe local stand-ins; swap for curated hotel/car/destination imagery later.
- No remote image, tile, or map dependencies anywhere in the sample.

---

## Responsive behavior

| Breakpoint | Behavior |
|---|---|
| Mobile (< 640px) | Single-column everything; the real search card stacks its fields; popular routes 1-col; flexible strip full-width above entry tiles; fare cards 1-col; sticky "Search flights" CTA visible. |
| Tablet (`sm:`, 640–1024px) | Popular routes 2-col; whole-trip 3-col; fare cards 2-col; flexible/fare two-panel layouts begin. |
| Desktop (`lg:`+) | Popular routes 3-col; flexible & fare-clarity use asymmetric two-column layouts; fare cards up to 3-col (`xl:`); mobile sticky CTA hidden (search is in view / reachable). |

The hero search panel is full-width within `max-w-6xl` so all search fields stay on a comfortable line length across breakpoints.

---

## Accessibility notes

- Single `<h1>` ("Find your flight. Plan the whole trip.") ✓
- Breadcrumb `<nav aria-label="Breadcrumb"><ol>` with `aria-current="page"` ✓
- Real search controls inherit `FlightsSearchCard`'s `<label>`/`for` associations, required states, and `aria-live` validation summary ✓
- Popular-route links have descriptive `aria-label` ("Search flights from New York to Miami") ✓
- Flexible strip + cabin bars are `aria-hidden` decorative bars wrapped in a `role="img"` with an honest label; no information is conveyed by color alone (notes accompany each) ✓
- Mobile sticky CTA: 44px min target, visible focus ring, `#flight-search` jump with `scroll-mt` offset ✓
- All text/background pairs use `--ui-*` tokens targeting WCAG AA across the six palettes ✓

---

## SEO notes

This is a **dev/preview sample only** and is intentionally `noindex, nofollow` (route header + meta) and 404s on the production host via `shouldIndex(url)`.

For the eventual production page (CLAUDE-UI-014), the direction preserves/improves SEO:
- Keeps a single clear `<h1>` and a crawlable breadcrumb.
- Replaces filler body copy with genuinely useful sections (popular routes, flexible travel, fare clarity) — real internal-link value to `/hotels`, `/car-rentals`, `/destinations`.
- No keyword stuffing; no fabricated fares or availability that would create thin/misleading content.
- Production `/flights` metadata, canonical, and indexability are untouched by this task.

---

## Implementation boundary

**This task creates (sample only):**
- `src/components/dev/flights/flightsSampleData.ts`
- `src/components/dev/flights/FlightsLandingSample.tsx`
- `src/routes/dev/ui-flights/index.tsx`
- `docs/ui-redesign/samples/FLIGHTS_SAMPLE.md` (this file)

**This task does NOT change:**
- `src/routes/flights/index.tsx` — production flights landing unchanged.
- `FlightsSearchCard`, `VerticalHeroSearchLayout`, or any flight result/itinerary route/component.
- CLAUDE-UI-004 shell, CLAUDE-UI-006 home, CLAUDE-UI-008 hotels, CLAUDE-UI-010 hotel detail, CLAUDE-UI-012 hotels-by-city.
- Theme switching, mobile nav, footer.
- The pre-existing DB SSL TypeScript error (`src/lib/db/client.server.ts`) — out of scope.

No map dependencies, remote tiles, or API keys were added.

---

## Preview route

```
/dev/ui-flights
```

- `noindex, nofollow` via `x-robots-tag` response header + meta robots.
- 404s on the production host via `shouldIndex(url)` (same gate as every other `/dev/ui-*` route).
- Renders `FlightsLandingSample` inside the production global shell (header/footer from the root layout).
- The theme control in the header drives all `--ui-*` tokens — the sample responds to every palette + light/dark/auto combination.
- The embedded search module is the **real** `FlightsSearchCard`; submitting a valid search navigates to the genuine canonical `/flights/search/...` route.

---

## User decision needed

Review `/dev/ui-flights` (run `npm run dev`) across Skyglass Luxe Light/Dark and Andacity Meridian Light/Dark. Evaluate:

1. Is the flight-native hero + embedded real search the right opening, or do you prefer the centered `VerticalHeroSearchLayout` style retained?
2. Popular routes as **prefill-only** tiles (no prices) — right call, or do you want clearly-illustrative price hints on them too?
3. Flexible-travel concept: keep the relative week strip + entry tiles, or defer flexible views entirely to a later task?
4. Fare clarity: are clearly-illustrative fictional-carrier fare cards acceptable for direction, or should the sample omit example fares and show comparison structure only?
5. Whole-trip handoff placement and weight — prominent enough / too prominent?
6. Should CLAUDE-UI-014 also migrate the inner `FlightsSearchCard` control styles to `--ui-*`, or keep that as a separate component task?

---

## Verification results

**TypeScript (`npm run build.types`):**
- One pre-existing error: `src/lib/db/client.server.ts(91,5)` — SSL property type error (pre-existing, unrelated).
- Zero new type errors from CLAUDE-UI-013 ✓

**Production build (`npm run build`):**
- Build succeeds: `✓ built in 6.01s` ✓

**Dev smoke check (`npm run dev`, localhost:5173):**
- `/dev/ui-flights` — 200; all sections render: hero + real search, popular routes, flexible travel, fare clarity, whole-trip handoff, trust, mobile CTA ✓
- Real search controls present (Trip type, "City or airport" autosuggest, Travelers, Cabin) ✓
- `x-robots-tag: noindex, nofollow` present on the preview ✓
- Popular-route prefill target `/flights?from=New York&to=Miami` — 200 ✓
- `/` 200, `/hotels` 200, `/hotels/in/miami` 200, `/flights` 200 — unaffected ✓
- `/hotels/miami-motel-02` 200 (valid current seed slug) — unaffected ✓
- `/dev/ui-hotels-city`, `/dev/ui-hotel-detail`, `/dev/ui-hotels`, `/dev/ui-home`, `/dev/ui-shell`, `/dev/ui-palettes` — all 200, unaffected ✓
