# Hotel Detail Page Sample

> **Task ID:** CLAUDE-UI-009
> **Status:** Sample / approval-gated design preview. **No production hotel detail page was replaced.**
> **Prerequisites:** CLAUDE-UI-000 → CLAUDE-UI-008 (shell + home + hotels landing implemented) complete.
> **Preview:** [`/dev/ui-hotel-detail`](../../../src/routes/dev/ui-hotel-detail/index.tsx) — `noindex`, prod-gated. Renders the sample detail body inside the **production** global shell; switch palette + light/dark from the header theme control.

---

## Purpose

Propose a premium, media-first redesign of the Andacity hotel detail page (`/hotels/[slug]`) — immersive, trustworthy, easy to scan, and easy to act on, more beautiful and calmer than typical OTA detail pages while preserving the practical booking information users expect.

Design thesis the page must communicate:

> **Here is the stay, the price context, the policies, the rooms, and the reasons to trust it — all without clutter or pressure.**

This is a **sample for approval**. The production `/hotels/[slug]` route ([src/routes/hotels/[slug]/index.tsx](../../../src/routes/hotels/%5Bslug%5D/index.tsx)) is untouched until the user approves and CLAUDE-UI-010 implements it.

---

## Current hotel detail observations

From re-inspecting [src/routes/hotels/[slug]/index.tsx](../../../src/routes/hotels/%5Bslug%5D/index.tsx):

- **Route/loader:** `/hotels/[slug]`; `useHotelPage` (`routeLoader$`) loads a real `Hotel` via `loadHotelBySlugFromDb(slug)`, parses stay params (`checkIn`/`checkOut`/`adults`/`rooms`) from the URL, computes nights + pricing, builds a signed OG image, and returns a graceful `loadError`/`null` fallback (404 on missing). It's **deeply DB-coupled and conversion-rich** — not safe to mount in a dev-only concept route, which is why this sample uses static illustrative data.
- **Data model** ([src/data/hotels.ts](../../../src/data/hotels.ts)): `Hotel` = name, city/region, neighborhood, propertyType, addressLine, currency, `stars` (2–5), `rating`, `reviewCount`, `fromNightly`, `summary`, `images[]`, `amenities[]`, `policies` (freeCancellation, payLater, noResortFees, checkIn/OutTime, cancellation/payment/fees blurbs), `rooms[]` (`Room` = name, sleeps, beds, sizeSqft, priceFrom, refundable, payLater, badges[], features[]), `faq[]`, `availability`, `availabilityConfidence`, `freshness`. The sample's `SampleHotel`/`SampleRoom` shapes intentionally mirror these.
- **Current layout** (legacy `--color-*`, `t-card`/`t-badge`/`t-panel`): breadcrumbs → `AsyncStateNotice` → a 2-column grid (main + 360px sticky booking aside). Main: title/stars/rating/address, a trust-badge row, a **1-big-+-2-small image gallery**, a `DecisionSummarySection` ("Should you shortlist this stay?"), Overview + amenity preview, **Rooms** (`RoomCard` list), full Amenities, Policies (4 panels), FAQ. Aside: Save/Compare/Add-to-trip, a price module, a real **GET date form** (`DateField`), an `InventoryRefreshControl`, "Select a room", and a "Why Andacity" card. Plus a **mobile sticky CTA**, `CompareTray`, and `CompareSheet`.
- **Images:** `<img src={h.images[0] || "/img/demo/hotel-1.jpg"}>` — the fallback path **has no asset on disk** (the same broken sentinel flagged in CLAUDE-UI-008), so missing-image hotels render a broken `<img>` today.
- **Pricing:** real — `buildHotelPriceDisplay`, `formatMoney`, `formatPriceQualifier`; estimated tax ~14%. No fake urgency in the current page (good baseline to preserve).
- **SEO/indexability:** full `head` — title, description, **`robots: index,follow,max-image-preview:large`**, canonical (`/hotels/<slug>`), OG/Twitter with a path-based OG image. **Indexable.** Note: **no JSON-LD** is emitted today (unlike `/destinations/[slug]`, which emits `Hotel`/`BreadcrumbList`/`FAQPage` graphs) — an opportunity, not a regression, for CLAUDE-UI-010.
- **Breadcrumbs:** present (Home → Hotels → City → Name); the City crumb links to `/hotels/in/<cityQuery>`.
- **Shared dependencies:** `loadHotelBySlugFromDb`, the `Hotel`/`Room` types, `buildHotelPriceDisplay`/`formatMoney`, the decisioning (Save/Compare/Trip) system, and `DateField` — all shared with `/hotels` and `/hotels/in/[citySlug]`.

