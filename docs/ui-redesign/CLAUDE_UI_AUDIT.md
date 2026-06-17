# Andacity UI Reimagination Audit

> **Status:** Strategy + audit only. No UI has been rewritten as part of this task.
> **Scope:** Full consumer-facing UI reimagination strategy for Andacity.
> **Stack observed:** Qwik + Qwik City, Tailwind CSS v4 (`@theme` tokens), TypeScript, Drizzle/Postgres, Fastify adapter. Fonts: Poppins (body) + Lexend Variable (headings), self-hosted via Fontsource.
> **Task ID:** CLAUDE-UI-000

---

## Current route inventory

Routing is file-based under [src/routes/](../../src/routes/). Surfaces below are grouped by user intent. "Indexable" / "Noindex" reflect the actual robots behavior wired in [router-head.tsx](../../src/routes/router-head.tsx) and [src/routes/search/layout.tsx](../../src/routes/search/layout.tsx).

### Top-level & shell
| Route | File | Purpose | Index policy |
|---|---|---|---|
| `/` | [routes/index.tsx](../../src/routes/index.tsx) | Home: hero + global tabbed search + verticals grid + "Why Andacity" + popular destinations | Indexable (prod host only) |
| Global shell | [routes/layout.tsx](../../src/routes/layout.tsx) | Security headers + CSP, `SiteHeader`, `<main>`, `SiteFooter`, decisioning chrome (undo snackbar) | n/a |
| Header | [components/site/SiteHeader.tsx](../../src/components/site/SiteHeader.tsx) | Sticky glass header, Hotels mega-dropdown, primary nav, ThemeSwitcher, My Trips, Search | n/a |
| Footer | [components/site/SiteFooter.tsx](../../src/components/site/SiteFooter.tsx) | 4 link columns, trust/disclosure strip, social placeholders | n/a |

### Hotels vertical
| Route | File | Purpose | Index |
|---|---|---|---|
| `/hotels` | [routes/hotels/index.tsx](../../src/routes/hotels/index.tsx) | Hotels landing (hero search + city hub grid). Also handles `?search=1` → canonical redirect | Indexable |
| `/hotels/in` | [routes/hotels/in/index.tsx](../../src/routes/hotels/in/index.tsx) | Hotel city directory | Indexable |
| `/hotels/in/[citySlug]` | [routes/hotels/in/[citySlug]/index.tsx](../../src/routes/hotels/in/%5BcitySlug%5D/index.tsx) | Hotels-by-city guide | Indexable |
| `/hotels/[slug]` | [routes/hotels/[slug]/index.tsx](../../src/routes/hotels/%5Bslug%5D/index.tsx) | Hotel entity detail (legacy slug) | Indexable |
| `/hotels/stay/[...route]` | [routes/hotels/stay/[...route]/index.tsx](../../src/routes/hotels/stay/%5B...route%5D/index.tsx) | Canonical hotel entity detail | Indexable |
| `/hotels/search/[citySlug]/[checkIn]/[checkOut]` | [routes/hotels/search/...](../../src/routes/hotels/search/) | Alias → canonical search redirect | (redirect) |
| `/search/hotels/[query]/[pageNumber]` | [routes/search/hotels/[query]/[pageNumber]/index.tsx](../../src/routes/search/hotels/%5Bquery%5D/%5BpageNumber%5D/index.tsx) | Canonical hotel **results** page | **Noindex, follow** |

### Flights vertical
| Route | File | Purpose | Index |
|---|---|---|---|
| `/flights` | [routes/flights/index.tsx](../../src/routes/flights/index.tsx) | Flights landing (hero search) | Indexable |
| `/flights/search/[...route]` | [routes/flights/search/[...route]/index.tsx](../../src/routes/flights/search/%5B...route%5D/index.tsx) | Alias → canonical redirect | (redirect) |
| `/search/flights/from/[from]/to/[to]/[type]/[page]` | [routes/search/flights/...](../../src/routes/search/flights/) | Canonical flight **results** page | **Noindex, follow** |
| `/flights/itinerary/[...route]` | [routes/flights/itinerary/[...route]/index.tsx](../../src/routes/flights/itinerary/%5B...route%5D/index.tsx) | Flight itinerary / entity detail | Indexable |

### Cars vertical
| Route | File | Purpose | Index |
|---|---|---|---|
| `/car-rentals` | [routes/car-rentals/index.tsx](../../src/routes/car-rentals/index.tsx) | Cars landing (hero search) | Indexable |
| `/car-rentals/in` + `/car-rentals/in/[citySlug]` | [routes/car-rentals/in/](../../src/routes/car-rentals/in/) | Rental city directory + city guide | Indexable |
| `/car-rentals/[slug]` | [routes/car-rentals/[slug]/index.tsx](../../src/routes/car-rentals/%5Bslug%5D/index.tsx) | Car entity detail | Indexable |
| `/cars/rental/[...route]` | [routes/cars/rental/[...route]/index.tsx](../../src/routes/cars/rental/%5B...route%5D/index.tsx) | Canonical car entity detail | Indexable |
| `/cars/search/...`, `/car-rentals/search/...` | [routes/cars/search/](../../src/routes/cars/search/) | Alias → canonical redirect | (redirect) |
| `/search/car-rentals/[query]/[pageNumber]` | [routes/search/car-rentals/...](../../src/routes/search/car-rentals/) | Canonical car **results** page | **Noindex, follow** |

