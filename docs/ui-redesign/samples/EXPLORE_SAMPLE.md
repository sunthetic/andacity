# Explore Page Sample

CLAUDE-UI-021 — preview-only concept for `/explore`.
Rendered at `/dev/ui-explore`. **Not production.** The production `/explore`
route has not been changed.

## Purpose

Propose a premium, cinematic redesign of the Explore page that shifts the feel
from a functional link-list to a discovery-first editorial surface — while
preserving every real URL, filter behaviour, and booking path the current page
already has.

Design thesis: **"Discover where to go next, then turn that inspiration into a
whole-trip plan."**

## Current /explore observations

Reviewed `src/routes/explore/index.tsx` (1 423 lines):

- Built on the legacy `Page` shell + `--color-*` tokens (not the `--ui-*`
  system used across `/`, `/hotels*`, `/flights*`, and `/car-rentals*`).
- All data is static inline — no `routeLoader$`, no DB dependency. Every link
  targets a real existing route.
- Three URL filter params: `?theme=<key>`, `?idea=<key>`, `?destination=<key>`.
  Each drives a "guided mode" that promotes contextual next steps to the top.
- Strengths: thorough data, real booking links, clean state machine, good URL
  sharing. Weakness: visual treatment is understated — feels like an internal
  link board rather than an editorial travel surface.

## Proposed direction

A cinematic hero, a sticky mood-filter bar, editorial idea cards with gradient
header bands, visually rich destination cards, and a whole-trip handoff panel —
all on the `--ui-*` system. Guided mode behaviour is preserved and enhanced.

Section order in the sample:

1. Cinematic hero
2. Sticky mood filter bar (8 themes, horizontal scroll on mobile)
3. Guided context: suggested next steps (only when `?theme`, `?idea`, or `?destination` active)
4. Trip ideas (6 editorial cards)
5. Popular destinations (6 destination cards, priority-sorted by active filter)
6. Default next steps (only when no active filter — shown at bottom)
7. Whole-trip handoff panel

## Cinematic hero concept

Full-bleed `--ui-hero` gradient band with `--ui-hero-scrim` overlay. No image
file required — the gradient system provides the cinematic feel. Generous
padding (`py-20 md:py-28`).

Default mode copy:
- Eyebrow: "EXPLORE"
- H1: **"Discover where to go next"**
- Subtitle: "Browse trips by mood, season, or budget — then turn inspiration into a whole-trip plan."

Guided mode copy (when `?theme`, `?idea`, or `?destination` is active):
- Eyebrow: "EXPLORE · GUIDED"
- H1: **"Exploring trips that match your selection"**
- Glass panel: active filter banner text + "Clear selection" link back to `/dev/ui-explore`

Both use `#fff` primary text + `rgba(255,255,255,0.82)` secondary text on the
scrim-overlaid gradient. No external image dependencies.

## Sticky mood filter bar concept

Always-visible sticky bar below the hero. Eight `?theme=<key>` chip links:

| Key | Label |
|---|---|
| `beach` | Beach escapes |
| `mountains` | Mountain getaways |
| `weekend-cities` | Weekend cities |
| `warm-weather` | Warm weather |
| `luxury` | Luxury stays |
| `budget` | Budget trips |
| `family` | Family travel |
| `solo` | Solo escapes |

Active chip: `--ui-primary` background + `--ui-on-primary` text. Default chip:
`--ui-surface` + `--ui-border`. Horizontal scroll on mobile; fits in ~900px on
desktop. "Clear" link appears when any theme is active.

**Design direction change from production:** The production page renders 8 small
vibe cards in a grid section ("Browse by vibe"). The sample replaces this grid
with the sticky bar, which keeps the filter available throughout scrolling and
avoids the redundancy of a grid that duplicates the chips. The eight moods remain
fully accessible; they just live in the persistent bar instead of a mid-page
section.

In the dev preview, all chip links target `/dev/ui-explore?theme=<key>` so
filtering works in the sample. In production they would target `/explore?theme=<key>`.

## Trip ideas concept

Six editorial cards in a 1/2/3 column responsive grid. Each card:

- `--ui-hero` gradient header band (80px, rounded top corners only) — atmospheric
  visual without any image file
- "Flexible idea" badge in the bottom-left of the band
- Below: title (bold, 16px), description (14px muted), "Explore idea →" CTA
- `--ui-shadow-card` + 1px border default; `--ui-primary` 2px border + `--ui-shadow-panel` active

Active idea (via `?idea=<key>`) marked with `aria-current="page"` and primary border.

In the dev preview, idea links target `/dev/ui-explore?idea=<key>`. In
production they would target `/explore?idea=<key>`.

## Destination cards concept

Six destination cards in a 1/2/3 column grid, priority-sorted when an active
filter has `destinationSlugs`. Each card:

- `--ui-hero` gradient header (72px) with the city name in white overlaid at
  bottom-left — editorial pull-quote style
- "In focus" badge shown when `?destination=<key>` matches
- Below: blurb, three quick-link chips (Flights, Hotels, Cars), primary action
  link, "Use in Explore" link

"Use in Explore" links target `/dev/ui-explore?destination=<key>` in the sample
(real `/explore?destination=<key>` in production).

All booking links (Flights, Hotels, Cars, primary action) point to **real
production booking surfaces** — not dev URLs. The sample demonstrates real
navigation intent.

## Guided next steps concept

