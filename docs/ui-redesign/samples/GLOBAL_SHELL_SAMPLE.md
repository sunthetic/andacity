# Global Shell Sample

> **Task ID:** CLAUDE-UI-003
> **Status:** Sample / approval-gated design preview. **No production shell was replaced.**
> **Prerequisites:** CLAUDE-UI-000 → CLAUDE-UI-002 (foundation) complete.
> **Preview:** [`/dev/ui-shell`](../../../src/routes/dev/ui-shell/index.tsx) — `noindex`, prod-gated. Live, theme-switchable sample header + body + footer, plus mobile phone frames.

---

## Purpose

Propose a premium, fast, trustworthy global shell for Andacity — header, navigation, mobile nav, search affordance, theme control placement, footer, and page-frame behavior — that can compete visually and experientially with Expedia, Google Flights, Trivago, Kayak, Booking.com, and Hopper. This is a **sample for approval**; the production `SiteHeader`/`SiteFooter`/root layout are untouched until the user approves and CLAUDE-UI-004 implements it.

---

## Current shell observations

From the audit (CLAUDE-UI-000) and re-inspection:

- **Header** ([src/components/site/SiteHeader.tsx](../../../src/components/site/SiteHeader.tsx)): sticky glass header, a **Hotels hover mega-dropdown** (hover-only; works via `focus-within` but has no explicit toggle), primary nav (Hotels, Flights, Cars, Trips, Explore, Destinations), the legacy 5-swatch **ThemeSwitcher**, "My Trips", and a "Search" button that just deep-links to the home anchor `/#global-search-entry` — i.e. **no real search affordance on inner pages**.
- **Footer** ([src/components/site/SiteFooter.tsx](../../../src/components/site/SiteFooter.tsx)): four link columns + trust/disclosure strip, but renders a **placeholder logo** (a "swap this for your actual logo" inline SVG) and **placeholder social links** (`x.com/`, `github.com/`).
- **Root layout** ([src/routes/layout.tsx](../../../src/routes/layout.tsx)): security headers + CSP, `SiteHeader`, `<main>`, `SiteFooter`, decisioning chrome (undo snackbar).
- **Page frame** ([src/components/site/Page.tsx](../../../src/components/site/Page.tsx)): breadcrumb band + `max-w-6xl` container. (The `borde3r-b` typo was fixed in CLAUDE-UI-002.)
- **Mobile**: a `<details>` hamburger menu; functional but with modest ergonomics and a duplicated nav structure.
- **Theme**: legacy `data-theme` B1–B5 (OS-only dark). The new `--ui-*` system (6 palettes × light/dark) + `ThemeController` now exists but is not yet in the shell.

**Implications:** the shell is competent but reads "framework default"; the search entry is weak on inner pages; brand treatment is inconsistent; the theme control is a debug-feeling swatch row. All are addressed below.

---

## Proposed shell direction

**Calm, editorial, fast.** A single quiet surface bar (not glassy gradient clutter), confident wordmark, immediate vertical access, one obvious **persistent search affordance**, a **product-native theme control**, and a Trips/account entry — with a light, credible trust strip living in the footer (not the header). Depth comes from a subtle on-scroll shadow, not borders or fills. Everything is driven by `--ui-*`, so the shell re-skins instantly across all 12 theme states.

Sample components (preview-only, reusable as the basis for CLAUDE-UI-004):
- [SampleHeader.tsx](../../../src/components/dev/shell/SampleHeader.tsx) (+ exported `Brand`)
- [SampleFooter.tsx](../../../src/components/dev/shell/SampleFooter.tsx)
- [SampleMobileShell.tsx](../../../src/components/dev/shell/SampleMobileShell.tsx)
- [nav.ts](../../../src/components/dev/shell/nav.ts) (shared nav + trust data)

---

## Header concept

- **Sticky + adaptive:** pinned to the top; **condenses on scroll** (16→14 height, gains a soft `--ui-shadow-card`) for a premium, focused feel.
- **Layout (desktop):** `[Brand]  [Flights · Hotels · Cars · Explore · Destinations]  ·····  [Search pill] [Theme] [Trips]`.
- **Brand:** a clean **Andacity** wordmark (Lexend), with "city" in `--ui-primary` so it stays on-palette in every theme. (Logo lockup decision deferred — see *Light/dark behavior* and Implementation boundary.)
- **No mega-dropdown:** the hover-only Hotels mega-menu is dropped in favor of flat, fast, top-level links. (City-guide discovery moves into page content + footer, where it serves SEO without fragile hover UI.)
- **One quiet trust cue max** in the bar; the real trust strip lives in the footer to avoid OTA-style clutter.