### Discovery
| Route | File | Purpose | Index |
|---|---|---|---|
| `/explore` | [routes/explore/index.tsx](../../src/routes/explore/index.tsx) | Discovery: vibes, flexible ideas, popular destinations, guided mode via `?theme/idea/destination` | Indexable |
| `/destinations` | [routes/destinations/index.tsx](../../src/routes/destinations/index.tsx) | Destination directory | Indexable |
| `/destinations/[slug]` | [routes/destinations/[slug]/index.tsx](../../src/routes/destinations/%5Bslug%5D/index.tsx) | Destination guide (JSON-LD: TouristDestination + FAQPage + Breadcrumb) | Indexable |

### Booking / trips / account
| Route | File | Purpose | Index |
|---|---|---|---|
| `/trips` + `/trips/[tripId]` | [routes/trips/](../../src/routes/trips/) | Trip assembly / bundle builder | App surface |
| `/my-trips` | [routes/my-trips/index.tsx](../../src/routes/my-trips/index.tsx) | Trips dashboard (filters, groups, status) | App surface |
| `/checkout` + `/checkout/[checkoutSessionId]` | [routes/checkout/](../../src/routes/checkout/) | Checkout (snapshot revalidation, travelers, payment, booking) | App surface |
| `/confirmation/[confirmationRef]` | [routes/confirmation/](../../src/routes/confirmation/) | Booking confirmation | App surface |
| `/itinerary/[itineraryRef]` | [routes/itinerary/](../../src/routes/itinerary/) | Itinerary view + ownership claim | App surface |
| `/resume/[ref]` | [routes/resume/[ref]/index.tsx](../../src/routes/resume/%5Bref%5D/index.tsx) | Resume in-progress session | App surface |
| `/travelers` | [routes/travelers/index.tsx](../../src/routes/travelers/index.tsx) | Saved traveler profiles | App surface |

### SEO / infra / API (preserve as-is)
- `/robots.txt`, `/sitemap.xml`, `/sitemaps/[kind]/[page].xml`, `/sitemaps/hotels/[page].xml`, `/sitemaps/destinations/[page].xml`
- Dynamic OG images: `/og/hotel/[slug].png`, `/og/search/[vertical]/[query]/[pageNumber].png` (rendered with `@resvg/resvg-js`)
- API: `/api/search`, `/api/locations/search`, `/api/inventory/revalidate`, `/api/analytics/{events,pageview}`, `/api/trips/*` (items, move, reorder, replace-options, apply, preview, restore, revalidate)
- `/404` + `/[...catchAll]` not-found handling

---

## Current component/style inventory

### Styling foundation
- **Tailwind v4** imported in [src/styles/global.css](../../src/styles/global.css) (`@import 'tailwindcss'`), tokens in [src/styles/theme.css](../../src/styles/theme.css) via `@theme { … }`.
- **Token families** (light + dark per theme): surfaces (`--color-surface-0…5`, `panel`, `elevated`, `bg`), text (`--color-text`, `-strong`, `-muted`, `-subtle`, `-inverse`, `-on-hero`), borders/dividers, focus/ring, actions (`--color-action`, `-hover`, `-press`, `-soft`), accents (`--color-price`, `route`, `highlight`, `fuchsia`, `lime`), states (success/warning/danger), shadows (`--shadow-surface-1…4` + aliases `-e1…e3`, `-sm/md/lg/xl`), glass (blur + translucent surfaces + `--glass-highlight`), radius (`--radius-lg/xl`), gradients (`--grad-primary`, `-signal`, `-surface`, `-card`, `-panel`, `-deal`), and hero overlays.
- **5 runtime themes**, switchable client-side and persisted in `localStorage` (`andacity-theme`): B1 Sky Blue (default), B2 Ocean Teal, B3 Night Navy, B4 Desert Sand, B5 Atlas Indigo. Each defines a full light palette plus a `@media (prefers-color-scheme: dark)` override. Switcher: [components/site/ThemeSwitcher.tsx](../../src/components/site/ThemeSwitcher.tsx). FOUC is prevented by an inline pre-paint script in [root.tsx](../../src/root.tsx).
- **Dark mode is OS-driven only** (`prefers-color-scheme`). There is no manual light/dark toggle; the only manual control is the 5-swatch *color* theme picker.
- **Component-layer primitives** in [global.css](../../src/styles/global.css) `@layer components`: `.t-card`, `.t-panel`, `.t-btn-primary`, `.t-btn-ghost`, `.t-badge` / `.t-badge--deal`, hero overlay classes (`.t-hero-overlay-{soft,base,strong,flights,hotels,cars,explore-*}`), and per-vertical theme wrappers (`.t-vertical-theme-{flights,hotels,cars}`, `.t-detail-theme-*`) that locally re-bind `--color-action` and friends.

