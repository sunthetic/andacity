# Shared Component Token Migration

**Task:** CLAUDE-UI-038
**Date:** 2026-06-23

---

## Purpose

Migrate shared components that appear on redesigned public pages from legacy `--color-*` visual tokens to the `--ui-*` theme system, preventing legacy UI fragments from appearing inside otherwise fully-redesigned surfaces.

---

## Audit finding addressed

From `FULL_UI_MAKEOVER_COVERAGE_AUDIT.md` (CLAUDE-UI-035):

> "Shared components (CompareSheet, CompareTray, AsyncStateNotice, InventoryRefreshControl, NotFoundPage, Breadcrumbs) use legacy `--color-*` tokens and appear in redesigned page types including hotel detail"

With `/hotels/in` and `/car-rentals/in` now redesigned (CLAUDE-UI-036, CLAUDE-UI-037), all public-beta-blocking route-level work is complete. This task clears the shared-component leg of the same audit finding.

---

## Components reviewed

| Component | Path | Legacy tokens found |
|---|---|---|
| `CompareSheet` | `src/components/save-compare/CompareSheet.tsx` | 16 `--color-*` instances, `t-card` absent (used grid bg) |
| `CompareTray` | `src/components/save-compare/CompareTray.tsx` | `t-card`, 5 `--color-*` instances |
| `AsyncStateNotice` | `src/components/async/AsyncStateNotice.tsx` | 7 `--color-*` instances, non-ui radius/shadow tokens |
| `AsyncInlineSpinner` | `src/components/async/AsyncInlineSpinner.tsx` | 2 `--color-*` instances |
| `AsyncRetryControl` | `src/components/async/AsyncRetryControl.tsx` | 5 `--color-*` instances |
| `InventoryRefreshControl` | `src/components/inventory/InventoryRefreshControl.tsx` | 4 `--color-*` instances |
| `NotFoundPage` | `src/components/site/NotFoundPage.tsx` | `t-card`, `t-badge`, 3 `--color-*`, duplicate link bug |
| `Breadcrumbs` | `src/components/navigation/Breadcrumbs.tsx` | 2 `--color-*` instances |
| `Page` | `src/components/site/Page.tsx` | 1 `--color-*` instance (breadcrumb divider) |

---

## Components migrated

All 9 components listed above. Zero `--color-*` instances remain in any of the migrated files.

---

## Components deferred

None from the named list. The following remain legacy but are deferred per task scope:
- All checkout components (`src/components/checkout/**`) — on noindex routes, low public exposure
- All confirmation components (`src/components/confirmation/**`) — on noindex routes
- All itinerary components (`src/components/itinerary/**`) — on noindex routes
- All my-trips components (`src/components/my-trips/**`) — on noindex routes
- All trip components (`src/components/trips/**`) — on noindex routes
- All traveler components (`src/components/travelers/**`) — on noindex routes
- Results components (`src/components/results/**`) — on noindex search routes
- Entity components (`src/components/entities/**`) — used on noindex entity pages

---

## Public-surface exposure

| Component | Appears on public indexable pages |
|---|---|
| `CompareSheet` | Hotel detail (`/hotels/[slug]`), car rental detail (`/car-rentals/[slug]`) — user-triggered overlay |
| `CompareTray` | Same as CompareSheet — floating tray on search and detail pages |
| `AsyncStateNotice` | Hotel city page, car rental city page, search results |
| `AsyncInlineSpinner` | Rendered inside `AsyncStateNotice` wherever it appears |
| `AsyncRetryControl` | Rendered inside `AsyncStateNotice` wherever it appears |
| `InventoryRefreshControl` | Hotel detail page, car rental detail page |
| `NotFoundPage` | Any 404 response on any route |
| `Breadcrumbs` | `/privacy`, `/terms`, `/contact`, `/404` (via `Page` component) |
| `Page` | `/privacy`, `/terms`, `/contact`, `/404` |

---

## Token migration notes

### `Page.tsx`
- `--color-border` → `--ui-border` (breadcrumb band border-bottom)

