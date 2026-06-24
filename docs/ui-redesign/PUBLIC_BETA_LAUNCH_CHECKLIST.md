# Public Beta Launch Checklist

**Task:** CLAUDE-UI-031
**Date:** 2026-06-21
**Classification source:** CLAUDE-UI-030 Final Release Readiness Audit

---

## Current Release Classification

```
Ready for public beta
```

All primary consumer-facing routes are stable, claim-safe, and accessible. SEO/indexing is correct. Dev preview routes are gated. No remaining UI-blocking issues.

**Important reclassification:** The DB SSL TypeScript error in `src/lib/db/client.server.ts:91` was classified as non-blocking in CLAUDE-UI-030. After reviewing the Dockerfile, this classification must be narrowed:

- **Development server / direct `build.client` path:** non-blocking ✅
- **Docker build (`yarn run build`):** BLOCKING ❌ — `yarn run build` calls `build.types` which exits 1, failing the Docker image build

If production deployment uses Docker, this error must be fixed or the Dockerfile must be changed before launch.

---

## Source Audits Reviewed

| Document | Commit | Status |
|----------|--------|--------|
| `docs/ui-redesign/UI_SYSTEM_QA_REPORT.md` | a42b94d | ✅ |
| `docs/ui-redesign/FINAL_RELEASE_READINESS_AUDIT.md` | 7b79215 | ✅ |

---

## Must Complete Before Public Beta

- [ ] **Fix DB SSL TypeScript error** (`src/lib/db/client.server.ts:91`)<br>
  The error prevents `npm run build` / `yarn run build` from completing. The Dockerfile runs `yarn run build`, so Docker image builds will fail. Options: (a) fix the type annotation, (b) add `@ts-expect-error` if the runtime behavior is intentional and the type definition is wrong, or (c) split the Dockerfile build into `build.client` + `build.server` without `build.types`. Fix (a) or (b) is preferred; (c) silently bypasses all type checking.

- [ ] **Confirm production `ORIGIN` env var is set correctly**<br>
  The Dockerfile sets `ENV ORIGIN ${APP_ORIGIN}`. The Qwik/Fastify adapter uses `ORIGIN` for CSRF protection. If not set to the real production domain, CSRF checks will fail or the app will serve with the wrong origin.

- [ ] **Confirm production `shouldIndex` behavior**<br>
  The `shouldIndex(url)` function gates indexability and `/dev/ui-*` access. Confirm it correctly identifies the production host. Dev preview routes must 404 on the production host.

- [ ] **Verify `/sitemap.xml` is not empty**<br>
  `/sitemap.xml` currently returns an empty `<urlset>`. A public beta site with no sitemap will have slow indexing of new content. Populate with at minimum the primary indexable routes before launch. Sub-sitemaps at `/sitemaps/destinations/[page].xml` and `/sitemaps/hotels/[page].xml` exist and should be wired.

- [ ] **Verify `robots.txt` is served correctly on production host**<br>
  The robots.txt implementation exists (`src/routes/robots.txt/index.ts`) and disallows `/search/` and lists `Sitemap:`. Confirm it responds on the production domain and the sitemap URL uses the correct origin.

- [ ] **Create a Privacy Policy page**<br>
  No `/privacy` route exists. The footer includes "We may earn commission from select partners." Any meaningful data collection or affiliate revenue requires a Privacy Policy. At minimum a placeholder page should exist before public beta. This is a legal and trust requirement.

- [ ] **Create a Terms of Service page**<br>
  No `/terms` route exists. Required for any commerce-adjacent site before public launch.

- [ ] **Create a Contact or Support page**<br>
  No `/contact` or `/support` route exists. Users encountering booking issues need a contact path. Minimum: a page with an email address.

---

## Strongly Recommended Before Public Beta

- [ ] **Connect a real analytics provider**<br>
  The `PageView` component fires `sendBeacon('/api/analytics/pageview', …)` and the endpoint logs to `console.info`. This is server-log-only — no dashboard, no retention, no funnel tracking. Before public beta, connect a provider (Plausible, PostHog, GA4, or Cloudflare Web Analytics) so you can observe real user behavior from day one. The hook is already in place in `src/components/analytics/PageView.tsx`.

- [ ] **Set up error monitoring**<br>
  No Sentry, Datadog, or equivalent is configured. Client-side JS errors and server-side 500s will be invisible. At minimum, add a Sentry DSN to capture unhandled exceptions before real users arrive.