### Shared UI components (high-traffic)
- **Shell:** `SiteHeader`, `SiteFooter`, `Page` ([components/site/Page.tsx](../../src/components/site/Page.tsx)), `ThemeSwitcher`, `Breadcrumbs`, `HeroBackground` ([components/hero/HeroBackground.tsx](../../src/components/hero/HeroBackground.tsx)).
- **Search entry:** `GlobalSearchEntry` (tabbed flights/hotels/cars) ([components/search-entry/GlobalSearchEntry.tsx](../../src/components/search-entry/GlobalSearchEntry.tsx)), `VerticalHeroSearchLayout` ([components/search/VerticalHeroSearchLayout.tsx](../../src/components/search/VerticalHeroSearchLayout.tsx)), per-vertical search cards (`HotelSearchCard`, `FlightsSearchCard`, `CarRentalSearchCard`), `BookingSearchSurface` primitives, `DateField`, `LocationAutosuggestField`.
- **Results system:** `ResultsShell` (filter sidebar + control bar + pagination + async states), `ResultCardScaffold` + `ResultFactGrid`/`ResultFactList`/`ResultReasonCallout`/`ResultTrustBar`/`ResultPricePanel` ([components/results/ResultCardScaffold.tsx](../../src/components/results/ResultCardScaffold.tsx)), per-vertical result cards + renderers (`*ResultsRenderer.tsx` with tested `*RendererModel.ts`), `ResultsControlBar`, `ResultsFilters`, `ResultsSort`, `ResultsPagination`, `ResultsEmpty`, `ResultsLoading`.
- **Entity detail:** `BookableEntityPage` + `HotelEntityPage`/`FlightEntityPage`/`CarEntityPage` with per-vertical summary/price/policy/amenity/segment subcomponents under [components/entities/](../../src/components/entities/).
- **Trips/checkout/confirmation:** `TripPage`, `Trip{Hotel,Flight,Car}ItemCard`, `TripSummary`, `CheckoutShell`, the `Checkout*` section family, `Confirmation*`, `Itinerary*`, `MyTrips*`.
- **Cross-cutting:** async-state primitives (`AsyncStateNotice`, `AsyncPendingButton`, `AsyncSurfaceSkeleton`), inventory trust (`AvailabilityConfidence`, `InventoryFreshness`, `InventoryRefreshControl`), save/compare decisioning (`DecisioningProvider`, `SaveButton`, `CompareTray`/`CompareDrawer`/`CompareSheet`, `UndoSnackbar`, `RecentlyViewedModule`), `DetailTrustPanel`, `PageView` analytics.

### Typography & imagery
- Headings: `Lexend Variable` (tight tracking, `h1` 700/-0.025em). Body: `Poppins`. System fallback stack defined.
- Hero art: five flat **SVG placeholders** in [public/images/hero/](../../public/images/hero/) (`home/hotels/flights/cars/explore.svg`) painted under a dark gradient overlay. No photography or video anywhere in the product.

---

## Existing strengths

1. **Mature, disciplined token system.** Nearly all color/spacing/shadow usage flows through CSS variables, not hardcoded values. Re-skinning is mechanically feasible without touching component logic. This is the single biggest asset to preserve.
2. **Multi-theme + dark mode already wired**, with FOUC-safe pre-paint application. Demonstrates the system can carry several distinct visual identities at runtime.
3. **Strong SEO architecture.** Env-gated indexing ([lib/seo/env.ts](../../src/lib/seo/env.ts)), canonical policy that strips query params + tracking IDs, route-level robots (`noindex,follow` on `/search/*`), JSON-LD (WebSite/Breadcrumb/TouristDestination/FAQPage), dynamic OG image routes, and sitemaps. This is production-grade and must not regress.
4. **Clean architecture seam between data and UI.** Routes are thin; server loaders produce typed "renderer models" (`HotelResultCardModel`, `PriceDisplayContract`, etc.) that have unit tests. The redesign can replace presentation while consuming the same models.
5. **Accessibility scaffolding is present.** `focus-visible` rings on interactive elements, ARIA roles on nav/menus/tablists, semantic `dl/dt/dd` in fact lists, `sr-only` labels, breadcrumb trails, `aria-pressed`/`aria-current`.
6. **Trust & transparency framing.** Total-price emphasis, availability confidence, inventory freshness, and revalidation-before-payment in checkout are real differentiators worth amplifying visually.
7. **Consistent layout container** (`max-w-6xl px-4`) and a shared async-state machine (`initial_loading / refreshing / partial / stale / failed / empty / loaded`) across verticals.

---

## Existing weaknesses

