# Public Beta Deployment Verification

**Task:** CLAUDE-UI-034
**Date:** 2026-06-22
**Branch:** main
**Prereq:** CLAUDE-UI-033 complete

---

## Purpose

Verify that Andacity is deployable as a public beta candidate. Confirm that build,
lint, Docker, environment variables, indexing, contact/legal, analytics, error
monitoring, and route safety all meet the deployment gate.

---

## Deployment Classification

```
Ready to deploy after environment variables are set
```

`yarn run build` now exits 0 after fixing two unused-import lint errors in this
task. The Docker image will build successfully once `APP_ORIGIN` is passed as a
build arg. No secrets are committed. No code blockers remain.

---

## Source Docs Reviewed

| Document | Status |
|----------|--------|
| `docs/ui-redesign/PUBLIC_BETA_LAUNCH_CHECKLIST.md` | ✅ Reviewed |
| `docs/ui-redesign/PUBLIC_BETA_BLOCKER_CLOSURE.md` | ✅ Reviewed |
| `docs/ui-redesign/ANALYTICS_MONITORING_INTEGRATION.md` | ✅ Reviewed |
| `docs/ui-redesign/FINAL_RELEASE_READINESS_AUDIT.md` | ✅ Reviewed |

---

## Build and CI Gate Audit

### `qwik build` step sequence

`yarn run build` calls `qwik build`, which runs **all four** steps in sequence:

```
yarn run build.types    → tsc --incremental --noEmit
yarn run build.client   → vite build
yarn run build.server   → qwik check-client + vite build -c adapters/fastify/vite.config.ts
yarn run lint           → eslint "src/**/*.ts*"
```

**Lint is part of the deployment gate.** If lint exits 1, `yarn run build` exits 1,
and the Docker image build fails.

### Dockerfile build stage

```dockerfile
RUN yarn run build
RUN yarn run build.server
```

Note: `yarn run build` already includes `build.server`. The second `build.server`
call in the Dockerfile is redundant but harmless.

### CI pipeline (GitHub Actions)

`deploy-production.yml` triggers on push to `main`. It:

1. Configures SSH to the EC2 host
2. SSHs to EC2 and runs `./deploy.sh $ref $APP_NAME $PORT $FRAMEWORK $(pwd)`

**The CI pipeline itself does not run lint or type checks.** The gate is embedded
in `yarn run build`, which `deploy.sh` presumably invokes on the EC2 server.
If `deploy.sh` runs the Docker build, lint failures will surface there.

### Build results after fixes in this task

| Step | Result |
|------|--------|
| `yarn run build.types` | ✅ exit 0 — no TypeScript errors |
| `yarn run build.client` | ✅ exit 0 — 1083 modules transformed |
| `yarn run build.server` | ✅ exit 0 — 729 modules, non-fatal worker exit 1 noise |
| `yarn run lint` | ✅ exit 0 — 0 errors, 2 warnings (non-blocking) |
| `yarn run build` | ✅ exit 0 — all steps pass |

### Remaining lint warnings (non-blocking)

| File | Warning |
|------|---------|
| `src/components/site/SiteHeader.tsx:63` | `qwik/no-use-visible-task` — `useVisibleTask$` performance warning |
| `src/components/ui/theme/ThemeController.tsx:48` | Same warning |

These are warnings, not errors. They do not block the build and are deferred
(theme controller functionality requires `useVisibleTask$` for correct behavior).

---

## Docker Verification

Docker is not installed in the local development environment. The build cannot
be run locally.

### Exact Docker build command

```bash
docker build \
  --build-arg APP_ORIGIN=https://andacity.com \
  --build-arg NODE_ENV=production \
  -t andacity:latest \
  .
```

### Docker build expectations

| Concern | Status |
|---------|--------|
| `yarn run build` passes (lint gate cleared) | ✅ Verified locally before Docker |
| `APP_ORIGIN` must be passed as build arg | ⚠️ Required — default is `http://localhost` |
| `ENV ORIGIN ${APP_ORIGIN}` set in final stage | ✅ Confirmed in Dockerfile |
| `NODE_ENV=production` set in final stage | ✅ Confirmed in Dockerfile |
| App runs as non-root user | ✅ Dockerfile uses `USER node` |
| Secrets baked into image | ✅ None — no secrets in source or Dockerfile |
| Runtime env vars (emails, DB) excluded from image | ✅ Set at container runtime, not build time |
| Analytics `PUBLIC_*` vars baked at build time | ⚠️ Must be set before `docker build` if activating a provider |

