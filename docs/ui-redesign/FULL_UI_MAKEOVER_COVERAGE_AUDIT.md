# Full UI Makeover Coverage Audit

**Task:** CLAUDE-UI-035
**Date:** 2026-06-22
**Auditor:** Claude Code (claude-sonnet-4-6)
**Branch:** dev

---

## Purpose

Produce a complete inventory and classification of every route and page type in Andacity, identifying what has been fully redesigned to the `--ui-*` token system, what remains on legacy `--color-*` tokens, and what the impact is on public beta readiness.

This audit is a planning and triage document, not an implementation task. No routes were modified.

---

## Why Launch Was Paused

The beta launch sequence was paused because the user observed that some pages still use the pre-makeover visual system — specifically the `--color-*` CSS token namespace and legacy layout patterns — and had not been formally audited for full coverage before opening to the public. Prior audits (CLAUDE-UI-029R, CLAUDE-UI-030, CLAUDE-UI-031) focused on the redesigned production surface (14–15 routes) but did not classify every public-facing route. The complete gap list was not established before CLAUDE-UI-034 declared the build ready for deployment.

Key gaps identified before this audit:

- `/hotels/in` and `/car-rentals/in` (all-cities index pages) are publicly linked from the footer "Discover" column but use legacy `--color-*` tokens
- Shared components (CompareSheet, CompareTray, AsyncStateNotice, InventoryRefreshControl, NotFoundPage, Breadcrumbs) use legacy `--color-*` tokens and appear in redesigned page types including hotel detail
- `/trips`, `/my-trips`, `/travelers`, and the full checkout/confirmation/itinerary subsystem are noindex but footer-linked and still on legacy tokens
- The 404/not-found surface uses `--color-*` tokens
- Search results routes for hotels and car rentals use legacy ResultsShell/ResultsHeader components

---

## Source Documents Reviewed

| Document | Task | Status |
|----------|------|--------|
| `docs/ui-redesign/UI_SYSTEM_QA_REPORT.md` | CLAUDE-UI-029R | Reviewed |
| `docs/ui-redesign/FINAL_RELEASE_READINESS_AUDIT.md` | CLAUDE-UI-030 | Reviewed |
| `docs/ui-redesign/PUBLIC_BETA_LAUNCH_CHECKLIST.md` | CLAUDE-UI-031 | Reviewed |
| `docs/ui-redesign/PUBLIC_BETA_BLOCKER_CLOSURE.md` | CLAUDE-UI-032 | Reviewed |
| `docs/ui-redesign/ANALYTICS_MONITORING_INTEGRATION.md` | CLAUDE-UI-033 | Reviewed |
| `docs/ui-redesign/PUBLIC_BETA_DEPLOYMENT_VERIFICATION.md` | CLAUDE-UI-034 | Reviewed |
| `docs/ui-redesign/GLOBAL_SHELL_IMPLEMENTATION.md` | CLAUDE-UI-004 | Reviewed |
| Implementation docs for all 14 redesigned routes | Various | Reviewed |

---

## Route Inventory Method

1. `find src/routes -type f` — enumerate all route files
2. `grep -rn "\-\-color-" src/routes/ -l` — identify legacy token usage per route file
3. `grep -rn "\-\-ui-" src/routes/ -l` — identify new token usage per route file
4. `grep -rn "\-\-color-" src/components/ -l` — identify legacy token usage in shared components
5. Manual inspection of key route files for `onRequest` noindex directives, `head` robots meta, and `Page` vs legacy shell usage
6. Review of `src/components/site/siteNav.ts` for public navigation exposure
7. Review of prior audit documents for confirmed route status

---

## Full Route Inventory

### Routes enumerated from `src/routes/`

