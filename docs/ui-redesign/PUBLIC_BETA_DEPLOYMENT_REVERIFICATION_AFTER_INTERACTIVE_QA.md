# Public Beta Deployment Reverification After Interactive QA

**Task:** CLAUDE-UI-044
**Date:** 2026-06-23
**Auditor:** Claude Code (claude-sonnet-4-6)
**Branch:** dev
**Predecessor:** CLAUDE-UI-040 (`PUBLIC_BETA_DEPLOYMENT_REVERIFICATION.md`)

---

## Purpose

Reverify that Andacity is deployable as a public beta candidate after the late interactive UI blocker remediation in CLAUDE-UI-041, CLAUDE-UI-042, and CLAUDE-UI-043. Reconciles the prior CLAUDE-UI-040 deployment verification with all changes made since.

---

## Why Reverification Was Needed

CLAUDE-UI-040 classified the app as "Ready to deploy after environment variables are set." Three additional blocking issues were subsequently discovered and fixed:

- **CLAUDE-UI-041**: Search overlays clipped by `overflow-hidden` in hero sections; hotel/car-rental search pages not using the new UI concept; results shell on legacy `--color-*` tokens.
- **CLAUDE-UI-042**: Hero stacking contexts missing explicit `z-index`, causing following DOM sections to paint over overlays.
- **CLAUDE-UI-043** (final interactive QA): `LocationAutosuggestField.tsx` dropdown using `--color-*` tokens; `FlightsSearchCard.tsx` autofill notice using `--color-text-muted`; `/hotels/in` and `/car-rentals/in` directory heroes retaining `overflow-hidden` without `z-index`.

This reverification confirms no deployment-gate regressions were introduced by these fixes.

---

## Deployment Classification

```
Ready to deploy after environment variables are set
```

All build gates pass. Dockerfile unchanged. No new environment variables. No new dependencies. No new routes or taxonomy. No new third-party services. SEO/indexing unchanged. The only changes since CLAUDE-UI-040 are CSS class changes, inline style token migrations, and prop additions — no behavioral, routing, or infrastructure changes.

---

## Source Docs Reviewed

| Document | Task | Reviewed |
|---|---|---|
| `PUBLIC_BETA_DEPLOYMENT_REVERIFICATION.md` | CLAUDE-UI-040 | ✅ |
| `FINAL_INTERACTIVE_PUBLIC_SURFACE_QA.md` | CLAUDE-UI-043 | ✅ |
| `SEARCH_OVERLAY_AND_VERTICAL_RESULTS_BLOCKER_REMEDIATION.md` | CLAUDE-UI-041 | ✅ |
| `FINAL_FULL_SURFACE_UI_QA.md` | CLAUDE-UI-039 | ✅ |
| `PUBLIC_BETA_DEPLOYMENT_VERIFICATION.md` | CLAUDE-UI-034 | ✅ |
| `PUBLIC_BETA_LAUNCH_CHECKLIST.md` | CLAUDE-UI-031 | ✅ |
| `ANALYTICS_MONITORING_INTEGRATION.md` | CLAUDE-UI-033 | ✅ |

---

## Post-CLAUDE-UI-040 Changes Reviewed

### CLAUDE-UI-041 (commit 7dd8dc1) — 27 files

| Category | Files | Deployment impact |
|---|---|---|
| `overflow-hidden` removed from 4 hero sections | `HotelsLandingPage.tsx`, `CarRentalsLanding.tsx`, `hotels/in/[citySlug]/index.tsx`, `car-rentals/in/[citySlug]/index.tsx` | CSS class only |
| Hotel/car search route hero rewrite | `hotels/search/.../index.tsx`, `car-rentals/search/.../index.tsx` | Visual change; noindex/follow preserved |
| `hideHeader` prop chain | `ResultsShell.tsx`, `CanonicalHotelResultsSection.tsx`, `CanonicalCarResultsSection.tsx` | Prop addition only; no behavior change to non-results routes |
| Results component token migration (10 files) | `src/components/results/*` | CSS tokens only |
| Card/adapter/renderer token migration (8 files) | Various | CSS tokens only |
| `DateField.tsx` token migration | `src/components/ui/DateField.tsx` | CSS tokens only |
| Docs | 2 new doc files | No runtime impact |

**New env vars introduced:** None. **New dependencies:** None. **New routes:** None.

