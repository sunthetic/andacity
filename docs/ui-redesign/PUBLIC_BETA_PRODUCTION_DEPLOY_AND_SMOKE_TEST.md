# Public Beta Production Deploy and Live Smoke Test

**Task:** CLAUDE-UI-047
**Date:** 2026-06-24
**Auditor:** Claude Code (claude-sonnet-4-6)
**Branch at execution:** dev
**Predecessor:** CLAUDE-UI-046 (`PRODUCTION_ENV_AND_DEPLOY_GATE_CLOSURE.md`)

---

## Purpose

Deploy Andacity public beta to production and run live smoke tests, or stop with exact unresolved operational blockers if deployment cannot be safely executed.

---

## Deployment Classification

```
Ready for manual deployment after EC2 secret/deploy.sh confirmation
```

Deployment was not executed from this environment. The following capabilities are unavailable:

1. **GitHub Actions environment** — `gh` CLI not installed; cannot inspect or confirm production environment secrets/variables (`APP_ORIGIN`, `EC2_SERVER_KEY`, `EC2_SERVER_HOST`, `EC2_SERVER_USER`, etc.)
2. **EC2 SSH access** — No EC2 credentials available in this environment; cannot SSH to EC2, inspect or update `deploy.sh`, or run preflight check on the server
3. **Docker build** — Docker socket requires interactive sudo on this machine (permission denied at `unix:///var/run/docker.sock`); not a code issue
4. **DNS/production domain** — `curl https://andacity.com/healthz` returns exit code 6 (DNS resolution failure); `andacity.com` is not yet live
5. **Merge authorization** — Merging `dev` → `main` to trigger CI requires explicit user authorization; not yet granted

All code gates pass. No code changes required. The deployment is unblocked from a codebase standpoint. Only operational steps remain.

---

## Source Docs Reviewed

| Document | Task | Status |
|---|---|---|
| `PRODUCTION_ENV_AND_DEPLOY_GATE_CLOSURE.md` | CLAUDE-UI-046 | ✅ Latest source of truth |
| `PUBLIC_BETA_LAUNCH_EXECUTION.md` | CLAUDE-UI-045 | ✅ Reviewed |
| `PUBLIC_BETA_LAUNCH_CHECKLIST.md` | CLAUDE-UI-031/045/046 | ✅ Reviewed |
| `PUBLIC_BETA_DEPLOYMENT_REVERIFICATION_AFTER_INTERACTIVE_QA.md` | CLAUDE-UI-044 | ✅ Reviewed |
| `FINAL_INTERACTIVE_PUBLIC_SURFACE_QA.md` | CLAUDE-UI-043 | ✅ Reviewed |
| `scripts/check-production-env.sh` | CLAUDE-UI-046 | ✅ Reviewed |
| `scripts/deploy-template.sh` | CLAUDE-UI-046 | ✅ Reviewed |
| `.github/workflows/deploy-production.yml` | CLAUDE-UI-046 | ✅ Reviewed |
| `.env.example` | CLAUDE-UI-046 | ✅ Reviewed |
| `Dockerfile` | CLAUDE-UI-033 | ✅ Reviewed |

---

## Repository State

| Property | Value |
|---|---|
| Branch | `dev` |
| HEAD | `dc848ad` |
| HEAD message | `feat(ui-redesign): CLAUDE-UI-046 production env and deploy gate closure` |
| Working tree | Clean — nothing to commit |
| Remote sync | 12 commits ahead of `origin/dev` — **not yet pushed** |
| `main` status | Unknown — cannot confirm without remote access; expected to be behind `dev` |
| All CLAUDE-UI-041 through 046 | ✅ Committed locally |

The local `dev` branch is 12 commits ahead of `origin/dev`. None of the CLAUDE-UI-041 through CLAUDE-UI-046 changes have been pushed to the remote or merged to `main`.

---

## Release Tag Status

| Tag | Points to | Task | Status |
|---|---|---|---|
| `beta-launch-v1` | `6133148` | CLAUDE-UI-044 | ⚠ **Stale — 2 commits behind HEAD** |