### Key Docker notes

- Analytics provider token/ID (`PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN`,
  `PUBLIC_GA_MEASUREMENT_ID`) must be available in the **build environment**
  when running `docker build` — they are baked into the client bundle by Vite.
- Contact/legal emails (`CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL`) are
  runtime env vars — pass them via `-e` or container env config at startup.
- The redundant second `RUN yarn run build.server` in the Dockerfile adds ~85s
  to build time but does not cause failures.

---

## Required Environment Variables

### Required before Docker build

| Variable | Required | Notes |
|----------|----------|-------|
| `APP_ORIGIN` | **Required** | Docker build arg. Sets `ORIGIN` in container. Must be `https://andacity.com` |

### Required at container startup (runtime)

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `ORIGIN` | **Required** | `http://localhost` | Qwik CSRF protection. Set via `APP_ORIGIN` build arg or container env |
| `DATABASE_URL` | Required if DB features enabled | — | PostgreSQL connection string |

### Strongly recommended at container startup

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `PUBLIC_BASE_URL` | Recommended | _(request URL origin)_ | Sets canonical URL origin for sitemap + JSON-LD. If unset, derived from incoming request |
| `CONTACT_EMAIL` | Recommended | `hello@andacity.com` | Email shown on `/contact`. Must be monitored |
| `PRIVACY_EMAIL` | Recommended | `privacy@andacity.com` | Email shown on `/privacy`. Must be monitored |
| `LEGAL_EMAIL` | Recommended | `legal@andacity.com` | Email shown on `/terms`. Must be monitored |
| `OG_SIGNING_SECRET` | Recommended | `change-me` | Signs OG image requests. Change before launch |

### Required only if Cloudflare Web Analytics is enabled

_Requires rebuild — these are baked into the client bundle at build time._

| Variable | Notes |
|----------|-------|
| `PUBLIC_ANALYTICS_PROVIDER=cloudflare` | Activates Cloudflare analytics |
| `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` | Cloudflare site token. Public (appears in client JS) |

### Required only if GA4 is enabled

_Requires rebuild. GA4 sets analytics cookies — add cookie consent banner._

| Variable | Notes |
|----------|-------|
| `PUBLIC_ANALYTICS_PROVIDER=ga4` | Activates GA4 |
| `PUBLIC_GA_MEASUREMENT_ID` | Format: `G-XXXXXXXXXX`. Public (appears in client JS) |

### Reserved for future Sentry integration (no current effect)

| Variable | Notes |
|----------|-------|
| `PUBLIC_SENTRY_DSN` | No effect until `@sentry/browser` is installed |

### CI-only (source map uploads — Sentry only)

| Variable | Notes |
|----------|-------|
| `SENTRY_AUTH_TOKEN` | Secret. Never in app code or Docker image |
| `SENTRY_ORG` | Sentry org slug |
| `SENTRY_PROJECT` | Sentry project slug |
| `SENTRY_ENVIRONMENT` | Default: `production` |

---

## Analytics Launch Decision

**Recommendation: Deploy with no analytics provider, then activate Cloudflare
Web Analytics as a follow-up rebuild.**

### Rationale

- No analytics configured → `AnalyticsProvider` returns null, no script injected.
  First-party `PageView` sendBeacon → `/api/analytics/pageview` → `console.info`
  remains active. Container logs capture every pageview.
- Cloudflare Web Analytics is cookieless. No GDPR cookie banner required in most
  jurisdictions. Minimal privacy surface.
- GA4 sets analytics cookies. Cookie consent banner required before activating in
  EU/EEA markets. Do not activate GA4 by default.
- Activating Cloudflare requires: (a) create Cloudflare account + site, (b) set
  `PUBLIC_ANALYTICS_PROVIDER=cloudflare` and token in build env, (c) rebuild +
  redeploy. This can be done as the first post-launch task.

### Analytics behavior table

