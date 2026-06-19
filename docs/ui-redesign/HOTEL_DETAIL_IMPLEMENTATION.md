# Hotel Detail Page Implementation

## Approved direction

Gallery-first, media-rich layout with distributed trust. No heavy centralized decision block. Desktop booking rail, sticky mobile CTA, real room/rate cards mapped from production data, amenity grid, location section with CSS-only map concept, policies section with trust badges. Built on `--ui-*` theme tokens. Approved from CLAUDE-UI-009.

---

## Production files changed

**New:**
- `src/components/hotels/HotelGallery.tsx` — Production gallery with real image support and `--ui-hero` gradient fallbacks

**Updated:**
- `src/routes/hotels/[slug]/index.tsx` — Full visual redesign of the hotel detail page using `--ui-*` tokens and CLAUDE-UI-009 direction

**Preserved (no changes):**
- All loader logic, route params, analytics, decisioning, pricing, availability refresh
- `src/components/dev/hotel-detail/` — sample files unchanged, remain as historical reference
- CLAUDE-UI-004 global shell
- CLAUDE-UI-006 home page
- CLAUDE-UI-008 hotels landing page

---

## Data mapping notes

| UI element | Data source | Notes |
|---|---|---|
| Stars | `h.stars` | Rendered as `★` repeat |
| Rating badge | `h.rating` | Formatted with `toFixed(1)` |
| Review label | `resolveReviewLabel(h.rating)` | Derived label (Superb, Excellent, etc.) |
| Address | `h.addressLine` | Shown verbatim |
| Neighborhood/city badge | `h.neighborhood`, `h.city` | Combined pill |
| Policy highlights | `h.policies.freeCancellation`, `.payLater`, `.noResortFees` | Distributed trust row |
| Gallery | `h.images[]` | Real images when present; `--ui-hero` gradient tiles for gaps |
| Overview | `h.summary` | Verbatim paragraph |
| Rooms | `h.rooms[]` | One rate row per room (flat structure) |
| Amenities | `h.amenities[]` | Flat 2-col grid with ✓ marks |
| Location | `h.addressLine`, `.neighborhood`, `.city`, `.region`, `.country` | No fake nearby data |
| Policies | `h.policies.cancellationBlurb`, `.paymentBlurb`, `.feesBlurb`, `.checkInTime`, `.checkOutTime` | 4-panel grid |
| FAQ | `h.faq[]` | Rendered if array is non-empty |
| Price | `stayPriceDisplay` (from `buildHotelPriceDisplay`) | Real; no fake live rates |
| Availability | `h.availabilityConfidence`, `h.freshness` | Real signals |

---

## Hero/gallery implementation

**File:** `src/components/hotels/HotelGallery.tsx`

- Lead tile: real `<img>` when `images[0]` exists; `--ui-hero` gradient tile otherwise
- Desktop: lead (1.7fr) + 2×2 thumbnail grid; last thumbnail overlaid with "View all N photos" button when `total > 5`
- Mobile: lead tile + horizontal strip of gradient or real thumbnail tiles; "All N photos" button
- Loading: lead image uses `loading="eager"`; thumbnails use `loading="lazy"`
- Alt text: lead uses `hotelName`; thumbnails use `"${hotelName} photo ${n}"`
- Placeholder tiles use `role="img"` with descriptive `aria-label`
- Full lightbox deferred (see Deferred work)

---

## Summary and booking rail implementation

The previous `DecisionSummarySection` ("Should you shortlist this stay?") has been removed and replaced with distributed trust:
- Policy highlights row (✓ Free cancellation available / Pay later options / No resort fees / Transparent totals)
- These are derived from real `h.policies.*` fields

**Desktop booking rail:**
- Price display from real `stayPriceDisplay` (using `buildHotelPriceDisplay`)
- Stay total shown when dates are set
- Date/guest GET form using real `DateField` primitive (unchanged from previous implementation)
- "Update dates" submit button
- "Select a room" primary CTA → `#rooms`
- Save/Compare/Add to trip decisioning buttons (real, unchanged)
- Availability confidence + refresh control (real, unchanged)
- Price refresh banner when delta detected (real, unchanged)
- Calm confidence note (no urgency)
- Trust mini-card with "Compare more hotels in [city]" → searchHref

---

## Room/rate card implementation

Production `Room` type has a flat structure (one `priceFrom`, `refundable`, `payLater` booleans, `badges[]`, `features[]`) — not the multi-rate model in the CLAUDE-UI-009 sample.