```
src/routes/index.tsx                                              → /
src/routes/layout.tsx                                             → root layout (all routes)
src/routes/router-head.tsx                                        → head component
src/routes/plugin@server-env.ts                                   → server env plugin

# Hotels
src/routes/hotels/index.tsx                                       → /hotels
src/routes/hotels/in/index.tsx                                    → /hotels/in
src/routes/hotels/in/[citySlug]/index.tsx                         → /hotels/in/[citySlug]
src/routes/hotels/[slug]/index.tsx                                → /hotels/[slug]
src/routes/hotels/search/[citySlug]/[checkIn]/[checkOut]/index.tsx → /hotels/search/... (proxy/redirect)
src/routes/hotels/stay/[...route]/index.tsx                       → /hotels/stay/... (redirect shim)

# Flights
src/routes/flights/index.tsx                                      → /flights
src/routes/flights/search/[...route]/index.tsx                    → /flights/search/... (redirect shim)
src/routes/flights/itinerary/[...route]/index.tsx                 → /flights/itinerary/... (redirect shim)

# Car Rentals
src/routes/car-rentals/index.tsx                                  → /car-rentals
src/routes/car-rentals/in/index.tsx                               → /car-rentals/in
src/routes/car-rentals/in/[citySlug]/index.tsx                    → /car-rentals/in/[citySlug]
src/routes/car-rentals/[slug]/index.tsx                           → /car-rentals/[slug]
src/routes/car-rentals/search/[airportCode]/[pickupDate]/[dropoffDate]/index.tsx → search proxy
src/routes/cars/rental/[...route]/index.tsx                       → /cars/rental/... (redirect shim)
src/routes/cars/search/[...route]/index.tsx                       → /cars/search/... (redirect shim)

# Explore / Destinations
src/routes/explore/index.tsx                                      → /explore
src/routes/destinations/index.tsx                                 → /destinations
src/routes/destinations/[slug]/index.tsx                          → /destinations/[slug]

# Search
src/routes/search/layout.tsx                                      → search layout (all /search/* routes)
src/routes/search/all/index.tsx                                   → /search/all (redirect)
src/routes/search/all/[query]/index.ts                            → /search/all/[query] (redirect to /1)
src/routes/search/all/[query]/[pageNumber]/index.tsx              → /search/all/[query]/[pageNumber]
src/routes/search/hotels/index.tsx                                → /search/hotels (redirect)
src/routes/search/hotels/[query]/index.ts                         → /search/hotels/[query] (redirect)
src/routes/search/hotels/[query]/[pageNumber]/index.tsx           → /search/hotels/[query]/[pageNumber]
src/routes/search/flights/index.tsx                               → /search/flights (redirect)
src/routes/search/flights/from/.../[pageNumber]/index.tsx         → /search/flights/from/[origin]/to/[dest]/[type]/[page]
src/routes/search/car-rentals/index.tsx                           → /search/car-rentals (redirect)
src/routes/search/car-rentals/[query]/[pageNumber]/index.tsx      → /search/car-rentals/[query]/[pageNumber]

# Legal / Trust
src/routes/privacy/index.tsx                                      → /privacy
src/routes/terms/index.tsx                                        → /terms
src/routes/contact/index.tsx                                      → /contact

# User / Account
src/routes/my-trips/index.tsx                                     → /my-trips
src/routes/travelers/index.tsx                                    → /travelers
src/routes/trips/index.tsx                                        → /trips
src/routes/trips/[tripId]/index.tsx                               → /trips/[tripId]
src/routes/itinerary/[itineraryRef]/index.tsx                     → /itinerary/[itineraryRef]
src/routes/resume/[ref]/index.tsx                                 → /resume/[ref]
src/routes/checkout/index.tsx                                     → /checkout
src/routes/checkout/[checkoutSessionId]/index.tsx                 → /checkout/[checkoutSessionId]
src/routes/confirmation/[confirmationRef]/index.tsx               → /confirmation/[confirmationRef]

# Errors / Catch-all
src/routes/404/index.tsx                                          → /404
src/routes/[...catchAll]/index.tsx                                → * (catch-all → NotFoundPage)

# Operational
src/routes/healthz/index.ts                                       → /healthz
src/routes/robots.txt/index.ts                                    → /robots.txt
src/routes/sitemap.xml/index.tsx                                  → /sitemap.xml
src/routes/sitemaps/destinations/[page].xml/index.ts              → /sitemaps/destinations/[page].xml
src/routes/sitemaps/hotels/[page].xml/index.ts                    → /sitemaps/hotels/[page].xml
src/routes/sitemaps/[kind]/[page].xml/index.ts                    → /sitemaps/[kind]/[page].xml

# OG Images
src/routes/og/hotel/[slug].png/index.ts                           → /og/hotel/[slug].png
src/routes/og/search/[vertical]/[query]/[pageNumber].png/index.ts → /og/search/...

# API Routes
src/routes/api/analytics/events/index.ts                          → /api/analytics/events
src/routes/api/analytics/pageview/index.ts                        → /api/analytics/pageview
src/routes/api/errors/index.ts                                    → /api/errors
src/routes/api/inventory/revalidate/index.ts                      → /api/inventory/revalidate
src/routes/api/locations/search/index.ts                          → /api/locations/search
src/routes/api/search/index.ts                                    → /api/search
src/routes/api/trips/index.ts                                     → /api/trips
src/routes/api/trips/[tripId]/...                                 → /api/trips/[tripId]/...

# Dev Preview (15 routes — all prod-gated)
src/routes/dev/ui-palettes/index.tsx                              → /dev/ui-palettes
src/routes/dev/ui-shell/index.tsx                                 → /dev/ui-shell
src/routes/dev/ui-home/index.tsx                                  → /dev/ui-home
src/routes/dev/ui-hotels/index.tsx                                → /dev/ui-hotels
src/routes/dev/ui-hotel-detail/index.tsx                          → /dev/ui-hotel-detail
src/routes/dev/ui-hotels-city/index.tsx                           → /dev/ui-hotels-city
src/routes/dev/ui-flights/index.tsx                               → /dev/ui-flights
src/routes/dev/ui-flight-results/index.tsx                        → /dev/ui-flight-results
src/routes/dev/ui-cars/index.tsx                                  → /dev/ui-cars
src/routes/dev/ui-cars-city/index.tsx                             → /dev/ui-cars-city
src/routes/dev/ui-explore/index.tsx                               → /dev/ui-explore
src/routes/dev/ui-destinations/index.tsx                          → /dev/ui-destinations
src/routes/dev/ui-search/index.tsx                                → /dev/ui-search
src/routes/dev/ui-destination-detail/index.tsx                    → /dev/ui-destination-detail
src/routes/dev/ui-trips/index.tsx                                 → /dev/ui-trips
```