1. **Generic "component-library demo" aesthetic.** The site reads as a competent design-system showcase, not a branded consumer travel product. Pages are dominated by near-identical small rounded cards (`.t-card`) on tinted gradients; flights, hotels, cars, and destinations all look the same.
2. **No real imagery.** Heroes are flat SVGs under dark overlays; destination and "popular" cards are text-only; the destination map is a literal grey placeholder box ([destinations/[slug]/index.tsx](../../src/routes/destinations/%5Bslug%5D/index.tsx) `h-56 … bg-neutral-50`). Competitors lead with lush photography/video — this is the biggest emotional gap.
3. **Developer-facing copy leaking into the UI.** Examples: "Every form routes into the existing canonical search flow, so shared links, results pages, and trip assembly all stay aligned" (home), "Search pages are not indexed. This destination page is." and "Keep the map compact. It supports decision-making, but shouldn't steal conversion." (destination page), "This is where you earn long-tail rankings…" (literal SEO instructions rendered to users). This voice must be scrapped entirely.
4. **Result cards read like spec sheets.** `ResultFactList` renders a `dl` grid of Location / Guest score / Stay class / Offer / Policies. Dense and uniform, low scannability, no visual hierarchy that guides the eye to price + the one decisive fact. Not emotionally compelling.
5. **No vertical-specific richness.** Flights have no route/timeline visualization; hotels have no gallery or rating prominence; cars have no vehicle imagery. Every vertical is forced through the same generic scaffold.
6. **Inconsistent page patterns.** Hotel detail uses a large tone-boxed header; destination detail hand-rolls its own breadcrumb (instead of the `Breadcrumbs` component) and a bespoke 2-column layout; explore uses a full-bleed hack (`left-1/2 right-1/2 w-screen -translate-x-1/2`). Three different "page top" idioms.
7. **Concrete visual bugs (verified):**
   - `--color-tertiary-50` / `--color-tertiary-700` are referenced in [routes/index.tsx](../../src/routes/index.tsx) (Car Rentals vertical card + "Why Andacity" gradient) but **never defined** in [theme.css](../../src/styles/theme.css). Those gradients silently fall back to transparent.
   - Typo `borde3r-b` in [components/site/Page.tsx](../../src/components/site/Page.tsx#L11) — the breadcrumb band's intended bottom border never renders.
8. **Brand inconsistency.** The real logo wordmark is teal + amber on Open Sans ([public/assets/logo/](../../public/assets/logo/)), but the default theme B1 is Sky Blue + Coral on Poppins. The footer additionally renders a *placeholder* inline SVG with a "Swap this for your actual logo" comment instead of the real mark, while the header uses the real mark.
9. **Duplicated route namespaces** (`/cars` vs `/car-rentals`, `/hotels/search` vs `/search/hotels`) create an inconsistent mental model and dilute internal-link clarity.
10. **Search is anchored to home.** The header "Search" button just deep-links to `/#global-search-entry`; there's no persistent or page-local way to start a fresh search from results/detail pages without scrolling the home hero.
11. **Placeholder polish gaps:** footer social links point to bare `x.com/` and `github.com/`; hover-only desktop mega-menu (works via `focus-within` but has no explicit toggle button).

---

## What Claude Code should feel free to scrap

Be aggressive. The following are presentation-only and can be fully replaced:

- **The entire visual language of cards, gradients, and tinted "soft" surfaces.** `.t-card`/`.t-panel` styling, the inset-bar accents (`shadow-[inset_3px_0_0_…]`), and the rounded-pill-everything look.
- **Hero treatment.** Flat SVG + dark overlay → replace with photographic/video heroes and a redesigned search composition. `HeroBackground` and the `t-hero-overlay-*` family can be reconceived.
- **Home page composition** ([routes/index.tsx](../../src/routes/index.tsx)) — the verticals grid, "Why Andacity" gradient block, and text-only destination cards.
- **Result card anatomy** ([ResultCardScaffold.tsx](../../src/components/results/ResultCardScaffold.tsx)) — the `dl`-based `ResultFactList` spec-sheet pattern. Keep the *slots concept* (media / identity / price / action / trust) but redesign the rendered output per vertical.
- **All meta/developer-facing microcopy.** Every sentence that explains the system to the user, references SEO, "canonical flow," "snapshot," indexing, or commission mechanics in body copy. Rewrite to consumer voice.
- **Destination detail layout** including its hand-rolled breadcrumb and grey placeholder map.
- **Explore page's full-bleed hack** and its dense vibe/idea card walls.
- **Footer brand placeholder SVG** and placeholder social links.
- **The 5-swatch theme picker as a primary nav element** (keep the multi-theme *capability* if desired, but it should not anchor the consumer header — see thesis).
- Per-vertical hardcoded accent overrides may be **reduced** to a cleaner system (see "Proposed sitewide UI system").

---

## What must be preserved

**Functionality, routing, and contracts are not in scope to change.** Preserve:

- **Route structure and URL semantics**, including canonical builders (`buildCanonicalHotelSearchHref`, `buildCanonicalFlightSearchHref`, flights `from/to/type/page` shape), and the `onGet` redirect handlers (302/301) that turn form submits into canonical routes ([routes/hotels/index.tsx](../../src/routes/hotels/index.tsx), [routes/flights/index.tsx](../../src/routes/flights/index.tsx), [routes/search/hotels/[query]/[pageNumber]/index.tsx](../../src/routes/search/hotels/%5Bquery%5D/%5BpageNumber%5D/index.tsx)).
- **Search behavior:** vertical search cards → canonical route flow; `submitBehavior="canonical-route"`; location autosuggest + selection validation.
- **Entity/detail behavior:** `BookableEntityPage` load states (`resolved / unavailable / revalidation_required / error`) and add-to-trip flow.
- **SEO strategy in full:** env-gated indexing, canonical policy (no query params by default, tracking-param stripping), route-level robots (`noindex,follow` for `/search/*` via [search/layout.tsx](../../src/routes/search/layout.tsx)), JSON-LD graphs, OG image routes, sitemaps, breadcrumb lists.
- **Indexable destination/city pages; noindexed search/result pages.** This split is core to the SEO model.
- **Metadata/canonical behavior** in [router-head.tsx](../../src/routes/router-head.tsx) (route canonical/robots win over defaults; duplicate-meta filtering; WebSite JSON-LD only when indexable).
- **Accessibility & semantic correctness:** keep/raise current focus management, ARIA roles, semantic landmarks, breadcrumbs.
- **Data contracts:** all renderer models and their tests, `routeLoader$` shapes, the async-state machine, inventory freshness/confidence, decisioning/save-compare, trip assembly/checkout/revalidation.
- **The token mechanism** (Tailwind v4 `@theme` + CSS variables). Re-skin *values*; keep the *architecture* so components stay declarative and themeable.
- **Build/type stability:** Qwik `component$` patterns, `q:slot` contracts, and a green `build.types` + `build`.
- **Security headers / CSP** in [routes/layout.tsx](../../src/routes/layout.tsx) (note: CSP allows `img-src https:` and `'unsafe-inline'` styles — compatible with adding remote photography and inline style tokens).

---

## SEO constraints

The redesign must operate within these guardrails (all currently enforced in code):

1. **Canonical = path only, no query params** by default ([lib/seo/env.ts](../../src/lib/seo/env.ts) `getCanonicalHref`). Don't introduce UI states that depend on indexable query-string variants.
2. **`/search/*` results pages are `noindex,follow`** ([search/layout.tsx](../../src/routes/search/layout.tsx)). Redesigned result pages must keep emitting this. New filter/sort states should stay inside the noindexed namespace.
3. **Indexable surfaces are landings + city/destination guides + entity detail.** These carry the ranking weight; their content depth (FAQ, guide copy, JSON-LD) must be retained even as the layout changes — but the *placeholder/instructional* copy should be replaced with genuine, useful content.
4. **JSON-LD must remain valid** for BreadcrumbList, TouristDestination, FAQPage, and the global WebSite/SearchAction. Keep emitting via the `name: "json-ld"` meta channel that [router-head.tsx](../../src/routes/router-head.tsx) extracts.
5. **OG images** are generated server-side per slug/query; redesign should keep these routes intact (they are referenced by `og:image`).
6. **Robots/canonical precedence**: route-level values win over env defaults. Preserve this when restructuring heads.
7. **Indexing is host-gated** to `andacity.com` — staging/local are always `noindex`. Don't hardcode index permissions in components.

---

## Accessibility constraints

Maintain or improve the current baseline:

1. **Visible focus on every interactive element** (`focus-visible:ring-2` with `--color-ring`). Keep a ≥3:1 focus indicator against all surfaces, including over photography.
2. **Semantic landmarks & roles:** `header`/`main`/`footer`, `nav[aria-label]`, `role=tablist/tab/tabpanel` (GlobalSearchEntry), `role=menu/menuitem` (header dropdown), `dl/dt/dd` for facts. Preserve semantics when restyling.
3. **Color contrast:** any new palette/photographic overlay must hold **WCAG AA** (4.5:1 text, 3:1 large text/UI). Hero text over imagery needs a guaranteed scrim — don't rely on the image alone.
4. **Hit targets ≥ 44px** on mobile; the current sticky CTAs are good — keep them.
5. **Keyboard operability of disclosure UI.** The hover mega-menu currently relies on `:hover`/`focus-within`; the redesign should add an explicit, keyboard-toggleable control.
6. **Motion:** any new animation must honor `prefers-reduced-motion`.
7. **Forms:** keep label↔input association (`for`/`id`), validation messaging, and the accessible `DateField`/autosuggest patterns.
8. **Images need real `alt`** (and decorative imagery `aria-hidden`). Today many "images" are decorative SVGs; photographic content must carry meaningful alt text.

---

## Responsive design risks

1. **Hero density on mobile.** The tabbed `GlobalSearchEntry` packs eyebrow + title + description + tabs + a full search form. On small screens this is tall and crowded; redesign must prioritize the search action above the fold.
2. **Result-card fact grids** collapse to single-column and become very tall; the `dl` spec-sheet pattern is worst on mobile. New cards should be summary-first with progressive disclosure.
3. **Filter access on results.** `ResultsShell` hides filters behind a toggle on mobile (good) but the desktop sidebar is fixed at `280px`; ensure the new layout keeps a discoverable mobile filter entry and a results-count anchor.
4. **Full-bleed explore hack** (`w-screen` translate) can cause horizontal overflow / scrollbar jitter; replace with a proper full-bleed utility.
5. **Sticky offsets are hardcoded** (`--app-header-height: 64px`, `--sticky-top-offset: 80px`). A taller/photographic header must update these or sticky elements will misalign.
6. **Mega-menu width** is a literal `w-[520px]`; on narrow desktop widths this can overflow. Redesign should make it fluid.
7. **Mobile sticky CTA bars** (destination page) overlay content `bottom-0`; ensure new pages reserve bottom padding so the bar never covers the final CTA.
8. **Photography performance:** introducing real imagery risks LCP/CLS regressions. Require explicit `width`/`height`, `loading`/`fetchpriority` discipline, and responsive `srcset`.

---

## Brand/logo observations

- **Real asset:** [public/assets/logo/andacity-primary-color_mark-darkword_transparent.svg](../../public/assets/logo/andacity-primary-color_mark-darkword_transparent.svg) — an orbit/sun mark (amber circle `#F59E0B` + teal orbit `#14B8A6`→`#0EA5A0`) with a wordmark "Anda" (slate `#0F172A`) + "city" (teal `#14B8A6`) set in Open Sans 700.
- **Mismatch with the live theme:** the default B1 theme is **Sky Blue `#2563EB` + Coral `#F97316`** on **Poppins/Lexend**. The logo's **teal + amber on Open Sans** does not align with any default surface. The closest theme is actually **B2 Ocean Teal + Sun Gold**.
- **Footer doesn't use the real mark** — it renders a placeholder inline SVG with a "Swap this for your actual logo" comment.
- **Recommendation: treat the logo as flexible input, not a hard constraint.** The mark (sun + orbit) is a strong, ownable concept evoking travel/horizons. Recommended direction:
  - Keep the **sun + orbit motif** as the brand idea; refine the mark for small sizes (the current clip-path band is fragile at favicon scale).
  - **Align the product palette to the logo** (teal/amber as a credible default), OR commission a refreshed logo palette to match a chosen blue identity. Either way, **one** brand palette should govern logo + default theme. The teal/gold (B2) family is the natural reconciliation.
  - Standardize the **wordmark typeface** to the heading face (Lexend) for cohesion, or keep a dedicated logo lockup but stop using Open Sans elsewhere.
  - Use the **real mark in the footer** and generate proper favicon/apple-touch/OG marks from it.

---

## Competitive positioning

How Andacity should differ from the incumbents:

| Player | Their strength | Their weakness Andacity exploits |
|---|---|---|
| **Expedia / Booking.com** | Inventory depth, loyalty | Cluttered, ad-dense, urgency-spam ("1 room left!"), heavy cognitive load |
| **Google Flights** | Speed, price-graph clarity, trust | Utilitarian/sterile; flights-only; no emotional or discovery layer |
| **Kayak** | Meta-search breadth, filters | Dated, dense, aggregator feel; weak brand warmth |
| **Trivago** | Hotel price comparison | One-vertical; ad-driven; little planning continuity |
| **Hopper** | Predictive pricing, mobile-first delight, color | Opinionated/narrow; app-first; limited desktop depth |

**Andacity's wedge:** *the unified, discovery-first trip — planned across flights + stays + cars in one coherent, emotionally appealing surface, with Google-Flights-grade clarity and Hopper-grade delight, minus the ad clutter and false-urgency of the OTAs.*

Two assets already in the codebase support this and should be foregrounded:
- **Discovery (`/explore`)** — incumbents bury inspiration; Andacity can lead with it.
- **Cross-vertical trip assembly** — a real differentiator vs. single-vertical metasearch.

---

## Recommended redesign thesis

### What Andacity should feel like
**"Calm confidence for the whole trip."** Editorial and photographic like a premium travel magazine, but as fast and legible as Google Flights. Spacious, image-led, and trustworthy — never ad-cluttered, never urgency-spammed. The feeling is *"this app has my whole trip handled, and it's beautiful."*

### How it differs from Expedia / Google Flights / Trivago
- **vs Expedia/OTAs:** no banner ads, no false scarcity, dramatically less density. Whitespace and one clear decision per screen.
- **vs Google Flights:** add emotion and discovery (photography, destination storytelling, cross-vertical planning) without losing the price clarity and speed.
- **vs Trivago/metasearch:** one continuous planning journey across flights + hotels + cars + discovery, not a vertical silo.

### Visual qualities that should dominate
1. **Photography-first.** Real destination imagery anchors heroes, destination/city pages, and hotel cards. Images carry the emotion; UI chrome stays quiet.
2. **Editorial typography.** Confident, large display headings (Lexend), generous line-height, restrained color in text.
3. **Depth through light, not borders.** Soft, real shadows and layering (the token system already supports `--shadow-surface-1…4` and glass) instead of busy gradient fills and inset accent bars.
4. **One accent, used decisively.** A single brand action color for primary CTAs and price emphasis; everything else neutral. (Reconcile to the logo's teal/gold or a chosen blue.)
5. **Quiet trust signals.** Total-price-first, availability confidence, and freshness expressed subtly — never as red urgency.

### What the user should feel in the first five seconds
"I can start my trip *right now*, and this place is going to make it easy and beautiful." A photographic hero with a **single, obvious search** (smart-defaulted to the most likely intent), a one-line value promise, and a glimpse of inspiring destinations just below the fold.

### What the search experience should prioritize
- **Immediate, low-friction start:** one prominent search, vertical switch secondary, sensible defaults (dates, nearest origin), and forgiving location autosuggest.
- **Persistent search:** a compact, page-local search affordance on results and detail pages (not just the home anchor).
- **Clarity over cleverness:** all-in pricing, transparent fees, no dark patterns.

### What destination discovery should feel like
Like flipping through a gorgeous, *actionable* travel magazine: full-bleed photography, mood/season/budget entry points that immediately translate into bookable flights/hotels/cars, and editorial guide content that earns both the user's trust and the long-tail rankings — written for humans, not for crawlers.

### What cards, filters, and result pages should feel like
- **Cards:** summary-first and scannable — image, name, the one decisive fact, rating, and **price as the visual anchor**, with details on progressive disclosure. Vertical-specific richness (flight route timeline, hotel gallery + score, car vehicle imagery).
- **Filters:** quiet, fast, and obviously reversible; active filters always visible; instant result-count feedback; great mobile sheet.
- **Result pages:** calm list with a strong sort/price hierarchy, honest availability/freshness, and zero ad-style interruption.

### What mobile users should experience
A near-app-grade flow: search above the fold, thumb-reachable primary actions, bottom-sheet filters, sticky context-aware CTAs, buttery (reduced-motion-aware) transitions, and images that load progressively without layout shift.

---

## Proposed sitewide UI system

Evolve — don't discard — the token architecture.

1. **Token layer (keep mechanism, re-skin values).**
   - Consolidate to **one canonical brand palette** as default (reconciled with the logo). Keep the multi-theme capability as an *optional* mechanism, but demote the 5-swatch picker from the consumer header.
   - Add the missing **`--color-tertiary-*` ramp** (or remove its references) to fix the broken home gradients.
   - Introduce **content/elevation tokens for photography**: standard scrim gradients, image radius, and an "on-image" text/contrast token set that guarantees AA.
   - Add a proper **full-bleed** utility to replace the `w-screen` hack.

2. **Typography scale.** Define an explicit display→caption type scale (Lexend display, Poppins/var body). Bigger, more confident headings; consistent measure (`max-w-[60–72ch]`).

3. **Spacing & layout.** Keep `max-w-6xl` content container; add a `max-w-7xl`/full-bleed track for photographic sections. Standardize section rhythm.

4. **Core components (redesign the surface, keep the contract).**
   - **Buttons:** one primary (brand action), one secondary (quiet), one tertiary/link. Retire the pill-everything look in favor of a calmer radius scale.
   - **Card family:** a single `Card` with photographic and compact variants; vertical-specific result cards built on a shared scaffold whose **slots are preserved** (`media/identity/price/primary-action/trust`) but whose output is redesigned per vertical.
   - **Search:** a unified `SearchBar` usable in hero (large) and inline (compact, persistent) modes, sharing the existing canonical-route submit behavior.
   - **Hero:** photographic `Hero` with guaranteed scrim and overlay-safe text tokens.
   - **Filters/Sort/Pagination/Empty/Loading:** restyle in place; preserve `ResultsShell` async-state contract.
   - **Trust primitives:** restyle `AvailabilityConfidence` / `InventoryFreshness` / price panel into quiet, premium signals.
   - **Navigation:** simplify header (brand, verticals, Explore, Trips, persistent compact search, account); keyboard-toggleable menus; real footer brand.

5. **Imagery system.** Define sourcing + responsive `srcset`/sizes conventions, aspect-ratio boxes (prevent CLS), `fetchpriority="high"` for hero LCP, lazy below the fold, and a tasteful blur-up placeholder.

6. **Motion system.** A small set of tokens (durations/easings) for hover lift, sheet/dialog transitions, and page entrance — all gated on `prefers-reduced-motion`.

7. **Voice & content.** A microcopy pass replacing all developer/SEO-facing language with warm, concrete consumer copy.

---

## Page-by-page redesign sequence

Ordered by brand impact × reuse leverage. Each step ships behind an approval gate (see next section).

1. **CLAUDE-UI-001 — Palette + Visual Direction Samples.** Reconcile brand palette with the logo; define type scale, elevation, imagery/scrim tokens, motion. Produce 1–3 static direction samples. *(Next task — do not start yet.)*
2. **CLAUDE-UI-002 — Global shell** (Header, Footer, `Page`, breadcrumbs, persistent compact search). Highest reuse; fixes `borde3r-b` and footer brand.
3. **CLAUDE-UI-003 — Home** (`/`). Photographic hero + unified search + inspiring discovery. Fixes `--color-tertiary-*`.
4. **CLAUDE-UI-004 — Search/Hero layout + per-vertical landings** (`VerticalHeroSearchLayout`, `/hotels`, `/flights`, `/car-rentals`).
5. **CLAUDE-UI-005 — Results system** (`ResultsShell`, cards, filters, sort, pagination, empty/loading) — generic scaffold first.
6. **CLAUDE-UI-006 — Per-vertical result cards** (flight route timeline, hotel gallery+score, car vehicle imagery).
7. **CLAUDE-UI-007 — Entity detail** (`BookableEntityPage` + hotel/flight/car detail).
8. **CLAUDE-UI-008 — Discovery** (`/explore`, `/destinations`, `/destinations/[slug]`, city hubs) — photographic, editorial, keep JSON-LD/FAQ.
9. **CLAUDE-UI-009 — Trips & assembly** (`/trips`, `/my-trips`, item cards, summary).
10. **CLAUDE-UI-010 — Checkout / confirmation / itinerary / travelers / resume.**
11. **CLAUDE-UI-011 — Cross-cutting polish** (404/catch-all, OG image visual refresh, favicons, motion QA, a11y/contrast audit, perf/LCP pass).

---

## Approval-gated workflow

**Rule: the redesign proceeds one page/sample at a time. For every major page rewrite, Claude Code must first produce a sample direction and stop for approval before any full implementation.**

For each major page, Claude Code must first create a **sample direction** (a focused, low-risk preview — e.g. a single sample route/component, screenshots/markup, or an isolated styled section) and then stop and present exactly these options:

```txt
Sample ready for review.

Options:
1. Approve this direction.
2. Reject this direction and request a different concept.
3. Modify this direction with specific changes.

No full implementation has been applied yet.
```

Constraints on the workflow:
- **No full page rewrite** is applied until the user explicitly approves that page's sample direction (Option 1).
- On **Reject (2)**, produce a *different* concept, not a revision of the rejected one.
- On **Modify (3)**, apply the user's specific changes to the sample and re-present the same three options.
- Each approved page must keep `build.types` + `build` green and must not regress routing, SEO, data contracts, or accessibility.
- Work proceeds in the **page-by-page sequence** above; do not batch multiple major pages into one approval.

---

## Risk areas

1. **SEO regression.** Restructuring heads/canonicals/robots or losing JSON-LD/OG routes would damage rankings. *Mitigation:* preserve [router-head.tsx](../../src/routes/router-head.tsx) precedence and the indexable/noindex split; verify per page.
2. **Performance/LCP/CLS from photography.** New imagery is the biggest perf risk. *Mitigation:* aspect-ratio boxes, explicit dimensions, `fetchpriority`, responsive `srcset`, lazy-loading discipline.
3. **Theme/token breakage.** The 5-theme + dark system means a restyle must be validated across themes and color schemes. *Mitigation:* keep using tokens; spot-check B1/B2 light+dark per page; add the missing tertiary ramp.
4. **Qwik constraints.** `q:slot` contracts, serialization boundaries, and `useVisibleTask$` usage (e.g. ThemeSwitcher) must be respected; literal class strings are required where Tailwind extracts variants (note the existing comment in `SiteHeader`). *Mitigation:* preserve slot names and component boundaries.
5. **Accessibility/contrast over imagery.** Text on photos can fail AA. *Mitigation:* mandatory scrim tokens + contrast checks.
6. **Sticky-offset drift.** A taller photographic header breaks hardcoded sticky offsets. *Mitigation:* drive sticky offsets from the header height token.
7. **Scope creep into logic.** Temptation to "improve" data flows. *Mitigation:* presentation-only; consume existing renderer models unchanged.
8. **Brand decision dependency.** Several choices hinge on the palette/logo reconciliation in CLAUDE-UI-001; downstream pages shouldn't finalize until that's approved.

---

## Verification results

Verification commands available in [package.json](../../package.json):
- `npm run build.types` → `tsc --incremental --noEmit`
- `npm run build` → `qwik build` (client + types + lint, per Qwik build)
- (others: `npm run lint`, `npm run test`)

**This task is audit/strategy/documentation only and changed no application code** — it added a single Markdown file under `docs/`. Verification status is recorded below; see the final response for the as-run results.

- `npm run build.types`: _see final report_
- `npm run build`: _see final report_

No source/TSX/CSS files were modified, so no behavioral, type, routing, SEO, or accessibility regressions are introduced by this deliverable. The two real defects discovered (`--color-tertiary-*` undefined; `borde3r-b` typo) are **documented, not fixed** here, and are slotted into CLAUDE-UI-002/003.