**Implications:** the current page is information-rich and conversion-aware but reads "dense booking utility" — legacy tokens, a small gallery, heavy decision-analysis blocks, and a broken image fallback. The sample keeps every practical element (price context, rooms/rates, policies, dates, trust, compare) but makes it **media-first, calmer, and `--ui-*`-native**.

---

## Proposed hotel detail direction

**Immersive but calm.** A large editorial gallery up top, a confident title/rating header, then a two-column body — scannable content (overview, rooms, amenities, location, policies) beside a **sticky booking rail** — closing with related stays and a mobile sticky CTA. Everything on the `--ui-*` foundation + CLAUDE-UI-002 primitives, so it re-skins across all 12 theme states inside the CLAUDE-UI-004 shell.

Sample components (preview-only; the basis for CLAUDE-UI-010):

- [HotelDetailSample.tsx](../../../src/components/dev/hotel-detail/HotelDetailSample.tsx) — full composition.
- [HotelGallery.tsx](../../../src/components/dev/hotel-detail/HotelGallery.tsx) — media-first gallery.
- [BookingRail.tsx](../../../src/components/dev/hotel-detail/BookingRail.tsx) — sticky desktop booking rail.
- [RoomRateCard.tsx](../../../src/components/dev/hotel-detail/RoomRateCard.tsx) — room + rate rows.
- [hotelDetailSampleData.ts](../../../src/components/dev/hotel-detail/hotelDetailSampleData.ts) — **illustrative, DB-free** sample data.

**What is illustrative vs. real:** _everything in this sample is illustrative_ — a fictional property ("The Reefline Hotel," Miami), fictional rooms/rates, **sample prices**, and a **sample rating/review count**. No live availability, no real inventory, no DB calls. The preview banner and on-page "Sample rate(s)" / "illustrative" labels make this explicit. The only real, shared code reused is the pure `formatMoney` price formatter and the CLAUDE-UI-002 primitives.

---

## Hero/gallery concept

[HotelGallery.tsx](../../../src/components/dev/hotel-detail/HotelGallery.tsx):

- **Desktop:** a large lead tile (≈1.7fr) + a 2×2 thumbnail grid (≈1fr); the 4th thumbnail carries a **"+ View all 28 photos"** overlay (the future lightbox trigger).
- **Mobile:** the lead tile + a horizontal **thumbnail strip** and an "All 28 photos" pill.
- **Safe, accessible, no broken images:** every tile is a `--ui-hero` **gradient placeholder** (subtle per-tile `hue-rotate` so adjacent tiles read as distinct photos), each `role="img"` with a descriptive `aria-label` (`"Photo 2 of 28: Ocean-view king room"`). This degrades gracefully for hotels with weak/missing imagery (the exact case the production page mishandles today with `/img/demo/hotel-1.jpg`) and is **photography-ready** — real stills drop into the same slots with no structural change.
- **Performance:** gradients are pure CSS (no network, no layout shift); real images would be lazy below the lead with width/height set.

---

## Summary and booking rail concept

- **Title header** (above the gallery for an early `<h1>` + scan anchor): star row, neighborhood/city chip, **`<h1>` name**, a **rating pill** ("9.2 Superb · 1,840 reviews" — illustrative) + address, Save/Share ghost actions, and a quiet 3-item highlight row.
- **Booking rail** ([BookingRail.tsx](../../../src/components/dev/hotel-detail/BookingRail.tsx)) — sticky right column, the calm conversion zone:
  - **Price/availability module:** "From $228 / night" with a **"Sample rate"** chip and _"Taxes & fees included… set dates to see your full stay total."_ — price context without a fake live quote.
  - **Date/guests refinement** (check-in / check-out / guests & rooms).
  - Primary **"Select a room"** CTA → `#rooms`.
  - **Save / Compare / Add to trip** action chips (visual concept; production wires the real decisioning buttons).
  - A calm confidence line (_"Prices and availability update when you set dates. Shareable link…"_) — **no countdown, no scarcity**.
  - A secondary **"Why book with Andacity"** trust mini-card.
