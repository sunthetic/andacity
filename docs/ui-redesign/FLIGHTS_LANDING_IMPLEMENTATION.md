# Flights Landing Page Implementation

> CLAUDE-UI-014 — production implementation of the approved CLAUDE-UI-013 flights
> landing direction. The production `/flights` route now uses the `--ui-*`
> system. The dev preview at `/dev/ui-flights` is retained as historical
> reference. Next: CLAUDE-UI-015 — Flight Route Results Page Sample (not started).

## Approved direction

Promote the CLAUDE-UI-013 flights sample to production with these approved decisions:

- Premium, flight-native landing page direction.
- Headline: **"Find your flight. Plan the whole trip."**
- Use the **real** production `FlightsSearchCard` (not a presentational stand-in).
- Popular routes stay **price-free** (prefill the real form).
- Keep the flexible-travel concept, clearly labeled illustrative.
- Fare clarity/comparison: **structure-first / clearly illustrative**, no fictional live fares.
- Whole-trip handoff to hotels, cars, destinations.
- Calm, verifiable trust/conversion messaging.
- Migrate `FlightsSearchCard` inner control styling to `--ui-*` **only if safe** — otherwise wrap + defer.

Page thesis: *Search flights quickly, compare the trip clearly, and move from route intent to whole-trip planning without clutter.*

---

## Production files changed

**Added:**
- `src/components/flights/landing/flightsLandingData.ts` — static, fabrication-free content (popular routes, flex week, cabin comparison, fare anatomy, trip handoff). Production-safe location (not under `dev/`).
- `src/components/flights/landing/FlightsLanding.tsx` — production page body composition on `--ui-*` tokens. Accepts the loader-wired search card via a `searchCard: JSXOutput` prop. Does **not** render its own `<main>`.

**Rewritten:**
- `src/routes/flights/index.tsx` — swapped `VerticalHeroSearchLayout` for `FlightsLanding`. Preserved `onGet` (canonical redirect on `search=1`), `useFlightsIndexPage` loader, URL-param prefill wiring, and `head` metadata exactly. Now mounts `FlightsSearchCard surface="plain"` inside the new `--ui-*` hero frame.

**Unchanged (intentionally):**
- `src/components/flights/search/FlightsSearchCard.tsx` — real search component, shared with home/hotels/cars flows. No changes (see styling notes).
- `src/components/booking-surface/SearchFormPrimitives.tsx` — shared by hotels + flights + cars search cards. No changes.
- `src/components/dev/flights/*` and `src/routes/dev/ui-flights/*` — the CLAUDE-UI-013 sample, kept as historical reference.
- All CLAUDE-UI-004/006/008/010/012 work, theme switching, nav, footer.
- `src/lib/db/client.server.ts` SSL error — out of scope, untouched.

---

## Hero implementation

- Full-width `--ui-hero` gradient with a `--ui-hero-scrim` overlay (matches the shipped shell/home/hotels heroes). No photography dependency.
- Breadcrumb `Home / Flights` (crawlable `<nav aria-label="Breadcrumb"><ol>` with `aria-current="page"`).
- Eyebrow "Flights", single `<h1>` **"Find your flight. Plan the whole trip."**, supporting subhead, and three real-capability value pills ("Round-trip & one-way", "Compare by total price", "Flexible date views") — no fabricated stats.
- The search module sits directly under the headline in a `--ui-surface` panel (`--ui-shadow-panel`), `id="flight-search"` with `scroll-mt-24` so the mobile CTA anchor lands cleanly.

---

## Search module implementation

- Mounts the **real** `FlightsSearchCard` with `surface="plain"` inside the hero's `--ui-*` framed panel (mirrors how the production home page frames the same card).
- The route wires loader-prefilled props exactly as before: `initialItineraryType`, `initialFrom`/`initialFromLocation`, `initialTo`/`initialToLocation`, `initialDepart`, `initialReturn`, `initialTravelers`, `initialCabin`, `autoResolveOriginLocation={true}`.
- Canonical flight search flow is fully preserved: valid submits navigate to `/flights/search/{FROM}-{TO}/{depart}[/return/{return}]?...` via `buildCanonicalFlightSearchHref`; the `onGet` server redirect on `search=1` is unchanged.
- Verified in dev: `/flights?from=New York&to=Miami` resolves both endpoints to full canonical locations (`New York, NY, United States` / `Miami, FL, United States`) and prefills the form so a submit goes straight to canonical results.
- No broken submissions, no developer/SEO copy, no fake fares/availability.