- [ ] **Set up a health-check endpoint**<br>
  No `/healthz` or `/health` route exists. Required for Docker orchestration (load balancer, k8s liveness probes). The app exposes port 3000; without a health endpoint, container restarts may go undetected.

- [ ] **Add legal links to the footer**<br>
  The footer currently has no links to Privacy Policy or Terms of Service. Once those pages exist, add them to `FOOTER_NAV` in `src/components/site/siteNav.ts` under an appropriate column (e.g., a "Company" or "Legal" column).

- [ ] **Add affiliate/commission disclosure link**<br>
  The footer currently shows "We may earn commission from select partners." as plain text. For compliance, this statement should link to or sit near the Privacy/Terms page. Confirm this satisfies FTC or relevant jurisdiction requirements.

- [ ] **Confirm database connection is stable at production scale**<br>
  The DB SSL TypeScript error suggests the Postgres connection config may have SSL settings that aren't recognized by the current type definitions. Verify the production DB connection works with SSL enabled before serving real traffic.

- [ ] **Populate `/sitemap.xml` with real URLs (minimum set)**<br>
  If full dynamic sitemap generation isn't ready, at minimum include static entries for:
  - `/`
  - `/hotels`
  - `/hotels/in`
  - `/flights`
  - `/car-rentals`
  - `/explore`
  - `/destinations`

- [ ] **Set cookie policy if analytics collects cookies**<br>
  Current analytics is server-log-only (no cookies set by the analytics stub). If a real provider is added before launch, confirm cookie disclosure requirements and add a cookie banner if required by jurisdiction.

- [ ] **Confirm `theme-color` meta tag matches brand**<br>
  `root.tsx` sets `<meta name="theme-color" content="#2563EB">`. Confirm this matches the Skyglass Luxe primary color for a consistent browser chrome experience on mobile.

- [ ] **Verify production-host CSS is production-optimized**<br>
  The dev build serves unminified CSS via Vite. Confirm `build.client` output is being served, not a dev server, in production.

---

## Safe to Defer Until After Public Beta

- [ ] Shared component token migration (`CompareSheet`, `CompareTray`, `AsyncStateNotice`, `InventoryRefreshControl`) from `--color-*` to `--ui-*` — these components work but will not theme-switch correctly with the new palette system
- [ ] `/hotels/in` and `/car-rentals/in` full redesign to `--ui-*` tokens — functional, just uses legacy palette
- [ ] Flight search URL format documentation update — `/search/flights/miami/1` returns 404; this is architectural, not a consumer-facing bug
- [ ] Remaining mild jargon in explore page nextSteps card descriptions
- [ ] Full dynamic sitemap generation for hotel/destination pages
- [ ] Structured log aggregation / log pipeline
- [ ] A/B testing infrastructure
- [ ] Social share meta (`og:image`) per-page optimization
- [ ] Trips production page (CLAUDE-UI-032+)
- [ ] Auth / account flows
- [ ] Checkout hardening

---

## Build and Deployment Checklist

- [ ] `npm run build.types` — expected: exit 2, one error (`src/lib/db/client.server.ts:91`). If new errors appear, investigate before deploying.
- [ ] `npm run build.client` — expected: ✅ pass (1071 modules). Confirm before Docker build.
- [ ] `npm run build.server` — expected: ✅ pass. Confirm.
- [ ] `docker build` — will fail until DB SSL error is fixed or Dockerfile is updated.
- [ ] Confirm `APP_ORIGIN` Docker ARG is set to the real production domain.
- [ ] Confirm `NODE_ENV=production` in the production container.
- [ ] Confirm the production database URL, SSL settings, and pool config are correct.
- [ ] Confirm port 3000 is exposed and reachable behind any load balancer or reverse proxy.
- [ ] Confirm `ORIGIN` env var is set (required for Qwik CSRF protection on form submissions).

---

## Route Smoke-Test Checklist

Run on the production host immediately after deployment:

- [ ] `GET /` → 200, H1 visible, global search entry visible
- [ ] `GET /hotels` → 200, hotel search form visible
- [ ] `GET /hotels/in/miami` → 200, city page loads with hotel cards or empty state
- [ ] `GET /hotels/[valid-slug]` → 200 (use `miami-resort-01` or equivalent), hotel detail visible
- [ ] `GET /flights` → 200, flight search form visible
- [ ] `GET /search/flights/from/jfk/to/mia/round-trip/1` → 200, flight results page
- [ ] `GET /car-rentals` → 200, car rental search form visible
- [ ] `GET /car-rentals/in/orlando` → 200, city page visible
- [ ] `GET /explore` → 200, theme filters visible
- [ ] `GET /destinations` → 200, destination cards visible
- [ ] `GET /destinations/miami` → 200, destination detail visible
- [ ] `GET /search/all/miami/1` → 200, cross-vertical results visible
- [ ] `GET /sitemap.xml` → 200, valid XML (not empty)
- [ ] `GET /robots.txt` → 200, contains `Disallow: /search/` and correct `Sitemap:` URL
- [ ] `GET /dev/ui-home` → **404** on production host (prod-gated)
- [ ] `GET /dev/ui-trips` → **404** on production host (prod-gated)

---

## SEO / Indexing Checklist

- [ ] Confirm `shouldIndex(url)` returns true for the production host domain
- [ ] Confirm indexable routes serve `<meta name="robots" content="index,follow,…">` (not noindex)
- [ ] Confirm `/search/*` routes serve `x-robots-tag: noindex, follow` HTTP header
- [ ] Confirm `/robots.txt` `Sitemap:` URL uses the correct production origin
- [ ] Confirm JSON-LD is valid on at least: `/`, `/hotels`, `/hotels/in/miami`, `/hotels/[slug]`, `/destinations/miami`
- [ ] Submit sitemap to Google Search Console after launch
- [ ] Confirm no canonical URL mismatches (canonical should use `https://` production origin, not `http://localhost`)
- [ ] `/dev/ui-*` routes: confirm they 404 on production (not just noindex)

---

## Analytics and Monitoring Checklist

Current state: analytics is a no-op stub with server-side `console.info` logging only. No third-party provider is configured.

- [ ] **Decision required:** Choose an analytics provider (Plausible, GA4, PostHog, Cloudflare Web Analytics) before or immediately after launch
- [ ] Wire the chosen provider into `src/components/analytics/PageView.tsx` — the `useTask$` hook and `andacity:pageview` DOM event are already in place
- [ ] Confirm `/api/analytics/pageview` is not returning 500s in production server logs
- [ ] Set up error monitoring (Sentry or equivalent) before opening to real users
- [ ] Confirm server-side logs are accessible (Docker logs, or log aggregator)
- [ ] Set up uptime monitoring on `/` or a dedicated `/healthz` endpoint
- [ ] Define alerting threshold for 5xx errors

---

## Legal and Trust Checklist

- [ ] **Privacy Policy page** (`/privacy`) — does not exist. Required before public beta.
- [ ] **Terms of Service page** (`/terms`) — does not exist. Required before public beta.
- [ ] **Contact or support page** (`/contact`) — does not exist. Strongly recommended.
- [ ] Affiliate disclosure in footer (`"We may earn commission from select partners."`) — ✅ present. Confirm it satisfies FTC disclosure requirements for your jurisdiction.
- [ ] Once Privacy Policy exists, link it from the footer bottom bar.
- [ ] Confirm cookie/tracking disclosure requirements for each target market. Current analytics is server-log-only; if a cookie-setting provider is added, cookie consent may be required.
- [ ] Confirm no personal data (names, emails, payment info) is logged in `console.info` analytics events.

---

## Accessibility Checklist

Verified in CLAUDE-UI-030. Quick re-confirm on production:

- [ ] One H1 per page on all primary routes
- [ ] Header nav has `aria-label="Primary"` (desktop) and `aria-label="Primary mobile"` (mobile)
- [ ] Mobile nav dialog has `role="dialog"` and `aria-label="Menu"`
- [ ] Footer has `aria-label="Site footer"`
- [ ] Breadcrumbs have `aria-label="Breadcrumb"` and `aria-current="page"` on current item
- [ ] Decorative icons are `aria-hidden="true"`
- [ ] Focus-visible ring visible on keyboard navigation
- [ ] No horizontal overflow on mobile at 375px viewport
- [ ] Sticky header does not obscure content on scroll
- [ ] Filter bars (explore, destinations) remain usable on mobile

---

## Mobile and Theme Checklist