Adaptation:
- Room media: `--ui-hero` gradient placeholder (no room-level images in production data; deferred)
- Room name, sleeps, beds, sizeSqft
- Feature badges (pill-style)
- Single rate row: cancellation term from `refundable`, payment term from `payLater`, `priceFrom` formatted via `buildHotelPriceDisplay`, stay total when nights set
- "Select" CTA → `#booking`
- Fallback empty state when `h.rooms.length === 0`: message + "Set dates to check availability →" link

---

## Amenities implementation

- Flat 2-column grid of `h.amenities[]`
- Each row: ✓ checkmark + amenity name
- No fake categories (production data is a flat string array)
- Deferred: category-grouping when semantic amenity schema is available

---

## Location/context implementation

Two-panel layout:
- CSS-only map concept (grid lines, hotel name pin, "Map layout · concept" badge) — labeled `role="img"` with honest `aria-label`
- Location context card: neighborhood, city, region, country from real data; link to city search (`/hotels/in/[citySlug]`)
- No geocoded maps, no tile libraries, no API keys
- No fake "What's nearby" distances (production data has no `nearby` field)

---

## Policy and trust implementation

4-panel grid:
- Cancellation — `h.policies.cancellationBlurb`
- Payment — `h.policies.paymentBlurb`
- Taxes & fees — `h.policies.feesBlurb`
- Check-in / out — `h.policies.checkInTime` + `h.policies.checkOutTime`

Trust badges below panels:
- "Total price shown up front"
- "No countdown timers"
- "No '1 room left!' pressure"

---

## Related stays implementation

**Omitted.** No production query for related/nearby hotels exists. A city search link (`/hotels/in/[citySlug]`) is surfaced in:
- The booking rail trust card ("Compare more hotels in [city]")
- The location section ("Browse all hotels in [city]")

A full related stays section can be added if a `loadRelatedHotelsByCity` query is implemented.

---

## Mobile sticky CTA implementation

- Fixed to `bottom-0`, `z-40`, hidden on `lg:` breakpoint
- Renders real `stayPriceDisplay.baseLabel` + `baseAmount` + `baseQualifier`
- Party label (adults · rooms)
- "Select a room" → `#rooms`
- `min-height:44px` on the CTA button (accessible tap target)
- `h-20 lg:hidden` spacer below content prevents sticky bar from covering last section
- Does not trap focus; no modal behavior

---

## Loading/fallback states

- **Hotel not found / load error:** `AsyncStateNotice` + `AsyncRetryControl` within a `--ui-*` styled card; breadcrumbs still render
- **No rooms:** polished empty state with "Set dates to check availability" link
- **No images:** all gallery tiles render as `--ui-hero` gradient placeholders; no broken `<img>`
- **Availability degraded:** `AsyncStateNotice` banner at top of page (pre-existing behavior, unchanged)
- **Refreshing:** `InventoryRefreshControl` (unchanged)

---

## Photography/image strategy

- Real images from `h.images[]` are used when present (external URLs from DB seed)
- Gallery tiles defensively render gradient placeholders when:
  - No images exist (`images.length === 0`)
  - Fewer than 5 images (remaining slots use gradient tiles with hue rotation for visual variety)
- Room-level images are not in the production data model — room cards use `--ui-hero` gradient placeholder (deferred until room image fields are added)
- No remote image dependencies added beyond what already exists in the data

---

## SEO and structured data notes

- **Title:** `${hotel.name} | Andacity Travel` (unchanged)
- **Description:** `Browse ${hotel.name}. Compare totals and policies with clarity.` (unchanged)
- **robots:** `index,follow,max-image-preview:large` (unchanged, no noindex leak)
- **Canonical:** `/hotels/${slug}` (unchanged)
- **OG:** hotel name, description, OG image route (unchanged)
- **H1:** Single `<h1>` — hotel name in `TitleHeader` ✓
- **Breadcrumbs:** Home → Hotels → City → Hotel name, crawlable `<nav>` with `<ol>` (from `Page` + `Breadcrumbs`)
- **Structured data:** No new JSON-LD added. The `Hotel` JSON-LD was not present before and was not added in this task (production hotel schema fields map cleanly but this was deferred per approved direction). `BreadcrumbList` JSON-LD deferred similarly.
- **Internal links:** City search link, home link, and hotel policy anchor links all crawlable
- **FAQ:** Rendered as plain HTML `<dl>`-adjacent elements when present — not marked up as `FAQPage` JSON-LD (no new JSON-LD was added)

