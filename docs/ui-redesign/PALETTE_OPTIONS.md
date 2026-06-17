# Andacity Palette + Visual Direction Options

> **Task ID:** CLAUDE-UI-001
> **Status:** Design direction / palette exploration / preview samples only. **No production page has been rewritten.**
> **Prerequisite:** CLAUDE-UI-000 (audit) complete.
> **In-app preview:** [`/dev/ui-palettes`](../../src/routes/dev/ui-palettes/index.tsx) — `noindex`, gated off the production host. Renders all six directions as self-contained mini-mocks (header, hero, search panel, hotel/flight/car/destination cards, result+filter surface, CTA, footer, mobile frame).

---

## Purpose

Give the user a concrete, side-by-side choice of visual direction **before** any UI-system foundation or page rewrite begins. Each direction is a complete palette + treatment system (color, type, surface, photography, motion intent) evaluated against:

- the **redesign thesis** — *calm confidence for the whole trip; photography-first; editorial typography; depth via light/shadow rather than borders and gradient fills; one decisive accent color; quiet trust signals; emotionally compelling like a premium travel magazine and fast/legible like Google Flights*; and
- **brand/logo compatibility** with the existing Andacity mark.

This document is the decision surface. The in-app preview is the visual companion. Nothing here is wired into production tokens.

---

## Brand/logo reconciliation

### What the current mark is
[public/assets/logo/andacity-primary-color_mark-darkword_transparent.svg](../../public/assets/logo/andacity-primary-color_mark-darkword_transparent.svg) — a sun + orbit mark:
- **Amber sun** `#F59E0B`
- **Teal orbit** gradient `#14B8A6 → #0EA5A0`
- **Wordmark** "Anda" slate `#0F172A` + "city" teal `#14B8A6`, set in **Open Sans 700**

The live default theme (B1) is **Sky Blue `#2563EB` + Coral `#F97316`** on **Poppins/Lexend** — so today the product palette and the logo do not agree. The closest existing theme to the logo is **B2 Ocean Teal + Sun Gold**.

### The tradeoff
There are two competing pulls:

1. **Logo continuity (low risk).** Teal + amber is a warm, friendly, ownable identity. Building the UI from it keeps brand equity, avoids a logo redo, and reads as "approachable premium." Teal is under-used by the big OTAs (who skew blue/Expedia, dark-blue/Booking, yellow/Hopper), so it is differentiating. Risk: teal+amber can read "fintech/eco" rather than "aspirational travel" if executed flatly, and amber is hard to use for large fills without feeling cheap.

2. **Stronger consumer-market positioning (higher brand risk).** A cooler "aviation premium" blue-glass system (Skyglass Luxe) or a warm, emotive sunset system (Sunset Atlas) can out-position the category on *feeling* and trust faster than teal can — but they pull away from the current mark and would eventually require a logo refresh.

### Recommendation
**Evolve the logo-adjacent identity rather than abandon it — but modernize it well beyond the current flat execution.** Specifically:

- **Adopt an ocean-teal + sun-gold + warm-ink + sand system as the default** (Option 6 — *Andacity Meridian*, or its purer-editorial cousin Option 5 — *Sandbar Editorial*). This honors the mark, is differentiating, and directly serves the "editorial + warm + photography-first" thesis.
- **Use the mark's teal as the primary action color and gold strictly as a single decisive accent** (price, deal, one CTA flourish) — never as a large fill. This fixes the "amber feels cheap at scale" risk.
- **Keep the sun + orbit concept; plan a later lightweight logo refresh** (CLAUDE-UI-011) to: tighten the mark for favicon scale, switch the wordmark off Open Sans onto the product heading face, and lock the logo palette to the chosen UI palette. **Do not change the logo in this task.**
- If the user instead prioritizes the boldest market break, **Skyglass Luxe** is the recommended divergence — but it must be paired with a committed logo-palette refresh so brand and UI don't fight.

Net: **logo-compatible direction recommended as default; a documented, deliberate divergence available if the user wants maximum category contrast.**

---

## Existing theme observations

From CLAUDE-UI-000, reconfirmed here as the foundation these directions must respect:

- **Tailwind v4 `@theme` tokens** in [src/styles/theme.css](../../src/styles/theme.css); global rules + component primitives in [src/styles/global.css](../../src/styles/global.css).
- **Five runtime themes (B1–B5)**, each with a full light palette and a `@media (prefers-color-scheme: dark)` override; switched client-side and persisted (`andacity-theme`).
- **Dark mode is OS-driven only** — there is no manual light/dark toggle, only the 5-swatch color picker.
- **FOUC-safe**: an inline pre-paint script in [src/root.tsx](../../src/root.tsx) applies the stored theme before first paint.
- **Token families already exist** for surfaces, text, borders, actions, accents (price/route/highlight), states, four shadow levels, glass (blur + translucent surfaces + highlight), radius, gradients, and hero overlays — so any chosen direction can be expressed as a values-only re-skin without changing component logic.
- **Type:** Lexend Variable (headings) + Poppins (body), self-hosted via Fontsource.
- **Cards/surfaces today** lean on tinted gradient fills, pill-everything radii, and inset accent bars (`shadow-[inset_3px_0_0_…]`) — the thesis calls for replacing these with light/shadow depth and quieter surfaces.
- **Known defects to fix during foundation (not here):** `--color-tertiary-*` referenced but undefined ([src/routes/index.tsx](../../src/routes/index.tsx)); `borde3r-b` typo in [src/components/site/Page.tsx](../../src/components/site/Page.tsx#L11).
- **Pre-existing, unrelated build blocker:** `TS2353` on `ssl` in [src/lib/db/client.server.ts](../../src/lib/db/client.server.ts#L91). Documented only; not fixed in this task.

Each direction below is expressible within this token architecture (notably: each maps onto `--color-bg/surface/panel`, `--color-text*`, `--color-action*`, `--color-price`, `--shadow-surface-*`, `--radius-*`, and the hero-overlay tokens).

---

## Option 1 — Skyglass Luxe

- **Emotional positioning:** Cool, precise, premium-aviation trust. "Google Flights, but beautiful." Confidence through clarity and air.
- **Primary colors:** Azure `#1E6AE1` (action), deep azure `#1854C0` (press/hover).
- **Secondary colors:** Ice cyan `#38BDF8`, glass white `rgba(255,255,255,0.72)`.
- **Neutral system:** Cool slate. Page `#F6F8FB`, surface `#FFFFFF`, muted `#EEF2F8`, border `rgba(15,23,42,0.10)`, ink `#0E1B2E`, ink-muted `#5A6B82`.
- **Accent colors:** Ice cyan for highlights; calm jade `#0E9F6E` reserved for positive/price-good states.
- **Gradient usage:** Minimal — a single azure→cyan wash on the hero scrim and one CTA band. No gradient fills on cards.
- **Button treatment:** Solid azure, white text, medium radius (`12px`), soft elevation; secondary = hairline-bordered glass.
- **Card/surface treatment:** Clean white cards, true depth via layered soft shadows + frosted-glass search panel over photography. No inset bars.
- **Typography recommendation:** Lexend (display) + Inter or Söhne-style grotesque (body). Tight, confident, lots of whitespace.
- **Photography/image treatment:** Bright, high-key, airy — window-seat skies, coastlines from above, glass architecture. Cool grade.
- **Best-fit travel mood:** Business + city + premium flight-led planning.
- **Logo compatibility:** **Low.** Blue fights the teal/amber mark; would need a logo-palette refresh.
- **Risks / downsides:** Can drift toward "generic SaaS/fintech blue"; least differentiated from Expedia/Booking unless executed with strong photography and restraint; weakest brand continuity.

---

## Option 2 — Sunset Atlas

- **Emotional positioning:** Warm, aspirational, vacation-forward. Desire and escape. The most *emotionally captivating* option.
- **Primary colors:** Coral `#FB5E3D` (action), deep coral `#E0481F` (hover).
- **Secondary colors:** Electric violet `#7C3AED`, sun amber `#F59E0B`.
- **Neutral system:** Warm. Page `#FBF6F1`, surface `#FFFFFF`, muted `#F4ECE5`, ink `#1B1726`, ink-muted `#6E6678`, deep-navy base `#16162B` for inverse/footer sections.
- **Accent colors:** Amber for price/deal; violet for discovery/explore surfaces.
- **Gradient usage:** Signature — coral→violet (and amber) on heroes and discovery; used as *emotional photography companions*, not on functional cards.
- **Button treatment:** Solid coral, white text, rounded `14px`, warm glow shadow.
- **Card/surface treatment:** Warm-white cards, generous imagery, soft shadow; violet/amber used as tiny accents only.
- **Typography recommendation:** High-contrast serif display (Fraunces / Canela) + grotesque body — true magazine pairing.
- **Photography/image treatment:** Golden-hour, saturated, people-in-place, beaches and skylines at dusk.
- **Best-fit travel mood:** Leisure, couples, beach/escape, discovery-led.
- **Logo compatibility:** **Medium-low.** Amber agrees with the mark's gold, but coral/violet diverge from teal.
- **Risks / downsides:** Most polarizing; coral+violet can tip "trendy/consumer-app" and date faster; harder to keep "calm" — needs disciplined neutrals and whitespace to avoid loudness; accessibility care needed on coral text.

---

## Option 3 — Alpine Signal

- **Emotional positioning:** Grounded, trustworthy, outdoors. Clean mountain air; dependable adventure.
- **Primary colors:** Pine `#157A5B` (action), deep pine `#0C4A39` (hover).
- **Secondary colors:** Ice blue `#7FB7D9`, glacier `#BFE3F0`.
- **Neutral system:** Warm stone. Page `#F4F3EF`, surface `#FFFFFF`, muted `#ECEAE3`, ink `#15201C`, ink-muted `#5C6660`, border `rgba(21,32,28,0.12)`.
- **Accent colors:** Ice blue highlights; a restrained safety-orange `#EA6A1E` strictly for signal/alerts.
- **Gradient usage:** Very low — at most a pine→glacier hero scrim. Flat, calm surfaces.
- **Button treatment:** Solid pine, white text, `12px` radius, understated elevation.
- **Card/surface treatment:** Matte stone surfaces, crisp hairlines, photography-forward; feels tactile and quiet.
- **Typography recommendation:** Sturdy humanist grotesque (e.g., Lexend display + Inter body); functional, legible.
- **Photography/image treatment:** Cool daylight, mountains, fjords, trails, national parks; natural and un-saturated.
- **Best-fit travel mood:** Outdoor, road-trip/cars, adventure, family-active.
- **Logo compatibility:** **Medium.** Green is teal-adjacent and the mark's amber can survive as the signal accent.
- **Risks / downsides:** Can read "eco/REI/banking-green" rather than aspirational travel; least "luxury"; green CTAs can feel utilitarian; narrower mood fit (weaker for city/beach/luxury).

---

## Option 4 — Midnight Terminal

- **Emotional positioning:** Cinematic, premium night-travel energy. The "first-class lounge at 11pm" feeling. Bold and modern.
- **Primary colors:** Electric blue `#4F86FF` (action), bright `#6AA0FF` (hover).
- **Secondary colors:** Violet `#8B5CF6`, cyan glow `#22D3EE`.
- **Neutral system:** **Dark-first.** Base `#0B0E1A`, surface `#161C2E`, elevated `#1E2640`, ink `#E7ECF5`, ink-muted `#9AA6BD`, hairline `rgba(231,236,245,0.12)`.
- **Accent colors:** Mint `#34D399` for price/positive; violet for discovery; subtle neon glows.
- **Gradient usage:** Cinematic — electric-blue→violet glows on heroes/CTAs; used as light sources, not decoration.
- **Button treatment:** Luminous electric-blue, dark text or white, `12px`, soft outer glow.
- **Card/surface treatment:** Layered dark glass; depth via luminosity and shadow; imagery pops against dark chrome.
- **Typography recommendation:** Tight modern grotesque (Space Grotesk / Lexend display) + clean body; high contrast on dark.
- **Photography/image treatment:** Night cities, runways at dusk, neon, aerials after dark; moody, contrasty.
- **Best-fit travel mood:** Premium city, nightlife, business travel, "wow" marketing surfaces.
- **Logo compatibility:** **Low-medium.** Needs a light/teal-on-dark logo lockup; current mark won't sit on dark cleanly.
- **Risks / downsides:** Dark-first complicates the indexable, content-heavy SEO pages (destination guides read better light); accessibility/contrast vigilance required throughout; can feel "gamer/crypto" if glows overused; would likely need a light counterpart for content pages → two systems to maintain.

---

## Option 5 — Sandbar Editorial

- **Emotional positioning:** Quiet luxury, editorial calm. A premium travel magazine you trust. The purest expression of the thesis.
- **Primary colors:** Ocean teal `#0E7C73` (action), deep teal `#0B5F58` (hover).
- **Secondary colors:** Terracotta/clay `#C4683C` (sparing), warm ink.
- **Neutral system:** Sand + warm white. Page `#FAF7F1`, sand panel `#F1E9DC`, surface `#FFFFFF`, ink `#14110D` (warm near-black), ink-muted `#6B6256`, border `rgba(20,17,13,0.12)`.
- **Accent colors:** Teal as the single decisive accent; clay reserved for deal/editorial flourishes; price set in ink for restraint.
- **Gradient usage:** Almost none — flat editorial surfaces; photography carries the color. (Directly answers "depth via light/shadow, not gradient fills.")
- **Button treatment:** Solid teal, warm-white text, restrained radius (`10–12px`), subtle shadow; secondary = ink hairline.
- **Card/surface treatment:** Warm-white cards on sand, generous margins, big type, full-bleed imagery; understated and confident.
- **Typography recommendation:** Editorial serif display (Spectral / Fraunces) + clean grotesque body — the strongest magazine pairing.
- **Photography/image treatment:** Full-bleed documentary/editorial, warm muted grade, real places and textures.
- **Best-fit travel mood:** Discovery, destination guides, hotels, slow/considered travel — and it makes the indexable SEO content pages genuinely beautiful.
- **Logo compatibility:** **High.** Ocean teal matches the mark; sand/ink are warm complements; amber can live as the deal accent.
- **Risks / downsides:** Serif-led editorial demands disciplined layout and real photography to avoid feeling plain; less overtly "techy/fast" than blue options (mitigated by tight grotesque body + crisp interactions); clay accent must be used sparingly.

---

## Option 6 — Andacity Meridian

- **Emotional positioning:** Practical premium consumer travel, built from the brand. Warm, confident, trustworthy — "approachable premium." The logo-native evolution.
- **Primary colors:** Ocean teal `#0F766E` (action), deep teal `#0C5F58` (hover); brand-bright teal `#14B8A6` for accents/focus glow.
- **Secondary colors:** Sun gold `#F2A516` / `#F59E0B` (the mark's amber), used as the **single decisive accent**.
- **Neutral system:** Warm white + soft sand + ink navy. Page `#FBF8F2`, sand `#F3ECDD`, surface `#FFFFFF`, ink navy `#0F2433`, ink-muted `#5C6B6A`, border `rgba(15,36,51,0.12)`.
- **Accent colors:** Gold for price/deal and one CTA flourish; bright teal for focus/active; nothing else competes.
- **Gradient usage:** Low and purposeful — teal→deep-teal on the primary CTA and a teal→gold hero scrim; never on functional cards.
- **Button treatment:** Solid teal, white text, `12–14px` radius, soft elevation; gold used only on the highest-intent CTA or price chip; secondary = teal hairline.
- **Card/surface treatment:** Warm-white cards on sand, soft shadow depth, photography-forward; gold price as the eye-anchor.
- **Typography recommendation:** Lexend (display) + a warm grotesque body (General Sans / Inter) — keeps current heading equity, warms the body voice beyond Poppins.
- **Photography/image treatment:** Warm, inviting, natural light; coastal + city + people; balanced (not as moody as Midnight, not as saturated as Sunset).
- **Best-fit travel mood:** All-round consumer travel across all four verticals; strongest "whole-trip" generalist.
- **Logo compatibility:** **Very high.** Built directly from the mark's teal `#14B8A6` + amber `#F59E0B`.
- **Risks / downsides:** Closest to existing theme B2, so it must be executed with markedly better photography, type, and spacing or it risks looking like "B2 again"; gold discipline is essential (large gold fills read cheap); slightly less category-contrast than the bolder cool options.

---

## Comparison matrix

| Dimension | 1 · Skyglass Luxe | 2 · Sunset Atlas | 3 · Alpine Signal | 4 · Midnight Terminal | 5 · Sandbar Editorial | 6 · Andacity Meridian |
|---|---|---|---|---|---|---|
| Base scheme | Light, cool | Light, warm | Light, stone | **Dark-first** | Light, warm | Light, warm |
| Primary action | Azure `#1E6AE1` | Coral `#FB5E3D` | Pine `#157A5B` | Electric blue `#4F86FF` | Teal `#0E7C73` | Teal `#0F766E` |
| Decisive accent | Ice cyan | Amber/violet | Ice blue | Mint/violet glow | Teal (+clay) | **Sun gold** |
| Emotional pull | Med-high | **Highest** | Medium | High (bold) | High (quiet) | High (warm) |
| Trust/legibility | **Highest** | Medium | High | Medium (dark) | High | High |
| Photography fit | Airy/cool | Golden/saturated | Natural/cool | Moody/night | **Editorial/warm** | Warm/balanced |
| Thesis alignment | High | Med-high | Medium | Medium | **Highest** | **High** |
| SEO-content fit (light guides) | High | High | High | **Low** (dark) | **Highest** | High |
| Logo compatibility | Low | Med-low | Medium | Low-med | High | **Very high** |
| Brand risk | High | Med-high | Medium | High | Low | **Lowest** |
| Category differentiation | Low | High | Medium | High | Med-high | Med-high |
| Best vertical fit | Flights/city | Beach/discovery | Cars/outdoor | City/nightlife | Hotels/discovery | **All-round** |
| Maintenance cost | Low | Med | Low | **High** (dual light/dark) | Low | Low |

---

## Recommended top 2 directions

**These two give the user a genuine warm-vs-cool, continuity-vs-bolder choice — both viable, with clearly different risk profiles.**

### 1) Andacity Meridian (recommended default)
- **Why:** Highest logo compatibility and lowest brand risk, while still serving the thesis (warm, photography-first, one decisive accent in gold, calm trust). Works across all four verticals and keeps the content-heavy SEO pages light and readable. Best "whole-trip generalist."
- **The watch-out:** Must visibly out-execute the current B2 theme through photography, type scale, spacing, and gold discipline.
- **Pairs with:** keep the mark now; light logo refresh later (CLAUDE-UI-011).

### 2) Skyglass Luxe (recommended bolder alternative)
- **Why:** Strongest pure "fast, legible, premium-trust" positioning — the most direct answer to the "Google-Flights-fast" half of the thesis, and the cleanest path to a modern, confident product feel.
- **The watch-out:** Lowest logo compatibility — choosing it means committing to a logo-palette refresh so brand and UI agree.
- **Pairs with:** a planned logo evolution toward cool blue/glass.

**Honorable mention — Sandbar Editorial:** the *purest* thesis match (and High logo compatibility). If the user's priority is "premium travel-magazine feel" over "all-round generalist," Sandbar is the strongest single direction; Meridian is essentially Sandbar with the brand's gold accent and Lexend (vs. serif) display. A **Meridian × Sandbar hybrid** (Meridian palette + Sandbar's editorial serif display + flat surfaces) is a strong "combine" candidate.

---

## User decision needed

A direction must be chosen before CLAUDE-UI-002 (UI System Foundation) can define production tokens. Specifically, the user should decide:

1. **Which direction** (one of the six, or a hybrid).
2. **Brand stance:** keep the logo and evolve the palette from it (favors Meridian/Sandbar), or accept a future logo refresh for a bolder break (Skyglass/Sunset/Midnight)?
3. **Default scheme:** light-first (recommended for SEO content pages) vs. dark-first (Midnight) — and whether a manual light/dark toggle should be added alongside the chosen palette.
4. **Type direction:** retain Lexend display (Meridian/Skyglass/Alpine) or move to an editorial serif display (Sandbar/Sunset).

See the in-app preview at [`/dev/ui-palettes`](../../src/routes/dev/ui-palettes/index.tsx) to compare all six as live mini-mocks.

---

## Verification results

Commands available in [package.json](../../package.json): `npm run build.types`, `npm run build`, `npm run lint`, `npm run test`.

This task added **a docs file, a preview route, and a preview component** only; it modified **no production page or the global shell**, and changed no shared tokens. The preview route is `noindex` and 404s on the production host (via `shouldIndex`), so it cannot ship publicly.

- **`npm run build.types`** → exits non-zero with exactly **one** error: the **pre-existing** `TS2353` on `ssl` in [src/lib/db/client.server.ts](../../src/lib/db/client.server.ts#L91). This is unrelated to CLAUDE-UI-001 and was **not fixed here** (per instructions). The new files (`src/components/dev/PalettePreview.tsx`, `src/routes/dev/ui-palettes/index.tsx`) contribute **zero** type errors.
- **`npm run build`** → exits `1` because Qwik's build runs the same type check and throws on that one pre-existing error. **However, the client (Vite) bundle compiles successfully** in the same run: `✓ 810 modules transformed`, chunks + font assets emitted to `dist/`. Since a JSX/Qwik error in the new preview files would have failed the Vite transform, this confirms the preview route and component are valid and bundle cleanly. No lint/Qwik-plugin errors reference the new files.
- **Net:** the only blocker is the documented pre-existing DB SSL type error; this task introduces no new type, lint, or build regressions, and changed no production page, the global shell, or shared tokens.