---

## Public Route Coverage Matrix

| Route pattern | Example URL | Indexable | Uses `--ui-*` tokens | Uses legacy `--color-*` | Makeover status | Beta impact |
|---------------|-------------|-----------|----------------------|------------------------|-----------------|-------------|
| `/` | `/` | ✅ Yes | ✅ Yes | No | ✅ Complete | None |
| `/hotels` | `/hotels` | ✅ Yes | ✅ Yes | No | ✅ Complete | None |
| `/hotels/in` | `/hotels/in` | ✅ Yes | No | ⚠️ Yes (8 instances) | ⚠️ Partial | Footer-linked |
| `/hotels/in/[citySlug]` | `/hotels/in/miami` | ✅ Yes | ✅ Yes | No | ✅ Complete | None |
| `/hotels/[slug]` | `/hotels/miami-resort-01` | ✅ Yes | ✅ Yes (route) | ⚠️ Yes (CompareSheet/Tray components) | ⚠️ Partial | Low (components deferred) |
| `/flights` | `/flights` | ✅ Yes | ✅ Yes | No | ✅ Complete | None |
| `/car-rentals` | `/car-rentals` | ✅ Yes | ✅ Yes | No | ✅ Complete | None |
| `/car-rentals/in` | `/car-rentals/in` | ✅ Yes | No | ⚠️ Yes (5 instances) | ⚠️ Partial | Footer-linked |
| `/car-rentals/in/[citySlug]` | `/car-rentals/in/orlando` | ✅ Yes | ✅ Yes | No | ✅ Complete | None |
| `/car-rentals/[slug]` | `/car-rentals/ful-compact-01` | ✅ Yes | No | ⚠️ Yes (many) | ❌ Legacy | Not redesigned |
| `/explore` | `/explore` | ✅ Yes | ✅ Yes | No | ✅ Complete | None |
| `/destinations` | `/destinations` | ✅ Yes | ✅ Yes | No | ✅ Complete | None |
| `/destinations/[slug]` | `/destinations/miami` | ✅ Yes | ✅ Yes | Comment only | ✅ Complete | None |
| `/privacy` | `/privacy` | ✅ Yes | ✅ Yes | No | ✅ Complete | None |
| `/terms` | `/terms` | ✅ Yes | ✅ Yes | No | ✅ Complete | None |
| `/contact` | `/contact` | ✅ Yes | ✅ Yes | No | ✅ Complete | None |

---

## Internal/Search Route Coverage Matrix

| Route pattern | Example URL | Indexable | Uses `--ui-*` tokens | Uses legacy `--color-*` | Makeover status | Beta impact |
|---------------|-------------|-----------|----------------------|------------------------|-----------------|-------------|
| `/search/all/[query]/[pageNumber]` | `/search/all/miami/1` | ❌ noindex | ✅ Yes | No | ✅ Complete | None |
| `/search/hotels/[query]/[pageNumber]` | `/search/hotels/miami/1` | ❌ noindex | No | ⚠️ Yes (ResultsShell components) | ❌ Legacy | Noindex; deferred |
| `/search/car-rentals/[query]/[pageNumber]` | `/search/car-rentals/orlando/1` | ❌ noindex | No | ⚠️ Yes (ResultsShell components) | ❌ Legacy | Noindex; deferred |
| `/search/flights/from/.../[type]/[page]` | `/search/flights/from/jfk/to/mia/round-trip/1` | ❌ noindex | ✅ Yes | No | ✅ Complete | None |
| `/404` and `[...catchAll]` | `/any-missing-path` | ❌ noindex | No | ⚠️ Yes (NotFoundPage) | ❌ Legacy | Low (error surface) |
| `/my-trips` | `/my-trips` | ❌ noindex | No (Page shell only) | ⚠️ Yes (all MyTrips components) | ❌ Legacy | Footer-linked; noindex |
| `/travelers` | `/travelers` | ❌ noindex | No (Page shell only) | ⚠️ Yes (all Traveler components) | ❌ Legacy | Footer-linked; noindex |
| `/trips` | `/trips` | ❌ noindex | No (Page shell only) | ⚠️ Yes (210 instances in route file) | ❌ Legacy | Footer-linked; noindex |
| `/trips/[tripId]` | `/trips/42` | ❌ noindex | No | ⚠️ Yes (TripPage components) | ❌ Legacy | Not nav-linked |
| `/itinerary/[itineraryRef]` | `/itinerary/ABC-123` | ❌ noindex | No | ⚠️ Yes (all Itinerary components) | ❌ Legacy | Deferred |
| `/checkout/[checkoutSessionId]` | `/checkout/ses_...` | ❌ noindex | No | ⚠️ Yes (all Checkout components) | ❌ Legacy | Deferred |
| `/confirmation/[confirmationRef]` | `/confirmation/ref_...` | ❌ noindex | No | ⚠️ Yes (all Confirmation components) | ❌ Legacy | Deferred |
| `/resume/[ref]` | `/resume/TRP-001` | ❌ noindex | No (Page shell only) | ⚠️ Yes (ResumeLoading, ResumeNotFound) | ❌ Legacy | Deferred |

