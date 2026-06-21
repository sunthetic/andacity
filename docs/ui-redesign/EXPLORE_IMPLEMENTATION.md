# Explore Page Implementation

CLAUDE-UI-022 — production implementation of the approved CLAUDE-UI-021
Explore page direction.

## Approved direction

Approved from CLAUDE-UI-021 sample:
- Cinematic discovery hero (`--ui-hero` gradient, no image file)
- H1: "Discover where to go next"
- Sticky mood/theme filter bar (8 chips, replaces vibe-card grid)
- Editorial idea cards with `--ui-hero` gradient header bands
- Destination cards with city name overlaid on gradient header
- Guided mode: next steps promoted above the grid
- Default mode: next steps at bottom
- Whole-trip handoff panel at the bottom
- `/explore?theme=<key>` URL scheme (production filter URLs)
- No real photography required (gradient strategy confirmed)
- "Flexible idea" badge kept (describes inspiration/flexibility, not pricing)

## Production files changed

- `src/routes/explore/index.tsx` — full rewrite of the default component and
  metadata; all data arrays and context helpers preserved exactly

## Data mapping notes

All data comes from the same static inline arrays as before, now with the
`--ui-*` rendering layer:

- `VIBE_ITEMS` (8 themes) — contextBanner, nextStepsIntro, popularTitle,
  popularDescription, destinationSlugs, nextSteps → sticky filter bar chips +
  guided context
- `FLEX_IDEAS` (6 ideas) — same shape as themes + title/description → editorial
  idea cards
- `POPULAR_DESTINATIONS` (6 destinations) — name, blurb, primaryLink,
  flightLink, hotelLink, carLink, guideLink → destination cards
- `DEFAULT_NEXT_STEPS` (4 steps) — used when no filter is active

No fabricated data. No invented links. No fake prices, rankings, or
availability claims. All booking links target real existing routes.

The following were removed (were only used by the now-removed
`ExplorePresetChips` component):
- All preset maps (THEME_TRAVEL_STYLE_MAP, THEME_HOTEL_PRESET_MAP,
  THEME_CAR_PRESET_MAP, THEME_DATE_HINT_MAP, THEME_ACCENT_MAP and their IDEA_
  and DESTINATION_ equivalents)
- Hero overlay maps (`EXPLORE_THEME_OVERLAY_MAP`, `EXPLORE_IDEA_OVERLAY_MAP`)
- Intent derivation functions (`toThemeExploreIntent`, etc.)
- `DESTINATION_CITY_LABELS`, `deriveExploreOverlayVariant`
- Type imports from `~/types/explore/intent`

## Discovery hero implementation

Full-bleed `--ui-hero` gradient band with `--ui-hero-scrim` overlay. No image
file required. Generous padding (`py-20 md:py-28`).

Default mode:
- Eyebrow: "EXPLORE"
- H1: **"Discover where to go next"** (`id="explore-heading"`)
- Subtitle: "Browse trips by mood, season, or budget — then turn inspiration
  into a whole-trip plan."

Guided mode (when `?theme`, `?idea`, or `?destination` is active):
- Eyebrow: "EXPLORE · GUIDED"
- H1: **"Exploring trips that match your selection"**
- Glass panel: `context.bannerText` + "Use the next steps below..." +
  "Clear selection" → `/explore`

Breadcrumb inside the hero: Home / Explore (`aria-current="page"` on current).

## Mood/theme filter implementation

Sticky bar below the hero (`top-0 z-20`). Eight `?theme=<key>` chip links from
`VIBE_ITEMS`. Horizontal scroll on mobile (`overflow-x-auto whitespace-nowrap`).

Active chip: `--ui-primary` background + `--ui-on-primary` text +
`aria-current="page"`.
Default chip: `--ui-surface` background + `--ui-border` border.

"Clear" link appears when `rawTheme` is set → `/explore`.

`role="navigation"` + `aria-label="Browse by mood"` for accessibility.

All chip links target `/explore?theme=<key>` (production URL scheme confirmed).

## Editorial collection implementation