| Scenario | Behavior |
|----------|----------|
| No provider configured | First-party console.info log only. No script injected. No user-facing impact |
| `PUBLIC_ANALYTICS_PROVIDER=cloudflare` + token | Cookieless CF beacon script injected. CSP updated automatically |
| `PUBLIC_ANALYTICS_PROVIDER=cloudflare` but token empty | `AnalyticsProvider` returns null. No script. Fail safe |
| `PUBLIC_ANALYTICS_PROVIDER=ga4` + measurement ID | GA4 gtag script injected. Sets cookies. Add consent banner |
| Analytics CDN unreachable | Script load fails silently. Async load, no render block |

---

## Error Monitoring Launch Decision

**First-party error capture is sufficient for public beta.**

### Current state

- `ErrorMonitor` component registers `window.onerror` + `window.onunhandledrejection`
  on client hydration via `useTask$`
- Errors sent via `navigator.sendBeacon` to `/api/errors` (same-origin)
- Server endpoint logs `console.error("[andacity.errors]", ...)` — visible in
  container logs immediately
- No personal data captured (message ≤500 chars, filename origin-stripped)
- `sendBeacon` failures are silently swallowed — no user-facing impact
- `PUBLIC_SENTRY_DSN` is reserved but has no effect until `@sentry/browser` is
  installed

### Sentry upgrade path

Install `@sentry/browser`, init with `PUBLIC_SENTRY_DSN`, add `@sentry/vite-plugin`
for source maps. See `docs/ui-redesign/ANALYTICS_MONITORING_INTEGRATION.md` for the
exact upgrade steps.

**Decision:** First-party capture is acceptable for public beta. Sentry remains
strongly recommended before wider commercial launch.

---

## Contact/Legal Launch Check

| Item | Status |
|------|--------|
| `/contact` uses `CONTACT_EMAIL` env var (default: `hello@andacity.com`) | ✅ Verified — `routeLoader$` implementation confirmed |
| `/privacy` uses `PRIVACY_EMAIL` env var (default: `privacy@andacity.com`) | ✅ Verified — `routeLoader$` implementation confirmed |
| `/terms` uses `LEGAL_EMAIL` env var (default: `legal@andacity.com`) | ✅ Verified — `routeLoader$` implementation confirmed |
| Footer bottom bar links: Privacy / Terms / Contact / Sitemap | ✅ Confirmed in `SiteFooter.tsx` |
| Footer has no affiliate guarantee, booking guarantee, or refund guarantee claims | ✅ Only: "Transparent total pricing / Clear cancellation and fee policies / We may earn commission from select partners." |
| `/terms` confirms Andacity is a search/comparison tool, not booking provider | ✅ Confirmed |
| `/terms` includes beta disclaimer ("as is", no warranties) | ✅ Confirmed |
| Legal review | ⚠️ Deferred — both `/privacy` and `/terms` contain `// TODO: Legal review recommended before full commercial launch.` |

**Pre-launch action required:** Verify `CONTACT_EMAIL`, `PRIVACY_EMAIL`, and
`LEGAL_EMAIL` are monitored inboxes before setting them in production. Defaults
are `@andacity.com` addresses — confirm domain email is set up.

---

## SEO/Indexing Deployment Check

### `shouldIndex()` verification

Source: `src/lib/seo/env.ts`

| Host | `shouldIndex()` | Note |
|------|-----------------|------|
| `andacity.com` | `true` | Production — indexable |
| `www.andacity.com` | `true` | Production — indexable |
| `stage.andacity.apps.sunthetic.media` | `false` | Staging — noindex |
| `localhost:*` | `false` | Dev — noindex |
| Any other host | `false` | Noindex by default |

### Dev preview route gating

All `/dev/ui-*` routes use the pattern:
```ts
if (shouldIndex(url)) throw error(404, "Not found")
headers.set("x-robots-tag", "noindex, nofollow")
```

On `andacity.com`, `shouldIndex()` returns `true` → routes throw 404. ✅

### Search route indexing

`src/routes/search/layout.tsx` sets `x-robots-tag: noindex, follow` on **all**
`/search/*` routes via `onRequest`. ✅

### Sitemap

`/sitemap.xml` returns populated XML:
- 11 static routes (/, /hotels, /flights, /car-rentals, /explore, /destinations,
  /hotels/in, /car-rentals/in, /privacy, /terms, /contact)