---

## Dev Preview Route Coverage Matrix

All 15 dev preview routes are prod-gated (404 on `andacity.com`) via `shouldIndex()` check in each route's `onRequest`. They serve `x-robots-tag: noindex, nofollow` on non-production hosts.

| Route | Build with `--ui-*` | Prod-gated |
|-------|---------------------|------------|
| `/dev/ui-palettes` | ✅ | ✅ (404 on prod) |
| `/dev/ui-shell` | ✅ | ✅ |
| `/dev/ui-home` | ✅ | ✅ |
| `/dev/ui-hotels` | ✅ | ✅ |
| `/dev/ui-hotel-detail` | ✅ | ✅ |
| `/dev/ui-hotels-city` | ✅ | ✅ |
| `/dev/ui-flights` | ✅ | ✅ |
| `/dev/ui-flight-results` | ✅ | ✅ |
| `/dev/ui-cars` | ✅ | ✅ |
| `/dev/ui-cars-city` | ✅ | ✅ |
| `/dev/ui-explore` | ✅ | ✅ |
| `/dev/ui-destinations` | ✅ | ✅ |
| `/dev/ui-search` | ✅ | ✅ |
| `/dev/ui-destination-detail` | ✅ | ✅ |
| `/dev/ui-trips` (CLAUDE-UI-029 accidental) | ✅ | ✅ |

No production route links to any `/dev/*` path. Confirmed in `siteNav.ts`, `SiteFooter.tsx`, and all production route files.

---

## Operational/API Route Coverage Matrix

No visual redesign required for these routes.

| Route | Type | Status |
|-------|------|--------|
| `/healthz` | Health check endpoint (`{"ok":true}`) | ✅ Operational |
| `/robots.txt` | robots.txt (text response) | ✅ Operational |
| `/sitemap.xml` | XML sitemap (populated in CLAUDE-UI-032) | ✅ Operational |
| `/sitemaps/destinations/[page].xml` | XML sub-sitemap | ✅ Operational |
| `/sitemaps/hotels/[page].xml` | XML sub-sitemap | ✅ Operational |
| `/sitemaps/[kind]/[page].xml` | XML sub-sitemap (general) | ✅ Operational |
| `/og/hotel/[slug].png` | OG image generation (server-side) | ✅ Operational |
| `/og/search/[vertical]/[query]/[page].png` | OG image generation | ✅ Operational |
| `/api/analytics/pageview` | First-party pageview endpoint | ✅ Operational |
| `/api/analytics/events` | Analytics events endpoint | ✅ Operational |
| `/api/errors` | First-party error capture endpoint | ✅ Operational |
| `/api/inventory/revalidate` | Inventory revalidation endpoint | ✅ Operational |
| `/api/locations/search` | Location autosuggest API | ✅ Operational |
| `/api/search` | Search API endpoint | ✅ Operational |
| `/api/trips/...` | Trip management API (12 sub-routes) | ✅ Operational |

---

## Completed Redesigned Page Types

The following page types have been fully redesigned to the `--ui-*` token system, verified in CLAUDE-UI-029R, CLAUDE-UI-030, and CLAUDE-UI-034:

| Page type | Route | Task |
|-----------|-------|------|
| Global shell (header, footer) | All routes | CLAUDE-UI-004 |
| Home page | `/` | CLAUDE-UI-006 |
| Hotels landing | `/hotels` | CLAUDE-UI-008 |
| Hotel detail | `/hotels/[slug]` (route file) | CLAUDE-UI-010 |
| Hotels by city | `/hotels/in/[citySlug]` | CLAUDE-UI-012 |
| Flights landing | `/flights` | CLAUDE-UI-014 |
| Flight search results | `/search/flights/from/.../[page]` | CLAUDE-UI-016 |
| Car rentals landing | `/car-rentals` | CLAUDE-UI-018 |
| Car rentals by city | `/car-rentals/in/[citySlug]` | CLAUDE-UI-020 |
| Explore | `/explore` | CLAUDE-UI-022 |
| Destinations index | `/destinations` | CLAUDE-UI-024 |
| Global search overview | `/search/all/[query]/[pageNumber]` | CLAUDE-UI-026 |
| Destination detail | `/destinations/[slug]` | CLAUDE-UI-028 |
| Privacy Policy | `/privacy` | CLAUDE-UI-032 |
| Terms of Service | `/terms` | CLAUDE-UI-032 |
| Contact | `/contact` | CLAUDE-UI-032 |