- **Boundary:** rail fields are presentational here; in production the rail keeps the existing **real GET date form** (`DateField`) and decisioning actions.

---

## Room/rate card concept

[RoomRateCard.tsx](../../../src/components/dev/hotel-detail/RoomRateCard.tsx) — the conversion core, made scannable:

- Per room: a gradient media tile, name, **sleeps / beds / size**, and feature chips.
- **One or more selectable rate rows** (e.g. **Flexible** vs. **Saver**) — each stating its real-language **cancellation** term (green ✓ when "Free cancellation…") and **payment** term, an **illustrative** nightly price ("per night · taxes incl."), an optional **"Best value"** badge, and a **Select** button.
- This rate-table pattern matches what travelers expect from OTAs (choosing a rate, not just a room) while staying calm and honest — no "only 1 left", no fake discounts, no struck-through "was" prices.

---

## Amenities concept

Grouped, icon-led amenity cards (**Most popular · Wellness · Food & drink · Services**) in a 2-up grid, each a `--ui-surface` card with a soft accent icon and a ✓ list — far calmer than the production page's flat badge wall, and easy to scan. A full-list expansion (or `#amenities` anchor) is the natural production extension.

---

## Location/context concept

- **Static map concept** (CSS-only, reused from the CLAUDE-UI-008 pattern): a `--ui-surface-muted` panel with a faux street grid and a single **hotel pin**, labeled **"Map preview · concept"**, `role="img"` with an honest `aria-label` ("…not a geocoded map"). **No map library, tiles, or API key.**
- **"What's nearby"** list (landmarks + **illustrative** walk/drive distances, explicitly labeled "Distances are illustrative") and a getting-around note.

---

## Policy and trust concept

- **Policies & what to know:** four `--ui-*` cards — Cancellation, Payment, Taxes & fees, Check-in/out — using plain-language copy that mirrors the product's real `defaultPolicies` voice (no guarantees).
- **Anti-dark-pattern badges:** "Total price up front", "No countdown timers", "No '1 room left!' pressure" — making the calm stance explicit.
- **Trust is distributed** (header rating, rail "Why book with Andacity", policy clarity) rather than a single heavy decision-analysis block, keeping the page immersive. The illustrative rating/review count is framed by the page-wide sample banner; **no fabricated written reviews/testimonials** are shown.

---

## Related stays concept

A **"Other stays in Miami"** row of three [`HotelCard`](../../../src/components/ui/HotelCard.tsx) primitives (image-led, price-anchored), carrying a **"Sample rates · illustrative"** chip and linking to the real `/hotels/in/miami` hub — keeps comparison going without leaving the calm frame.

---

## Mobile sticky CTA concept

A fixed bottom bar (`lg:hidden`): "From $228 / night · Taxes & fees included · sample rate" + a **"Select a room"** button → `#rooms`. A spacer prevents it from covering content. No urgency, no price flicker. (Mirrors the production mobile CTA, restyled to `--ui-*`.)

---

## Loading/fallback state concept

Demonstrated live in the preview's **"Design states"** appendix:

- **Loading skeleton:** a gallery-shaped skeleton (lead + 2×2) + title/room/rail skeletons using the CLAUDE-UI-002 `ui-skeleton` primitives (reduced-motion-aware).
- **Fallback state:** an `EmptyState` ("We couldn't load this stay") with Retry + "Browse Miami hotels" — the calm equivalent of the production `AsyncStateNotice`/`AsyncRetryControl` path, for incomplete/unavailable hotel data.

---

## Photography/image strategy

No remote image dependency. Hero/gallery, room media, related-stay cards, and the map all use `--ui-hero` / `--ui-surface-muted` placeholders, so the page is intentional-looking in all 12 theme states with zero assets — and crucially **never renders a broken `<img>`** (fixing the production `/img/demo/hotel-1.jpg` gap by construction).