---

## Navigation concept

- **Primary verticals are first-class and flat:** Flights, Hotels, Cars, Explore, Destinations — direct links, no nested menus, large enough hit targets, `--ui-text-secondary` resting / full-contrast on hover/focus.
- **Account/Trips** as a distinct pill with a small avatar token (`A`), separated from verticals.
- Rationale: speed and predictability beat cleverness; metasearch users expect to reach a vertical in one click.

---

## Mobile navigation concept

- **Header row:** hamburger + brand + theme control; a **full-width search trigger** sits directly beneath (thumb-friendly, always visible).
- **Menu sheet:** slides from the right, full-height, scrollable; contents top-to-bottom: a prominent **"Start a search"** primary button, large vertical links, divider, **My trips**, a **Theme** row (palette + light/dark), and a quiet **trust list** pinned to the bottom.
- **Ergonomics:** 44px+ targets, large type, Escape-to-close, tap-scrim-to-close, clear close affordance.
- Preview shows both **collapsed** and **menu-open** states in phone frames (the sheet is rendered within the frame so it stays inside the device outline).

---

## Search affordance concept

The biggest functional upgrade. Search becomes a **persistent, product-native entry point**, not a scroll-to-home anchor:

- **Desktop (≥lg):** a pill — `🔍 Search flights, hotels, cars` — in the header actions cluster. (Implementation in CLAUDE-UI-004 opens a unified search overlay/route reusing the existing canonical-route submit flow.)
- **Tablet (md–lg):** the pill collapses to a single search **icon button** to save width.
- **Mobile:** a full-width search bar under the brand row, plus a prominent **"Start a search"** button at the top of the menu sheet.

---

## Theme selector placement

- **Desktop:** the polished `ThemeController` ([ui/theme/ThemeController.tsx](../../../src/components/ui/theme/ThemeController.tsx)) lives in the header actions cluster, right-aligned popover.
- **Mobile:** inside the menu sheet, on a dedicated **Theme** row.
- **Footer:** a secondary placement next to the brand block, for users who reach the bottom.
- It presents **Skyglass Luxe first, Andacity Meridian second**, then Sandbar, Sunset, Alpine, Midnight — with swatch pairs, names, and a Light/Dark/Auto segment. It is intentionally **product-native** (named palettes, tasteful popover), not a debug swatch strip.

---

## Light/dark behavior

- Every palette supports **Light / Dark / Auto** via `data-mode`; "Auto" follows the OS and live-updates. The control sets `data-palette` + `data-mode` on `<html>`, persisted across reloads, applied FOUC-safe before paint (foundation from CLAUDE-UI-002).
- The shell uses only `--ui-*` tokens, so header/nav/footer adapt automatically across all 12 states (verified live in the preview).
- **Logo note:** the text wordmark is palette-safe in all modes. The raster/SVG logo lockup (and a possible refresh for cool/dark palettes) is **out of scope here** and deferred to CLAUDE-UI-011; the shell is built so a final lockup can drop into the `Brand` slot without structural change.

---

## Footer concept

- **Editorial and calm:** a quiet trust strip across the top (Total price, no hidden fees · Free cancellation on most stays · 24/7 support), then a brand block (real wordmark + value prop + a theme control) beside three link columns (**Book / Discover / Company**), then a bottom bar (copyright + Privacy/Terms/Sitemap/Accessibility).
- **Real brand, real links:** replaces the production placeholder logo and the placeholder social links.
- **Collapse behavior:** columns are a 3-up grid on `sm+` and **accordions (`<details>`) on mobile** to keep the footer short and scannable.

---

## Breadcrumb/page-frame concept

- **Page frame:** content lives in a `max-w-6xl` container on `--ui-bg`; surfaces use `--ui-surface` with `--ui-shadow-card` depth (no gradient fills).
- **Breadcrumbs:** a thin, optional band directly under the header on inner/detail/SEO pages (kept for `BreadcrumbList` JSON-LD value), using `--ui-text-muted` with the current page in `--ui-text`. Landing/hero pages omit it. (This formalizes the existing `Page` breadcrumb band on the new tokens during CLAUDE-UI-004.)
- **Sticky offset:** the production header height token (`--app-header-height`) should drive any sticky offsets so they never drift when the header condenses.

---

## Responsive behavior

| Breakpoint | Header | Search | Nav | Theme |
|---|---|---|---|---|
| **Mobile (<768)** | Brand + hamburger + theme; full-width search row beneath | Full-width trigger + "Start a search" in sheet | Right slide-over sheet | In sheet (Theme row) |
| **Tablet (768–1024)** | Brand + flat nav + actions | Pill collapses to **icon button** | Flat links persist | Header popover |
| **Desktop (≥1024)** | Full bar, condenses on scroll | Full **search pill** | Flat links | Header popover |

