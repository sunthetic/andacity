# Home Page Sample

> **Task ID:** CLAUDE-UI-005
> **Status:** Sample / approval-gated design preview. **No production home page was replaced.**
> **Prerequisites:** CLAUDE-UI-000 → CLAUDE-UI-004 (palette, foundation, global shell) complete.
> **Preview:** [`/dev/ui-home`](../../../src/routes/dev/ui-home/index.tsx) — `noindex`, prod-gated. Renders the sample home body inside the **production** global shell; switch palette + light/dark from the header theme control.

---

## Purpose

Propose a captivating new **home page** for Andacity that makes the product feel premium, fast, emotionally compelling, and whole-trip-oriented — able to compete with Expedia, Google Flights, Trivago, Kayak, Booking.com, and Hopper.

The design thesis the page must communicate:

> **Andacity helps visitors move from inspiration to a whole-trip plan across flights, hotels, cars, and destinations with calm confidence.**

This is a **sample for approval**. The production `/` route ([src/routes/index.tsx](../../../src/routes/index.tsx)) is untouched until the user approves and CLAUDE-UI-006 implements it.

---

## Current home page observations

From re-inspecting [src/routes/index.tsx](../../../src/routes/index.tsx):

- **Composition:** a `HeroBackground` (raster/SVG via `imageUrl="/images/hero/home.svg"`, `overlay="strong"`) wrapping a centered headline ("Plan the whole trip in one place"), the `GlobalSearchEntry` card (`id="global-search-entry"`), CTA buttons, and a vertical chip row. Below: a `#verticals` grid (Flights/Hotels/Cars/Explore), a "Why Andacity" gradient panel, and a "Popular destinations" grid.
- **Tokens:** still on the **legacy `--color-*`** system (e.g. `--color-text-on-hero`, `--color-route-soft`, `t-btn-primary`, `t-card`). It has **not** been migrated to the new `--ui-*` system, so it does not benefit from the 6-palette × light/dark theme controls now in the shell.
- **Search flow:** `GlobalSearchEntry` ([src/components/search-entry/GlobalSearchEntry.tsx](../../../src/components/search-entry/GlobalSearchEntry.tsx)) is the canonical entry — tabbed Flights/Hotels/Cars, each projecting the real `FlightsSearchCard` / `HotelSearchCard` / `CarRentalSearchCard` with `submitBehavior="canonical-route"`. **Destinations is not a search tab today** (only a chip link to `/explore`).
- **`#global-search-entry` behavior:** the production shell's search affordances all link to `/#global-search-entry` (see [siteNav.ts](../../../src/components/site/siteNav.ts) `SEARCH_HREF`), i.e. "scroll to the home search card." There is no unified search overlay yet (deferred).
- **Data/model dependencies:** **none** — the route is fully static (no `routeLoader$`, no DB/server calls). Destination/route links are hardcoded to existing routes (`/destinations/miami`, `/hotels/in/new-york`, `/car-rentals/in/orlando`, etc.).
- **SEO/indexability:** a complete `DocumentHead` — title, description, canonical (`/`), Open Graph + Twitter card, OG image `/og/home.png`. Indexable (no robots restriction). This is the canonical landing page and a key indexable hub.
- **Discovery content:** a flat 4-city "Popular destinations" grid; competent but text-only (no imagery), no editorial inspiration, no popular-routes surface, no price-confidence surface.

**Implications:** the current home is functional and SEO-sound but reads "framework default" — legacy tokens, text-only discovery, no emotional/editorial pull, no price-clarity story, and a search module that doesn't yet anticipate destinations. All are addressed below, **without** touching production yet.

---

## Proposed home page direction

**Cinematic, calm, whole-trip.** A single photographic hero with a strong consumer headline and **one obvious search module** that anticipates all four verticals; then a fast descent through multi-vertical entry, destination discovery, popular routes, an honest price-clarity surface, "Why Andacity," and editorial inspiration, ending in a final CTA that hands off to the production footer.

Everything is built on the **`--ui-*` foundation** (CLAUDE-UI-002) and reuses CLAUDE-UI-002 primitives, so the page re-skins instantly across all 12 theme states and sits natively inside the CLAUDE-UI-004 shell.

Sample components (preview-only; the basis for CLAUDE-UI-006):

- [HomeSample.tsx](../../../src/components/dev/home/HomeSample.tsx) — full page composition (hero → CTA).
- [HomeSearchModule.tsx](../../../src/components/dev/home/HomeSearchModule.tsx) — the one obvious, multi-vertical search module.
- [homeSampleData.ts](../../../src/components/dev/home/homeSampleData.ts) — illustrative sample data (verticals, discovery, routes, value props, editorial).