---

## FlightsSearchCard styling notes

**Decision: wrap, don't migrate (inner-control migration deferred).**

`FlightsSearchCard`'s inner controls are styled by `SearchFormPrimitives` (`BookingSearchSurface`, `BookingSearchField`, `BOOKING_SEARCH_CONTROL_CLASS`) and `t-btn-primary`, which are **shared by the home page (`HomeSearchModule`), the hotels search card, and the cars search card**. Migrating those inner styles to `--ui-*` would risk regressing all three production surfaces and is out of scope for a flights-landing task.

Per the approved fallback, the card is wrapped in a `--ui-*` production shell (the hero panel) and inner-control migration is recorded as deferred work. No public props changed; all behavior, validation, and canonical submission are preserved. This matches the existing production home page, which already wraps the same `surface="plain"` card in a `--ui-*` frame.

---

## Popular routes implementation

- Responsive grid (1 / 2 / 3 cols) of six well-known U.S. city pairs as `FROM → TO` with an airline glyph, city names, and a neutral "Round-trip" tag.
- Each tile links to `/flights?from={City}&to={City}` (`popularRouteHref`), which prefills the real search form (text → resolved location, as verified above). No `search=1`, so it never auto-submits and never asserts a price/demand/availability.
- Descriptive `aria-label` per tile ("Search flights from New York to Miami").

---

## Flexible travel implementation

- "A week at a glance" — a 7-bar relative strip (Mon–Sun) with an "Illustrative" badge. Heights are relative shape only (0–1); **no amounts and no "cheapest day" claim**. Wrapped in `role="img"` with an honest label; bars are `aria-hidden`.
- Three flexible-entry tiles ("Whole month", "Weekend trips", "± 3 days"), each linking to `/flights` (safe real target) as concept entry points for future flexible-date views.
- Honest footnote: "Relative shape only — no amounts shown. Real fare trends load from a live search."

---

## Fare clarity/comparison implementation