`beta-launch-v1` was created in CLAUDE-UI-045 pointing to `6133148` (CLAUDE-UI-044). Two additional commits have landed since then:

| Commit | Task | What it added |
|---|---|---|
| `9f4e50c` | CLAUDE-UI-045 | Launch execution report, tag creation |
| `dc848ad` | CLAUDE-UI-046 | CI workflow fix (APP_ORIGIN), preflight script, deploy template |

**The CLAUDE-UI-046 CI fix (`dc848ad`) is load-bearing for production correctness.** Without it, Docker images built on EC2 would bake in `ORIGIN=http://localhost`. `beta-launch-v1` does not include this fix.

**Recommendation:** Before merging to `main`, create a new tag at `dc848ad`:

```bash
git tag beta-launch-v1-final dc848ad
git push origin beta-launch-v1-final
```

Or retag (requires explicit authorization since `beta-launch-v1` already exists locally):

```bash
git tag -f beta-launch-v1 dc848ad
git push origin beta-launch-v1
```

The `beta-launch-v1` tag has not been pushed to remote yet, so retagging is low-risk. The launch commit should be `dc848ad`, not `6133148`.

---

## GitHub Actions Environment

`gh` CLI is not available on this machine. GitHub Actions production environment variables and secrets cannot be inspected.

**Cannot confirm:**
- `APP_ORIGIN` variable exists and is set to `https://andacity.com`
- `EC2_SERVER_KEY` secret exists
- `EC2_SERVER_HOST` variable exists
- `EC2_SERVER_USER` secret exists
- `EC2_DEPLOY_ROOT_DIR` variable exists
- `APP_NAME` variable exists
- `APP_SERVER_PORT` variable exists
- `APP_FRAMEWORK` variable exists

**Operator must verify:** all of the above are set in the GitHub Actions `production` environment before triggering the workflow. The deployment will fail silently or incorrectly if any are missing.

---

## EC2 Runtime Environment

No EC2 SSH credentials are available from this machine. Cannot SSH to EC2.

**Cannot confirm:**
- `DATABASE_URL` is set and points to the production database
- `ORIGIN=https://andacity.com`
- `PUBLIC_BASE_URL=https://andacity.com`
- `OG_SIGNING_SECRET` is set and is not the default `change-me`
- `CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL` are real monitored inboxes

**Operator must verify:** all required runtime vars are set in the EC2 environment before deploy. Use `scripts/check-production-env.sh` to validate.

---

## Production Env Preflight

`scripts/check-production-env.sh` was smoke-tested in CLAUDE-UI-046 with no env vars set:

```
FAIL — 8 required variable(s) are missing.
```

Script exits 1 and does not print any secret values. Behavior confirmed correct.

**Cannot run on EC2** — no SSH access from this environment.

**Operator must run** on EC2 before deploy:

```bash
# On EC2, source production env file first:
source /etc/andacity/production.env
APP_ORIGIN=https://andacity.com ./scripts/check-production-env.sh
# Must exit 0 before proceeding
```

---

## deploy.sh Verification

**Cannot inspect** — `deploy.sh` lives on EC2 and is not in the repo. No EC2 access from this environment.

**Verified in repo (CLAUDE-UI-046):** `deploy-production.yml` now injects `APP_ORIGIN` before calling `deploy.sh`:

```yaml
APP_ORIGIN=${{ vars.APP_ORIGIN || 'https://andacity.com' }} ./deploy.sh ...
```

**Operator must verify on EC2** that `deploy.sh` includes:

```bash
docker build \
  --build-arg APP_ORIGIN="${APP_ORIGIN:-https://andacity.com}" \
  ...
```

Reference implementation at `scripts/deploy-template.sh` in the repo. If EC2's `deploy.sh` does not pass this build arg, it must be updated before deployment. See `PRODUCTION_ENV_AND_DEPLOY_GATE_CLOSURE.md` (CLAUDE-UI-046) for full context.

---

## Build Verification

Run on 2026-06-24 at HEAD `dc848ad`:

```
yarn run build.types   ✅  exit 0 — Done in 6.15s
yarn run build.client  ✅  exit 0 — 1083 modules, built in 8.76s
yarn run build.server  ✅  exit 0 — Done in 17.79s
yarn run lint          ✅  exit 0 — 0 errors, 2 pre-existing warnings
yarn run build         ✅  exit 0 — Done in 36.80s
```

2 pre-existing lint warnings: `SiteHeader.tsx:63` and `ThemeController.tsx:48` — intentional `useVisibleTask$` uses suppressed with eslint-disable comments. Unchanged since CLAUDE-UI-034.

---

## Docker Build

```
docker build --build-arg APP_ORIGIN=https://andacity.com -t andacity:beta-launch-v1 .
  ⚠  Permission denied (unix:///var/run/docker.sock — local user not in docker group)
  Not a code issue. Dockerfile unchanged since CLAUDE-UI-040 where Docker build was verified.
  Build gate (yarn run build) passes — Docker build expected to succeed with correct permissions.
```

---

## Deployment Execution

**Not executed.** Deployment blocked by:

1. GitHub Actions secrets/variables cannot be confirmed (no `gh` CLI)
2. EC2 SSH not available (no credentials)
3. EC2 `deploy.sh` content cannot be verified or updated remotely
4. `dev` not yet pushed to `origin/dev`
5. No explicit authorization to merge `dev` → `main`
6. `andacity.com` DNS does not resolve — domain not yet configured or pointed to EC2

---

## Live Smoke Tests

**Not run — production not yet live.**

`curl https://andacity.com/healthz` returns exit code 6 (DNS resolution failure). `andacity.com` is not accessible from this network.

Expected results after deployment (based on dev server verification in CLAUDE-UI-043/044):

| URL | Expected | Notes |
|---|---|---|
| `https://andacity.com/` | 200 | |
| `https://andacity.com/hotels` | 200 | |
| `https://andacity.com/hotels/in` | 200 | |
| `https://andacity.com/hotels/in/las-vegas/` | 200 | Indexable |
| `https://andacity.com/hotels/search/los-angeles/2026-07-01/2026-07-08/` | 200 | noindex, follow |
| `https://andacity.com/flights` | 200 | |
| `https://andacity.com/flights/search/SLC-LAX/2026-07-01/` | 200 | noindex |
| `https://andacity.com/car-rentals` | 200 | |
| `https://andacity.com/car-rentals/in` | 200 | |
| `https://andacity.com/car-rentals/in/new-york/` | 200 | Indexable |
| `https://andacity.com/car-rentals/search/LAS/2026-07-01/2026-07-08/` | 200 | noindex, follow |
| `https://andacity.com/explore` | 200 | |
| `https://andacity.com/destinations` | 200 | |
| `https://andacity.com/destinations/miami` | 200 | |
| `https://andacity.com/search/all/miami/1` | 200 | noindex via layout |
| `https://andacity.com/privacy` | 200 | |
| `https://andacity.com/terms` | 200 | |
| `https://andacity.com/contact` | 200 | |
| `https://andacity.com/healthz` | 200 | `{"ok":true}` |
| `https://andacity.com/sitemap.xml` | 200 | 313+ URLs |
| `https://andacity.com/robots.txt` | 200 | `Disallow: /search/` |
| `https://andacity.com/dev/ui-home/` | **404** | Production-gated |

---

## Interactive Production Checks

**Not run — production not yet live.**

Run in a browser after deployment:

- [ ] Hotel city page (`/hotels/in/las-vegas/`) — location autosuggest dropdown appears above following content
- [ ] Hotel city page — date picker appears above following content
- [ ] Car-rental city page (`/car-rentals/in/new-york/`) — same overlay checks
- [ ] Home page — all three search tabs; overlay clears following sections
- [ ] Hotel search result page — `--ui-hero` gradient header, breadcrumb, H1, date range, Edit search
- [ ] Car-rental search result page — same pattern
- [ ] Mobile (375px) — overlays usable, no horizontal overflow
- [ ] Dark mode (Skyglass Luxe Dark) — overlays readable

---

## SEO/Indexing Verification