### `Breadcrumbs.tsx`
- `--color-text-muted` → `--ui-text-muted` (base text color)
- `--color-text-strong` → `--ui-text` (hover text color on links)

### `AsyncInlineSpinner.tsx`
- `--color-text-muted` → `--ui-text-muted` (base color, overrideable via props.class)
- `--color-border` → `--ui-border` (spinner ring)
- `--color-action` → `--ui-primary` (spinner active segment)

### `AsyncRetryControl.tsx`
- `--color-text-muted` → `--ui-text-muted` (message text)
- `--color-border` → `--ui-border` (retry button border)
- `--color-action` → `--ui-primary` (retry button text and hover border)

### `AsyncStateNotice.tsx`
- `--radius-xl` (non-ui variable) → `rounded-xl` Tailwind utility
- `--shadow-sm` (non-ui variable) → `shadow-sm` Tailwind utility
- `--color-text-muted` → `--ui-text-muted`
- refreshing state: `--color-primary-150`/`--color-primary-25`/`--color-action` → `--ui-accent`/`--ui-accent-soft`/`--ui-primary`
- failed state: `--color-danger,...`/`--color-danger-soft,...` → `--ui-danger`/`--ui-danger-soft` (both fully defined in all theme palettes)
- warning state: `--color-warning,...`/`--color-warning-soft` → `--ui-warning`/`--ui-warning-soft` (both fully defined in all theme palettes)

### `InventoryRefreshControl.tsx`
- `--color-border` → `--ui-border` (button border)
- `--color-action` → `--ui-primary` (hover border)
- `--color-error` → `--ui-danger` (failure message text — `--ui-danger` defined in all palettes)
- `--color-text-muted` → `--ui-text-muted` (success/idle message text)

### `CompareTray.tsx`
- `t-card` class removed → inline `style` with `--ui-surface`, `--ui-border`, `--ui-radius`, `--ui-shadow-panel`
- `--color-surface-chrome` → `--ui-surface` (tray background)
- `--color-text-muted` → `--ui-text-muted`
- `--color-text-strong` → `--ui-text`
- `--color-border` → `--ui-border` (Clear all button)

### `CompareSheet.tsx`
- Full dialog background: `--color-surface` → `--ui-bg` (full-screen, so bg is appropriate)
- Header bar: `--color-divider` + `--color-surface-chrome` → `--ui-divider` + `--ui-surface`
- `--color-text-strong` → `--ui-text` (throughout)
- `--color-text-muted` → `--ui-text-muted` (throughout)
- `--color-text` → `--ui-text` (data cell text)
- `--color-text-subtle` → `--ui-text-muted` (em-dash placeholder)
- `--color-border` → `--ui-border` (throughout)
- `--color-divider` → `--ui-divider` (grid gaps and row borders)
- `--color-panel` → `--ui-surface-muted` (sticky criteria column)
- `--color-surface` → `--ui-surface` (article cells)
- `--color-neutral-50` → `--ui-surface-muted` (image placeholder)

### `NotFoundPage.tsx`
- `t-card` removed → inline `--ui-surface`/`--ui-border`/`--ui-radius-lg`/`--ui-shadow-card`
- `t-badge` removed → inline `--ui-surface-muted`/`--ui-border`/`--ui-text` pill links
- `t-btn-primary` replaced with explicit inline `--ui-primary`/`--ui-on-primary` button style
- `--color-text-strong` → `--ui-text`
- `--color-text-muted` → `--ui-text-muted`
- Fixed duplicate link bug: previously "Hotels" and "Search hotels" both pointed to `/hotels`
- New nav: Home (primary CTA) + Hotels, Flights, Car Rentals, Destinations (secondary)

---

## Behavior preservation notes