---

## Partially Redesigned Page Types

These page types have some `--ui-*` usage but also retain `--color-*` tokens, either in the route file itself or in shared components that appear on the page:

| Page type | Route | Issue | Severity |
|-----------|-------|-------|----------|
| Hotels all-cities index | `/hotels/in` | Route file uses `--color-*` tokens throughout (8 direct instances; grids, text, badges) | High — publicly linked from footer "Discover" |
| Car rentals all-cities index | `/car-rentals/in` | Route file uses `--color-*` tokens throughout (5 direct instances; grids, text, actions) | High — publicly linked from footer "Discover" |
| Hotel detail | `/hotels/[slug]` | Route file is on `--ui-*` but `CompareSheet.tsx` and `CompareTray.tsx` appear on the page and use `--color-*` | Medium — deferred per CLAUDE-UI-029R |
| 404 / Not found | `/404` and `[...catchAll]` | `NotFoundPage.tsx` uses `--color-text-strong`, `--color-text-muted` (3 instances) | Low — noindex error surface |
| All routes | Root `layout.tsx` line 61 | `min-h-screen` wrapper uses `text-[color:var(--color-text)]` (1 instance) | Low — `--color-text` is still defined in themes |
| All routes | `Page.tsx` line ~11 | Breadcrumb border uses `--color-border` (1 instance) | Low — same |
| All routes | `Breadcrumbs.tsx` | 2 instances of `--color-*` | Low — same |

---

## Legacy Page Types

These page types have not been redesigned and use `--color-*` tokens throughout:

| Page type | Route | `--color-*` instances | Footer-linked | Priority |
|-----------|-------|-----------------------|---------------|----------|
| Trip builder | `/trips` and `/trips/[tripId]` | ~210 in route file alone | ✅ Yes ("Current trip") | High |
| My Trips | `/my-trips` | Many (all MyTrips components) | ✅ Yes ("My Trips") | Medium |
| Saved Travelers | `/travelers` | Many (all Traveler components) | ✅ Yes ("Saved Travelers") | Medium |
| Car rental detail | `/car-rentals/[slug]` | Many (route file + CarEntity components) | ❌ No (via search results) | Medium |
| Hotel search results | `/search/hotels/[query]/[pageNumber]` | Many (ResultsShell, ResultsHeader, etc.) | ❌ No | Low (noindex) |
| Car rental search results | `/search/car-rentals/[query]/[pageNumber]` | Many (ResultsShell, etc.) | ❌ No | Low (noindex) |
| Itinerary view | `/itinerary/[itineraryRef]` | Many (all Itinerary components) | ❌ No | Low (noindex) |
| Checkout | `/checkout/[checkoutSessionId]` | Many (all Checkout components) | ❌ No | Low (noindex) |
| Confirmation | `/confirmation/[confirmationRef]` | Many (all Confirmation components) | ❌ No | Low (noindex) |
| Resume flow | `/resume/[ref]` | Several (ResumeLoading, ResumeNotFound) | ❌ No | Low (noindex) |

---

## Shared Component/Token Findings

### Confirmed deferred in CLAUDE-UI-029R

| Component | File | Legacy token count | Appears on |
|-----------|------|--------------------|------------|
| CompareSheet | `src/components/save-compare/CompareSheet.tsx` | Many | Hotel detail, Car rental detail |
| CompareTray | `src/components/save-compare/CompareTray.tsx` | Many | Hotel detail, Car rental detail |
| AsyncStateNotice | `src/components/async/AsyncStateNotice.tsx` | Several | Trips, My Trips, search error states |
| InventoryRefreshControl | `src/components/inventory/InventoryRefreshControl.tsx` | Several | Hotel detail, Trips, Car rental detail |

### Additional findings (not previously documented)

| Component | File | Legacy token count | Appears on |
|-----------|------|--------------------|------------|
| NotFoundPage | `src/components/site/NotFoundPage.tsx` | 3 | 404 page, all unresolved routes |
| Breadcrumbs | `src/components/navigation/Breadcrumbs.tsx` | 2 | All pages using the Page shell |
| Page.tsx | `src/components/site/Page.tsx` | 1 | All pages using the Page shell |
| Root layout | `src/routes/layout.tsx` | 1 (`--color-text` on wrapper div) | All routes |

### Bulk legacy component systems (no change since original codebase)

These component families are entirely on `--color-*` and belong to the user-facing app subsystems not yet redesigned:

- `src/components/trips/` — All trip builder components (~15 files)
- `src/components/my-trips/` — All My Trips components (~10 files)
- `src/components/travelers/` — All Saved Travelers components (~5 files)
- `src/components/checkout/` — All checkout components (~20 files)
- `src/components/confirmation/` — All confirmation components (~8 files)
- `src/components/itinerary/` — All itinerary components (~12 files)
- `src/components/retrieval/` — Resume flow components (~3 files)
- `src/components/results/` — Search result components (~10 files)
- `src/components/search/hotels/` — Hotel search result components (~5 files)
- `src/components/search/cars/` — Car search result components (~5 files)
- `src/components/search/flights/` — Flight search result components (~5 files)
- `src/components/entities/cars/` — Car entity page components (~8 files)
- `src/components/entities/flights/` — Flight entity page components (~6 files)

---

## Navigation/Footer Exposure Findings

### Header primary navigation (fully redesigned, all routes complete)

| Label | Href | Status |
|-------|------|--------|
| Flights | `/flights` | ✅ Complete |
| Hotels | `/hotels` | ✅ Complete |
| Cars | `/car-rentals` | ✅ Complete |
| Explore | `/explore` | ✅ Complete |
| Destinations | `/destinations` | ✅ Complete |

### Footer column navigation (siteNav.ts)

**"Book" column:**

| Label | Href | Status |
|-------|------|--------|
| Flights | `/flights` | ✅ Complete |
| Hotels | `/hotels` | ✅ Complete |
| Car rentals | `/car-rentals` | ✅ Complete |
| My Trips | `/my-trips` | ❌ Legacy (components use `--color-*`); noindex |

**"Discover" column:**

| Label | Href | Status |
|-------|------|--------|
| Explore | `/explore` | ✅ Complete |
| Destinations | `/destinations` | ✅ Complete |
| Hotel city guides | `/hotels/in` | ⚠️ Partial — route uses `--color-*` tokens |
| Rental cities | `/car-rentals/in` | ⚠️ Partial — route uses `--color-*` tokens |

**"Plan" column:**

| Label | Href | Status |
|-------|------|--------|
| Start a search | `/#global-search-entry` | ✅ Complete |
| Current trip | `/trips` | ❌ Legacy (210 `--color-*` instances); noindex |
| Saved Travelers | `/travelers` | ❌ Legacy (components use `--color-*`); noindex |
| Sitemap | `/sitemap.xml` | ✅ Operational |

**Footer bottom bar (SiteFooter.tsx):**

| Label | Href | Status |
|-------|------|--------|
| Privacy | `/privacy` | ✅ Complete |
| Terms | `/terms` | ✅ Complete |
| Contact | `/contact` | ✅ Complete |
| Sitemap | `/sitemap.xml` | ✅ Operational |

### Navigation summary

**3 footer-linked routes use legacy tokens and are publicly reachable:**

1. `/hotels/in` — Indexable public page, `--color-*` throughout. Theme switching will not work. Visual inconsistency with all other redesigned pages.
2. `/car-rentals/in` — Same as above.
3. `/trips` — Noindex, user-facing app page, `--color-*` throughout. Linked from footer "Plan" as "Current trip."

**2 additional footer-linked routes use legacy component systems:**

4. `/my-trips` — Noindex, uses `Page` shell but all `MyTrips*` components use `--color-*`.
5. `/travelers` — Noindex, uses `Page` shell but all `Traveler*` components use `--color-*`.

---

## SEO/Indexing Findings

All findings from CLAUDE-UI-030 and CLAUDE-UI-034 remain current. No new SEO issues introduced.

| Check | Status |
|-------|--------|
| `shouldIndex()` production behavior | ✅ Correct (`andacity.com` → true, all others → false) |
| All 15 `/dev/ui-*` routes 404 on production | ✅ Confirmed |
| `/search/*` routes set `x-robots-tag: noindex, follow` via layout | ✅ Confirmed |
| User-scoped routes (`/my-trips`, `/travelers`, `/trips`, `/checkout`, `/itinerary`, `/confirmation`) | ✅ All noindex per onRequest or head meta |
| `/404` and `[...catchAll]` | ✅ noindex,follow |
| Indexable routes (/, /hotels, /hotels/in, /hotels/in/[slug], /hotels/[slug], /flights, /car-rentals, /car-rentals/in, /car-rentals/in/[slug], /explore, /destinations, /destinations/[slug], /privacy, /terms, /contact) | ✅ All index,follow |
| `/sitemap.xml` populated | ✅ Includes 11 static routes + destinations + hotel cities + car rental cities |
| `/robots.txt` | ✅ Disallow: /search/, Sitemap: present |
| Canonical URLs | ✅ Use request origin (correct on production with proper Host headers) |
| JSON-LD validity | ✅ No invalid objects in @graph arrays (CLAUDE-UI-029R) |