Six `FLEX_IDEAS` cards in a 1/2/3 column responsive grid. Each card:
- `--ui-hero` gradient header band (80px, rounded top corners, `aria-hidden`)
- "Flexible idea" badge in the band (tonal, `rgba(255,255,255,0.2)` bg)
- Title (Lexend, bold, 16px), description (muted, 14px), "Explore idea →" CTA
- `--ui-shadow-card` + 1px border default; `--ui-primary` 2px border +
  `--ui-shadow-panel` active
- `aria-current="page"` on active card (when `?idea=<key>` matches)
- Links target `/explore?idea=<key>`

## Destination card implementation

Six `POPULAR_DESTINATIONS` cards in a 1/2/3 column grid, priority-sorted by
active filter's `destinationSlugs`. Each card:
- `--ui-hero` gradient header (72px) with city name in white at bottom-left
  (text-shadow, Lexend, not aria-hidden so screen readers get the name)
- "In focus" badge when `?destination=<key>` matches
- Blurb (muted text), three quick-link chips (Flights / Hotels / Cars)
- Primary action link (`destination.primaryLink.label → href`)
- "Use in Explore" → `/explore?destination=<key>`
- `--ui-shadow-card` + 1px border default; 2px `--ui-primary` border active

## Guided-mode implementation

When `context.bannerText !== null` (any of `?theme`, `?idea`, `?destination`):
- "Suggested next steps" section is rendered **above** the Trip ideas grid
- Intro text from `context.nextStepsIntro` (theme/idea/destination-aware)
- Four `NextStepsGrid` cards with `--ui-primary` accent bar, bold title, muted
  description, colored CTA

When no filter is active:
- Same "Suggested next steps" section rendered **below** the destinations grid
- Uses `DEFAULT_NEXT_STEPS` (Flights / Hotels / Car Rentals / Destinations)

`NextStepsGrid` is a plain inline function component (no `component$`), so it
is inlined at the call site and shares the parent's reactive context.

## Whole-trip handoff implementation

`--ui-hero` gradient panel inside `max-w-6xl` at the bottom of the page.
`--ui-hero-scrim` overlay for depth.

Three glass booking tiles (Flights / Hotels / Cars) with:
- `rgba(255,255,255,0.13)` background, `rgba(255,255,255,0.28)` border
- White bold label + muted sub-text
- Links: `/flights`, `/hotels`, `/car-rentals`

H2: "Turn inspiration into a whole-trip plan"

## Internal linking implementation

Crawlable links produced by this page:
- Breadcrumb: Home `/` → Explore `/explore`
- Mood filter chips: `/explore?theme=<key>` (8 links)
- "Clear" link → `/explore` (when theme active)
- "Clear selection" → `/explore` (in hero glass panel when guided)
- Idea cards: `/explore?idea=<key>` (6 links)
- Destination quick chips: `flightLink.href`, `hotelLink.href`, `carLink.href`
- Destination primary actions: `primaryLink.href` (real booking/guide routes)
- "Use in Explore": `/explore?destination=<key>` (6 links)
- Next step cards: real booking/destination URLs
- Handoff tiles: `/flights`, `/hotels`, `/car-rentals`

All links point to valid existing routes. No broken links, no dev URLs in
production.

## Empty/loading states

- No loader — all data is static inline. No empty state needed.
- Hero and mood bar always render.
- Guided context/glass panel: conditional on `isGuidedMode && context.bannerText`.
- "Clear" chip: conditional on `rawTheme` being set.
- "In focus" badge: conditional on active destination match.
- Guided vs default next steps: mutually exclusive via `isGuidedMode`.

## Photography/image strategy

No remote images. No local image files. `--ui-hero` CSS gradient serves as the
atmospheric visual in the hero, idea card header bands, destination card header
bands, and handoff panel. This is palette-agnostic and works across all
6 palettes × light/dark without any image changes.

In future, real photography could slot into the same 80px/72px header slots
without layout changes.

## SEO preservation notes

- `/explore` remains **indexable**: no `noindex` in metadata, no
  `x-robots-tag` on the production route, no `shouldIndex` gate
- Title: `Explore | Andacity` (unchanged)
- Description: updated from developer copy to discovery-first traveller copy:
  "Discover where to go next. Browse trips by mood, season, or budget — then
  turn inspiration into a whole-trip plan across flights, hotels, and car
  rentals."