Section order on the sample:

1. **Hero** — gradient/photographic background + headline + search module + quiet trust row.
2. **Start anywhere** — four first-class vertical entries (Flights, Hotels, Cars, Destinations).
3. **Where to next** — destination discovery (image-led `DestinationCard`s).
4. **Routes travelers are searching** — popular city-pair routes → fares.
5. **Price clarity** — honest, illustrative price-confidence surface.
6. **Why Andacity** — four verifiable value props.
7. **The Andacity edit** — editorial inspiration (feature + two).
8. **Ready when you are** — final CTA → production footer handoff.

---

## Hero concept

- **Photography-first, full-bleed.** A single cinematic destination still fills the hero; a guaranteed legibility scrim (`--ui-hero-scrim`) sits over it so white type always passes contrast. In the sample the palette's `--ui-hero` atmosphere gradient stands in (no remote image dependency) — see _Photography/image strategy_.
- **Strong consumer headline (Lexend):** **"Your whole trip, beautifully simple."** Eyebrow `Flights · Hotels · Cars · Destinations`; subhead frames the inspiration→itinerary promise.
- **Calm, not cluttered:** left-aligned editorial headline column, one obvious search module beneath, then a quiet three-item trust row (reused from the shell's `FOOTER_TRUST` so claims stay consistent and verifiable). No badges/urgency in the hero.
- **No false scarcity:** zero countdown timers or "1 left!" nudges anywhere on the page.

---

## Search module concept

The functional centerpiece — **one obvious search module** ([HomeSearchModule.tsx](../../../src/components/dev/home/HomeSearchModule.tsx)):

- **Four verticals, one surface:** segmented tabs for **Flights · Hotels · Cars · Destinations**. Each shows a tailored, calm set of fields (e.g. Flights: From / To / When / Travelers; Hotels: Where to / Dates / Guests; Cars: Pick-up / Dates / Driver age; Destinations: Vibe / When / Budget) plus one primary action and a row of "Popular" quick chips.
- **Preserves the canonical flow concept:** mirrors today's `GlobalSearchEntry` tab model and routes to the existing vertical hubs; in CLAUDE-UI-006 each tab projects the **real** search card (`FlightsSearchCard` / `HotelSearchCard` / `CarRentalSearchCard`) with `submitBehavior="canonical-route"` — no new search backend.
- **Adds Destinations** as a first-class, discovery-first tab (the home page's job is inspiration too), routing to `/explore`.
- **Simpler than OTA forms:** one row of fields, generous hit targets, no nested accordions, no developer/SEO copy.
- **`#global-search-entry` compatible:** the module carries `id="global-search-entry"`, so the shell's `/#global-search-entry` affordance still lands here.
- **Fields are presentational placeholders** in the sample (no invented availability/prices); values like "New York (JFK) → Lisbon (LIS)" are illustrative defaults.

---

## Destination discovery concept

- **"Where to next"** uses the image-led [`DestinationCard`](../../../src/components/ui/DestinationCard.tsx) primitive: full-bleed media, gradient legibility wash, optional tag chip ("Trending", "Editor's pick"), name + one-line meta.
- Four curated cards link to routes that **exist today** (`/destinations/miami`, `/destinations/san-diego`, `/hotels/in/new-york`, `/car-rentals/in/orlando`), with a "Browse all destinations" → `/destinations` action.
- This preserves the home's internal-linking equity to discovery/hub pages while making it emotionally compelling rather than text-only.

---

## Popular trips/routes concept

- **"Routes travelers are searching"** — a compact grid of trending **city-pair routes** (New York → Lisbon, Los Angeles → Tokyo, …) rendered as quiet `--ui-surface` cards with a `from → to` line and a "View fares" affordance.
- All route cards link to the **flights hub** (`/flights`), since concrete fare URLs need canonical params resolved server-side; CLAUDE-UI-006 can deep-link to canonical route searches once wired.
- Honest framing: it's "popular right now," not a fabricated deal/price claim.

---

## Trust and conversion concept

Two complementary surfaces, both honest:

- **Price clarity ("Clarity, not pressure"):** states the real promise — total price up front (taxes & fees included) and cancellation terms shown before booking — with calm `Badge`s. The accompanying price-range visual is **explicitly labeled "Illustrative"** with a "real prices come from a live search" disclaimer, so nothing reads as a live quote or guarantee.
- **"Why Andacity":** four **verifiable** value props (whole-trip planning; transparent total pricing; clear policies up front; save & compare — the last backed by the existing decisioning/save-compare system). No review counts, star ratings, partnership claims, or guarantees the product doesn't back today.
- **CTA hierarchy:** one primary action repeated at the natural decision points (hero search module → vertical entries → final "Start a search"), with secondary "Explore" paths for the undecided. The final CTA hands off to the production `SiteFooter`.

---

## Photography/image strategy

- **No remote image dependency is introduced.** The sample uses the palette's **`--ui-hero` atmosphere gradient + scrim** as a safe local stand-in for every photographic surface (hero, vertical-entry thumbnails, editorial media, destination cards without a set `imageUrl`). This guarantees the page looks intentional in all 12 theme states with zero asset work.
- **Existing local placeholders** (`/public/images/hero/*.svg`) remain available; `DestinationCard` / `HotelCard` already accept an `imageUrl` and fall back to `--ui-hero` when none is given.
- **Production plan (CLAUDE-UI-006+):**
  - Source a small set of **licensed, optimized** destination stills (hero + ~6 discovery + ~3 editorial), served **locally** from `/public/images/…` (or the project's image pipeline) as responsive `AVIF/WebP` with width descriptors and `loading`/`fetchpriority` set (hero eager, below-the-fold lazy).
  - Keep the scrim/overlay so headline contrast is image-independent.
  - The current CSP already allows `img-src 'self' data: https:`; prefer **self-hosted** assets to avoid third-party/privacy/perf cost. Any remote/CDN host would be a deliberate, separately-approved decision.
  - Provide descriptive `alt` text per image; decorative gradient layers stay `aria-hidden`.

---

## Responsive behavior

**Mobile-first.** Every section is a single column on small screens and expands by breakpoint.

| Section              | Mobile (<640)                                                           | Tablet (640–1024) | Desktop (≥1024)                               |
| -------------------- | ----------------------------------------------------------------------- | ----------------- | --------------------------------------------- |
| **Hero**             | Stacked headline → search module full-width → trust row                 | Same, wider type  | Left headline column, search module max-w-5xl |
| **Search module**    | Tabs scroll horizontally; fields stack (1–2 per row); full-width action | Fields wrap 2-up  | Fields in a row, action inline                |
| **Vertical entries** | 1 col                                                                   | 2 col             | 4 col                                         |
| **Discovery**        | 1 col                                                                   | 2 col             | 4 col                                         |
| **Popular routes**   | 1 col                                                                   | 2 col             | 3 col                                         |
| **Price clarity**    | Stacked (copy → visual)                                                 | Stacked           | 2 col side-by-side                            |
| **Why Andacity**     | 1 col                                                                   | 2 col             | 4 col                                         |
| **Editorial**        | 1 col                                                                   | feature + stacked | feature spans 2×2, two side cards             |

- Containers use the shared `max-w-6xl` rhythm (matching the shell); the hero and final CTA are full-bleed bands.
- The header is sticky and condenses on scroll (CLAUDE-UI-004); the sample body flows beneath it with no overlap.

---

## Accessibility notes

- **Landmarks & structure:** one `<h1>` (hero); sections use `<h2>`/`<h3>` in order. The search module is a proper `role="tablist"` → `role="tab"` (`aria-selected`, `aria-controls`) → `role="tabpanel"` (`aria-labelledby`).
- **Contrast:** all text-on-image uses the `--ui-hero-scrim` / gradient washes so white type holds AA across palettes; body surfaces use `--ui-text` / `--ui-text-muted` token pairs tuned per mode.
- **Focus:** every interactive element shows a visible `--ui-ring` focus ring (≥2px); hit targets are ≥44px on mobile.
- **Semantics over decoration:** decorative gradient/media layers are `aria-hidden`; the illustrative price bar is `aria-hidden` with the real meaning conveyed in adjacent text labels; field "inputs" carry descriptive `aria-label`s.
- **Motion:** only subtle `hover:-translate-y-px`; no autoplay/parallax. (Skeleton shimmer, if used in loading states, already respects `prefers-reduced-motion` via global CSS.)
- **Follow-up:** full keyboard **roving-tabindex** for the tab strip and a multi-theme contrast audit are folded into CLAUDE-UI-006 / the scheduled contrast pass (matches the current `GlobalSearchEntry` baseline today).

---

## SEO notes

- The sample is **presentational** and changes no routing, canonical/robots logic, JSON-LD, sitemaps, or `RouterHead` precedence.
- **Indexability of the sample:** the preview route is `noindex, nofollow` and **404s on the production host**, so it cannot leak into the index.
- **For the production rewrite (CLAUDE-UI-006):** preserve the existing home `DocumentHead` (title, description, **canonical `/`**, OG/Twitter, OG image), keep a single `<h1>`, and **retain internal links** to verticals, city guides, and destinations (the page's hub-linking equity). Real imagery should ship with descriptive `alt` text. No behavior here jeopardizes the current indexable home.

---

## Implementation boundary

**This task added (preview-only):**

- `src/components/dev/home/` — [HomeSample.tsx](../../../src/components/dev/home/HomeSample.tsx), [HomeSearchModule.tsx](../../../src/components/dev/home/HomeSearchModule.tsx), [homeSampleData.ts](../../../src/components/dev/home/homeSampleData.ts).
- `src/routes/dev/ui-home/index.tsx` — noindex, prod-gated preview.
- This doc.

**Reused (unchanged):** CLAUDE-UI-002 primitives (`DestinationCard`, `Badge`, `Button`, `ResponsiveSection`) and the production shell's `FOOTER_TRUST` copy.

**Not touched (await approval → CLAUDE-UI-006):**

- Production `/` route ([src/routes/index.tsx](../../../src/routes/index.tsx)), `HeroBackground`, and `GlobalSearchEntry`.
- The CLAUDE-UI-004 shell (`SiteHeader`/`SiteFooter`/`layout.tsx`) — preserved intact.
- The legacy `--color-*` system that still themes un-migrated pages.

**On approval, CLAUDE-UI-006 will:** rebuild `/` from this composition, migrate it to `--ui-*`, wire each search tab to the real canonical search cards (preserving `#global-search-entry`), drop in licensed local imagery, keep the existing `DocumentHead`/SEO, and retire the legacy-token home markup.

---

## Preview route

[`/dev/ui-home`](../../../src/routes/dev/ui-home/index.tsx) — run `npm run dev`, open the route (note: it 301-redirects to the trailing-slash form `/dev/ui-home/`). `noindex, nofollow`; 404s on the production host. It renders the sample home body **inside the production global shell** (so the real header/footer + theme control frame it). Use the header theme control to verify Skyglass Luxe and Andacity Meridian in light + dark.

---

## User decision needed

1. **Direction:** approve / reject / modify the cinematic, whole-trip, calm-confidence home concept.
2. **Search module:** confirm the **four-vertical** module (adding **Destinations** as a first-class tab) over today's three-tab Flights/Hotels/Cars, with each production tab projecting the existing canonical search card.
3. **Price clarity surface:** confirm the **honest, explicitly-illustrative** price-confidence treatment (no live quotes/deals) — or omit it.
4. **Editorial section:** confirm including **"The Andacity edit"** inspiration block, or defer editorial until real content exists.
5. **Imagery:** approve **self-hosted licensed stills** with gradient fallbacks for CLAUDE-UI-006 (vs. shipping with gradients only for now).
6. **Headline/voice:** confirm "Your whole trip, beautifully simple." or supply preferred copy.

---

## Verification results

- **`npm run build.types`** → exits non-zero with **one** error only: the **pre-existing** `TS2353` `ssl` in [src/lib/db/client.server.ts:91](../../../src/lib/db/client.server.ts#L91) — unrelated, **not fixed** here (per instructions). The new sample code adds **zero** type errors.
- **`npm run build`** → fails only on that same pre-existing type check, but the **client (Vite) bundle compiles cleanly: 895 modules transformed** (up from 871 at CLAUDE-UI-003), `✓ built in ~5.9s`. A JSX/Qwik error in any new file would fail the Vite transform, so the sample is valid and bundles cleanly.
- **Lint:** `eslint` on the three new components + the route → **clean** (no errors/warnings).
- **Dev smoke (`npm run dev`):**
  - `/dev/ui-home/` → `200` with `x-robots-tag: noindex, nofollow`; SSR contains the hero headline, the search tabs (`home-search-tab-flights`), `id="global-search-entry"`, all eight sections, and **379** `var(--ui-*)` references, wrapped by the production header (`aria-label="Primary"`) and footer.
  - `/` (production home) → `200`, **indexable** (no robots header) — untouched.
  - `/dev/ui-shell/` and `/dev/ui-palettes/` → `200` with `noindex, nofollow` — unaffected.
- **Token purity:** the new sample files use **0** legacy `var(--color-*)` references (only `--ui-*`), so the page themes across all 12 states.
- **Net:** the only blocker is the documented pre-existing DB SSL error; this task introduces no new regressions and replaced no production page.
