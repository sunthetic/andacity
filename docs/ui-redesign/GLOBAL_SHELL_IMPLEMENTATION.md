# Global Shell Implementation

> **Task ID:** CLAUDE-UI-004
> **Status:** Production implementation. **The production global shell (header, footer) has been replaced.** No production page content was rewritten.
> **Prerequisites:** CLAUDE-UI-000 → CLAUDE-UI-003 (approved shell sample) complete.

---

## Approved direction

Per the CLAUDE-UI-003 approval decisions, this task implements:

- The calm-editorial global shell direction.
- Sticky header that **condenses on scroll**.
- **Flat** top-level navigation (Flights, Hotels, Cars, Explore, Destinations) — the Hotels hover mega-dropdown is **removed**.
- A **persistent search pill** that links into the existing canonical search entry point (not a new overlay — see *Search affordance implementation* for the explicit risk call).
- The visitor-facing **ThemeController** in: desktop header actions, the mobile navigation sheet, and the footer.
- The **text wordmark** ("Anda**city**") as the brand treatment; the SVG logo refresh remains deferred to a later task (the existing asset is left on disk, untouched, for that future work).
- No production page content (Home, Hotels, Hotel detail, Flights, Cars, Explore, Destinations, global search) rewritten — shell/header/footer only.

---

## Production files changed

| File | Change |
|---|---|
| [src/components/site/SiteHeader.tsx](../../src/components/site/SiteHeader.tsx) | **Rewritten.** New sticky/condensing header, flat nav, search pill, ThemeController, mobile sheet. |
| [src/components/site/SiteFooter.tsx](../../src/components/site/SiteFooter.tsx) | **Rewritten.** Editorial footer: trust strip, brand + ThemeController, real link columns, legal bar. |
| [src/components/site/Brand.tsx](../../src/components/site/Brand.tsx) | **New.** Shared text-wordmark component used by header + footer. |
| [src/components/site/siteNav.ts](../../src/components/site/siteNav.ts) | **New.** Shared nav/footer-link/trust data — every href maps to a route that exists today. |
| [src/components/site/ThemeSwitcher.tsx](../../src/components/site/ThemeSwitcher.tsx) | **Deleted.** Superseded by `ThemeController`; confirmed it had no other importers and no test coverage before removal. |
| [src/routes/layout.tsx](../../src/routes/layout.tsx) | **Unchanged.** Already renders `<SiteHeader />` / `<SiteFooter />` with no props — the rewritten components are drop-in compatible. Security headers/CSP untouched. |
| [src/components/site/Page.tsx](../../src/components/site/Page.tsx) | **Unchanged** (beyond the CLAUDE-UI-002 typo fix). Per-page breadcrumb frame intentionally left on legacy `--color-*` — see *Deferred work*. |

No other production route or content component was touched.

---

## Header implementation

[SiteHeader.tsx](../../src/components/site/SiteHeader.tsx), promoted from the CLAUDE-UI-003 sample, built on `--ui-*`:

- **Sticky + condensing:** `position: sticky; top: 0`, height `64px → 56px` and a soft `--ui-shadow-card` once `window.scrollY > 8`.
- **Layout (desktop, ≥1024px):** `Brand · [Flights · Hotels · Cars · Explore · Destinations] ····· [Search pill] [Theme + My Trips]`.
- **No mega-dropdown:** the previous hover-only Hotels submenu is gone; all five verticals are flat, single-click links with visible focus rings.
- **Brand:** the shared `Brand` component (text wordmark, "city" in `--ui-primary`), replacing the `<img>` reference to the SVG logo asset (asset file itself is untouched on disk).

---

## Navigation implementation