- Canonical: `/explore` (unchanged)
- OG + Twitter meta: preserved with same structure
- Single `<h1>` (`id="explore-heading"`) confirmed in SSR
- All filter URLs (`?theme=`, `?idea=`, `?destination=`) remain crawlable
- No developer/SEO copy leakage into customer-facing UI
- No `noindex` leak from dev sample to production route (separate routes,
  separate `onRequest` handlers)

## Accessibility notes

- Single `<h1>` with `id="explore-heading"`, referenced by `aria-labelledby`
  on the hero section
- Breadcrumb: `<nav aria-label="Breadcrumb">` with `<ol>` and `aria-current`
- Mood filter bar: `role="navigation"` + `aria-label="Browse by mood"`
- Active theme chips and idea cards: `aria-current="page"`
- Idea card gradient header bands: `aria-hidden` (decorative gradient + badge)
- Destination card gradient headers: **not** `aria-hidden` — city name is
  meaningful text readable by screen readers
- "In focus" badge: visible to all (not aria-hidden)
- Quick-link chips on destination cards: descriptive text labels ("Flights",
  "Hotels", "Cars")
- Next step cards: `<h3>` title + description + CTA, focus-visible ring
- Handoff tiles: descriptive label + sub-text
- Focus-visible rings on all interactive elements (`focus-visible:ring-2`)
- No color-only meaning

## Responsive notes

- Hero: single column, generous padding, full-bleed gradient (no Page container)
- Mood bar: sticky `top-0`, horizontal scroll, `whitespace-nowrap` chips
- Ideas grid: 1 col → 2 (sm) → 3 (lg)
- Destinations grid: 1 col → 2 (sm) → 3 (lg)
- Next steps grid: 1 col → 2 (sm) → 4 (lg)
- Handoff tiles: 1 col → 3 (sm)
- `max-w-6xl` on all content sections; no horizontal overflow
- No `Page` shell wrapper — content renders directly into the root layout's
  `<main>` slot

## Sample/preview cleanup

`src/components/dev/explore/` kept as historical reference per convention.
**No production import from `src/components/dev/`** — verified with grep.
The production route imports only from `~/lib/search/flights/routing`.

The `ExplorePresetChips` component (`src/components/explore/ExplorePresetChips.tsx`)
is no longer imported by the explore route but remains in the codebase.
The `HeroBackground` component (`src/components/hero/HeroBackground.tsx`) is
no longer imported by the explore route but remains used by
`VerticalHeroSearchLayout`.

## Deferred work

- Real photography in idea/destination card header slots (80px/72px bands
  accept `background-image:url(...)` without layout changes)
- `/explore?destination=<key>` pages for destinations not yet in
  `POPULAR_DESTINATIONS` (would require new data entries)
- Per-idea/per-theme visual differentiation within card bands (could use
  palette-specific accent overrides once a design direction is chosen)
- ExplorePresetChips removal/repurposing decision (currently orphaned but
  harmless)
- Destinations page redesign (CLAUDE-UI-023 and beyond)

## Verification results

- `npm run build.types`: only the pre-existing `src/lib/db/client.server.ts(91,5)`
  SSL error — zero new errors ✓
- `npx vite build`: `✓ built in 4.30s` ✓
- `/explore` → 200 ✓
- `/explore?theme=beach` → 200, bannerText "Showing beach-inspired trip ideas" ✓
- `/explore?theme=mountains` → 200 ✓
- `/explore?idea=quick-mountain-escapes` → 200, bannerText confirmed ✓
- `/explore?destination=miami` → 200, bannerText "Showing trip paths for Miami" ✓
- H1: "Discover where to go next" ✓
- Metadata: `index,follow` (no noindex leak) ✓
- No `x-robots-tag` on production `/explore` ✓
- `/dev/ui-explore` still has `x-robots-tag: noindex, nofollow` ✓
- All 16 required dev/production routes → 200 ✓
- No production import from `src/components/dev/` ✓
- `/destinations`, `/hotels`, `/flights`, `/car-rentals` unaffected ✓
