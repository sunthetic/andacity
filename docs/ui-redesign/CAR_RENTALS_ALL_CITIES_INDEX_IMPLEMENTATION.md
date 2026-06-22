# Car Rentals All-Cities Index Implementation

## Purpose

Production redesign of `/car-rentals/in` — the publicly-indexed, footer-linked all-cities car rental directory page — to match the `--ui-*` token system established across the rest of the Andacity UI redesign.

---

## Audit finding addressed

From `FULL_UI_MAKEOVER_COVERAGE_AUDIT.md` (CLAUDE-UI-035):

- `/car-rentals/in` classified as **Partial/Legacy**
- Linked from `FOOTER_NAV` "Discover" column and `/sitemap.xml`
- Using `<Page>` wrapper, `--color-*` tokens, `t-card`, `t-badge`, `hover:bg-white`
- Flagged as a public-beta blocker alongside `/hotels/in` (completed in CLAUDE-UI-036)

---

## Production files changed

- **`src/routes/car-rentals/in/index.tsx`** — full rewrite (CLAUDE-UI-037)

---

## Data mapping notes

`CarRentalCity` type (from `src/data/car-rental-cities.ts`):

```typescript
export type CarRentalCity = {
  slug: string
  name: string
  region: string
  country: string
}
```

No price, count, amenity, or neighborhood data is available at the directory level. Unlike `/hotels/in` (which has `priceFrom`, `hotelSlugs.length`, `topNeighborhoods`), car rental city cards can only display name, region, and country. The two static placeholder badges ("City guide", "Search") from the previous implementation are removed — they were decoration, not data.

---

## UI system migration

**Tokens replaced (6 instances → 0):**

| Old | New | Usage |
|---|---|---|
| `--color-text-strong` | `--ui-text` | H1, card city name |
| `--color-text-muted` | `--ui-text-muted` | Subtitle, region/country |
| `--color-action` | `--ui-primary` | "Browse rentals →" CTA |
| `t-card` | inline `--ui-surface`/`--ui-border`/`--ui-shadow-card` | City cards |
| `t-badge` | removed | Static placeholder badges removed |
| `hover:bg-white` | `group-hover:underline` on city name | Card hover state |

**Structural changes:**
- `<Page>` wrapper removed → `<div style="background:var(--ui-bg);color:var(--ui-text)">` outer container
- Breadcrumbs removed from `<Page>` props → inline hero breadcrumb nav
- Dual header CTA buttons removed → clean hero stat pill + handoff section
- `t-btn-primary` class usage removed entirely

---

## Page structure

```
<div> outer (--ui-bg / --ui-text)
  <section> hero (--ui-hero gradient + --ui-hero-scrim overlay)
    <nav> breadcrumb: Home / Car Rentals / Cities
    <h1> Car rental destinations by city
    <p>  intro copy
    <span> city count stat pill (frosted-glass)
  </section>

  <div> city directory grid (sm:grid-cols-2 lg:grid-cols-3)
    city cards or <SearchEmptyState>

  <section> handoff (border-top: --ui-divider)
    <h2> Where to next
    3 × handoff cards → /car-rentals, /hotels/in, /destinations
  </section>
</div>
```

---

## City directory implementation

Each city card:
- Accent band: 6px `background-image:var(--ui-hero)`, rounded top corners matching `--ui-radius`
- City name: `font-family:'Lexend Variable'`, `--ui-text`, `group-hover:underline`
- Region · Country: `--ui-text-muted`
- "Browse rentals →" CTA: `--ui-primary`
- Card shell: `--ui-surface` bg, `--ui-border` border, `--ui-shadow-card`, `--ui-radius`
- Focus: `focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]`

No price badge, rental count, or amenity data — `CarRentalCity` does not carry this information at the directory level. Placeholder badges from the previous implementation removed.

---

## Internal linking

- Breadcrumb: Home → `/`, Car Rentals → `/car-rentals`
- Each city card → `/car-rentals/in/[citySlug]`
- Handoff cards → `/car-rentals`, `/hotels/in`, `/destinations`
- Footer `FOOTER_NAV` "Discover" column link to `/car-rentals/in` unchanged and valid
- `SearchEmptyState` fallback → `/car-rentals`

---

## SEO/indexing preservation

- No `noindex` — remains fully indexable
- Canonical: `/car-rentals/in`
- Title: `Car Rental Destinations | Andacity Travel`
- Meta description: `Browse car rental city guides by destination. Compare vehicles and pickup types in popular cities before you book.`
- JSON-LD: BreadcrumbList + ItemList (capped at 48 items) in `scripts` array only
- Removed: `numberOfItems` property on individual `ListItem` entries (not a valid Schema.org ListItem property — was present in the previous implementation; correctly placed on the list-level schema if needed)
- Sitemap inclusion via `/sitemap.xml` unchanged

---

## Accessibility notes

- One H1 per page: "Car rental destinations by city"
- Breadcrumb `<nav aria-label="Breadcrumb">` with `aria-current="page"` on terminal crumb
- City cards: full-card `<a>` with visible `focus-visible:ring-2` focus ring
- Hero scrim div: `aria-hidden="true"`
- Accent band div: `aria-hidden="true"`
- "→" decorative arrow: `aria-hidden="true"` via wrapping `<span>`
- `SearchEmptyState` empty state has descriptive title + description
- All text-on-background combinations use `--ui-*` tokens which respect palette-level contrast tuning

---

## Theme/responsive notes

- Outer container `--ui-bg`/`--ui-text` responds to all 6 palettes × light/dark
- Hero gradient uses `--ui-hero` (palette-aware) with `--ui-hero-scrim` overlay — consistent across Skyglass Luxe, Meridian, Sandbar, Sunset, Alpine, Midnight in both modes
- Stat pill uses `rgba(255,255,255,0.18)` frosted-glass — visible on all hero gradients
- Card surfaces use `--ui-surface`/`--ui-border`/`--ui-shadow-card` — correct in all themes
- City name: `font-family:'Lexend Variable'` with `var(--system-font-family)` fallback
- Mobile: single-column cards, full-width hero text
- Tablet: `sm:grid-cols-2`
- Desktop: `lg:grid-cols-3`
- No horizontal overflow: max-w-6xl with px-4 gutter

---

## Claim-safety notes

No invented data. City cards display only: city name, region, country. No prices, availability, rental counts, cancellation guarantees, mileage terms, shuttle details, supplier names, or rankings are introduced. Intro copy ("Compare vehicles, pickup types, and policy terms before you book") describes what the city pages offer, not specific terms. Handoff copy is navigational only.

---

## Deferred work

- CLAUDE-UI-038: Shared component token migration (`Page`, `Breadcrumbs`, `AsyncStateNotice`, etc.) — the `<Page>` component itself still has 1 `--color-border` instance in its breadcrumb divider, but `/car-rentals/in` no longer uses `<Page>`

---

## Verification results

```
yarn run build.types    ✅  exit 0
yarn run lint           ✅  exit 0  (2 pre-existing warnings in SiteHeader + ThemeController, 0 errors)
yarn run build          ✅  exit 0
```