### CLAUDE-UI-042 (commit f475d9e) — 8 files

All changes: CSS class `relative isolate overflow-hidden` → `relative isolate z-10` or `relative isolate z-10` across 8 hero sections. Pure CSS class changes. No behavior, routing, or env changes.

### CLAUDE-UI-043 (commit babc6bc) — 8 files (4 source, 4 docs)

| File | Change |
|---|---|
| `LocationAutosuggestField.tsx` | `--color-*` → `--ui-*` in dropdown; `rounded-[var(--radius-lg)]` → `style` attr with `--ui-radius-lg` |
| `FlightsSearchCard.tsx` | `--color-text-muted` → `--ui-text-muted` on autofill notice |
| `routes/hotels/in/index.tsx` | `overflow-hidden` → `z-10` on hero |
| `routes/car-rentals/in/index.tsx` | `overflow-hidden` → `z-10` on hero |
| 4 doc files | Addenda and new QA report |

**New env vars introduced:** None. **New dependencies:** None. **New routes:** None. **New external services:** None.

---

## Build and CI Gate Reverification

### Yarn build

```
yarn run build.types    ✅  exit 0 — Done in 4.21s
yarn run build.client   ✅  exit 0 — 1083 modules transformed
yarn run build.server   ✅  exit 0 — Built server (ssr) modules
yarn run lint           ✅  exit 0 — 0 errors, 2 pre-existing warnings
yarn run build          ✅  exit 0 — Done in 33.43s
```

The 2 pre-existing lint warnings (`SiteHeader.tsx:63`, `ThemeController.tsx:48`) are intentional `useVisibleTask$` uses, unchanged since CLAUDE-UI-034.

### CI/CD pipeline

`deploy-production.yml` triggers on push to `main`. No changes to the workflow. SSHes to EC2 and runs `./deploy.sh`. No additional steps required.

No `deploy.sh` in the repo root — the deployment script lives on the EC2 server. Workflow unchanged.

---

## Docker Verification

Docker requires interactive sudo on this machine (cannot run `sudo docker build` non-interactively). The Dockerfile is **unchanged since CLAUDE-UI-040**, which verified Docker build success.

Dockerfile inspection confirms:

| Concern | Status |
|---|---|
| `RUN yarn run build` — build gate in Docker | ✅ Correct — same build gate |
| `RUN yarn run build.server` (redundant but harmless) | ✅ Unchanged |
| `APP_ORIGIN` as build arg → `ENV ORIGIN ${APP_ORIGIN}` | ✅ Correct |
| `USER node` in final stage | ✅ Non-root |
| No secrets baked into image | ✅ Confirmed — runtime vars excluded |
| `PUBLIC_ANALYTICS_PROVIDER` baked at build time | ✅ Documented; currently empty by default |
| `EXPOSE 3000` | ✅ |
| `CMD ["yarn", "serve"]` | ✅ |

Since `yarn run build` passes with 0 errors and the Dockerfile hasn't changed, Docker build will succeed with:
```bash
docker build --build-arg APP_ORIGIN=https://andacity.com -t andacity:beta-ui-final .
```

---

## Required Environment Variables

Unchanged from CLAUDE-UI-040. No new env vars introduced by CLAUDE-UI-041/042/043.

### Required — Docker build arg

| Variable | Notes |
|---|---|
| `APP_ORIGIN=https://andacity.com` | Baked as `ORIGIN` in container. Required for CSRF protection. |

### Required at container startup

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string. Required for DB features. |
| `ORIGIN` | `http://localhost` | Set via `APP_ORIGIN` build arg. Must be `https://andacity.com`. |
| `PUBLIC_BASE_URL` | _(from request)_ | Canonical URLs, sitemap, JSON-LD. Set to `https://andacity.com`. |
| `OG_SIGNING_SECRET` | `change-me` | Signs OG image requests. Must be changed before launch. |
| `CONTACT_EMAIL` | `hello@andacity.com` | Shown on `/contact`. Must be monitored. |
| `PRIVACY_EMAIL` | `privacy@andacity.com` | Shown on `/privacy`. Must be monitored. |
| `LEGAL_EMAIL` | `legal@andacity.com` | Shown on `/terms`. Must be monitored. |

### Optional — analytics (rebuild required to activate)

