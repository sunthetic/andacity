# CLAUDE-UI-036 — Hotels All-Cities Index Page Redesign

**Date:** 2026-06-22
**Route:** `/hotels/in` → `src/routes/hotels/in/index.tsx`
**Status:** Complete

---

## Summary

Full production redesign of the `/hotels/in` all-cities hotel index page. Removed the legacy `<Page>` component wrapper and all `--color-*` token usage, replacing them with the `--ui-*` system established in `/hotels/in/[citySlug]`. Added a hero section, redesigned city cards, and a handoff navigation section.

---

## Changes Made

### `src/routes/hotels/in/index.tsx` (full rewrite)

**Structural changes:**
- Removed `<Page>` wrapper (which had breadcrumbs handled via props)
- Added bare `<div style="background:var(--ui-bg);color:var(--ui-text)">` outer container — matching the `/hotels/in/[citySlug]` pattern
- Added `<section>` hero with `background-image:var(--ui-hero)` gradient and `--ui-hero-scrim` overlay
- Inline breadcrumb nav in hero (Home / Hotels / City guides) with `aria-current="page"` on the terminal crumb
- City count stat pill (frosted-glass style) in hero
- City directory grid retains `sm:grid-cols-2 lg:grid-cols-3` layout
- New handoff section (border-top: `--ui-divider`) with links to `/hotels`, `/explore`, `/destinations`

**Token migration (8 instances → 0):**

| Old token | New token | Location |
|---|---|---|
| `--color-text-strong` | `--ui-text` | H1, card city name |
| `--color-text-muted` | `--ui-text-muted` | Subtitle, region, neighborhoods |
| `--color-text-muted` | `--ui-text-muted` | Price badge suffix, hotel count |
| `--color-text` | `--ui-text` | (removed via card redesign) |
| `--color-action` | `--ui-primary` | "View hotels →" CTA |
| `t-card` class | inline `--ui-surface` / `--ui-border` / `--ui-shadow-card` | City cards |
| `t-badge` class | inline `--ui-accent-soft` / `--ui-accent` | Price badge |
| `hover:bg-white` | `group-hover:underline` on city name | Card hover state |

**JSON-LD cleanup:**
- Removed the redundant `{ name: 'json-ld', content: jsonLd }` meta array entry (was not a valid meta tag — just noise)
- Kept the correct `scripts` array entry with `key: 'ld-hotel-cities'` and `props: { type: 'application/ld+json' }`
- Added OG + Twitter card meta tags (were absent from the previous implementation)
- Kept BreadcrumbList + ItemList structured data (cap 48 cities)

**City card design:**
- Top accent band: 6px, `background-image:var(--ui-hero)`, rounded top corners
- City name: `font-family:'Lexend Variable'`, `--ui-text`, underlines on group-hover
- Region/country: `--ui-text-muted`
- Price badge: `--ui-accent-soft` bg, `--ui-accent` text, rounded-full
- Hotel count: `--ui-text-muted`
- Top neighborhoods (up to 3): `--ui-text-muted`
- "View hotels →" CTA: `--ui-primary`
- Card focus ring: `--ui-ring`
- No `<img>` elements — card identity comes from the accent band + typography

**Helpers:**
- `buildHotelsInCityHref`, `formatMoney`, `HANDOFF_LINKS` kept at module scope
- `HANDOFF_LINKS` typed `as const`

---

## Design Reference

Primary reference: `src/routes/hotels/in/[citySlug]/index.tsx`
- Outer container pattern
- Hero `background-image:var(--ui-hero)` + scrim overlay
- Inline breadcrumb in hero
- `--ui-surface` card shells
- Section dividers via `border-top:1px solid var(--ui-divider)`

---

## SEO & Indexing

- No `noindex` — page remains fully indexable
- Canonical: `/hotels/in`
- Meta description: "Browse hotel city guides by destination. Find hotels in popular cities and compare rates, cancellation policies, and totals before you book."
- Title: "Hotel Destinations | Andacity Travel"
- JSON-LD: BreadcrumbList + ItemList (capped at 48) in `scripts` array
- `FOOTER_NAV` "Discover" column links to this route — now ships fully on `--ui-*`

---

## Build Verification

```
yarn run build.types    ✅  exit 0
yarn run lint           ✅  exit 0  (2 pre-existing warnings, 0 errors)
yarn run build          ✅  exit 0
```