- [ ] Skyglass Luxe Light — hero, cards, prices all legible
- [ ] Skyglass Luxe Dark — hero, cards, prices all legible
- [ ] Andacity Meridian Light — verify
- [ ] Andacity Meridian Dark — verify
- [ ] Quick-check Sandbar, Sunset, Alpine, Midnight at default (light)
- [ ] Theme controller visible and functional in the footer
- [ ] No layout breaks at 375px (iPhone SE width)
- [ ] No layout breaks at 768px (tablet)
- [ ] Mobile menu opens and closes correctly
- [ ] Tap targets are at least 44×44px on touch-primary elements

---

## Preview / Dev Route Safety Checklist

- [ ] All `/dev/ui-*` routes return **404** on the production host
- [ ] No production route links to any `/dev/*` path (confirmed in CLAUDE-UI-030, re-verify after any deploy)
- [ ] `/dev/ui-trips` returns 404 on production host (accidental CLAUDE-UI-029 route — preview-only)
- [ ] `x-robots-tag: noindex, nofollow` is set on any `/dev/*` route that doesn't 404 on dev/staging hosts

---

## Known Limitations

Document internally before launch. Do not hide these from the team.

| Limitation | Impact | Status |
|------------|--------|--------|
| `npm run build` fails due to DB SSL TypeScript error | Blocks Docker image build | Must fix before Docker deployment |
| `/sitemap.xml` is empty | Slows organic indexing | Must fix before/at launch |
| No Privacy Policy or Terms pages | Legal and trust risk | Must fix before public beta |
| No Contact/Support page | User trust risk | Should fix before public beta |
| Analytics is no-op stub | Zero visibility into user behavior | Must wire a provider before/at launch |
| No error monitoring | Errors invisible in production | Strongly recommended before launch |
| Shared components (`CompareSheet`, `CompareTray`, etc.) use legacy `--color-*` tokens | Theme-switching may be inconsistent on hotel detail and compare surfaces | Non-blocking, deferred |
| `/hotels/in` and `/car-rentals/in` use legacy `--color-*` tokens | Visual inconsistency on all-cities pages | Non-blocking, deferred |
| `/search/flights/miami/1` returns 404 | Edge-case user confusion if linked from external sources | Non-blocking, documented |
| No health-check endpoint | Container orchestration (k8s, ECS) cannot probe liveness | Should add before scale |

---

## Rollback Plan

Before deploying to production:

1. **Tag the last known stable commit** (the commit before the deploy push):
   ```bash
   git tag beta-launch-v1 HEAD
   git push origin beta-launch-v1
   ```

2. **Identify the rollback commit:**<br>
   The current tip of `dev` is commit `7b79215` (CLAUDE-UI-030). For rollback, note this SHA and the prior stable SHA before any changes to the production branch.

3. **Rollback procedure:**
   - Container rollback: re-deploy the previously built Docker image (by tag or digest)
   - Git rollback: `git revert` the offending commits or `git checkout <stable-tag>` on the deploy branch
   - DNS/proxy rollback: point traffic to a previous instance if blue/green is in place

4. **To disable public beta quickly:**
   - Option A: Take the site down with a maintenance page via reverse proxy (nginx/Cloudflare)
   - Option B: Change DNS to a static maintenance page
   - Option C: Set `shouldIndex` to return false for all hosts (forces 404 on all `/dev/` routes and makes the site unindexable; does not take it down)
   - **Preferred:** Maintain the ability to switch DNS or proxy instantly without redeploying

5. **Communicating beta status:**
   - Internal: notify team via Slack/email with the production URL, known limitations, and this checklist
   - External: consider adding a visible "Public Beta" label in the UI (e.g., a subtle header chip or footer note) so users know the product is pre-GA

---

## Launch-Day Checklist

Run in order on launch day:

- [ ] Merge `dev` → `main` (or your production branch)
- [ ] Confirm production build succeeds (after DB SSL fix)
- [ ] Tag the release commit: `git tag beta-launch-v1`
- [ ] Deploy Docker image to production
- [ ] Smoke-test all routes in [Route Smoke-Test Checklist](#route-smoke-test-checklist) on the live production domain
- [ ] Confirm `shouldIndex(url)` returns true for the production domain
- [ ] Confirm `/dev/ui-home` returns 404 on production
- [ ] Confirm `robots.txt` Sitemap URL uses `https://[production-domain]`
- [ ] Submit sitemap to Google Search Console
- [ ] Verify analytics events are being received (server logs or provider dashboard)
- [ ] Set up uptime monitoring alert
- [ ] Send team notification with live URL and known limitations

---

## First 24 Hours After Launch

- [ ] Monitor server error logs for 5xx patterns
- [ ] Check `console.info` analytics output for pageview volume (or provider dashboard if wired)
- [ ] Verify search routes are functioning under real load
- [ ] Check Google Search Console for crawl errors
- [ ] Confirm no unexpected 404s on production
- [ ] Verify theme switching works for real users (check DOM event `andacity:pageview` in browser)
- [ ] Check mobile rendering on real devices, not just emulators
- [ ] Confirm `/dev/ui-*` routes remain 404 on production
- [ ] Review any user feedback (if a feedback channel is set up)

---

## Open Questions

| Question | Owner | Priority |
|----------|-------|----------|
| Which analytics provider will be used? | Product | Must decide before/at launch |
| Will Docker be the production deployment path, or is a different runtime used? | Infra | Affects DB SSL blocker severity |
| Which jurisdiction(s) require Privacy Policy? | Legal | Affects legal blocker urgency |
| Will a cookie consent banner be required? | Legal | Depends on analytics provider and market |
| Is there a staging/preview environment for smoke-testing before production deploy? | Infra | Launch quality |
| Is blue/green deployment in place, or is rollback a full redeploy? | Infra | Rollback time |
| What is the beta user communication plan? | Product | Feedback collection |
| Should the footer display a "Public Beta" indicator? | Design | Brand/trust |

---

## Verification Results

```bash
# Checked at CLAUDE-UI-031 time (2026-06-21)

npm run build.types
# Exit 2 — pre-existing SSL error:
# src/lib/db/client.server.ts(91,5): error TS2353: Object literal may only
# specify known properties, and 'ssl' does not exist in type …
# → BLOCKS Docker build (yarn run build fails)

npm run build.client
# ✅ pass — 1071 modules, no errors

# Analytics: server-log stub only — no third-party provider
# Legal: no /privacy, /terms, or /contact routes exist
# Sitemap: /sitemap.xml responds 200 but returns empty <urlset>
# Robots.txt: ✅ implemented, Disallow: /search/, Sitemap: pointer present
# Footer affiliate disclosure: ✅ "We may earn commission from select partners."
# Docker: Dockerfile present, uses yarn run build (will fail until SSL fix)
# Health check: no /healthz route — manual check only
```

---

## CLAUDE-UI-045 addendum (2026-06-23) — Launch Status: Ready for manual deployment

**All launch-checklist blockers from CLAUDE-UI-031 are resolved.** Status at CLAUDE-UI-045:

| Original blocker | Resolution | Task |
|---|---|---|
| DB SSL TypeScript error blocked Docker build | ✅ Fixed (type annotation corrected) | CLAUDE-UI-032 |
| No Privacy Policy / Terms / Contact pages | ✅ Created and live on dev server | CLAUDE-UI-032 |
| `/sitemap.xml` empty | ✅ 313 URLs (151 hotels, 151 car-rentals, index pages) | CLAUDE-UI-032 |
| `/healthz` health-check missing | ✅ `{"ok":true}` endpoint live | CLAUDE-UI-032 |
| Analytics no-op stub | ✅ First-party provider abstraction; Cloudflare recommended post-launch | CLAUDE-UI-033 |
| Error monitoring missing | ✅ First-party via `/api/errors` + `window.onerror` | CLAUDE-UI-033 |
| Search overlays clipped by `overflow-hidden` | ✅ Removed from all 4 hero sections | CLAUDE-UI-041 |
| Hotel/car search pages using legacy UI | ✅ New `--ui-hero` gradient header | CLAUDE-UI-041 |
| Results shell on legacy tokens | ✅ Full `--ui-*` migration across 10+ components | CLAUDE-UI-041 |
| Hero stacking context — overlays painted over | ✅ `z-10` on all search-bearing heroes | CLAUDE-UI-042 |
| LocationAutosuggestField on `--color-*` | ✅ Migrated to `--ui-*` | CLAUDE-UI-043 |
| Build gate | ✅ `yarn run build` exits 0 — Done in 26.42s | CLAUDE-UI-045 verified |

**Launch execution summary** (CLAUDE-UI-045):
- Release tag `beta-launch-v1` created at commit `6133148`
- Final build gates re-verified: all exit 0
- Docker build requires interactive sudo locally; Dockerfile unchanged from verified state (CLAUDE-UI-040)
- Deployment requires production env vars + EC2 credentials + user authorization to push `main`
- Classification: **Ready for manual deployment**

See `PUBLIC_BETA_LAUNCH_EXECUTION.md` (CLAUDE-UI-045) for the full launch execution report and required manual action steps.

---

## CLAUDE-UI-046 addendum (2026-06-23) — Gate classification: Ready after production secrets are set

**Deploy script gap identified and closed.**

| Gate | Status | Fix |
|---|---|---|
| `deploy-production.yml` passes `APP_ORIGIN` to EC2 | ✅ Fixed | CI workflow updated to inject `APP_ORIGIN` before calling `deploy.sh` |
| Dockerfile defaults `APP_ORIGIN=http://localhost` | ✅ Mitigated | CI now passes `APP_ORIGIN=https://andacity.com` — image correctly bakes in production origin |
| EC2 `deploy.sh` must use `--build-arg APP_ORIGIN` | ⚠ Manual action required | See `scripts/deploy-template.sh` — operator must verify/update EC2 script |
| Production env vars confirmed on EC2 | ⚠ Manual action required | Use `scripts/check-production-env.sh` to validate before deploy |
| `OG_SIGNING_SECRET` is not `change-me` | ⚠ Manual action required | Must generate a new random string for production |
| Contact/privacy/legal emails are monitored | ⚠ Manual action required | Confirm or set `CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL` |
| Analytics off by default | ✅ Confirmed | `PUBLIC_ANALYTICS_PROVIDER` empty; first-party logging always active |

**New files added (CLAUDE-UI-046):**
- `scripts/check-production-env.sh` — preflight validator (exits 1 if any required var is missing)
- `scripts/deploy-template.sh` — reference implementation for EC2's `deploy.sh`

See `PRODUCTION_ENV_AND_DEPLOY_GATE_CLOSURE.md` (CLAUDE-UI-046) for full gate closure report.

---

## CLAUDE-UI-047 addendum (2026-06-24) — Deploy status: Not yet deployed

**Public Beta Production Deploy and Live Smoke Test** attempted. Deployment could not be executed.

| Item | Status |
|---|---|
| GitHub Actions production env vars | ⚠ Cannot confirm — `gh` CLI not installed |
| EC2 SSH access | ⚠ No credentials available — cannot inspect `deploy.sh` or run preflight |
| Docker build (local) | ⚠ Permission denied on socket |
| `andacity.com` DNS | ⚠ Not resolving (exit code 6) — not yet live |
| `dev` pushed to `origin/dev` | ⚠ 12 commits ahead, not yet pushed |
| `dev` merged to `main` | ⚠ Not done — requires explicit user authorization |
| `beta-launch-v1` tag | ⚠ Points to `6133148` (CLAUDE-UI-044) — missing CLAUDE-UI-045/046 changes |

**Tag action needed:** `beta-launch-v1` should be retagged or a new `beta-launch-v1-final` tag should be created at `dc848ad` (CLAUDE-UI-046 HEAD).

**Classification: Ready for manual deployment after EC2 secret/deploy.sh confirmation.**

All remaining items are operational. No further code changes are required. See `PUBLIC_BETA_PRODUCTION_DEPLOY_AND_SMOKE_TEST.md` (CLAUDE-UI-047) for the full deploy report and complete required manual actions checklist.

---

## CLAUDE-UI-048 addendum (2026-06-24) — Gate status: Ready after external settings corrected

**Remote gate closure actions taken:**

| Item | Status |
|---|---|
| `dev` pushed to `origin/dev` | ✅ Done — all 13 CLAUDE-UI commits on remote |
| `beta-launch-v1-final` created at `6e925c7` | ✅ Done — pushed to remote |
| Remote URL updated to `sunthetic/andacity` | ✅ Done |
| `OG_SIGNING_SECRET` confirmed | 🚨 Local `.env production` has literal placeholder — not a real secret |
| Missing env vars found | ❌ `ORIGIN`, `CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL` absent from `.env production` |
| DNS configured | ❌ `andacity.com` has no A records |
| GitHub Actions env confirmed | ❌ `gh` CLI unavailable |
| EC2 SSH / deploy.sh confirmed | ❌ EC2 hostname not known locally |

**Classification: Ready after one or more external settings are corrected.**

See `REMOTE_PRODUCTION_GATE_CLOSURE_AND_LAUNCH_AUTHORIZATION.md` (CLAUDE-UI-048) for full report and ordered required manual actions checklist.
