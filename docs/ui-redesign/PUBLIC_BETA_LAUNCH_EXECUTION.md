# Public Beta Launch Execution

**Task:** CLAUDE-UI-045
**Date:** 2026-06-23
**Auditor:** Claude Code (claude-sonnet-4-6)
**Branch at execution:** dev
**Predecessor:** CLAUDE-UI-044 (`PUBLIC_BETA_DEPLOYMENT_REVERIFICATION_AFTER_INTERACTIVE_QA.md`)

---

## Purpose

Execute the Andacity public beta launch or prepare it for manual deployment if deployment cannot be safely executed from this environment.

---

## Launch Classification

```
Ready for manual deployment
```

All local build gates pass. Release tag created. Deployment cannot be executed from this environment because:

1. Production environment variables (`DATABASE_URL`, `OG_SIGNING_SECRET`, etc.) cannot be inspected or confirmed from the local machine.
2. Docker build requires interactive sudo (local Docker socket permission constraint — not a code issue; Dockerfile unchanged from CLAUDE-UI-040 where Docker build was verified).
3. Deployment requires merging `dev` → `main` and pushing, which triggers the GitHub Actions CI/CD pipeline that SSHes to the EC2 server. This requires explicit user authorization and EC2 credentials that are not available in this environment.
4. Live production smoke tests (`https://andacity.com/…`) cannot be run until production is deployed.