**Future imagery needs (CLAUDE-UI-010+):**

- Real `Hotel.images[]` wired into the gallery (lead eager, rest lazy, width/height set, descriptive `alt`).
- Per-room photos for room cards (a data/seed concern as much as UI).
- A graceful "no photos yet" gradient fallback retained for sparse properties.
- Optional real map provider (separate, deliberately-approved decision; self-hosted/first-party preferred).

---

## Responsive behavior

Mobile-first; single column on small screens, two columns from `lg`.

| Zone          | Mobile (<1024)                                     | Desktop (≥1024 / xl ≥1280)                      |
| ------------- | -------------------------------------------------- | ----------------------------------------------- |
| Gallery       | Lead tile + thumbnail strip + "All N photos"       | Lead + 2×2 grid; "View all" overlay             |
| Body          | Single column (content, then rail content inlined) | `minmax(0,1fr)` content + **360px sticky rail** |
| Rooms / rates | Stacked; rate price+CTA wrap under terms           | Rate terms left, price+CTA right                |
| Amenities     | 1 col                                              | 2-up cards                                      |
| Location      | Map then nearby stacked                            | Map (1.4fr) + nearby (1fr)                      |
| Policies      | 1 col                                              | 2-up                                            |
| Conversion    | **Fixed bottom CTA**                               | Sticky rail                                     |

Containers use the shared `max-w-6xl` rhythm; no horizontal overflow (no fixed pixel widths beyond the intentional 360px rail track, which sits opposite a `minmax(0,1fr)` column).

---

## Accessibility notes

- One `<h1>` (hotel name); sections use ordered `<h2>`/`<h3>`.
- Gallery tiles are `role="img"` with descriptive, indexed `aria-label`s; "View all photos" is a real labeled `button`; the mobile strip duplicates are `aria-hidden`.
- Star row carries `aria-label="5 star"`; the map panel is `role="img"` with an honest label; decorative grid/pins are `aria-hidden`.
- Rate "Select" buttons carry context (`aria-label="Select Ocean View King, Saver rate"`).
- Every interactive element shows a visible `--ui-ring` focus ring (≥2px); the mobile sticky CTA and rail CTA are ≥44px targets.
- The loading skeleton is wrapped in `role="status"`; shimmer respects `prefers-reduced-motion` (CLAUDE-UI-002).
- **Follow-up (CLAUDE-UI-010):** a real lightbox needs focus-trap + Escape + roving arrows; the date refinement inherits the production `DateField` a11y; a full multi-theme contrast pass is scheduled.

---

## SEO notes

- The sample is **presentational** and changes no routing, canonical/robots logic, or structured data; the preview is `noindex, nofollow` and 404s on the production host (verified).
- **For the production rewrite (CLAUDE-UI-010):** keep `/hotels/[slug]` indexable; **preserve the existing `head`** (title, description, `robots: index,follow,max-image-preview:large`, canonical, OG/Twitter, signed OG image); keep a single `<h1>` (the hotel name); retain the **breadcrumb** (Home → Hotels → City → Name) and the City→`/hotels/in/<cityQuery>` internal link; keep content server-rendered. **Opportunity:** add `Hotel` + `BreadcrumbList` (+ `FAQPage` if FAQ is retained) JSON-LD — the detail page emits none today, while `/destinations/[slug]` already does, so this is a clear, low-risk SEO upgrade to fold in.

---

## Implementation boundary

**This task added (preview-only):**

- `src/components/dev/hotel-detail/` — `HotelDetailSample.tsx`, `HotelGallery.tsx`, `BookingRail.tsx`, `RoomRateCard.tsx`, `hotelDetailSampleData.ts`.
- `src/routes/dev/ui-hotel-detail/index.tsx` — noindex, prod-gated preview (+ loading/fallback appendix).
- This doc.

**Reused (unchanged):** CLAUDE-UI-002 primitives (`HotelCard`, `Badge`, `Button`, `ResponsiveSection`, `EmptyState`, `Skeleton`) and the pure `formatMoney` helper.