- `CompareSheet`: all analytics events, shortlist/remove/view/add-to-trip actions, overlay focus trapping, close behavior preserved
- `CompareTray`: `canOpenCompare` gate, disabled state, clear/open actions preserved
- `AsyncStateNotice`: loading/refreshing/partial/stale/failed/empty state logic unchanged; only visual palette updated
- `AsyncInlineSpinner`: spinner animation, compact mode, label/sr-only behavior preserved
- `AsyncRetryControl`: retry button/link logic, telemetry events, `onRetry$` QRL preserved
- `InventoryRefreshControl`: reload/action/unsupported modes, sessionStorage refresh state, telemetry, `useVisibleTask$` cleanup, disabled states preserved
- `Breadcrumbs`: `aria-current="page"`, link/span branch, empty-list guard preserved
- `Page`: `<Slot />`, breadcrumb conditional, `max-w-6xl` layout preserved
- `NotFoundPage`: 404 content unchanged; link set expanded and deduplicated

---

## Accessibility notes

- `CompareSheet`: `role="dialog"`, `aria-modal`, `aria-label`, `tabIndex={-1}`, `initialFocusRef` on Close button, backdrop close button with `aria-label` — all preserved
- `CompareTray`: disabled button state, `cursor-not-allowed opacity-60` preserved for `canOpen=false`
- `AsyncStateNotice`: `role="alert"` for failed, `role="status"` for others, `aria-live="polite"`, decorative dot `aria-hidden` — preserved
- `AsyncInlineSpinner`: `role="status"`, `aria-live`, `aria-hidden` on spinner element, `sr-only` fallback label — preserved
- `InventoryRefreshControl`: disabled/unsupported state, `cursor-not-allowed` preserved; error message text uses semantic color distinction (not color-only)
- `Breadcrumbs`: `aria-label="Breadcrumb"` nav, `aria-current="page"` on terminal — preserved
- `NotFoundPage`: one H1, focus ring on all buttons (`focus-visible:ring-2`), all links have clear text labels

---

## Theme/responsive notes

- `--ui-warning`, `--ui-warning-soft`, `--ui-danger`, `--ui-danger-soft` confirmed defined across all 6 palettes × light/dark in `themes.css`
- `--ui-surface-muted` confirmed defined in all theme variants
- `--ui-accent`, `--ui-accent-soft` defined in all theme palettes (used for refreshing state in AsyncStateNotice)
- `CompareSheet` full-screen overlay uses `--ui-bg` (dark-mode aware), header uses `--ui-surface` with `backdrop-blur`
- `CompareTray` uses `backdrop-blur` with `--ui-surface` background — legible on both light and dark palettes
- No fixed `#hex` colors introduced in any migrated component

---

## SEO/indexing preservation

- No route files modified — only shared components
- No `noindex`/`robots` directives affected
- `NotFoundPage` does not expose developer route paths or internal copy
- `/search/*` noindex behavior unchanged (layout-level; not touched here)
- `/dev/ui-*` production gate unchanged (`shouldIndex()` in route handlers; not touched here)

---

## Claim-safety notes

No copy was added or changed that could imply:
- Guaranteed availability
- Guaranteed prices
- Free cancellation
- Unlimited mileage
- Partner or supplier guarantees
- Live data guarantees
- Popularity or rankings

`InventoryRefreshControl` success/failure messages are prop-driven by callers and unchanged. `AsyncStateNotice` titles ("Partial availability", "Availability needs recheck") are accurate state descriptions, not claims.

---

## Remaining legacy token findings

Legacy `--color-*` tokens remain in the following **deferred** component groups (all on noindex surfaces):
- `src/components/checkout/**` (~30 files)
- `src/components/confirmation/**`
- `src/components/itinerary/**`
- `src/components/my-trips/**`
- `src/components/trips/**`
- `src/components/travelers/**`
- `src/components/results/**` (search results, noindex)
- `src/components/entities/**` (entity detail, noindex)
- Various car-rental, flight, hotel result card components

On public indexable pages, the named components are now fully migrated. The `t-btn-primary` class remains in use in `CompareTray` and `CompareSheet` (interactive button with hover/active states baked in); it is preserved intentionally since it's used consistently across the codebase.

---

## Verification results

```
yarn run build.types    ✅  exit 0
yarn run lint           ✅  exit 0  (2 pre-existing warnings, 0 errors)
yarn run build          ✅  exit 0
```

Post-migration grep: zero `--color-*` instances in any of the 9 migrated component files.
