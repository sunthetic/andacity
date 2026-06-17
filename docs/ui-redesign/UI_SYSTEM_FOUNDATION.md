# Andacity UI System Foundation

> **Task ID:** CLAUDE-UI-002
> **Status:** Design-system foundation only. **No production page or the global shell was rewritten.**
> **Prerequisites:** CLAUDE-UI-000 (audit), CLAUDE-UI-001 (palette options).
> **Preview:** [`/dev/ui-palettes`](../../src/routes/dev/ui-palettes/index.tsx) — `noindex`, prod-gated. Live ThemeController + all 12 theme states rendered with the new primitives.

---

## Approved palette strategy

All **six** CLAUDE-UI-001 directions ship as visitor-selectable variants, each in **light and dark/inverted** mode — **12 theme states** total. The system is a new, additive token namespace (`--ui-*`) that is **independent of the legacy `--color-*` system**, so it can be adopted page-by-page (CLAUDE-UI-003+) without destabilizing un-migrated production pages.

Visitor-facing order (and switcher order):

1. **Skyglass Luxe** — default
2. **Andacity Meridian** — second option / brand-native alternative
3. **Sandbar Editorial**
4. **Sunset Atlas**
5. **Alpine Signal**
6. **Midnight Terminal**

---

## Default theme

**Skyglass Luxe**, mode = **system** (Auto). On first load with no stored preference, the palette is Skyglass and the mode resolves from the OS `prefers-color-scheme` — preserving the app's existing system-preference behavior. When the OS preference is light/unset, the result is **Skyglass Luxe Light** (the intended default first-load experience).

- Default palette: `DEFAULT_PALETTE = "skyglass"` ([src/lib/ui-theme/theme.ts](../../src/lib/ui-theme/theme.ts))
- Default mode preference: `DEFAULT_MODE_PREFERENCE = "system"`
- In CSS, the default (no attributes) resolves to Skyglass Light because the base `:root` block carries the Skyglass light values ([src/styles/themes.css](../../src/styles/themes.css)).

---

## Visitor-selectable variants

| # | Palette | `data-palette` | Mood | Logo compatibility |
|---|---|---|---|---|
| 1 | Skyglass Luxe | `skyglass` | Cool, premium, legible (aviation trust) | Acceptable (careful treatment) |
| 2 | Andacity Meridian | `meridian` | Warm, brand-native, trustworthy | **Very high** |
| 3 | Sandbar Editorial | `sandbar` | Quiet luxury, editorial calm | High |
| 4 | Sunset Atlas | `sunset` | Warm, aspirational, emotive | Needs future refresh |
| 5 | Alpine Signal | `alpine` | Grounded, outdoors | Needs future refresh |
| 6 | Midnight Terminal | `midnight` | Dark cinematic night-travel | Needs future refresh |

Each is selectable in any mode via the **ThemeController** ([src/components/ui/theme/ThemeController.tsx](../../src/components/ui/theme/ThemeController.tsx)).

---

## Light/dark mode behavior

- Selection is driven by two attributes on a scope element (normally `<html>`): `data-palette` and `data-mode` (`light | dark`).
- The persisted **mode preference** is `light | dark | system`. `system` is resolved to a concrete `light`/`dark` at runtime via `matchMedia('(prefers-color-scheme: dark)')`, and the ThemeController re-resolves it live when the OS theme changes (only while the preference is `system`).
- Because CSS only ever sees a concrete `data-mode`, the stylesheet needs only `[data-mode="dark"]`-qualified blocks — no duplicated `@media` palette sets.
- **Midnight Terminal** is dark-first; its `light` mode is a designed inverted (bright, cool) counterpart so the variant still honors the "light + dark for every variant" requirement.
- Selectors are **attribute-scoped (not `:root`-only)**, so a palette/mode can be scoped to any subtree (used by the preview to show all 12 states simultaneously) as well as to the live document.

---

## Theme token map

