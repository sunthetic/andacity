# Home Page Implementation

> **Task ID:** CLAUDE-UI-006
> **Status:** Production implementation. **The production home page (`/`) has been replaced.** No other production page was rewritten.
> **Prerequisites:** CLAUDE-UI-000 → CLAUDE-UI-005 (approved home page sample) complete.

---

## Approved direction

Per the CLAUDE-UI-005 approval decisions, this task implements:

- The cinematic, whole-trip home page direction.
- Headline: **"Your whole trip, beautifully simple."**
- The **4-vertical search module**: Flights, Hotels, Cars, Destinations.
- **Destinations** as a real discovery/search intent (not just a vertical-entry link).
- The illustrative price-clarity surface — strengthened wording (see _Trust and conversion implementation_) so it cannot be mistaken for a live quote.
- The editorial inspiration section.
- The photography-first strategy using the `--ui-hero` gradient placeholder (no real imagery sourced yet — documented below).
- The production CLAUDE-UI-004 global shell, untouched.
- No other page rewrites.

---

## Production files changed

| File                                                                                                         | Change                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/components/home/HomePage.tsx](../../src/components/home/HomePage.tsx)                                   | **New.** Production page composition (hero → final CTA), promoted from the CLAUDE-UI-005 sample.                                                                                                  |
| [src/components/home/HomeSearchModule.tsx](../../src/components/home/HomeSearchModule.tsx)                   | **New.** Production 4-tab search module. Flights/Hotels/Cars render the real `FlightsSearchCard`/`HotelSearchCard`/`CarRentalSearchCard`; Destinations renders real `/explore?theme=` vibe links. |
| [src/components/home/homeContent.ts](../../src/components/home/homeContent.ts)                               | **New.** Production content data (vertical entries, destinations, popular routes, value props, editorial, destination vibes).                                                                     |
| [src/routes/index.tsx](../../src/routes/index.tsx)                                                           | **Rewritten.** Now renders `<HomePage />`. The `head: DocumentHead` export is **byte-for-byte unchanged** (title, description, canonical, OG/Twitter, OG image).                                  |
| [src/components/search-entry/GlobalSearchEntry.tsx](../../src/components/search-entry/GlobalSearchEntry.tsx) | **Deleted.** Its only consumer was the old `routes/index.tsx`; confirmed zero other importers and zero test coverage before removal — same precedent as `ThemeSwitcher.tsx` in CLAUDE-UI-004.     |

**Not touched:** `src/components/dev/home/*` and `src/routes/dev/ui-home/index.tsx` (the CLAUDE-UI-005 sample is left exactly as-is, as a historical reference — same precedent as `/dev/ui-shell` after CLAUDE-UI-004); the global shell (`SiteHeader`/`SiteFooter`/`layout.tsx`); `HeroBackground` (still used by `/explore` and other pages); `FlightsSearchCard`/`HotelSearchCard`/`CarRentalSearchCard` (used as-is, unmodified); every other route.

---

## Hero implementation

[HomePage.tsx](../../src/components/home/HomePage.tsx) `Hero`:

- Full-bleed band using the active palette's `--ui-hero` gradient + `--ui-hero-scrim` for guaranteed text legibility (no remote image dependency).
- One `<h1>` — **"Your whole trip, beautifully simple."** — eyebrow `Flights · Hotels · Cars · Destinations`, subhead framing the inspiration→itinerary promise.
- The search module sits directly beneath, then a quiet trust row reusing `FOOTER_TRUST` from [siteNav.ts](../../src/components/site/siteNav.ts) so the hero and footer never make different claims.
- The CLAUDE-UI-005 sample's inline "Photography direction: … see sample doc" caption was **removed** for production — that was internal design commentary, inappropriate for customer-facing copy (it would have been the kind of "developer/SEO copy" the task explicitly says to avoid). The same information now lives only in this doc.

---

## Search module implementation

[HomeSearchModule.tsx](../../src/components/home/HomeSearchModule.tsx) — the central functional change from the sample:

- **Flights / Hotels / Cars tabs** render the **real, existing** canonical search cards with the exact contract the legacy `GlobalSearchEntry` used:
  ```tsx
  <FlightsSearchCard surface="plain" submitBehavior="canonical-route" autoResolveOriginLocation={true} />
  <HotelSearchCard surface="plain" submitBehavior="canonical-route" />
  <CarRentalSearchCard variant="hero" surface="plain" submitBehavior="canonical-route" />
  ```
  Submission behavior is therefore **proven and unchanged** — these are the same forms that already power `/flights`, `/hotels`, and `/car-rentals`, validated in production before this task.
- **Destinations tab** is a real discovery intent, not a placeholder: four mood chips (`role="radiogroup"`, single-select) — Beach escapes, Weekend cities, Warm weather, Mountain getaways — route to **`/explore?theme=<key>`**, the existing, already-shipped filter on `src/routes/explore/index.tsx` (`ThemeKey`). A "Browse all destinations" link goes to `/destinations`. Verified live: `/explore?theme=beach` renders "Showing beach-inspired trip ideas" — this is a genuinely functional filter, not a dead end.
- **`id="global-search-entry"` preserved exactly.** The header's existing search affordances (`SEARCH_HREF = "/#global-search-entry"` in [siteNav.ts](../../src/components/site/siteNav.ts)) and `MyTripsAccessFallback`/`getMyTripsPageModel`'s "start a new trip" links all continue to land on this module unchanged — verified live (`/flights/` renders `href="/#global-search-entry"`).
- **Tab/panel chrome is `--ui-*`**; the embedded real search-card forms still render with the legacy `--color-*` system — see _Deferred work_ for why this is the correct boundary for a home-page-only task.
- Accessible tab semantics throughout: `role="tablist"` → `role="tab"` (`aria-selected`, `aria-controls`) → `role="tabpanel"` (`aria-labelledby`); all four tab buttons are present in SSR output (verified) so the control works the instant Qwik resumes, independent of which tab is "active."

---

## Destination discovery implementation

`Discovery` section in [HomePage.tsx](../../src/components/home/HomePage.tsx): the same four cities the **legacy production home page already linked** — Miami, San Diego, New York, Orlando — now rendered as image-led `DestinationCard`s instead of plain text links, pointing at the identical existing routes (`/destinations/miami`, `/destinations/san-diego`, `/hotels/in/new-york`, `/car-rentals/in/orlando`). A "Browse all destinations" action links to `/destinations`.

---

## Popular routes/cities implementation

`PopularRoutes` section: six aspirational city pairs (flavor copy, e.g. "New York → Lisbon"), each linking to `/flights` — the existing flights hub. **Deliberately not deep-linked** to a specific fare: a real deep link (`buildCanonicalFlightSearchHref`) requires a _resolved_ `CanonicalLocation` pair **and** a specific date, which a static marketing list can't supply without inventing one. Generic linking to `/flights` avoids implying a specific bookable fare exists for an unverified route, while still being a real, valid, working path.

---

## Trust and conversion implementation

- **Price clarity:** kept from the approved sample, with **stronger non-live framing** for production (the sample was noindex/dev-gated; production is live and indexable, so the bar for "cannot be mistaken for a real quote" is higher):
  - Badge changed from "Illustrative" → **"Illustrative — not a live quote."**
  - Removed the specific city pair ("Typical New York → Lisbon") in favor of a **generic, route-agnostic** "Example round-trip price range" — this avoids any reading that Andacity has live New York–Lisbon fare data at that price.
  - Disclaimer strengthened to **"Example only — not tied to a specific route. Real prices come from a live search."**
- **Why Andacity:** four verifiable value props, unchanged from the sample (whole-trip planning, transparent total pricing, clear policies up front, save & compare) — all backed by existing product behavior, mirroring `FOOTER_TRUST`.
- **CTA hierarchy:** one repeated primary action ("Start a search" / vertical CTAs) at every natural decision point, secondary "Explore" paths for the undecided, ending in a final CTA band that hands off to the production `SiteFooter`.

---

## Photography/image strategy

No remote image dependency was introduced. Every photographic surface (hero, vertical-entry thumbnails, editorial cards) uses the active palette's `--ui-hero` gradient + scrim — the approved placeholder treatment (decision #5: _"gradient/image placeholders where real assets are not yet available"_).

**Future imagery needs (documented, not built):**