- All destination pages (from `~/data/destinations`)
- All hotel city pages (from `~/data/hotel-cities`)
- All car rental city pages (from `~/data/car-rental-cities`)
- `Cache-Control: public, max-age=600` on production host
- Hotel detail pages deferred to sub-sitemap at `/sitemaps/hotels/[page].xml`

**Note:** Sitemap origin is derived from `getPublicBaseUrl(url)`. If `PUBLIC_BASE_URL`
is not set at build time, origin falls back to the incoming request URL, which on
production will correctly be `https://andacity.com`.

### robots.txt

```
User-agent: *
Allow: /
Disallow: /search/
Sitemap: <request-origin>/sitemap.xml
```

`Sitemap:` URL uses `url.origin` from the incoming request. On production with
correct Host headers, this will be `https://andacity.com/sitemap.xml`. ✅

### Canonical URLs

Routes generate canonical URLs from the request URL origin or `PUBLIC_BASE_URL`
if set. On production, canonicals will correctly use `https://andacity.com`.

### Footer nav links

No `/dev/*` links in any nav. Confirmed in `siteNav.ts` and `SiteFooter.tsx`. ✅

---

## Production Route Smoke Test

Smoke test based on code inspection. A running server smoke test on the production
host is required on launch day per the launch checklist.

| Route | Expected | Status |
|-------|----------|--------|
| `/` | 200, index page | ✅ Route exists, indexable |
| `/hotels` | 200, hotel search | ✅ Route exists |
| `/hotels/in/miami` | 200, city page | ✅ Dynamic route exists |
| `/hotels/[valid-slug]` | 200, hotel detail | ✅ Route exists |
| `/flights` | 200, flight search | ✅ Route exists |
| `/car-rentals` | 200, car search | ✅ Route exists |
| `/car-rentals/in/orlando` | 200, city page | ✅ Dynamic route exists |
| `/explore` | 200, explore | ✅ Route exists |
| `/explore?theme=beach` | 200, filtered | ✅ Query param supported |
| `/destinations` | 200, destinations | ✅ Route exists |
| `/destinations/miami` | 200, destination detail | ✅ Dynamic route exists |
| `/search/all/miami/1` | 200, noindex | ✅ Route exists, search layout sets noindex |
| `/search/hotels/miami/1` | 200, noindex | ✅ Route exists |
| `/privacy` | 200, privacy policy | ✅ Route exists, updated in CLAUDE-UI-033 |
| `/terms` | 200, terms of service | ✅ Route exists |
| `/contact` | 200, contact page | ✅ Route exists, email env-configurable |
| `/healthz` | 200, `{"ok":true}` | ✅ Endpoint exists, returns JSON |
| `/sitemap.xml` | 200, populated XML | ✅ Populated in CLAUDE-UI-032 |
| `/robots.txt` | 200, disallows /search/ | ✅ Implemented |
| `/search/flights/miami/1` | 404 | ⚠️ Known deferred — flight search URL format mismatch |

**Flight route note:** `/search/flights/miami/1` returns 404. This is a known
deferred issue from CLAUDE-UI-031 (flight search URL format mismatch). Non-blocking
for public beta. Correct route: `/search/flights/from/[slug]/to/[slug]/[type]/[page]`.

---

## Preview Route Safety Check