- Primary nav data lives in one place — [siteNav.ts](../../src/components/site/siteNav.ts) `PRIMARY_NAV` — consumed by both the desktop nav and the mobile sheet, so the two can't drift out of sync.
- All five vertical links preserved exactly: `/flights`, `/hotels`, `/car-rentals`, `/explore`, `/destinations`.
- `My Trips` → `/my-trips` (verified against the existing My Trips dashboard route and its established product naming — confirmed via `MyTripsAccessFallback`, the `getMyTripsPageModel` title, and the `/travelers` page's own breadcrumb, all of which already say "My Trips").

---

## Mobile shell implementation

- **Header row:** hamburger (`md:hidden`) + Brand. The hamburger sets `aria-haspopup="dialog"` and `aria-expanded`.
- **Inline search row:** a full-width search trigger directly under the header on `<md` screens.
- **Sheet:** `role="dialog" aria-modal="true" aria-label="Menu"`, slides from the right, `w-[88vw] max-w-sm`, internally scrollable, contains (top to bottom): a prominent "Start a search" button, the five vertical links, a divider, **My Trips**, and a **Theme** row with the `ThemeController`.
- **Closing:** Escape key (`useOnDocument('keydown', ...)`), a full-screen scrim button, and an explicit close button — three independent ways to dismiss.
- **Focus management (new in this task, beyond the sample):** a `useVisibleTask$` moves focus to the sheet's close button on open and back to the hamburger trigger on close, skipping the very first render so page load never steals focus.
- **Tablet (768–1024px):** nav links visible, the search pill collapses to an icon-only button (`md:grid lg:hidden`), and the Theme+Trips cluster becomes visible together at `md:flex`.

### Fixed during implementation (not present at sample stage)

The CLAUDE-UI-003 sample rendered its header `ThemeController` with no responsive wrapper, so on a real mobile viewport it would have shown **both** in the cramped top bar *and* again inside the sheet. Production now wraps `ThemeController` + `My Trips` together in a single `hidden md:flex` cluster (mirroring the legacy header's one-breakpoint actions cluster), so **mobile sees exactly one theme control — inside the sheet.** Verified via SSR HTML inspection (see *Verification results*).

---

## Search affordance implementation

**Implemented as a styled link, not a new overlay** — an explicit, documented risk decision:

- Desktop (`≥1024px`): a pill — `🔍 Search flights, hotels, cars` — `href="/#global-search-entry"`, `aria-label="Search flights, hotels, and cars"`.
- Tablet (`768–1024px`): the pill collapses to an icon-only link, same href/label.
- Mobile (`<768px`): a full-width row under the header, plus a primary "Start a search" button at the top of the sheet — same href/label.
- This **reuses the exact href the legacy header already shipped** (`/#global-search-entry`, the `id` on `GlobalSearchEntry` at the bottom of the home hero), so behavior is proven and zero-risk: from any page it navigates home and the browser jumps to the existing tabbed Flights/Hotels/Cars search surface, which already submits through the canonical-route flow.
- **Why not a true in-page overlay:** mounting the existing `GlobalSearchEntry` (and its nested `FlightsSearchCard`/`HotelSearchCard`/`CarRentalSearchCard`) inside a header-level modal on every route was assessed as materially higher risk for this task — those cards do live location-autosuggest and date-field work, and duplicating that subtree globally introduces surface area (double data-fetch triggers, layout shift, focus-trap correctness) that wasn't worth the risk in a shell-only task. The link-based affordance satisfies every stated requirement (obvious, calm, desktop+mobile, routes into the canonical flow, accessible, no developer-facing copy) without it. **A true unified search overlay is recommended as a follow-up, scoped on its own.**

---

## Theme selector implementation

- `ThemeController` ([src/components/ui/theme/ThemeController.tsx](../../src/components/ui/theme/ThemeController.tsx), built in CLAUDE-UI-002) is now live in **three** places: header (desktop/tablet cluster), mobile sheet, and footer (next to the brand block) — exactly the three locations specified.
- Order and defaults are unchanged from the foundation: **Skyglass Luxe first/default**, **Andacity Meridian second**, then Sandbar, Sunset, Alpine, Midnight; **Light/Dark/Auto** for every palette; persisted via `localStorage`; FOUC-safe pre-paint script (already wired in `root.tsx` since CLAUDE-UI-002, unchanged here).
- Verified live: SSR output shows the trigger rendering `aria-label="Theme: Skyglass Luxe, Auto. Change theme"` on first load — confirming the correct default.
- The legacy 5-swatch `ThemeSwitcher` (B1–B5) is removed from the shell and deleted from the codebase.

---

## Footer implementation

[SiteFooter.tsx](../../src/components/site/SiteFooter.tsx):

- **Trust strip** (top): three verifiable, non-overclaiming statements — *"Transparent total pricing," "Clear cancellation and fee policies," "Flights, hotels, and cars in one place"* — chosen because they describe behavior the product actually implements (total-price-forward display patterns, per-item `cancellationSummary`/`policySummary`, multi-vertical planning), not unverifiable guarantees, review counts, or partnership claims.
- **Brand block:** `Brand` + value-prop copy + a `ThemeController`.
- **Three link groups**, all real routes (no placeholder pages): **Book** (Flights, Hotels, Car rentals, My Trips), **Discover** (Explore, Destinations, Hotel city guides, Rental cities), **Plan** (Start a search, Current trip, Saved Travelers, Sitemap). Desktop renders a 3-column grid; mobile collapses each group into a `<details>` accordion.
- **Legal/bottom bar:** the existing copyright + commission-disclosure line is **preserved verbatim** ("Prices and availability can change. We may earn commission from select partners.") plus Sitemap / Hotel cities / My Trips links. **No Privacy/Terms/Accessibility links were added** — those pages don't exist in the app, and linking to them would have created broken/missing-page links purely for cosmetic completeness.

---

## SEO preservation notes

Nothing in this task touches routing, canonical generation, robots policy, or structured data:

- `getCanonicalHref` / `shouldIndex` / `RouterHead` precedence — **untouched**.
- Verified live on `/hotels/`: `<link rel="canonical" href="https://andacity.com/hotels/">` and `<meta name="robots" content="index,follow,...">` render exactly as before.
- `/sitemap.xml` and `/robots.txt` serve unchanged (`200`, `Disallow: /search/` intact).
- Footer **internal-linking equity is preserved** — vertical, discovery, and city-guide hub links remain crawlable in the footer (now organized into Book/Discover/Plan rather than the old four columns, but covering the same real destinations).
- The new header/footer are pure presentation; they emit no meta/robots/canonical tags of their own.

---

## Accessibility notes

- **Semantics:** `<header>`, `<nav aria-label="Primary">` (desktop) / `aria-label="Primary mobile"` (sheet), `<footer aria-label="Site footer">`, per-column `<nav aria-label="{title}">` in the footer.
- **Mobile sheet:** `role="dialog" aria-modal="true" aria-label="Menu"`; hamburger trigger exposes `aria-haspopup="dialog"` + `aria-expanded`; **focus moves into the sheet on open and returns to the trigger on close** (new in this task); closes via Escape, scrim click, or an explicit labeled close button.
- **Theme controls:** unchanged from CLAUDE-UI-002 — labeled `radiogroup`s with `aria-checked`, trigger button has a full descriptive `aria-label` (e.g. *"Theme: Skyglass Luxe, Auto. Change theme"*).
- **Focus visibility:** every interactive element in the new shell carries `focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]`.
- **Search affordance:** real anchors with explicit `aria-label="Search flights, hotels, and cars"` on every breakpoint variant (pill, icon, mobile row, sheet button) — a screen reader hears the same intent regardless of viewport.
- **Reduced motion:** the shell introduces no new animation beyond CSS `transition` on height/shadow/hover, which is already how the rest of the site handles micro-interactions; nothing here requires a `prefers-reduced-motion` branch (the only motion-sensitive primitive, the skeleton shimmer, was already gated in CLAUDE-UI-002 and is untouched).
- **Known gap:** background content (`<main>`) is not `inert`/`aria-hidden` while the mobile sheet is open. Fixing this would require lifting open-state to the root layout (`SiteHeader` doesn't have a reference to the `<main>` slot it doesn't render) — flagged under *Deferred work* rather than done speculatively in a shell-only task.

---

## Responsive notes

| Breakpoint | Header | Search | Nav | Theme + Trips |
|---|---|---|---|---|
| **Mobile (<768)** | Brand + hamburger; full-width search row beneath | Inline row + "Start a search" in sheet | Sheet only | Sheet only (single instance) |
| **Tablet (768–1024)** | Brand + flat nav | Pill collapses to icon | Flat links visible | Visible together (`md:flex`) |
| **Desktop (≥1024)** | Full bar, condenses on scroll | Full pill | Flat links | Visible together |

- Footer: 3-column grid `sm+`, `<details>` accordion below `sm`.
- No horizontal overflow introduced — all new elements respect the existing `max-w-6xl` container; verified by visual smoke at mobile/tablet/desktop widths via the dev server.

---

## Deferred work

1. **Unified search overlay.** Today the search affordance is a real, working link into the existing home search surface — not a new in-place overlay. A true overlay (mounting `GlobalSearchEntry` without navigation) is recommended as a focused follow-up task.
2. **Background inerting while the mobile sheet is open.** Would require lifting sheet state into `routes/layout.tsx` to mark `<main>` `inert`/`aria-hidden`; not done here to avoid expanding the change surface beyond header/footer.
3. **Page content still on legacy `--color-*` tokens.** Selecting a non-default palette in the `ThemeController` now visibly re-skins the **shell** (header, footer) immediately, but page content (Home, Hotels, Flights, Cars, Explore, Destinations, etc.) will not change color yet — those pages still render via the legacy `--color-*` system, previously driven by the now-deleted `ThemeSwitcher`. This is the expected, intentional state of an additive, page-by-page migration: full visual consistency arrives as each page is migrated in CLAUDE-UI-005 onward. Existing visitors with a previously-stored legacy `andacity-theme` value are unaffected (that value still applies via its own untouched pre-paint script); there is simply no UI to change it anymore now that page content hasn't migrated.
4. **`Page.tsx` breadcrumb frame** intentionally left on `--color-*` — migrating it would touch every page that renders it, which oversteps this task's "shell only" boundary.
5. **Logo refresh** — explicitly deferred per the approved decision; the SVG asset remains on disk, unreferenced, for that future task.

---

## Verification results

- **`npm run build.types`** → exits non-zero with **exactly one** error: the **pre-existing** `TS2353` `ssl` in [src/lib/db/client.server.ts](../../src/lib/db/client.server.ts#L91). Unrelated to this task and **not fixed** (per instructions). The new/changed shell files type-check cleanly.
- **`npm run build`** → exits `1` from that same pre-existing error, but the **client (Vite) bundle compiles successfully**: **878 modules transformed**, assets/chunks emitted normally. A JSX/Qwik error anywhere in the rewritten header/footer would have failed this step.
- **Dev-server route smoke** (`npm run dev`), all `200`: `/`, `/hotels`, `/flights`, `/car-rentals`, `/explore`, `/destinations`, `/dev/ui-shell`, `/dev/ui-palettes`, `/trips`, `/my-trips`, `/travelers`, `/sitemap.xml`.
- **Rendered-content checks** on `/hotels/` and `/`:
  - Brand wordmark, all five primary nav hrefs, and the search-pill href (`/#global-search-entry`) present.
  - `ThemeController` renders with `aria-label="Theme: Skyglass Luxe, Auto. Change theme"` — confirms the correct default (Skyglass Luxe, Auto) on first load.
  - Legacy `ThemeSwitcher` markup (e.g. `"Sky Blue theme"`) confirmed **absent** site-wide.
  - `<link rel="canonical">` and `<meta name="robots">` confirmed unchanged/correct.
  - Footer renders the preserved commission-disclosure sentence verbatim; confirmed **no** `/privacy`, `/terms`, or `/accessibility` links were introduced.
  - After the mobile/tablet `ThemeController` fix, confirmed via raw SSR HTML that the header's Theme+Trips cluster is wrapped in `hidden items-center gap-2 md:flex`.
- **Net:** the only blocker is the documented pre-existing DB SSL type error; this task introduces no new type/build/lint regressions. The legacy shell components (`ThemeSwitcher.tsx`) were removed only after confirming zero remaining importers and zero test coverage.