Defined per state in [src/styles/themes.css](../../src/styles/themes.css). Every `[data-palette="X"]` block is self-contained (full color set) so scoped subtrees never leak tokens from an ancestor. Shadows/scrim/radius are shared by mode to avoid repetition; colors and the hero atmosphere gradient are per palette/mode.

| Requirement | Token |
|---|---|
| Page background | `--ui-bg` |
| Elevated surface | `--ui-surface` |
| Muted surface | `--ui-surface-muted` |
| Strong surface | `--ui-surface-strong` |
| Primary text | `--ui-text` |
| Secondary text | `--ui-text-secondary` |
| Muted text | `--ui-text-muted` |
| Border / subtle divider | `--ui-border`, `--ui-divider` |
| Primary action | `--ui-primary` |
| Primary action hover | `--ui-primary-hover` |
| Primary action text | `--ui-on-primary` |
| Secondary action | `--ui-secondary` |
| Accent / deal / price highlight | `--ui-accent`, `--ui-accent-soft`, `--ui-price` |
| Trust / success | `--ui-success`, `--ui-success-soft` |
| Warning | `--ui-warning`, `--ui-warning-soft` |
| Danger / error | `--ui-danger`, `--ui-danger-soft` |
| Focus ring | `--ui-ring` |
| Hero overlay (scrim) + atmosphere | `--ui-hero-scrim`, `--ui-hero` |
| Card shadow | `--ui-shadow-card` |
| Search panel shadow | `--ui-shadow-panel` |
| Radius scale | `--ui-radius-sm`, `--ui-radius`, `--ui-radius-lg` |

All 12 states define the full color set. Per-palette radius examples: Sandbar `10px`, Skyglass/Alpine/Midnight `12px`, Meridian `13px`, Sunset `14px`.

---

## Theme persistence behavior

- Two `localStorage` keys: `andacity-ui-palette` and `andacity-ui-mode`.
- The ThemeController writes on every change and re-applies attributes immediately.
- Values are validated on read (`isPaletteId`, `isModePreference`); invalid/corrupt values fall back to Skyglass / system.
- This is **separate from the legacy** `andacity-theme` / `data-theme` (B1–B5) switcher in [src/components/site/ThemeSwitcher.tsx](../../src/components/site/ThemeSwitcher.tsx), which still themes un-migrated production pages via `--color-*`. The two coexist during migration; the legacy switcher is untouched and will be replaced when the global shell is rebuilt (CLAUDE-UI-003).

---

## FOUC prevention behavior

- A dependency-free, defensive inline script (`UI_THEME_FOUC_SCRIPT` in [src/lib/ui-theme/theme.ts](../../src/lib/ui-theme/theme.ts)) is injected in `<head>` **before** `RouterHead` in [src/root.tsx](../../src/root.tsx). It reads the stored palette + mode, resolves `system` via `matchMedia`, and sets `data-palette` / `data-mode` on `<html>` prior to first paint.
- The legacy B1–B5 pre-paint script is preserved alongside it.
- Verified: the production homepage HTML contains the `andacity-ui-palette` pre-paint script.

---

## Logo compatibility notes

The current mark (teal `#14B8A6` + amber `#F59E0B`, slate/teal wordmark, Open Sans) is **not changed** in this task. Compatibility per palette:

- **Strongest — Andacity Meridian:** built directly from the mark's teal + gold; the logo sits natively.
- **Good — Sandbar Editorial:** ocean-teal + sand + ink; the mark's teal agrees, amber works as the deal accent.
- **Acceptable with care — Skyglass Luxe:** cool blue diverges from teal/amber; the mark reads fine on white surfaces but the palette ultimately wants a cooler logo lockup. A future logo-palette refresh is recommended if Skyglass stays the long-term default.
- **Likely needs a future logo refresh — Sunset Atlas, Alpine Signal, Midnight Terminal:** coral/violet, pine/ice, and dark-cinematic respectively pull away from the current mark; Midnight in particular needs a light/teal-on-dark lockup.

The mark remains usable across all palettes today (it is rendered on light surfaces in the shell); a lightweight logo refresh is deferred to CLAUDE-UI-011.