**New finding:** `/hotels/in` and `/car-rentals/in` are included in the sitemap with priority 0.7. Since they are indexable but still on legacy tokens, theme-switching inconsistencies will be visible to users coming from search engines.

---

## Claim-Safety Findings

All claim-safety fixes from CLAUDE-UI-029R and CLAUDE-UI-030 remain in place. No new unsupported claims were found in this audit.

Legacy page types (`/trips`, `/my-trips`, `/travelers`, checkout/confirmation) do not make marketing claims — they are functional user-facing app surfaces. No new fixes needed on that basis.

---

## Accessibility Findings

Accessibility work was completed and verified in CLAUDE-UI-030 for all redesigned routes. The following observations apply to legacy surfaces:

- `/trips`: Uses `<Page>` shell with breadcrumb. H1 is present (`Trips`). Accessible name issues in the complex trip builder UI are unknown but deferred.
- `/my-trips`, `/travelers`: Both use `<Page>` shell. H1 present. Legacy component accessibility is unknown but deferred.
- `/hotels/in`, `/car-rentals/in`: Both use `<Page>` shell. H1 present. The token inconsistency affects visual only, not semantic structure or ARIA attributes.
- `NotFoundPage`: Has an H1 and basic structure. No ARIA issues observed.

---

## Mobile/Responsive Findings

No new responsive issues found in redesigned routes. Legacy page types (`/trips`, `/my-trips`) have not been verified for mobile at `375px` but are noindex and internal-focused. `/hotels/in` and `/car-rentals/in` render a card grid with `sm:grid-cols-2 lg:grid-cols-3` — responsive layout works but visual polish is legacy.

---

## Public Beta Impact Classification

### Must complete before public beta

| Item | Route | Reason |
|------|-------|--------|
| Hotels all-cities index redesign | `/hotels/in` | Publicly linked, indexable, visually inconsistent. Theme switching broken. In sitemap. |
| Car rentals all-cities index redesign | `/car-rentals/in` | Same. Publicly linked, indexable, visually inconsistent. In sitemap. |

### Strongly recommended before public beta

| Item | Route/Component | Reason |
|------|-----------------|--------|
| Shared component token migration | `CompareSheet`, `CompareTray`, `AsyncStateNotice`, `InventoryRefreshControl` | These appear on hotel detail pages — a redesigned, indexable, footer-linked surface. Theme switching broken on those pages. |
| NotFoundPage migration | `NotFoundPage.tsx` | Every unresolved URL shows this page. Legacy tokens visible to any user following a broken link. |
| Minor token cleanup | `Breadcrumbs.tsx` (2), `Page.tsx` (1), `layout.tsx` (1) | Small but visible inconsistencies on every page. Low effort. |

### Safe to defer after public beta

| Item | Route/Component | Reason |
|------|-----------------|--------|
| Trip builder full redesign | `/trips`, `/trips/[tripId]` | Noindex; functional; complex multi-panel app UI |
| My Trips redesign | `/my-trips` | Noindex; complex app UI |
| Saved Travelers redesign | `/travelers` | Noindex; complex form-heavy UI |
| Car rental detail redesign | `/car-rentals/[slug]` | Not in primary nav; reachable via search results only |
| Hotel/car/flight search results migration | `/search/hotels/`, `/search/car-rentals/` | Noindex; functional; large component system |
| Checkout/confirmation system | `/checkout/`, `/confirmation/` | Noindex; complex payment flows |
| Itinerary view | `/itinerary/[ref]` | Noindex; not publicly linked |
| Resume flow | `/resume/[ref]` | Noindex; utility surface |

---

## Recommended Remediation Sequence

Ordered by impact × urgency:

| Priority | Task | Scope | Routes/Components | Est. complexity |
|----------|------|-------|-------------------|-----------------|
| 1 (Must) | Hotels all-cities index redesign | Replace `--color-*` with `--ui-*` in `/hotels/in` | `hotels/in/index.tsx` | Low |
| 2 (Must) | Car rentals all-cities index redesign | Replace `--color-*` with `--ui-*` in `/car-rentals/in` | `car-rentals/in/index.tsx` | Low |
| 3 (Recommended) | Shared component token migration | Migrate 4 deferred components + NotFoundPage + Breadcrumbs | `CompareSheet`, `CompareTray`, `AsyncStateNotice`, `InventoryRefreshControl`, `NotFoundPage`, `Breadcrumbs`, `Page` | Medium |
| 4 (Deferred) | Trip builder redesign | Full `--ui-*` migration of `/trips` page | `trips/index.tsx` + all `src/components/trips/` | High |
| 5 (Deferred) | My Trips + Travelers polish | Migrate `/my-trips`, `/travelers` page component systems | `my-trips/index.tsx`, `travelers/index.tsx` + all `MyTrips*`, `Traveler*` components | Medium |
| 6 (Deferred) | Car rental detail redesign | Migrate `/car-rentals/[slug]` and `CarEntity*` components | `car-rentals/[slug]/index.tsx` + `src/components/entities/cars/` | Medium |
| 7 (Deferred) | Search results component migration | Migrate `ResultsShell`, hotel/car search result components | `src/components/results/`, `src/components/search/hotels/`, `src/components/search/cars/` | High |
| 8 (Deferred) | Checkout/confirmation system | Full migration of checkout and confirmation flows | `src/components/checkout/`, `src/components/confirmation/` | High |
| 9 (Deferred) | Final full-surface UI QA | Cross-route QA after all migrations complete | All routes | Low |