All code gates are satisfied. The production operator must execute the deployment steps enumerated in [Required Manual Actions](#required-manual-actions).

---

## Source Docs Reviewed

| Document | Task | Status |
|---|---|---|
| `PUBLIC_BETA_DEPLOYMENT_REVERIFICATION_AFTER_INTERACTIVE_QA.md` | CLAUDE-UI-044 | ✅ Source of truth |
| `PUBLIC_BETA_DEPLOYMENT_REVERIFICATION.md` | CLAUDE-UI-040 | ✅ Reviewed |
| `FINAL_INTERACTIVE_PUBLIC_SURFACE_QA.md` | CLAUDE-UI-043 | ✅ Reviewed |
| `SEARCH_OVERLAY_AND_VERTICAL_RESULTS_BLOCKER_REMEDIATION.md` | CLAUDE-UI-041 | ✅ Reviewed |
| `PUBLIC_BETA_LAUNCH_CHECKLIST.md` | CLAUDE-UI-031 | ✅ Reviewed |
| `ANALYTICS_MONITORING_INTEGRATION.md` | CLAUDE-UI-033 | ✅ Reviewed |
| `PUBLIC_BETA_BLOCKER_CLOSURE.md` | CLAUDE-UI-032 | ✅ Reviewed |

---

## Launch Commit

| Property | Value |
|---|---|
| Branch | `dev` |
| Commit | `6133148` |
| Message | `feat(ui-redesign): CLAUDE-UI-044 public beta deployment reverification after interactive QA` |
| Author | Alden Gillespy |
| Date | 2026-06-23 |
| Working tree | Clean — no uncommitted changes |
| Remote sync | 10 commits ahead of `origin/dev` (not yet pushed) |
| All CLAUDE-UI-041 through 044 | ✅ All committed |

The deployment-ready commit is `6133148` on `dev`.

---

## Release Tag

```
beta-launch-v1  →  6133148
```

Created locally during this task. Not yet pushed to remote.

To push the tag after deployment:
```bash
git push origin beta-launch-v1
```

To verify the tag before deployment:
```bash
git show beta-launch-v1 --stat
```

If the tag already exists on remote from a previous attempt, do not overwrite. Use `beta-launch-v2` or a datestamped tag instead.

---

## Environment Variables

### Required before Docker build

| Variable | Value | Source |
|---|---|---|
| `APP_ORIGIN` | `https://andacity.com` | Docker `--build-arg` at build time |

### Required at container startup

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | **Required** | None | Production PostgreSQL connection string |
| `ORIGIN` | **Required** | `http://localhost` | Set via `APP_ORIGIN` build arg. Must be `https://andacity.com` |
| `PUBLIC_BASE_URL` | Recommended | _(from request)_ | Canonical URLs, sitemap, JSON-LD |
| `OG_SIGNING_SECRET` | **Required** | `change-me` | Replace with a real random secret before launch |
| `CONTACT_EMAIL` | **Required** | `hello@andacity.com` | Must be a monitored inbox |
| `PRIVACY_EMAIL` | **Required** | `privacy@andacity.com` | Must be a monitored inbox |
| `LEGAL_EMAIL` | **Required** | `legal@andacity.com` | Must be a monitored inbox |

### Optional — analytics (default off; requires rebuild to change)

| Variable | Default | Notes |
|---|---|---|
| `PUBLIC_ANALYTICS_PROVIDER` | `""` | Leave empty for initial beta. No script injected. |
| `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` | `""` | Set only with `PUBLIC_ANALYTICS_PROVIDER=cloudflare` |
| `PUBLIC_GA_MEASUREMENT_ID` | `""` | Do not activate — requires cookie consent |

**Cannot be confirmed from this environment.** The production operator must verify these values are set in the EC2 container environment or secrets manager before launch.

**Critical:** `OG_SIGNING_SECRET=change-me` is the default fallback. This default must be replaced before production. Failure to change it allows unauthenticated OG image requests.

---

## Build Verification

Final build run at `6133148` on 2026-06-23:

```
yarn run build.types    ✅  exit 0 — Done in 3.38s
yarn run build.client   ✅  exit 0 — 1083 modules transformed, built in 5.13s
yarn run build.server   ✅  exit 0 — 729 modules, built in 5.16s
yarn run lint           ✅  exit 0 — 0 errors, 2 pre-existing warnings
yarn run build          ✅  exit 0 — Done in 26.42s
```

2 pre-existing warnings (`SiteHeader.tsx:63`, `ThemeController.tsx:48`) — intentional `useVisibleTask$` uses, suppressed with ESLint disable comments. Unchanged since CLAUDE-UI-034.

---

## Docker Build

### Invocation

```bash
docker build \
  --build-arg APP_ORIGIN=https://andacity.com \
  --build-arg NODE_ENV=production \
  -t andacity:beta-launch-v1 \
  .
```

### Local result

Docker build requires interactive sudo on this machine (`permission denied while trying to connect to the Docker socket`). This is a local execution environment constraint — the current user is not in the `docker` group.

**This is not a code issue.** The Dockerfile is unchanged from CLAUDE-UI-040 where Docker build was verified successful. The build gate (`yarn run build`) passes with 0 errors. The Docker build will succeed when run with appropriate permissions.

### Dockerfile key properties

| Property | Value |
|---|---|
| Base image | `node:25-alpine` |
| Build: `RUN yarn run build` | Includes types + client + server + lint |
| Build: `RUN yarn run build.server` | Redundant second server build (harmless) |
| Final stage: `USER node` | Non-root |
| Final stage: `ENV ORIGIN ${APP_ORIGIN}` | CSRF origin baked from build arg |
| Final stage: `EXPOSE 3000` | HTTP port |
| Final stage: `CMD ["yarn", "serve"]` | Fastify adapter |
| Secrets baked | None — all secrets are runtime env vars |
| Analytics provider token baked | Only if `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` is set at build time |

---

## Deployment Workflow

### CI/CD pipeline

File: `.github/workflows/deploy-production.yml`

- **Trigger:** Push to `main` branch
- **Runner:** `ubuntu-latest` (GitHub Actions)
- **Environment:** `production` (GitHub Actions environment with secrets)
- **Action:** SSH to EC2 and run `./deploy.sh` with args: `$ref $app_name $port $framework $(cwd)`

Required GitHub Actions secrets and variables:
| Name | Type | Usage |
|---|---|---|
| `EC2_SERVER_KEY` | Secret | SSH private key for EC2 |
| `EC2_SERVER_HOST` | Variable | EC2 hostname/IP |
| `EC2_SERVER_USER` | Secret | SSH user on EC2 |
| `EC2_DEPLOY_ROOT_DIR` | Variable | Directory on EC2 where `deploy.sh` lives |
| `APP_NAME` | Variable | App name arg to deploy.sh |
| `APP_SERVER_PORT` | Variable | Port arg to deploy.sh |
| `APP_FRAMEWORK` | Variable | Framework arg to deploy.sh |

The `deploy.sh` script resides on the EC2 server (not in the repo). Its exact behavior is not inspectable from this environment, but it presumably:
1. Pulls the latest `main` branch code
2. Runs `docker build --build-arg APP_ORIGIN=https://andacity.com -t andacity:latest .`
3. Stops the existing container
4. Starts the new container with all required runtime env vars

### Deployment branch

The CI/CD deploys on push to `main`. The launch commit is on `dev`. The production operator must:
1. Push `dev` to `origin/dev` (or open a PR)
2. Merge `dev` → `main` (or push directly to `main`)
3. The push to `main` triggers the CI pipeline

---

## Deployment Execution

**Not executed from this environment.**

Reason: Production environment variables, EC2 credentials, and GitHub Actions secrets cannot be inspected or used from the local development machine. Merging and pushing to `main` to trigger CI requires explicit user authorization.

All prerequisites are satisfied in the codebase. Deployment awaits operator execution per [Required Manual Actions](#required-manual-actions).

---

## Live Smoke Tests

**Not run — deployment has not occurred.**

Expected results on `https://andacity.com` after deployment:

| URL | Expected status | Notes |
|---|---|---|
| `https://andacity.com/` | 200 | |
| `https://andacity.com/hotels/` | 200 | (or 301 → 200) |
| `https://andacity.com/hotels/in/` | 200 | |
| `https://andacity.com/hotels/in/las-vegas/` | 200 | Indexable |
| `https://andacity.com/hotels/search/los-angeles/2026-07-01/2026-07-08/` | 200 | noindex, follow |
| `https://andacity.com/flights/` | 200 | |
| `https://andacity.com/flights/search/SLC-LAX/2026-07-01/` | 200 | noindex, follow |
| `https://andacity.com/car-rentals/` | 200 | |
| `https://andacity.com/car-rentals/in/` | 200 | |
| `https://andacity.com/car-rentals/in/new-york/` | 200 | Indexable |
| `https://andacity.com/car-rentals/search/LAS/2026-07-01/2026-07-08/` | 200 | noindex, follow |
| `https://andacity.com/explore/` | 200 | |
| `https://andacity.com/destinations/` | 200 | |
| `https://andacity.com/destinations/miami/` | 200 | |
| `https://andacity.com/search/all/miami/1` | 200 | noindex via layout |
| `https://andacity.com/privacy/` | 200 | |
| `https://andacity.com/terms/` | 200 | |
| `https://andacity.com/contact/` | 200 | |
| `https://andacity.com/healthz` | 200 | `{"ok":true}` |
| `https://andacity.com/sitemap.xml` | 200 | 313+ URLs |
| `https://andacity.com/robots.txt` | 200 | `Disallow: /search/` |
| `https://andacity.com/dev/ui-home/` | **404** | Production-gated |
| `https://andacity.com/dev/ui-palettes/` | **404** | Production-gated |

Verified on dev server (`localhost:5173`) in CLAUDE-UI-043 and CLAUDE-UI-044. Production should match.

---

## Interactive Production Checks

**Not run — deployment has not occurred.**

Run these manually in a browser after production deployment:

- [ ] Open `/hotels/in/las-vegas/` — click the city field → location autosuggest dropdown appears above page body (not clipped or covered)
- [ ] Open `/hotels/in/las-vegas/` — click the check-in date → calendar appears above following content
- [ ] Open `/car-rentals/in/new-york/` — same date picker test
- [ ] Open `/` — click any of the three search tabs, then open the location or date field → overlay visible
- [ ] Open `/hotels/search/los-angeles/2026-07-01/2026-07-08/` — confirm `--ui-hero` gradient header with breadcrumb, H1 city name, date range, Edit search link
- [ ] Open `/car-rentals/search/LAS/2026-07-01/2026-07-08/` — same pattern
- [ ] Confirm CTA buttons have consistent focus/hover behavior
- [ ] Confirm mobile (375px): date pickers and overlays are usable, no horizontal overflow
- [ ] Confirm dark mode (Skyglass Luxe Dark): overlays remain readable

---

## SEO/Indexing Verification

Source-confirmed (dev server verified in CLAUDE-UI-043/044):

| Check | Status |
|---|---|
| `shouldIndex` returns true only for `andacity.com` / `www.andacity.com` | ✅ `src/lib/seo/env.ts` |
| Hotel/car search routes: `x-robots-tag: noindex, follow` | ✅ `onRequest` + `head` |
| `/search/*` noindex via `search/layout.tsx` | ✅ |
| `/hotels/in/[citySlug]` indexable | ✅ No noindex; canonical present |
| `/car-rentals/in/[citySlug]` indexable | ✅ |
| `/dev/ui-*` 404 on production | ✅ `shouldIndex()` throws `error(404)` |
| Sitemap: 313 URLs | ✅ dev server verified |
| Sitemap: includes `/hotels/in` and `/car-rentals/in` | ✅ 151 entries each |
| Sitemap: excludes `/dev/*` and `/search/*` | ✅ |
| `/robots.txt`: `Disallow: /search/` + Sitemap pointer | ✅ |

After production deploy: submit sitemap to Google Search Console at `https://search.google.com/search-console/`.

---

## Preview Route Safety

| Check | Status |
|---|---|
| `/dev/ui-*` routes: `noindex, nofollow` headers + robots meta | ✅ Source verified |
| `/dev/ui-*` routes: 404 on production (`shouldIndex()` gate) | ✅ Source verified |
| No `/dev/*` links in nav or footer | ✅ grep confirmed |

---

## Observability Verification

Source-confirmed:

| Check | Status |
|---|---|
| `/api/analytics/pageview` returns 204 | ✅ Dev server curl verified in CLAUDE-UI-044 |
| `/api/errors` active endpoint | ✅ Returns 400 on malformed, 204 on valid payload |
| First-party server log on every pageview | ✅ `console.info("[andacity.analytics]", ...)` |
| No third-party script when `PUBLIC_ANALYTICS_PROVIDER=""` | ✅ `AnalyticsProvider` returns null |
| CSP: no duplicate `script-src` | ✅ Provider CSP only added when provider is configured |
| `/healthz`: `{"ok":true}` | ✅ Dev server curl verified |
| Error rendering failure cannot block page | ✅ `ErrorMonitor` uses `useTask$` — errors caught, not thrown |

---

## Contact/Legal Verification

Source-confirmed:

| Check | Status |
|---|---|
| `/contact` uses `CONTACT_EMAIL` env var (fallback `hello@andacity.com`) | ✅ |
| `/privacy` uses `PRIVACY_EMAIL` env var (fallback `privacy@andacity.com`) | ✅ |
| `/terms` uses `LEGAL_EMAIL` env var (fallback `legal@andacity.com`) | ✅ |
| Footer legal bar: `/privacy`, `/terms`, `/contact`, `/sitemap.xml` | ✅ |
| No merchant-of-record claim | ✅ |
| No guaranteed price/refund/booking claim | ✅ |

**Operator action required:** Confirm the three email env vars are set to real monitored inboxes in the production container configuration. If left as defaults, the fallback addresses (`hello@andacity.com`, `privacy@andacity.com`, `legal@andacity.com`) will appear in production. Ensure these addresses are set up and monitored before launch.

---

## Rollback Plan

### Launch context

| Property | Value |
|---|---|
| Launch commit | `6133148` (HEAD at time of CLAUDE-UI-044 completion) |
| Release tag | `beta-launch-v1` |
| Previous known-good commit | `397bb8e` (CLAUDE-UI-040 — last pre-interactive-QA state) |
| Deploy branch | `main` (CI triggers on push to `main`) |

### Rollback options

**Option A — Container rollback (fastest)**

If the EC2 deploy script tags or retains the previous Docker image:
```bash
docker stop andacity-container
docker run -d \
  --name andacity-container \
  -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e ORIGIN="https://andacity.com" \
  [...other env vars...] \
  andacity:previous-tag
```

**Option B — Git rollback + redeploy**

Revert the offending commits on `main` and push:
```bash
git revert --no-commit 6133148 babc6bc f475d9e 7dd8dc1
git commit -m "chore: revert CLAUDE-UI-041 through 044 for emergency rollback"
git push origin main
# CI will redeploy with reverted code
```

Or roll back to the pre-interactive-QA state:
```bash
git checkout 397bb8e  # CLAUDE-UI-040 state
git push origin HEAD:main --force  # Use with caution — force push to main
```

**Option C — DNS/proxy disable (fastest exposure reduction)**

Via Cloudflare or EC2 load balancer:
- Point DNS to a maintenance page
- Return 503 with maintenance message
- No redeployment needed

**Recommended order on major incident:**

1. Assess severity
2. If data integrity risk: Option C (disable immediately)
3. If visual/UX bug: Option A (container rollback if previous image is available)
4. If code logic bug: Option B (revert + redeploy)

---

## Required Manual Actions

The production operator must complete these steps in order before launch:

### Pre-flight (do once)

- [ ] Confirm all 7 required environment variables are set in the production container environment
- [ ] Confirm `OG_SIGNING_SECRET` is not `change-me` (generate a real random string)
- [ ] Confirm `CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL` are real monitored inboxes
- [ ] Confirm `DATABASE_URL` points to the production database with SSL configured
- [ ] Confirm GitHub Actions secrets are set: `EC2_SERVER_KEY`, `EC2_SERVER_USER`
- [ ] Confirm GitHub Actions variables are set: `EC2_SERVER_HOST`, `EC2_DEPLOY_ROOT_DIR`, `APP_NAME`, `APP_SERVER_PORT`, `APP_FRAMEWORK`
- [ ] Confirm the `deploy.sh` on the EC2 server passes `APP_ORIGIN=https://andacity.com` as a Docker build arg

### Launch sequence

```bash
# 1. Verify you're on dev at the right commit
git log --oneline -1
# Expected: 6133148 feat(ui-redesign): CLAUDE-UI-044 ...

# 2. Push dev branch to remote (if not done)
git push origin dev

# 3. Merge dev → main (GitHub PR or direct merge)
#    Option A: Create PR on GitHub, review, merge
#    Option B: Direct merge locally and push
git checkout main
git merge dev
git push origin main
# This triggers the CI/CD deploy pipeline

# 4. Monitor GitHub Actions run
#    https://github.com/<owner>/andacity/actions

# 5. Confirm production is live
curl https://andacity.com/healthz
# Expected: {"ok":true}

# 6. Push release tag
git push origin beta-launch-v1

# 7. Submit sitemap
#    https://search.google.com/search-console/
#    Add property for andacity.com → Submit sitemap → https://andacity.com/sitemap.xml

# 8. Run smoke tests (see Live Smoke Tests table above)
```

### Post-launch (within 24 hours)

- [ ] Monitor server logs for 5xx errors
- [ ] Check `/dev/ui-home` returns 404 on production
- [ ] Verify `/sitemap.xml` uses production origin (not localhost)
- [ ] Set up uptime monitoring on `/healthz`
- [ ] Activate Cloudflare Web Analytics as first post-launch rebuild (optional but recommended)

---

## Remaining Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `OG_SIGNING_SECRET` not changed from default | High — allows unauthenticated OG image requests | Set a real random string before launch |
| Contact/privacy/legal emails not monitored | Medium — user inquiries go unanswered | Set real email addresses; verify delivery |
| `deploy.sh` behavior unknown | Medium — script lives on EC2; may not pass APP_ORIGIN | Verify Docker build args before merge |
| Database connection at production scale | Medium — SSL/pool not stress-tested | Monitor connection errors in first 24h |
| Analytics blind spot | Low — first-party logs only | Add Cloudflare Web Analytics post-launch |
| Container crash on bad env var | Low — Qwik/Fastify starts without most env vars | `DATABASE_URL` is most critical; test startup |
| No formal merge/PR review | Low — 10 unpushed commits | All changes are UI-only; documented in CLAUDE-UI-04x series |

---

## Public Beta Go/No-Go Recommendation

**Go.**

All code gates have been passed and verified across four consecutive tasks (CLAUDE-UI-041 through CLAUDE-UI-044). The public surface is visually complete on the `--ui-*` token system. Overlay/stacking issues are resolved. The search entry experience (location autosuggest, date pickers) has been migrated to `--ui-*`. Hotel and car-rental search result pages use the new hero UI pattern. No remaining blockers in the codebase.

The only open items before launch are operational:
1. Setting 7 production environment variables
2. Ensuring `OG_SIGNING_SECRET` is changed from the default
3. Executing the deployment via the existing CI/CD pipeline

---

## Verification Results

```
yarn run build.types    ✅  exit 0 — Done in 3.38s
yarn run build.client   ✅  exit 0 — 1083 modules
yarn run build.server   ✅  exit 0 — 729 modules
yarn run lint           ✅  exit 0 — 0 errors, 2 pre-existing warnings
yarn run build          ✅  exit 0 — Done in 26.42s
```

```
docker build --build-arg APP_ORIGIN=https://andacity.com .
  ⚠ Not run — requires interactive sudo on this machine.
  Dockerfile unchanged since CLAUDE-UI-040 (Docker build verified then).
  Build gate (yarn run build) passes — Docker build expected to succeed.
```

```
Dev server smoke test (CLAUDE-UI-044):
  20 routes tested — all 200 ✅

Hero stacking (all 10 search-bearing sections):
  relative isolate z-10 ✅

noindex/follow on hotel/car search routes:
  x-robots-tag: noindex, follow ✅

Sitemap: 313 URLs ✅
/healthz: {"ok":true} ✅

Release tag: beta-launch-v1 @ 6133148 ✅ (local, not yet pushed)
```

---

## CLAUDE-UI-046 addendum (2026-06-23)

**Production Environment and Deploy Gate Closure** completed. Deploy script gap identified and closed.

**Critical fix:** The `deploy-production.yml` CI workflow did not previously pass `APP_ORIGIN` to the SSH session. The Dockerfile defaults `APP_ORIGIN` to `http://localhost`. Without the fix, Docker images built on EC2 would have `ORIGIN=http://localhost` baked in, causing Qwik CSRF protection to reject all production form submissions.

**Fix applied:** CI workflow now injects `APP_ORIGIN=${{ vars.APP_ORIGIN || 'https://andacity.com' }}` before calling `deploy.sh`.

**Also added:**
- `scripts/check-production-env.sh` — preflight validator for all 8 required production variables
- `scripts/deploy-template.sh` — reference implementation for EC2's `deploy.sh` showing correct `--build-arg APP_ORIGIN` usage
- `.env.example` — `APP_ORIGIN` documented as Docker build arg

**Updated classification: Ready after production secrets are set.**

See `PRODUCTION_ENV_AND_DEPLOY_GATE_CLOSURE.md` (CLAUDE-UI-046) for full gate closure report.