**Not touched (await approval → CLAUDE-UI-010):** production `/hotels/[slug]` route, `loadHotelBySlugFromDb`, the `RoomCard`/`DecisionSummarySection`/decisioning components, `DateField`, the CLAUDE-UI-004 shell, the CLAUDE-UI-006 home page, and the CLAUDE-UI-008 hotels landing page.

**On approval, CLAUDE-UI-010 will:** rebuild `/hotels/[slug]` from this composition on `--ui-*`, mounting **real** `Hotel`/`Room` data, the real date refinement (`DateField`), real decisioning (Save/Compare/Add-to-trip), real `Hotel.images[]` in the gallery (with the graceful fallback), the real availability/refresh + price-change logic, real policy/FAQ content, preserve+extend SEO (add JSON-LD), and keep the static map concept until a map provider is separately approved.

---

## Preview route

[`/dev/ui-hotel-detail`](../../../src/routes/dev/ui-hotel-detail/index.tsx) — run `npm run dev`, open the route (301-redirects to the trailing-slash form). `noindex, nofollow`; 404s on the production host. Renders the sample inside the **production** shell, plus the "Design states" appendix (loading skeleton + fallback). Use the header theme control to check Skyglass Luxe and Andacity Meridian in light + dark.

---

## User decision needed

1. **Direction:** approve / reject / modify the media-first, calm hotel detail concept.
2. **Gallery layout:** confirm the lead-+-2×2 grid with a "View all photos" lightbox (vs. a simpler single-hero), and the gradient-placeholder strategy until real photos are seeded.
3. **Rate rows:** confirm the per-room **multi-rate** pattern (Flexible / Saver) vs. the production page's current single-rate `RoomCard`.
4. **Decision-analysis block:** the production page has a heavy `DecisionSummarySection` ("Should you shortlist this stay?"). Confirm **replacing it** with the lighter distributed trust (header rating + rail card + policy clarity), or keep a slimmed version.
5. **JSON-LD:** approve adding `Hotel`/`BreadcrumbList`/`FAQPage` structured data in CLAUDE-UI-010 (the detail page emits none today).
6. **Headline/voice & sample property:** confirm the calm voice and the illustrative "Reefline Hotel" framing, or supply preferences.

---

## Verification results

- **`npm run build.types`** → exits non-zero with **one** error only: the **pre-existing** `TS2353` `ssl` in [src/lib/db/client.server.ts:91](../../../src/lib/db/client.server.ts#L91) — unrelated, **not fixed** (per instructions). New sample code adds **zero** type errors.
- **`npm run build`** (Vite client) → compiles cleanly: **962 modules transformed** (up from 938 at CLAUDE-UI-008).
- **ESLint** on the five new components + the route → **clean**.
- **Dev smoke (`npm run dev`):**
  - `/dev/ui-hotel-detail/` → `200` + `x-robots-tag: noindex, nofollow`; SSR contains the `<h1>` ("The Reefline Hotel"), exactly **one `<h1>`**, the gallery (`role="img"` "Photo N of 28" labels, "View all 28 photos"), rooms ("Choose your room", "Ocean View King", "Best value"), the honest map label, policies, related stays, the mobile "Select a room" CTA, the loading skeleton (`ui-skeleton` ×6) and fallback EmptyState, and **577** `var(--ui-*)` references, wrapped by the production header/footer.
  - `/`, `/hotels`, `/hotels/in/orlando`, `/hotels/in/new-york`, and a **real** hotel detail URL (`/hotels/miami-motel-02`) → all `200`, indexable, **unchanged** (the real detail page still renders the legacy `/hotels/[slug]/index.tsx`).
  - `/dev/ui-hotels/`, `/dev/ui-home/`, `/dev/ui-shell/`, `/dev/ui-palettes/` → `200` + `noindex` — unaffected.
- **Token purity:** the new sample files use **0** legacy `var(--color-*)` references (only `--ui-*`).
- **No dark patterns:** confirmed no "only N left", "booked X times", scarcity, or fake-guarantee copy in the sample source.
- **Net:** only blocker is the documented pre-existing DB SSL error; this task introduces no new regressions and replaced no production page.