---

## Proposed Next Tasks

```
CLAUDE-UI-036 — Hotels All-Cities Index Page Redesign (/hotels/in)
CLAUDE-UI-037 — Car Rentals All-Cities Index Page Redesign (/car-rentals/in)
CLAUDE-UI-038 — Shared Component Token Migration (CompareSheet, CompareTray, AsyncStateNotice, InventoryRefreshControl, NotFoundPage, Breadcrumbs, Page minor fixes)
CLAUDE-UI-039 — Trip Builder Page Redesign (/trips)
CLAUDE-UI-040 — My Trips and Saved Travelers Page Polish
CLAUDE-UI-041 — Car Rental Detail Page Redesign (/car-rentals/[slug])
CLAUDE-UI-042 — Search Results and Entity Component Token Migration
CLAUDE-UI-043 — Checkout, Confirmation, and Itinerary System Polish
CLAUDE-UI-044 — Final Full-Surface UI QA
```

---

## Open Questions

| Question | Priority |
|----------|----------|
| Should `/trips`, `/my-trips`, `/travelers` remain in the footer while still on legacy tokens? Or should they be hidden from the footer until redesigned? | Medium — depends on whether internal inconsistency is acceptable in public beta |
| Does the `--color-text` token on the root layout wrapper (`layout.tsx:61`) resolve to the same value as `--ui-text`? Or is it a different value that may cause text color mismatches? | Low — both token systems define base text colors; verify they are compatible |
| Should `/car-rentals/[slug]` (car rental detail, not yet redesigned) be hidden from navigation or left accessible via search results? | Low — it is currently only reachable via search results, not nav links |
| Does the sitemap need to be updated to exclude `/hotels/in` and `/car-rentals/in` while they are in partial state, or is the partial state acceptable for indexing? | Low — both routes are functional; visual inconsistency does not affect SEO validity |

---

## Verification Results

### Build verification

```bash
yarn run build.types
# ✅ exit 0 — no TypeScript errors

yarn run lint
# ✅ exit 0 — 0 errors, 2 warnings (qwik/no-use-visible-task — pre-existing, non-blocking)

yarn run build
# ✅ exit 0 — build.types ✓, build.client ✓ (1083 modules), build.server ✓ (729 modules), lint ✓
```

Build status is unchanged from CLAUDE-UI-034. No regressions introduced by this audit task (audit-only, no code changes).

### Route classification verification

Routes classified as `--ui-*` complete were confirmed by:
- grep for `--color-*` returning 0 or comment-only results in the route file
- Cross-referencing with implementation docs and CLAUDE-UI-029R audit table

Routes classified as partial or legacy were confirmed by:
- grep for `--color-*` returning functional CSS usage (not comments) in the route file and/or its direct components

### Navigation exposure verification

`src/components/site/siteNav.ts` was inspected directly. The `FOOTER_NAV` array contains links to `/hotels/in`, `/car-rentals/in`, `/trips`, `/my-trips`, and `/travelers`. These links are active in the footer of every page.

### Smoke test (code inspection — no running server required)

| Route | Expected | Confirmed |
|-------|----------|-----------|
| `/` | 200, Complete | ✅ Route exists, `--ui-*` only |
| `/hotels` | 200, Complete | ✅ |
| `/hotels/in` | 200, Partial | ✅ Confirmed `--color-*` in route file |
| `/hotels/in/miami` | 200, Complete | ✅ |
| `/flights` | 200, Complete | ✅ |
| `/car-rentals` | 200, Complete | ✅ |
| `/car-rentals/in` | 200, Partial | ✅ Confirmed `--color-*` in route file |
| `/car-rentals/in/orlando` | 200, Complete | ✅ |
| `/explore` | 200, Complete | ✅ |
| `/destinations` | 200, Complete | ✅ |
| `/destinations/miami` | 200, Complete | ✅ |
| `/privacy` | 200, Complete | ✅ Uses `--ui-*` exclusively |
| `/terms` | 200, Complete | ✅ Uses `--ui-*` exclusively |
| `/contact` | 200, Complete | ✅ Uses `--ui-*` exclusively |
| `/search/all/miami/1` | 200, Complete, noindex | ✅ |
| `/dev/ui-trips` | 200 on dev, 404 on prod | ✅ Confirmed gate |
| `/trips` | 200, Legacy, noindex | ✅ Confirmed `--color-*` throughout (210 instances) |