When guided mode is active (`?theme`, `?idea`, or `?destination`), a four-card
"Suggested next steps" grid is promoted to the top of the page (after the hero)
with context-specific content from the active filter's `nextSteps` array.

Each step card: primary-coloured accent bar, bold title, muted description,
coloured CTA. Clean `--ui-surface` + `--ui-shadow-card`.

Default mode: the same grid appears at the **bottom** of the page with the four
generic booking-vertical next steps (Flights / Hotels / Car Rentals / Destinations).

This matches the production behaviour (guided steps surface at top; default
steps surface at bottom) with a more premium visual treatment.

## Whole-trip handoff concept

A full-width `--ui-hero` panel at the bottom of the page (inside `max-w-6xl`).
Three transparent tiles inside it: Search Flights, Browse Hotels, Compare Cars.
Each links to the real production booking surface. Same glass-tile treatment
used in the car-rentals-city hero panel.

Copy: "Turn inspiration into a whole-trip plan. Pick a vertical to start —
flights, hotels, or car rentals."

## Data and URL strategy

All data in `src/components/dev/explore/exploreSampleData.ts` mirrors the
production page data exactly:

- 8 themes, 6 ideas, 6 destinations
- All `nextSteps`, `popularTitle`, `popularDescription`, `contextBanner` fields
- Pre-computed flight hrefs using the real URL format
  (`/search/flights/from/anywhere/to/<slug>/round-trip/1`)

No fabricated data. No invented booking links. No fake prices. The sample is a
visual direction, not a data prototype.

## Photography/image strategy

No remote images. No local image files. The `--ui-hero` CSS gradient serves as
the atmospheric visual element in the hero, idea card bands, destination card
bands, and handoff panel. This keeps the sample palette-agnostic and fully
operational across all 6 colour palettes × light/dark without any image changes.

In production, real photography could be introduced behind the same 80px/72px
header slots without layout changes.

## Responsive behavior

- Hero: single column, generous padding, full-bleed gradient
- Mood bar: sticky, horizontal scroll, `whitespace-nowrap` chips
- Ideas grid: 1 col → 2 (sm) → 3 (lg)
- Destinations grid: 1 col → 2 (sm) → 3 (lg)
- Next steps grid: 1 col → 2 (sm) → 4 (lg)
- Handoff tiles: 1 col → 3 (sm)
- `max-w-6xl` on all content sections; no horizontal overflow

## Accessibility notes

- Single `<h1>` per page; sections use `<h2>`/`<h3>` in order
- Breadcrumb is a labelled `<nav><ol>` with `aria-current="page"` on the
  current item
- Mood filter bar has `role="navigation"` and `aria-label="Browse by mood"`
- Active chips/cards have `aria-current="page"`
- Gradient header bands in cards are `aria-hidden` (decorative)
- Focus-visible rings on all interactive elements (`focus:outline-none
  focus-visible:ring-2`)
- No colour-only meaning

## SEO notes

This sample is `noindex, nofollow` and 404s on the production host via the
standard `shouldIndex(url)` gate. The production `/explore` route is unchanged —
its canonical, meta description, Open Graph tags, and indexability are
unaffected.

When the production implementation is approved, the description can be updated
from the generic "Discover trips by mood, season, or budget…" to match the new
discovery-first framing.

## Implementation boundary

This task adds preview-only files:

- `src/routes/dev/ui-explore/index.tsx`
- `src/components/dev/explore/ExploreSample.tsx`
- `src/components/dev/explore/exploreSampleData.ts`
- `docs/ui-redesign/samples/EXPLORE_SAMPLE.md`

It does **not** touch `src/routes/explore/index.tsx` or any production
component, route, or shared data file. No production import from
`src/components/dev/`. No map dependencies, remote tiles, API keys, or image
files added. The pre-existing DB SSL TypeScript error is untouched.

## Preview route

`/dev/ui-explore` — cinematic explore concept, behind the standard `/dev/ui-*`
gate (`shouldIndex` → 404 on the production host) with `x-robots-tag: noindex,
nofollow` and an amber "not production" banner.

Theme/idea/destination filtering works in the preview:

```
/dev/ui-explore?theme=beach
/dev/ui-explore?theme=luxury
/dev/ui-explore?idea=quick-mountain-escapes
/dev/ui-explore?destination=miami
```

## User decisions needed

1. **Mood bar vs. vibe grid** — the sample replaces the "Browse by vibe" card
   grid with a sticky mood bar. Confirm this navigation model, or request the
   grid back (or both).
2. **Gradient-band card headers** — the `--ui-hero` gradient bands on idea and
   destination cards use the palette's own gradient. Confirm this as the image
   strategy (no real photography needed), or request space for real photos.
3. **Editorial "Flexible idea" badge** — a tonal badge in the gradient band
   labels each idea card. Confirm, or drop it for a cleaner band.
4. **Production URL scheme** — in production, all filter links (theme chips, idea
   cards, "Use in Explore") would target `/explore?...`. Confirm this, or
   consider a new discovery-dedicated URL (`/discover?...`).

---

**Explore page sample ready for review at `/dev/ui-explore`.**

Options:
1. Approve this direction (proceed to CLAUDE-UI-022 — Explore Page Implementation).
2. Reject this direction and request a different concept.
3. Modify this direction with specific changes.

No production explore page implementation has been applied yet.

Recommended next task after approval:
CLAUDE-UI-022 — Explore Page Implementation