---

## Shared primitives created or refactored

All new, under [src/components/ui/](../../src/components/ui/), consuming `--ui-*` (presentational; page interactivity is wired during page rewrites):

| Primitive | File | Notes |
|---|---|---|
| Theme runtime | [lib/ui-theme/theme.ts](../../src/lib/ui-theme/theme.ts) | Palette metadata, storage keys, `resolveMode`, FOUC script |
| ThemeController | [ui/theme/ThemeController.tsx](../../src/components/ui/theme/ThemeController.tsx) | Visitor switcher — palette + Light/Dark/Auto; accessible, mobile-friendly, persistent |
| PageShell | [ui/PageShell.tsx](../../src/components/ui/PageShell.tsx) | Themed page surface; can scope a palette/mode to a subtree |
| HeroSection | [ui/HeroSection.tsx](../../src/components/ui/HeroSection.tsx) | Photographic hero with guaranteed scrim; gradient stand-in when no image |
| SearchPanel | [ui/SearchPanel.tsx](../../src/components/ui/SearchPanel.tsx) | Elevated search surface (`hero`/`inline`) |
| ResponsiveSection | [ui/ResponsiveSection.tsx](../../src/components/ui/ResponsiveSection.tsx) | Section + heading row + container |
| ResultCard (+ ResultFact, ResultPrice) | [ui/ResultCard.tsx](../../src/components/ui/ResultCard.tsx) | Summary-first base scaffold, price-anchored |
| HotelCard | [ui/HotelCard.tsx](../../src/components/ui/HotelCard.tsx) | Image-led |
| FlightCard | [ui/FlightCard.tsx](../../src/components/ui/FlightCard.tsx) | Route-timeline |
| CarCard | [ui/CarCard.tsx](../../src/components/ui/CarCard.tsx) | Vehicle-led |
| DestinationCard | [ui/DestinationCard.tsx](../../src/components/ui/DestinationCard.tsx) | Full-bleed editorial |
| TrustStrip | [ui/TrustStrip.tsx](../../src/components/ui/TrustStrip.tsx) | Quiet trust signals |
| FilterRail | [ui/FilterRail.tsx](../../src/components/ui/FilterRail.tsx) | Filter sidebar |
| ResultToolbar | [ui/ResultToolbar.tsx](../../src/components/ui/ResultToolbar.tsx) | Count + sort + active chips |
| EmptyState | [ui/EmptyState.tsx](../../src/components/ui/EmptyState.tsx) | Empty/failed surface |
| Skeleton (+ SkeletonLine, SkeletonCard, SkeletonResults) | [ui/Skeleton.tsx](../../src/components/ui/Skeleton.tsx) | Reduced-motion-aware shimmer |
| Button | [ui/Button.tsx](../../src/components/ui/Button.tsx) | primary / secondary / ghost |
| Badge | [ui/Badge.tsx](../../src/components/ui/Badge.tsx) | neutral / accent / success / warning / danger |

Token + wiring files: [src/styles/themes.css](../../src/styles/themes.css) (12-state system + skeleton keyframes), [src/styles/global.css](../../src/styles/global.css) (`@import './themes.css'`), [src/root.tsx](../../src/root.tsx) (FOUC script).

---

## Preview route updates

[`/dev/ui-palettes`](../../src/routes/dev/ui-palettes/index.tsx) was rewritten to demonstrate the foundation:

- A **live** composition driven by the in-page **ThemeController** (applies to `<html>`), including loading skeletons and an empty state.
- A **static 12-state matrix**: each palette (Skyglass first, Meridian second) rendered in **light and dark**, each scoped via `<PageShell palette mode>`.
- Each composition exercises: header, hero, search panel, hotel/flight/car/destination cards, trust strip, results + filters (FilterRail + ResultToolbar + ResultCard), CTA, footer, and a mobile viewport frame.
- Verified in SSR output: 36 scoped palette cells and ~2,800 `var(--ui-*)` references render; all six palette names present.