Reworked to **structure-first** for production (the sample's clearly-illustrative fictional-carrier fare cards were intentionally dropped to avoid any priced/branded example on a live page):

- **Cabin comparison** — Economy / Premium economy / Business as relative progress bars (no axis numbers), each with a plain-language note. "Illustrative" badge + footnote: "Bars show the typical gap between cabins, not real prices."
- **Fare anatomy** — "What you'll compare on each option": Stops & duration, Departure & arrival, One all-in total (taxes/fees included). Explains the real comparison dimensions with **no fabricated airline, schedule, or price**, plus a "Start a flight search" button to `#flight-search`.
- No "best fare", "price drop", "only X seats left", guarantees, or airline-partnership language anywhere.

---

## Whole-trip handoff implementation

Three cards with `--ui-hero` gradient tiles, one-line value props, and secondary Buttons:
- **Add a hotel** → `/hotels`
- **Add a car** → `/car-rentals`
- **Plan what to do** → `/destinations`

All targets are real, existing routes (verified 200). Visually quiet so it supports — rather than competes with — flight search.

---

## Trust and conversion implementation

- "Booking you can read" — three calm, verifiable cards: "Total price, up front", "Change rules, clearly marked", "No surprise fees at checkout". No urgency, guarantees, or inventory claims.
- **Mobile sticky CTA** (`lg:hidden`, `z-40`): "Find your flight / Round-trip & one-way" + a "Search flights" button linking to `#flight-search`. 44px min tap target; an `h-20 lg:hidden` spacer prevents the last section from being covered.

---

## SEO preservation notes

- `/flights` remains **indexable** — verified `<meta name="robots" content="index,follow,max-image-preview:large,...">` and **no** `x-robots-tag` header on the production route.
- `head` export unchanged: title "Flights | Andacity" + the existing description (verified `<title>Flights | Andacity</title>`).
- Single, clear `<h1>` (verified exactly one `<h1>` on the page).
- Canonical flight search routing and the `onGet` redirect are unchanged.
- All internal links are real, crawlable `<a href>` targets (popular routes, flexible entries, whole-trip handoff, breadcrumb).
- Content is server-rendered (sections appear in the SSR HTML; verified via curl without JS).
- No developer/SEO placeholder copy.

---

## Accessibility notes

- One clear `<h1>`; section `<h2>`/`<h3>` hierarchy.
- Breadcrumb `<nav aria-label="Breadcrumb">` with `aria-current="page"`.
- Real search controls inherit `FlightsSearchCard`'s `<label>`/`for` associations, required states, and `aria-live` validation summary.
- Popular-route links have descriptive `aria-label`s; no icon-only links.
- Flexible strip + cabin bars are decorative (`aria-hidden`) inside honestly-labeled `role="img"` containers; information is never conveyed by color alone (text notes accompany each).
- Visible focus rings via `--ui-ring` on all interactive elements; mobile CTA is 44px min and uses an in-page `#flight-search` jump with `scroll-mt` offset.
- `--ui-*` token pairs target WCAG AA across the six palettes; layout uses `max-w-6xl` containers and wrapping flex/grid to avoid horizontal overflow.

---

## Responsive notes

| Breakpoint | Behavior |
|---|---|
| Mobile (< 640px) | Single-column throughout; real search card stacks its fields; popular routes 1-col; flex strip above entry tiles; cabin + anatomy stack; sticky "Search flights" CTA visible. |
| Tablet (`sm:`) | Popular routes 2-col; whole-trip 3-col; trust 3-col. |
| Desktop (`lg:`+) | Popular routes 3-col; flexible & fare-clarity use asymmetric two-column layouts; mobile sticky CTA hidden. |

Search panel is full-width within `max-w-6xl` so the real card's fields keep a comfortable line length at every width.

---

## Sample/preview cleanup

- Production imports only from `src/components/flights/landing/` — **no production import from `src/components/dev/`** (verified).
- The CLAUDE-UI-013 sample (`src/components/dev/flights/*`, `src/routes/dev/ui-flights/*`) is retained unchanged as historical reference; `/dev/ui-flights` still renders (200, noindex, prod-gated).
- Content was re-authored in the production data file rather than imported from the sample, keeping the dev/prod boundary clean.

---

## Deferred work

| Item | Reason deferred |
|---|---|
| Migrate `FlightsSearchCard` inner controls to `--ui-*` | Shared with home/hotels/cars via `SearchFormPrimitives`; migrating risks regressing those surfaces. Wrapped in a `--ui-*` shell instead. Best handled as a dedicated search-primitive task. |
| Real flexible-date fare data | No live flexible-fare dataset; strip is relative/illustrative with honest labels until a real source exists. |
| Priced fare-example cards | Intentionally omitted on the live page (structure-first) to avoid any fabricated fare/airline; revisit only with real fare data. |
| Hero photography | Gradient-first; a sky/aerial image can drop in via `background-image` over the existing scrim with no structural change. |
| Flight route/results page redesign | Out of scope — CLAUDE-UI-015+. |

---

## Verification results

**TypeScript (`npm run build.types`):**
- One pre-existing error: `src/lib/db/client.server.ts(91,5)` — SSL property type error (pre-existing, unrelated).
- Zero new type errors from CLAUDE-UI-014 ✓

**Production build (`npm run build`):**
- Build succeeds: `✓ built in 6.70s` ✓

**Dev smoke check (`npm run dev`, localhost:5174):**
- `/flights` — 200; new landing renders: hero + real search, popular routes, flexible travel, fare clarity (cabin bars + anatomy), whole-trip handoff, trust, mobile CTA ✓
- Exactly one `<h1>`; indexable (`robots: index,follow…`, no `x-robots-tag`); title "Flights | Andacity" ✓
- Real search controls present (Trip type, "City or airport" autosuggest, Travelers, Cabin) ✓
- `/flights?from=New York&to=Miami` — 200; both endpoints resolve to full canonical locations and prefill the form ✓
- Whole-trip links present: `/hotels`, `/car-rentals`, `/destinations` ✓
- Unaffected: `/` 200, `/hotels` 200, `/hotels/in/miami` 200, `/hotels/miami-motel-02` 200, `/car-rentals` 200, `/explore` 200, `/destinations` 200 ✓
- Unaffected dev samples: `/dev/ui-flights`, `/dev/ui-hotels-city`, `/dev/ui-hotel-detail`, `/dev/ui-hotels`, `/dev/ui-home`, `/dev/ui-shell`, `/dev/ui-palettes` — all 200 ✓