- 1 hero still (full-bleed, landscape, supports white overlay text).
- 4 vertical-entry thumbnails (Flights/Hotels/Cars/Destinations — small, 16:9-ish).
- 4 destination images for `DestinationCard` (`imageUrl` prop already supported — drop-in ready).
- 3 editorial images (1 feature-sized, 2 standard).
  All should be **self-hosted** (the existing CSP already restricts `img-src` to `'self' data: https:`; self-hosting avoids adding a new external host) and served as responsive AVIF/WebP with the hero eager-loaded and the rest lazy. `DestinationCard`/`HotelCard` already fall back to `--ui-hero` when `imageUrl` is omitted, so imagery can be added incrementally with zero structural change.

---

## SEO preservation notes

- `head: DocumentHead` in [src/routes/index.tsx](../../src/routes/index.tsx) is **unchanged** — same title, description, canonical, OG/Twitter tags, OG image (`/og/home.png`).
- Verified live: `<title>Andacity | Flights, Hotels, Car Rentals, and Discovery</title>`, `<link href="http://localhost:5174/" rel="canonical">`, `<meta content="index,follow,max-image-preview:large,..." name="robots">`, `<meta content=".../og/home.png" property="og:image">` — all render exactly as before.
- Exactly **one `<h1>`** on the page (verified by count).
- Internal links remain crawlable: every vertical, destination, and discovery link is a plain server-rendered `<a href>` (no client-only navigation) — `/flights`, `/hotels`, `/car-rentals`, `/explore`, `/destinations`, `/destinations/miami`, `/destinations/san-diego`, `/hotels/in/new-york`, `/car-rentals/in/orlando`.
- The page is fully server-rendered; Qwik's resumability model means all text content, headings, and links are present in the initial HTML (verified via raw `curl` — no client-side-only content).
- No `noindex` leaked onto `/` — confirmed `robots: index,follow,...` (the opposite of `/dev/ui-home`'s `noindex, nofollow`).

---

## Accessibility notes

- One `<h1>` (hero); section headings step down through `<h2>`/`<h3>` via `ResponsiveSection`.
- Search module: proper `role="tablist"` → `role="tab"` (`aria-selected`, `aria-controls`) → `role="tabpanel"` (`aria-labelledby`); Destinations mood chips use `role="radiogroup"` + `role="radio"` with `aria-checked`, mirroring the existing `ThemeController` pattern.
- Every interactive element carries a visible `focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]` (or the equivalent legacy focus ring inside the embedded search-card forms, unchanged from today's `/flights`/`/hotels`/`/car-rentals`).
- Decorative gradient/media layers are `aria-hidden="true"`.
- Mobile tap targets: tab buttons and CTA buttons use the same `px-4 py-2`/`px-6 py-3` sizing already verified ≥44px-equivalent in the CLAUDE-UI-004/005 shell and sample work.
- No horizontal-overflow-prone fixed pixel widths were introduced in the new files (checked: zero `w-[Npx]`/`min-w-[Npx]` patterns); all grids/flex layouts use responsive Tailwind utilities consistent with the rest of the `--ui-*` system.

---

## Responsive notes

Mobile-first, matching the approved CLAUDE-UI-005 breakpoints:

| Section                                     | Mobile                                      | Tablet                  | Desktop                                |
| ------------------------------------------- | ------------------------------------------- | ----------------------- | -------------------------------------- |
| Hero / search module                        | Stacked; tabs scroll horizontally if needed | Wider type, fields wrap | Left headline column, module max-w-5xl |
| Vertical entries / Discovery / Why Andacity | 1 col                                       | 2 col                   | 4 col                                  |
| Popular routes                              | 1 col                                       | 2 col                   | 3 col                                  |
| Price clarity                               | Stacked                                     | Stacked                 | 2 col side-by-side                     |
| Editorial                                   | 1 col                                       | feature + stacked       | feature spans 2×2, two side cards      |

The header is sticky/condensing (CLAUDE-UI-004, untouched) and the page body flows beneath it with no overlap.

---

## Sample/preview cleanup

Per precedent set in CLAUDE-UI-004 (where the CLAUDE-UI-003 `/dev/ui-shell` sample was **left untouched** after `SiteHeader`/`SiteFooter` were freshly written in `src/components/site/`), this task:

- **Left `src/components/dev/home/*` and `/dev/ui-home` completely untouched** — they remain a stable, frozen historical reference of the approved CLAUDE-UI-005 design direction, independent of any future production iteration.
- **Built fresh production files** in `src/components/home/` rather than moving/renaming the dev files, so the two can never silently drift into each other.
- **Deleted `GlobalSearchEntry.tsx`**, the one _production_ component made obsolete by this task (not a dev/ sample) — confirmed zero remaining importers and zero test coverage first, exactly mirroring the `ThemeSwitcher.tsx` removal precedent from CLAUDE-UI-004.
- Production never imported from `src/components/dev/` (confirmed by grep — the only matches are doc-comment mentions, not imports).

---

## Deferred work

1. **Real photography.** Documented above; gradient placeholders remain until assets are sourced.
2. **Search-card visual migration.** `FlightsSearchCard`/`HotelSearchCard`/`CarRentalSearchCard` still render with the legacy `--color-*` token system inside the new `--ui-*`-styled tab panel — exactly the same boundary that already exists today on `/flights`, `/hotels`, and `/car-rentals` (confirmed: those routes are 100% legacy-token, zero `--ui-*`). Migrating those shared forms would touch every page that embeds them — out of scope for a home-page-only task ("Do not begin other page rewrites"). Recommended as a focused follow-up once a vertical-page migration task is scheduled.
3. **Popular routes deep-linking.** Currently links generically to `/flights`; a true deep link needs a resolved `CanonicalLocation` + date pair per route, which isn't available to a static list — flagged for a future task if real "popular fare" data becomes available.
4. **`HomeDestinationVibe` key sync.** The vibe keys/labels in `homeContent.ts` are a small, independently-maintained mirror of `ThemeKey` in `src/routes/explore/index.tsx` (not imported directly, since route files aren't meant to be shared library modules). If `/explore`'s theme keys are ever renamed, this file needs a manual re-sync.
5. **Unified search overlay** — still deferred from CLAUDE-UI-004; the header search pill continues to link to `/#global-search-entry` rather than opening an in-place overlay.

---

## Verification results

- **`npm run build.types`** → exits non-zero with **exactly one** error: the **pre-existing** `TS2353` `ssl` in [src/lib/db/client.server.ts:91](../../src/lib/db/client.server.ts#L91) — unrelated, **not fixed** (per instructions). All new/changed home files type-check cleanly.
- **`npm run build`** → fails only on that same pre-existing check; the **client (Vite) bundle compiles cleanly: 908 modules transformed** (up from 895 at CLAUDE-UI-005), `✓ built in ~5s`.
- **ESLint** on all new/changed files (`src/components/home/*.tsx`, `*.ts`, `src/routes/index.tsx`) → **clean**, zero errors/warnings.
- **Dev smoke (`npm run dev`)** — all routes `200`:
  - `/` — indexable (`robots: index,follow,...`), exact title/canonical/OG preserved, exactly one `<h1>`, all four search tabs present in SSR, real `LocationAutosuggest`/`fromLocation`/`toLocation` form fields present (confirming the real `FlightsSearchCard` is rendering, not a placeholder).
  - `/flights`, `/hotels`, `/car-rentals`, `/explore`, `/destinations` — all `200`, unaffected.
  - `/explore?theme=beach` → `200`, renders "Showing beach-inspired trip ideas" — confirms the Destinations tab's vibe links are genuinely functional.
  - `/flights/` confirmed to still render `href="/#global-search-entry"` in its header search pill — CLAUDE-UI-004 shell compatibility intact.
  - `/dev/ui-home/`, `/dev/ui-shell/`, `/dev/ui-palettes/` — all `200` with `noindex, nofollow`, completely unaffected by this task.
- **Token audit:** zero `var(--color-*)` references in the three new production chrome files (`HomePage.tsx`, `HomeSearchModule.tsx`, `homeContent.ts`); 50 `var(--ui-*)` references across the two `.tsx` files. The embedded real search-card forms are the only legacy-token content, by design (see _Deferred work_).
- **Net:** the only blocker is the documented pre-existing DB SSL error; this task introduces no new type/build/lint regressions and touches no production page beyond `/`.