Source-verified in CLAUDE-UI-043/044 (dev server confirmed):

| Check | Status |
|---|---|
| `shouldIndex()` returns true only for `andacity.com` / `www.andacity.com` | ✅ Source verified |
| Hotel/car search routes: `x-robots-tag: noindex, follow` | ✅ Source verified |
| `/search/*` noindex via `search/layout.tsx` | ✅ Source verified |
| City pages (`/hotels/in/[slug]`, `/car-rentals/in/[slug]`) indexable | ✅ Source verified |
| `/dev/ui-*` 404 on production (`shouldIndex()` gate) | ✅ Source verified |
| Sitemap: 313 URLs | ✅ Dev server verified |
| `/robots.txt`: `Disallow: /search/`, Sitemap pointer | ✅ Dev server verified |

**Production verification pending deployment.**

---

## Preview Route Safety

| Check | Status |
|---|---|
| `/dev/ui-*` 404 on production (shouldIndex gate) | ✅ Source verified |
| No production nav/footer links to `/dev/*` | ✅ grep confirmed |
| `x-robots-tag: noindex, nofollow` on dev/staging hosts | ✅ Source verified |

---

## Observability Verification

Source-verified (dev server in CLAUDE-UI-044):

| Check | Status |
|---|---|
| `/api/analytics/pageview` returns 204 | ✅ Dev server verified |
| `/api/errors` returns 204 for valid payload | ✅ Dev server verified |
| First-party server log on every pageview | ✅ Source verified |
| No third-party script when `PUBLIC_ANALYTICS_PROVIDER=""` | ✅ Source verified |
| `/healthz`: `{"ok":true}` | ✅ Dev server verified |

**Production verification pending deployment.**

---

## Contact/Legal Verification

Source-verified:

| Page | Variable | Fallback | Production requirement |
|---|---|---|---|
| `/contact` | `CONTACT_EMAIL` | `hello@andacity.com` | Must be a monitored inbox |
| `/privacy` | `PRIVACY_EMAIL` | `privacy@andacity.com` | Must be a monitored inbox |
| `/terms` | `LEGAL_EMAIL` | `legal@andacity.com` | Must be a monitored inbox |

**Cannot confirm production rendering** — site not yet live. Operator must verify contact pages show the correct production email addresses after deploy.

---

## Sitemap Submission

**Not done — production not yet live.**

After deployment, submit `https://andacity.com/sitemap.xml` to Google Search Console:
1. Add `andacity.com` as a property in Google Search Console
2. Verify domain ownership (DNS TXT record or HTML file)
3. Navigate to Sitemaps → Submit new sitemap → `https://andacity.com/sitemap.xml`

---

## Rollback Plan

| Option | Mechanism | Speed |
|---|---|---|
| Container rollback | `docker stop andacity && docker run andacity:<previous-datestamped-tag>` | Fast |
| CI rollback | Revert commits on `main` + push → CI redeploys | ~5–10 min |
| DNS/proxy disable | Point DNS to maintenance page (Cloudflare or EC2 proxy) | Fast (depends on TTL) |

See `PRODUCTION_ENV_AND_DEPLOY_GATE_CLOSURE.md` (CLAUDE-UI-046) for full rollback notes.

---

## Required Manual Actions

All items require the production operator. None require code changes.

### Before deploy

- [ ] Push `dev` to `origin/dev` (or verify it is already pushed): `git push origin dev`
- [ ] Create updated release tag at the deployment commit (`dc848ad`):
  ```bash
  git tag beta-launch-v1-final dc848ad
  git push origin beta-launch-v1-final
  ```