- **Footer:** 3-column grid on `sm+`, **accordion** below `sm`.
- **Sticky:** header sticky + condense-on-scroll on all sizes; mobile sheet is full-height and scrollable.
- The preview renders the live shell (resize to see tablet/desktop) plus dedicated phone frames for the mobile states.

---

## Accessibility notes

- Landmarks: `<header>`, `<nav aria-label>`, `<footer aria-label>`; menu sheet is `role="dialog" aria-label`.
- All interactive elements show a visible focus ring (`--ui-ring`, ≥2px) that holds contrast across themes; hit targets ≥44px on mobile.
- Hamburger exposes `aria-expanded`; menu closes on **Escape** and scrim click; explicit close button.
- The theme control is a labeled `radiogroup` (palette) + `radiogroup` (mode) with `aria-checked` (from CLAUDE-UI-002).
- No hover-only navigation (the fragile mega-dropdown is removed); decorative icons are `aria-hidden`.
- Color choices target WCAG AA; a full multi-theme contrast pass is scheduled for CLAUDE-UI-011.

---

## SEO notes

- The shell is **presentational**; it does not alter routing, canonical/robots logic, JSON-LD, or sitemaps. CLAUDE-UI-004 must keep the existing `RouterHead` precedence and the indexable/noindex split intact.
- **Footer link columns preserve internal-linking equity** (verticals, city guides, destinations) that the current footer provides — important for the indexable hub strategy.
- **Breadcrumbs are retained** on inner pages to keep `BreadcrumbList` structured data.
- The preview route itself is `noindex, nofollow` and 404s on the production host, so it cannot leak into the index.

---

## Implementation boundary

**This task added (preview-only):**
- `src/components/dev/shell/` — `SampleHeader.tsx`, `SampleFooter.tsx`, `SampleMobileShell.tsx`, `nav.ts`.
- `src/routes/dev/ui-shell/index.tsx` — noindex, prod-gated preview.
- This doc.

**Not touched (await approval → CLAUDE-UI-004):**
- Production `SiteHeader`, `SiteFooter`, `routes/layout.tsx`, `Page.tsx`, and the legacy `ThemeSwitcher`.
- No production page consumes the sample shell.
- The legacy `--color-*` theming remains the production default until the shell is implemented.

**On approval, CLAUDE-UI-004 will:** promote these samples to `src/components/site/` (or a shell module), wire the unified search affordance to the canonical-route flow, replace the legacy header/footer + ThemeSwitcher, migrate the page frame/breadcrumbs to `--ui-*`, and update sticky-offset tokens.

---

## Preview route

[`/dev/ui-shell`](../../../src/routes/dev/ui-shell/index.tsx) — run `npm run dev`, open the route. `noindex, nofollow`; 404s on the production host. Shows: a live theme-switchable desktop/responsive shell (scroll to see condense), and phone frames for the collapsed header + open menu. The current production header still wraps the page (root layout) for direct contrast.

---

## User decision needed

1. **Direction:** approve / reject / modify the calm-editorial shell concept.
2. **Search affordance:** confirm the persistent pill + unified search overlay direction (vs. keeping a simpler "go to search page" link).
3. **Mega-menu:** confirm dropping the Hotels hover mega-dropdown for flat top-level links.
4. **Theme control placement:** header popover (primary) + footer (secondary) + mobile sheet — OK?
5. **Logo:** keep the text wordmark for now (logo lockup/refresh deferred to CLAUDE-UI-011), or supply a mark to drop into `Brand` during CLAUDE-UI-004?

---

## Verification results

- **`npm run build.types`** → exits non-zero with **one** error only: the **pre-existing** `TS2353` `ssl` in [src/lib/db/client.server.ts](../../../src/lib/db/client.server.ts#L91) — unrelated, **not fixed** here (per instructions). New shell code adds **zero** type errors.
- **`npm run build`** → exits `1` from that same pre-existing type check, but the **client (Vite) bundle compiles successfully**: **871 modules transformed** (up from 849), `✓ built in ~5.6s`. A JSX/Qwik error in any new file would fail the Vite transform, so the sample shell is valid and bundles cleanly. No lint/Qwik-plugin errors reference the new files.
- **Runtime smoke:** `/dev/ui-shell` serves `200` with `x-robots-tag: noindex, nofollow`; SSR output contains the brand wordmark, all five nav labels, and ~280 `var(--ui-*)` references.
- **Net:** only blocker is the documented pre-existing DB SSL error; this task introduces no new regressions and replaced no production shell.