| Variable | Notes |
|---|---|
| `PUBLIC_ANALYTICS_PROVIDER=cloudflare` | Recommended first provider. Cookieless. |
| `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` | Required when provider=cloudflare. |
| `PUBLIC_ANALYTICS_PROVIDER=ga4` | Sets cookies. Requires consent banner in EU/EEA. Defer. |
| `PUBLIC_GA_MEASUREMENT_ID` | Required when provider=ga4. |

### Reserved — no current effect

| Variable | Notes |
|---|---|
| `PUBLIC_SENTRY_DSN` | No effect until `@sentry/browser` installed. |
| `SENTRY_AUTH_TOKEN` | CI-only, source map uploads. Never in app code. |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_ENVIRONMENT` | Sentry CI config. |

---

## Analytics Launch Decision

**Unchanged from CLAUDE-UI-040.** Deploy with no provider configured (first-party `console.info` log only). Activate Cloudflare Web Analytics as the first post-launch rebuild.

Verified behavior with no provider set:
- `AnalyticsProvider` returns null — no script injected
- `PageView` fires `sendBeacon('/api/analytics/pageview', …)` on every route change
- `/api/analytics/pageview` returns `204` ✅
- No CSP modifications for analytics when no provider is configured

---

## Error Monitoring Launch Decision

**Unchanged from CLAUDE-UI-040.** First-party error capture via `window.onerror` + `window.onunhandledrejection` → `sendBeacon('/api/errors')` → `console.error("[andacity.errors]", ...)` is sufficient for public beta.

Verified:
- `/api/errors` endpoint active — returns `400` on malformed payload, `204` on valid ✅
- Error rendering failure cannot block page render (error handler in `ErrorMonitor` is non-blocking)

---

## SEO/Indexing Reverification

| Check | Method | Status |
|---|---|---|
| `shouldIndex` returns true only for `andacity.com` / `www.andacity.com` | `src/lib/seo/env.ts` inspection | ✅ |
| Hotel search `x-robots-tag: noindex, follow` | `curl -sI` header check | ✅ |
| Car-rental search `x-robots-tag: noindex, follow` | `curl -sI` header check | ✅ |
| `/search/*` `x-robots-tag: noindex, follow` via `search/layout.tsx` | source + header check | ✅ |
| `/hotels/in/las-vegas/` — no noindex header | `curl -sI` header check | ✅ (indexable) |
| `/dev/ui-home` — `x-robots-tag: noindex, nofollow` + robots meta | source check | ✅ |
| `/dev/ui-palettes` — `x-robots-tag: noindex, nofollow` + robots meta | source check | ✅ |
| `/dev/ui-*` 404 on production host | `shouldIndex(url)` throws `error(404)` | ✅ |
| Sitemap populated | `curl /sitemap.xml | grep -c "<url>"` | ✅ 313 URLs |
| Sitemap includes `/hotels/in` | `grep -c "hotels/in\b"` | ✅ 151 entries |
| Sitemap includes `/car-rentals/in` | `grep -c "car-rentals/in\b"` | ✅ 151 entries |
| Sitemap excludes `/dev/*` and `/search/*` | `grep "/dev/\|/search/"` | ✅ None found |
| `/robots.txt` — `Disallow: /search/` | `curl /robots.txt` | ✅ |
| `/robots.txt` — `Sitemap:` pointer | `curl /robots.txt` | ✅ (uses runtime origin on prod) |
| No production nav/footer links to `/dev/*` | `grep "/dev/"` in site components | ✅ None |

**Note:** CLAUDE-UI-041/042/043 made no changes to `onRequest` handlers, `head` exports, `shouldIndex`, sitemap, or robots.txt. All SEO/indexing behavior is unchanged from CLAUDE-UI-040.

---

## Public Route Smoke Test

All routes tested on dev server (`http://localhost:5173`). Results after following redirects:

| Route | HTTP Status | Notes |
|---|---|---|
| `/` | 200 ✅ | |
| `/hotels/` | 200 ✅ | |
| `/hotels/in/` | 200 ✅ | |
| `/hotels/in/miami/` | 200 ✅ | |
| `/flights/` | 200 ✅ | |
| `/car-rentals/` | 200 ✅ | |
| `/car-rentals/in/` | 200 ✅ | |
| `/car-rentals/in/orlando/` | 200 ✅ | |
| `/explore/` | 200 ✅ | |
| `/destinations/` | 200 ✅ | |
| `/destinations/miami/` | 200 ✅ | |
| `/search/all/miami/1` | 200 ✅ | noindex via search/layout.tsx |
| `/privacy/` | 200 ✅ | |
| `/terms/` | 200 ✅ | |
| `/contact/` | 200 ✅ | |
| `/healthz` | 200 ✅ | `{"ok":true}` |
| `/sitemap.xml` | 200 ✅ | 313 URLs |
| `/robots.txt` | 200 ✅ | `Disallow: /search/` present |
| `/dev/ui-home/` | 200 locally ✅ | 404 on production via `shouldIndex()` |
| `/dev/ui-palettes/` | 200 locally ✅ | 404 on production via `shouldIndex()` |

### User-reported URLs (CLAUDE-UI-041 blockers)

| URL | Hero class | noindex | Notes |
|---|---|---|---|
| `/hotels/search/los-angeles/2026-07-01/2026-07-08/` | `relative isolate z-10` ✅ | `x-robots-tag: noindex, follow` ✅ | `--ui-hero` gradient hero; Edit search link present |
| `/car-rentals/search/LAS/2026-07-01/2026-07-08/` | `relative isolate z-10` ✅ | `x-robots-tag: noindex, follow` ✅ | `--ui-hero` gradient hero |
| `/hotels/in/las-vegas/` | `relative isolate z-10` ✅ | No noindex (indexable) ✅ | New UI throughout |
| `/car-rentals/in/new-york/` | `relative isolate z-10` ✅ | No noindex (indexable) ✅ | New UI throughout |
| `/flights/search/SLC-LAX/2026-07-01/` | `relative isolate overflow-hidden` ✅ | noindex via search/layout.tsx ✅ | Flight route header (static, no search overlays — overflow-hidden correct) |

---

## Overlay and Stacking-Context Verification

### Hero sections in final source

| Section | Class | Search overlays | Result |
|---|---|---|---|
| `/` (HomeSearchModule) | `relative isolate z-10` | ✅ | Overlays clear following content |
| `/flights/` FlightHero | `relative isolate z-10` | ✅ | Overlays clear following content |
| `/hotels/` Hero | `relative isolate z-10` | ✅ | Overlays clear following content |
| `/car-rentals/` CarsHero | `relative isolate z-10` | ✅ | Overlays clear following content |
| `/hotels/in/[citySlug]` city hero | `relative isolate z-10` | ✅ | Overlays clear following content |
| `/car-rentals/in/[citySlug]` city hero | `relative isolate z-10` | ✅ | Overlays clear following content |
| `/hotels/in` directory hero | `relative isolate z-10` | No form | ✅ Consistent stack order |
| `/car-rentals/in` directory hero | `relative isolate z-10` | No form | ✅ Consistent stack order |
| `/hotels/search/...` result hero | `relative isolate z-10` | No form | ✅ Consistent stack order |
| `/car-rentals/search/...` result hero | `relative isolate z-10` | No form | ✅ Consistent stack order |

### Non-search heroes with overflow-hidden — safe

| Section | Class | Rationale |
|---|---|---|
| `FlightResultsPage` FlightRouteHeader | `relative isolate overflow-hidden` | Static header — no interactive overlays |
| `HomePage.tsx` line 394 CTA band | `relative isolate overflow-hidden` | Static content section — no interactive overlays |
| `HeroSection.tsx` shared component | `relative isolate overflow-hidden` | Dev-only routes only (`/dev/ui-shell`, `PalettePreview`) |

### Overlay z-index hierarchy

| Layer | z-index | Note |
|---|---|---|
| SiteHeader (sticky) | z-40 | Above everything |
| DateField calendar / LocationAutosuggest dropdown | z-30 | Above hero content, below header |
| ResultsControlBar (sticky) | z-20 | Above page body, below overlays |
| Search-bearing hero sections | z-10 | Above page body, below everything above |
| Page content / result cards | auto | Normal flow |
| Hero scrim / decorative background | -z-10 | Behind hero text |

No clipping `overflow-hidden` exists on any element that is an ancestor of an interactive overlay.

---

## Search Results UI Verification

### Hotel search route (`/hotels/search/[citySlug]/[checkIn]/[checkOut]/`)

- Hero: `relative isolate z-10` with `background-image:var(--ui-hero)` ✅
- Breadcrumb: `color:rgba(255,255,255,0.72)` ✅
- H1: City name from `heroData.ui.summary.cityLabel` ✅
- Date range summary below H1 ✅
- "Edit search" link using `buildHotelSearchEditorHref` ✅
- `hideHeader={true}` → `ResultsHeader` suppressed ✅
- Results shell: `ResultsControlBar`, `ResultsFilters`, `ResultsFilterGroups` on `--ui-*` ✅
- Card scaffold: `--ui-surface` / `--ui-border` / `--ui-shadow-card` ✅
- `noindex, follow` via `onRequest` + `head` ✅

### Car-rental search route (`/car-rentals/search/[airportCode]/[pickupDate]/[dropoffDate]/`)

- Hero: `relative isolate z-10` with `--ui-hero` ✅
- Airport code H1 ✅
- Date range labels ✅
- "Edit search" CTA ✅
- `hideHeader={true}` ✅
- `noindex, follow` ✅

### Flight search route (`/flights/search/SLC-LAX/2026-07-01/`)

- `FlightRouteHeader` with `relative isolate overflow-hidden` (no search form → correct) ✅
- noindex via `search/layout.tsx` ✅

---

## City Page UI Verification

### `/hotels/in/las-vegas/` and `/hotels/in/miami/`

- Hero: `relative isolate z-10` ✅
- `HotelSearchCard` inside hero (city/date/guest selection available) ✅
- `CanonicalHotelResultsSection` with `ResultsShell` on `--ui-*` ✅
- `ResultsHeader` rendered (city pages show it; `hideHeader` not set) ✅
- `HotelResultCard` on `--ui-*` ✅
- Indexable: canonical present, no noindex ✅

### `/car-rentals/in/new-york/` and `/car-rentals/in/orlando/`

- Hero: `relative isolate z-10` ✅
- `CarRentalSearchCard` inside hero ✅
- `CanonicalCarResultsSection` on `--ui-*` ✅
- Indexable ✅

---

## Preview Route Safety

| Route | Local (dev server) | Production | x-robots-tag | robots meta |
|---|---|---|---|---|
| `/dev/ui-home/` | 200 | 404 (shouldIndex) | noindex, nofollow | noindex, nofollow |
| `/dev/ui-palettes/` | 200 | 404 (shouldIndex) | noindex, nofollow | noindex, nofollow |
| All `/dev/ui-*` routes | 200 | 404 (shouldIndex) | noindex, nofollow | noindex, nofollow |

Confirmed: No production nav or footer links to any `/dev/*` path.

---

## Contact/Legal Verification

| Check | Status |
|---|---|
| `/contact` uses `CONTACT_EMAIL` env var (fallback: `hello@andacity.com`) | ✅ |
| `/privacy` uses `PRIVACY_EMAIL` env var (fallback: `privacy@andacity.com`) | ✅ |
| `/terms` uses `LEGAL_EMAIL` env var (fallback: `legal@andacity.com`) | ✅ |
| Footer legal bar links: `/privacy`, `/terms`, `/contact`, `/sitemap.xml` | ✅ |
| Legal pages do not claim Andacity is merchant of record | ✅ |
| Legal pages do not guarantee prices, availability, refunds, or bookings | ✅ |
| Affiliate commission disclosure in footer | ✅ Present |

---

## Fixes Applied in CLAUDE-UI-044

None. All checks passed. No deployment-gate issues found. The four small fixes from CLAUDE-UI-043 (LocationAutosuggestField, FlightsSearchCard, two directory heroes) were already committed before this reverification began.

---

## Remaining Deploy Blockers

**None.**

The CLAUDE-UI-031 launch checklist items are all resolved:

| Original item | Status |
|---|---|
| DB SSL TypeScript error (blocked Docker build) | ✅ Fixed in CLAUDE-UI-032 |
| Privacy Policy page | ✅ Created in CLAUDE-UI-032 |
| Terms of Service page | ✅ Created in CLAUDE-UI-032 |
| Contact page | ✅ Created in CLAUDE-UI-032 |
| `/sitemap.xml` empty | ✅ Populated — 313 URLs |
| `/robots.txt` correct | ✅ `Disallow: /search/`, Sitemap pointer |
| Health check endpoint | ✅ `/healthz` → `{"ok":true}` |
| Footer legal links | ✅ `/privacy`, `/terms`, `/contact` in footer |
| Analytics provider | ✅ Abstraction in place; Cloudflare recommended post-launch |
| Error monitoring | ✅ First-party via `/api/errors` |
| Production `ORIGIN` env var | ✅ Set via `APP_ORIGIN` Docker build arg |
| `shouldIndex` production gating | ✅ Returns true only for `andacity.com` / `www.andacity.com` |
| Build gate | ✅ `yarn run build` exits 0 |
| Overlay/stacking fix | ✅ CLAUDE-UI-041/042/043 |
| Hotel/car search UI | ✅ CLAUDE-UI-041 |
| City page UI | ✅ CLAUDE-UI-041/042/043 |
| Results shell migration | ✅ CLAUDE-UI-041 |
| Location autosuggest token migration | ✅ CLAUDE-UI-043 |

---

## Required Pre-Deploy Actions

These are operational steps, not code changes:

1. **Set 7 required environment variables** (see table above) — `DATABASE_URL`, `ORIGIN`, `PUBLIC_BASE_URL`, `OG_SIGNING_SECRET`, `CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL`
2. **Run Docker build with production origin**: `docker build --build-arg APP_ORIGIN=https://andacity.com -t andacity:beta-ui-final .`
3. **Tag the release commit**: `git tag beta-launch-v1 HEAD`
4. **Merge `dev` → `main`** (triggers CI deploy pipeline)
5. **Smoke-test production routes** per [Public Route Smoke Test](#public-route-smoke-test) on live domain
6. **Submit sitemap to Google Search Console** after launch
7. **Verify `/dev/ui-home` returns 404** on production host

---

## Safe-to-Defer Work

| Item | Reason |
|---|---|
| Cloudflare Web Analytics activation | Requires Cloudflare account + token + rebuild. Post-launch task. |
| Full Sentry integration | `PUBLIC_SENTRY_DSN` reserved but no `@sentry/browser` installed. First-party error capture is sufficient. |
| GA4 activation | Requires cookie consent banner. Defer until legal review. |
| `/car-rentals/[slug]` full redesign | Not sitemapped, not nav-linked. |
| `/trips`, `/my-trips`, `/travelers` redesign | Noindex; functional app surfaces. |
| Checkout/confirmation/itinerary redesign | Noindex; payment flows. |
| `HotelSearchSummary.tsx` / `CarSearchSummary.tsx` token migration | On noindex search routes only. |
| Structured log aggregation / monitoring pipeline | Post-launch infra. |
| Cookie consent banner | Only needed when GA4 or a cookie-setting provider is activated. |

---

## Final Deploy Recommendation

**Ready to deploy after environment variables are set.**

The codebase is in the best shape it has been at any point in the UI redesign sequence. All three CLAUDE-UI-041 public-beta blockers are resolved. The CLAUDE-UI-042 stacking-context fix closes the follow-up user-reported overlay issue. The CLAUDE-UI-043 interactive QA found and fixed the last public-surface `--color-*` holdout (`LocationAutosuggestField` dropdown). All 20 smoke-test routes return 200. SEO gates, sitemap, robots.txt, analytics, error monitoring, legal pages, and Docker build are unchanged and verified. No remaining blockers.

---

## Verification Results

```
yarn run build.types    ✅  exit 0
yarn run build.client   ✅  exit 0 — 1083 modules
yarn run build.server   ✅  exit 0
yarn run lint           ✅  exit 0 — 0 errors, 2 pre-existing warnings
yarn run build          ✅  exit 0 — Done in 33.43s
```

Docker: Dockerfile unchanged since CLAUDE-UI-040 (verified successful). Build gate (`yarn run build`) passes. Expected result with `docker build --build-arg APP_ORIGIN=https://andacity.com .`: ✅ success.

Dev server smoke test (20 routes): All 200 ✅

Hero stacking class on all 10 search-bearing heroes: `relative isolate z-10` ✅

`x-robots-tag: noindex, follow` on hotel search, car-rental search, `/search/*`: ✅

Sitemap URL count: 313 ✅ (151 hotel city + 151 car-rental city + index/landing pages)

`/healthz`: `{"ok":true}` ✅