---

## Accessibility notes

- **H1:** Single `<h1>` — hotel name ✓
- **Gallery:** `<section aria-label="${hotelName} photo gallery">`; real images have `alt` text; gradient placeholders use `role="img"` with descriptive `aria-label`; "View all N photos" button has `aria-label`
- **Booking actions:** Save/Compare/Add to trip buttons have existing accessible labels ✓
- **Sticky mobile CTA:** "Select a room" with `min-height:44px`; does not trap focus ✓
- **Focus states:** `focus-visible:ring-2` on all interactive elements using `--ui-ring` ✓
- **Map concept:** `role="img"` with explicit honest label; decorative elements `aria-hidden` ✓
- **Rating badge:** `aria-label="${stars} star"` on star row ✓
- **Location `<dl>`:** Proper `<dt>`/`<dd>` markup for location facts ✓
- **Color contrast:** `--ui-*` tokens target WCAG AA across all 6 palettes (same foundation as CLAUDE-UI-004–008)
- **Mobile tap targets:** Sticky CTA `min-height:44px`, room Select buttons `min-height:36px` ✓
- **No horizontal overflow:** Content uses `min-w-0` and `max-w-[68ch]` constraints ✓

---

## Responsive notes

- Mobile-first layout; two-column grid activates at `lg:` (1024px)
- Gallery: single-column lead + strip on mobile; lead + 2×2 grid on desktop
- Room cards: stacked on mobile; image-left + content-right on `sm:`
- Booking rail: in document flow on mobile (above rooms on md-); sticky at `lg:top-[var(--sticky-top-offset)]` on desktop
- Mobile sticky CTA: `lg:hidden` — not shown when the desktop booking rail is visible
- Compare tray: `bottom-20 lg:bottom-3` to clear mobile sticky CTA

---

## Sample/preview cleanup

- `src/components/dev/hotel-detail/` files are **unchanged** — kept as historical reference for the CLAUDE-UI-009 direction
- Production does not import from `src/components/dev/`
- The new `src/components/hotels/HotelGallery.tsx` supersedes the dev-only `HotelGallery.tsx` from the sample for production use
- Dev sample at `/dev/ui-hotel-detail` remains functional and renders the Reefline fictional property

---

## Deferred work

| Item | Reason deferred |
|---|---|
| Gallery lightbox (full-screen photo viewer) | Interaction complexity; production gallery provides a "View all N photos" button stub |
| Room-level photography | No room image fields in the current `Room` data model |
| `Hotel` JSON-LD structured data | Data fields exist but schema wiring deferred; no regressions introduced |
| `BreadcrumbList` JSON-LD | Deferred alongside Hotel schema |
| Amenity grouping / categorization | Production `amenities[]` is a flat string array; semantic categorization requires a schema change |
| Related stays section | No production query for related/nearby hotels |
| Nearby points / distances in location section | No `nearby` field in production `Hotel` type |

---

## Verification results

**TypeScript (`npm run build.types`):**
- One pre-existing error: `src/lib/db/client.server.ts(91,5)` — `ssl` property type error in DB client (pre-existing, unrelated to this task)
- Zero new type errors from CLAUDE-UI-010 changes ✓

**Production build (`npm run build`):**
- Build succeeds: `✓ built in 4.83s` ✓

**Dev smoke check (`npm run dev`):**
- `/` — Home page loads ✓
- `/hotels` — Hotels landing page loads ✓
- `/hotels/in/miami` — City page loads ✓
- `/hotels/miami-motel-02` — Hotel detail page loads with new design ✓
  - All key sections present: Overview, Choose your room, Amenities, Where you'll be, Policies, Common questions, Select a room, Why Andacity
  - `--ui-*` tokens in use throughout
  - `--ui-hero` gallery tiles rendered (production data for this slug has no images)
  - No DecisionSummarySection rendered (removed per approved direction)
- `/dev/ui-hotel-detail` — CLAUDE-UI-009 Reefline sample still renders ✓

**Regression check:**
- Global shell (CLAUDE-UI-004): ✓ unchanged
- Home page (CLAUDE-UI-006): ✓ unchanged
- Hotels landing (CLAUDE-UI-008): ✓ unchanged
- Theme switching, mobile nav, footer: ✓ unaffected