---

## Production page boundaries

**Not touched / not rewritten** (per task constraints):

- Home, Hotels (landing/detail/by-city), Flights (landing/route), Cars (landing/by-city/detail), Explore, Destinations, global search/result pages.
- The global shell ([SiteHeader](../../src/components/site/SiteHeader.tsx), [SiteFooter](../../src/components/site/SiteFooter.tsx), [routes/layout.tsx](../../src/routes/layout.tsx)) and the legacy [ThemeSwitcher](../../src/components/site/ThemeSwitcher.tsx) — these are CLAUDE-UI-003's scope.

**Touched (foundation + sanctioned defect fixes only):**

- `src/root.tsx` — added the new FOUC script (theme runtime; not a page redesign).
- `src/styles/global.css` — added `@import './themes.css'`.
- `src/styles/theme.css` — **defect fix:** added the missing `--color-tertiary-*` ramp (home referenced it undefined).
- `src/components/site/Page.tsx` — **defect fix:** `borde3r-b` → `border-b` (one-class typo restoring the breadcrumb band border).

Because the new system uses the separate `--ui-*` namespace, **the live ThemeController does not visually alter legacy production pages yet** (they consume `--color-*`). Production pages adopt `--ui-*` during their individual rewrites; the switcher fully drives anything built on the new primitives (the preview today, real pages from CLAUDE-UI-003 onward).

---

## Known limitations

1. **Two parallel theme systems during migration.** Legacy `--color-*` (B1–B5, `data-theme`, OS-only dark) still drives un-migrated pages; new `--ui-*` (6 palettes, `data-palette`/`data-mode`, manual + system mode) drives the new primitives. This is intentional and temporary; convergence happens as pages migrate, ending with the legacy switcher's removal in the shell rebuild.
2. **Default-scheme visibility.** "Skyglass is the default" is realized in the new system; visible production pages still render legacy B1 until rewritten. Documented above.
3. **FOUC script duplicates a few constants** (storage keys, palette ids, default palette) as a literal string for pre-paint safety; if those constants change in `theme.ts`, update the script string.
4. **Photography is represented by gradient stand-ins** in primitives/preview; real imagery + responsive `srcset`/LCP discipline arrives with page rewrites.
5. **Dark-mode contrast** was set to target WCAG AA, but a formal contrast audit across all 12 states is deferred to the polish pass (CLAUDE-UI-011).
6. **Pre-existing, unrelated build blocker** remains: `TS2353` `ssl` in [src/lib/db/client.server.ts](../../src/lib/db/client.server.ts#L91). Not fixed here (per instructions).

---

## Verification results

Commands: `npm run build.types`, `npm run build` (see [package.json](../../package.json)).

- **`npm run build.types`** → exits non-zero with **exactly one** error: the **pre-existing** `TS2353` on `ssl` in [src/lib/db/client.server.ts](../../src/lib/db/client.server.ts#L91). Unrelated to this task and **not fixed** here (per instructions). **All new foundation code type-checks cleanly** — zero new type errors.
- **`npm run build`** → exits `1` because Qwik's build runs the same type check and throws on that one pre-existing error. **The client (Vite) bundle compiles successfully** in the same run: **849 modules transformed** (up from 810 — the new components/route are included), chunks + assets emitted, `✓ built in ~4.7s`. A JSX/Qwik error in any new file would have failed the Vite transform, so this confirms the entire foundation (tokens, runtime, primitives, ThemeController, rewritten preview) is valid and bundles cleanly. No lint/Qwik-plugin errors reference the new files.
- **Runtime smoke (dev server):** `/dev/ui-palettes` serves `200`; SSR output contains 36 scoped `data-palette` cells, ~2,800 `var(--ui-*)` references, and all six palette names; the production homepage `/` includes the `andacity-ui-palette` pre-paint FOUC script.
- **Net:** the only blocker is the documented pre-existing DB SSL type error; this task introduces no new type/build/lint regressions and rewrote no production page or the global shell.