- [ ] Set `APP_ORIGIN=https://andacity.com` in the GitHub Actions `production` environment as a variable
- [ ] Confirm all other GitHub Actions variables/secrets are set: `EC2_SERVER_KEY`, `EC2_SERVER_HOST`, `EC2_SERVER_USER`, `EC2_DEPLOY_ROOT_DIR`, `APP_NAME`, `APP_SERVER_PORT`, `APP_FRAMEWORK`
- [ ] Set all 7 required runtime env vars on EC2 (`DATABASE_URL`, `ORIGIN`, `PUBLIC_BASE_URL`, `OG_SIGNING_SECRET`, `CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL`)
- [ ] Confirm `OG_SIGNING_SECRET` is a real random string, not `change-me`
- [ ] Inspect EC2 `deploy.sh` — confirm it passes `--build-arg APP_ORIGIN="${APP_ORIGIN}"` to `docker build`. If not, update using `scripts/deploy-template.sh`
- [ ] Run `scripts/check-production-env.sh` on EC2 — confirm exits 0
- [ ] Confirm `andacity.com` DNS points to EC2 (or configure DNS before deploy)

### Deploy

- [ ] Merge `dev` → `main` (PR or direct push)
- [ ] Monitor GitHub Actions `deploy-production.yml` run
- [ ] Confirm CI workflow completes without error

### After deploy

- [ ] `curl https://andacity.com/healthz` → `{"ok":true}`
- [ ] Smoke-test at least 5 production routes from the smoke test table above
- [ ] Verify `https://andacity.com/dev/ui-home/` returns 404
- [ ] Verify sitemap uses production origin: `https://andacity.com/sitemap.xml` shows `andacity.com` URLs
- [ ] Verify contact/legal pages show correct monitored email addresses
- [ ] Push release tag: `git push origin beta-launch-v1` (or the new `beta-launch-v1-final`)
- [ ] Submit sitemap to Google Search Console
- [ ] Set up uptime monitoring on `/healthz`

---

## Remaining Risks

| Risk | Severity | Status |
|---|---|---|
| `beta-launch-v1` tag points to `6133148` (missing CLAUDE-UI-045/046 changes) | High | Document → Operator should retag or use new `beta-launch-v1-final` tag |
| `OG_SIGNING_SECRET=change-me` in production | High | Operator must confirm it is replaced |
| EC2 `deploy.sh` does not pass `--build-arg APP_ORIGIN` | High | Operator must inspect and update |
| GitHub Actions production env vars not set | High | Operator must set before triggering CI |
| `andacity.com` DNS not resolving | High | DNS must be configured before live tests |
| Local `dev` branch not pushed to remote | Medium | Push `dev` before or alongside merging to `main` |
| Contact/legal email addresses not monitored | Medium | Confirm before launch |
| Container starts with wrong `DATABASE_URL` | Medium | First-party error logs capture startup failures |
| Analytics blind spot at launch | Low | First-party pageview logging always active; provider activation is post-launch |

---

## Public Beta Status

```
Not yet deployed.
Classification: Ready for manual deployment after EC2 secret/deploy.sh confirmation
```

Codebase is ready. The launch sequence is fully documented. No further code changes are required before deployment. The production operator must:
1. Confirm/set production secrets and environment variables
2. Inspect and update EC2 `deploy.sh` if needed
3. Run the preflight check
4. Authorize and execute the merge to `main`

---

## Verification Results

```
yarn run build.types   ✅  exit 0 — Done in 6.15s
yarn run build.client  ✅  exit 0 — 1083 modules built in 8.76s
yarn run build.server  ✅  exit 0 — Done in 17.79s
yarn run lint          ✅  exit 0 — 0 errors, 2 pre-existing warnings
yarn run build         ✅  exit 0 — Done in 36.80s
```

```
docker build --build-arg APP_ORIGIN=https://andacity.com -t andacity:beta-launch-v1 .
  ⚠  Permission denied (unix:///var/run/docker.sock)
  Not a code issue. Dockerfile unchanged since CLAUDE-UI-040.
```

```
curl https://andacity.com/healthz
  ⚠  Exit code 6 — DNS resolution failure
  Domain not yet live or DNS not yet configured
```

```
gh variable list --env production
  ⚠  gh CLI not installed — cannot inspect GitHub Actions environment
```

```
EC2 SSH:
  ⚠  No credentials available — cannot SSH, inspect deploy.sh, or run preflight
```

```
scripts/check-production-env.sh (smoke test, CLAUDE-UI-046):
  ✅  Exits 1 and reports 8 missing vars when no env set
  ✅  Does not print secret values
```