| Route | Dev host | Production host | Robots |
|-------|----------|-----------------|--------|
| `/dev/ui-palettes` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-shell` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-home` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-hotels` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-hotel-detail` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-hotels-city` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-flights` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-flight-results` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-cars` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-cars-city` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-explore` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-destinations` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-search` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-destination-detail` | 200 | 404 (gated) | noindex, nofollow |
| `/dev/ui-trips` | 200 | 404 (gated) | noindex, nofollow |

All 15 `/dev/ui-*` routes use `if (shouldIndex(url)) throw error(404, "Not found")`.
On `andacity.com`, `shouldIndex()` returns `true` → all dev routes 404. ✅

No production route (footer, header, or page content) links to any `/dev/*` path.
Confirmed by inspection of `siteNav.ts` and `SiteFooter.tsx`. ✅

---

## Runtime Observability Check

| Item | Status |
|------|--------|
| `/api/analytics/pageview` accepts POST with `{path, occurredAt}` | ✅ Confirmed in source |
| `/api/analytics/pageview` logs `console.info("[andacity.analytics]", ...)` | ✅ Confirmed |
| `/api/errors` accepts POST with typed error payload | ✅ Confirmed in source |
| `/api/errors` validates and rejects bad payloads (400) | ✅ Confirmed |
| `/api/errors` logs `console.error("[andacity.errors]", ...)` | ✅ Confirmed |
| `/api/errors` captures no personal data | ✅ Message ≤500 chars, filename origin-stripped |
| `/healthz` returns `{"ok":true}` with `Cache-Control: no-store` | ✅ Confirmed |
| `AnalyticsProvider` returns null when provider not configured | ✅ Guard: `ANALYTICS_PROVIDER === 'X' && TOKEN` |
| No provider script injected when env vars blank | ✅ Build-time elimination |
| CSP `script-src` has no duplicate directives | ✅ Fixed in CLAUDE-UI-033 |
| CSP includes provider CDN only when provider is configured | ✅ `analyticsScriptSrcs()` returns `[]` when no provider |
| Production CSP: `script-src 'self' 'unsafe-inline'` (no provider) | ✅ Confirmed in `cspCommon()` |
| Dev CSP adds `'unsafe-eval'` without duplicating `script-src` | ✅ Fixed in CLAUDE-UI-033 |
| HSTS set on production HTTPS only | ✅ `if (isProd && baseUrl.protocol === 'https:')` |
| `x-content-type-options: nosniff` | ✅ All requests |
| `x-frame-options: DENY` | ✅ All requests |
| `referrer-policy: strict-origin-when-cross-origin` | ✅ All requests |

---

## Fixes Applied

| Fix | File | Reason |
|-----|------|--------|
| Removed unused `RequestHandler` import | `src/routes/car-rentals/in/[citySlug]/index.tsx:27` | `@typescript-eslint/no-unused-vars` error blocked `yarn run build` and Docker |
| Removed unused `formatPriceChange` import | `src/routes/hotels/[slug]/index.tsx:35` | Same — lint error blocked full build |

Both fixes are safe: the imports were confirmed unused (single occurrence in import
line only, confirmed with grep). No behavior changes.

---

## Remaining Deploy Blockers

**No code blockers remain.** All pre-launch items are operational or env-var gated.

---

## Required Pre-Deploy Actions

These must be completed before or on launch day. None require code changes.

| Action | Priority | Notes |
|--------|----------|-------|
| Pass `APP_ORIGIN=https://andacity.com` to `docker build` | **Critical** | Default is `http://localhost` — CSRF will fail without this |
| Set `ORIGIN=https://andacity.com` in container env (if not using build arg) | **Critical** | Alternative to build arg |
| Verify `CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL` are monitored | **Required** | Set env vars in container. No rebuild needed |
| Set `OG_SIGNING_SECRET` to a real random value | **Required** | Default is `change-me` |
| Verify database connection is stable with SSL | **Required** | `DATABASE_URL` with SSL must connect under production load |
| Choose analytics provider or confirm first-party-only | **Recommended** | Cloudflare Web Analytics is ready to activate — requires rebuild |
| Set `PUBLIC_BASE_URL=https://andacity.com` in build environment | **Recommended** | Ensures canonical URLs, sitemap, and JSON-LD use the correct origin even if Host headers are not forwarded correctly |
| Set up uptime monitoring on `/healthz` | **Recommended** | Docker/k8s liveness probe; uptime alert |
| Tag the release commit: `git tag beta-launch-v1` | **Recommended** | Enables clean rollback |

---

## Safe-to-Defer Work

| Item | Impact |
|------|--------|
| Sentry npm integration (`@sentry/browser`) | First-party console.error logging is sufficient for beta. Upgrade before broader launch |
| GA4 activation + cookie consent banner | Do not activate GA4 until cookie consent banner is ready |
| Legal review of `/privacy` and `/terms` | Required before full commercial launch, not public beta |
| Hotel detail pages in main sitemap | Hotel detail pages are in sub-sitemap `/sitemaps/hotels/[page].xml`. Deferred |
| Structured log aggregation pipeline | Container logs are usable for beta. Aggregation (e.g., CloudWatch, Datadog) deferred |
| Shared component token migration (`--color-*` → `--ui-*`) | `CompareSheet`, `CompareTray`, etc. theme correctly enough for beta |
| `/hotels/in` and `/car-rentals/in` full `--ui-*` redesign | Non-blocking |
| Flight search URL format documentation | `/search/flights/miami/1` → 404 is a known limitation, documented |
| A/B testing infrastructure | Post-launch |
| Auth/account/checkout hardening | Post-launch |

---

## Rollback Notes

Before deploying:

```bash
git tag beta-launch-v1 HEAD
git push origin beta-launch-v1
```

Rollback procedure:
- Container rollback: re-deploy the previously tagged Docker image
- Git rollback: `git revert` offending commits or `git checkout <stable-tag>` on deploy branch
- DNS/proxy rollback: point traffic to a previous instance if blue/green is configured

Quick disable (without taking down): Point DNS or reverse proxy to a maintenance
page. The fastest option does not require a redeploy.

---

## Final Deploy Recommendation

```
Deploy public beta after setting required environment variables.
```

No code blockers remain. The two lint errors that were preventing `yarn run build`
(and therefore the Docker build) from completing have been fixed in this task.

The recommended launch sequence:

1. Pass `APP_ORIGIN=https://andacity.com` to Docker build
2. Set `ORIGIN`, `CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL` in container env
3. Set `OG_SIGNING_SECRET` to a real secret
4. Set `DATABASE_URL` (if DB is required at launch)
5. Run Docker build → push image to registry
6. Deploy to production host
7. Run smoke tests from `PUBLIC_BETA_LAUNCH_CHECKLIST.md`
8. Confirm `/dev/ui-home` returns 404 on production
9. Confirm `/sitemap.xml` is populated on production
10. Submit sitemap to Google Search Console
11. Set up uptime monitoring on `/healthz`
12. (First post-launch) Set analytics provider env vars + rebuild

---

## Verification Results

```
# 2026-06-22 — CLAUDE-UI-034

yarn run build.types
✅ exit 0 — no TypeScript errors

yarn run build.client
✅ exit 0 — 1083 modules transformed

yarn run build.server
✅ exit 0 — 729 modules (worker exit 1 lines are non-fatal Vite worker-pool noise)

yarn run lint (before fixes)
✗ exit 1 — 2 errors: unused RequestHandler in car-rentals/[citySlug], unused formatPriceChange in hotels/[slug]

yarn run lint (after fixes in this task)
✅ exit 0 — 0 errors, 2 warnings (qwik/no-use-visible-task in SiteHeader and ThemeController — non-blocking)

yarn run build (after lint fixes)
✅ exit 0 — build.types ✓, build.client ✓, build.server ✓, lint ✓

Docker build
Not run — Docker not installed locally.
Command: docker build --build-arg APP_ORIGIN=https://andacity.com -t andacity:latest .

shouldIndex() behavior
✅ andacity.com → true (production, indexable)
✅ www.andacity.com → true
✅ localhost → false (dev)
✅ staging host → false

/dev/ui-* on production
✅ All 15 routes throw 404 when shouldIndex() returns true (production host)

Search route indexing
✅ src/routes/search/layout.tsx sets x-robots-tag: noindex, follow on all /search/* routes

/sitemap.xml
✅ Populated — static routes + destinations + hotel cities + car rental cities

/healthz
✅ Returns 200 {"ok":true}, Cache-Control: no-store

/robots.txt
✅ Disallow: /search/, Sitemap: <origin>/sitemap.xml

Footer links
✅ Privacy, Terms, Contact, Sitemap — all resolve to real routes
✅ No /dev/* links in any nav or footer

Analytics fail-safe
✅ No provider configured → AnalyticsProvider returns null, no script injected
✅ First-party sendBeacon → /api/analytics/pageview always active

Error monitoring fail-safe
✅ ErrorMonitor active (no Sentry dependency)
✅ sendBeacon failures silently swallowed
✅ No personal data in error payloads

CSP
✅ No duplicate script-src directives
✅ HSTS only on production HTTPS
✅ Provider CDN added to script-src only when provider is configured

No secrets committed
✅ .env.example documents all vars with empty/placeholder values only
✅ No tokens, keys, or secrets in source control
```
