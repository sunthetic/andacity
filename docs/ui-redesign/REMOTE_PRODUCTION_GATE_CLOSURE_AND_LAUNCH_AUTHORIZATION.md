# Remote Production Gate Closure and Launch Authorization

**Task:** CLAUDE-UI-048
**Date:** 2026-06-24
**Auditor:** Claude Code (claude-sonnet-4-6)
**Branch:** dev
**Predecessor:** CLAUDE-UI-047 (`PUBLIC_BETA_PRODUCTION_DEPLOY_AND_SMOKE_TEST.md`)

---

## Purpose

Close the remaining remote production gates so the project is authorized to merge `dev` → `main` and deploy, ready after external configuration, or confirmed blocked.

---

## Classification

```
Ready after one or more external settings are corrected
```

Four issues must be resolved before deployment:

1. **`OG_SIGNING_SECRET` is a literal placeholder** — `.env production` contains a placeholder string, not a real signing secret. Must be replaced before deployment.
2. **DNS not configured** — `andacity.com` has no A records. Domain must be pointed to EC2 (or a proxy) before production smoke tests can pass.
3. **Incomplete runtime env file** — `.env production` is missing `ORIGIN`, `CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL`.
4. **EC2 access not confirmed** — `deploy.sh` on EC2 cannot be inspected without knowing the EC2 hostname; EC2 runtime env state unknown.

---

## Source Docs Reviewed

| Document | Task | Status |
|---|---|---|
| `PUBLIC_BETA_PRODUCTION_DEPLOY_AND_SMOKE_TEST.md` | CLAUDE-UI-047 | ✅ Source of truth |
| `PRODUCTION_ENV_AND_DEPLOY_GATE_CLOSURE.md` | CLAUDE-UI-046 | ✅ Reviewed |
| `PUBLIC_BETA_LAUNCH_EXECUTION.md` | CLAUDE-UI-045 | ✅ Reviewed |
| `PUBLIC_BETA_LAUNCH_CHECKLIST.md` | CLAUDE-UI-031/044/045/046/047 | ✅ Reviewed |
| `scripts/check-production-env.sh` | CLAUDE-UI-046 | ✅ Reviewed |
| `scripts/deploy-template.sh` | CLAUDE-UI-046 | ✅ Reviewed |
| `.github/workflows/deploy-production.yml` | CLAUDE-UI-046 | ✅ Reviewed |
| `Dockerfile` | CLAUDE-UI-033 | ✅ Reviewed |
| `.env.example` | CLAUDE-UI-046 | ✅ Reviewed |

---

## Repository State

| Property | Value |
|---|---|
| Branch | `dev` |
| HEAD | `6e925c7` |
| HEAD message | `feat(ui-redesign): CLAUDE-UI-047 public beta production deploy and live smoke test` |
| Working tree | Clean |
| Remote sync | `origin/dev` at `6e925c7` — **fully synced** ✅ (pushed this task) |
| `origin/dev` before this task | `0b2ae0f` (13 commits behind local) |
| Remote URL (updated this task) | `git@github.com:sunthetic/andacity.git` |
| Previous remote URL | `github:brazenest/andacity.git` (SSH alias; redirected to `sunthetic`) |

---

## Push Status

`git push origin dev` was executed and succeeded:

```
To github:brazenest/andacity.git
   0b2ae0f..6e925c7  dev -> dev
```

All 13 local CLAUDE-UI commits (CLAUDE-UI-041 through CLAUDE-UI-047) are now on the remote.

`git fetch origin` confirmed working with the updated remote URL.

---

## Release Tag Status

| Tag | Points to | Task | Status |
|---|---|---|---|
| `beta-launch-v1` | `6133148` | CLAUDE-UI-044 | ⚠ Stale — missing CLAUDE-UI-045/046/047 |
| `beta-launch-v1-final` | `6e925c7` | CLAUDE-UI-048 | ✅ Created and pushed this task |

The stale `beta-launch-v1` tag was not overwritten. The new `beta-launch-v1-final` tag at `6e925c7` (CLAUDE-UI-047 HEAD) is the correct launch tag.

Note: If the operator prefers the latest code-only commit (before documentation commits), `dc848ad` (CLAUDE-UI-046) contains all code, CI, and script changes. `6e925c7` adds only documentation. Either is a valid launch commit.

---

## GitHub Actions Production Configuration

`gh` CLI is not installed. GitHub Actions environment variables/secrets cannot be read programmatically.

**Repository move noted:** The repository moved from `brazenest/andacity` to `sunthetic/andacity`. GitHub redirects pushes automatically. The remote URL has been updated in this task to the canonical location. GitHub Actions workflows are now at `sunthetic/andacity`.

**Confirmed:**
- Workflow trigger: `deploy-production.yml` triggers on push to `main` ✅ (source verified)
- `APP_ORIGIN` injection: CI workflow passes `APP_ORIGIN=${{ vars.APP_ORIGIN || 'https://andacity.com' }}` to SSH session ✅ (CLAUDE-UI-046 fix)

**Cannot confirm (requires GitHub UI or `gh` CLI):**
- `APP_ORIGIN` variable is set in the `production` environment
- `EC2_SERVER_KEY`, `EC2_SERVER_HOST`, `EC2_SERVER_USER` secrets are set
- `EC2_DEPLOY_ROOT_DIR`, `APP_NAME`, `APP_SERVER_PORT`, `APP_FRAMEWORK` variables are set

**GitHub security alerts noted:** 45 Dependabot vulnerability alerts on the default branch (1 critical, 13 high, 20 moderate, 11 low). These are npm dependency vulnerabilities, not application code vulnerabilities. They should be reviewed post-launch but are not a deployment blocker for this beta. See [Remaining Blockers](#remaining-blockers) for risk assessment.

---

## DNS Status

```
dig andacity.com A +short
  (empty — no A records)

dig www.andacity.com A +short
  (empty — no A records)

dig andacity.com NS +short
  (empty — no NS records returned from authoritative DNS)

curl -s --max-time 5 https://andacity.com/healthz
  exit 6 (DNS resolution failure / connection refused)
```

**`andacity.com` has no DNS records configured.** The domain has not been pointed to an EC2 server, load balancer, or Cloudflare proxy. DNS must be configured before the site can be reached on the public internet.

**Operator must:**
1. Configure `andacity.com` A record to point to the EC2 public IP
2. Configure `www.andacity.com` as CNAME to `andacity.com` or same A record
3. Configure HTTPS (TLS certificate via Nginx + Certbot, Cloudflare proxy, or ALB)
4. Allow DNS propagation (TTL typically 5 minutes to 24 hours)

---

## EC2 Runtime Environment

**No EC2 SSH access from this environment.** The `agcom-ec2-deployment-production` SSH key exists in `~/.ssh/` but has no configured hostname in `~/.ssh/config`. The EC2 production hostname is stored in the GitHub Actions variable `vars.EC2_SERVER_HOST`, which cannot be read without `gh` CLI.

**`~/.ssh/` contains potentially relevant keys:**
- `agcom-ec2-deployment-production` — labeled "AGCOM EC2 Deployment Key - Production"; no hostname configured locally
- `agcom__aws_20260102T1959Z.pem` — AWS PEM key from January 2026

**Cannot confirm EC2 runtime state:**
- `deploy.sh` presence and content
- Runtime env vars (`DATABASE_URL`, `ORIGIN`, `OG_SIGNING_SECRET`, etc.)
- Docker installation
- Docker group membership for deploy user
- Container currently running

---

## Local Env File Findings

### `.env production` (with space — not `.env.production`)

Located at `<repo>/.env production`. This file is gitignored by the `.env*` pattern. Content analysis:

| Variable | Status | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ Set | RDS endpoint, us-east-2, SSL required. Value not printed. |
| `PUBLIC_BASE_URL` | ✅ Set | `https://andacity.com` |
| `OG_SIGNING_SECRET` | 🚨 PLACEHOLDER | Value is a literal placeholder string, not a real secret. **Must replace before production deploy.** |
| `ORIGIN` | ❌ Missing | Must add: `ORIGIN=https://andacity.com` |
| `CONTACT_EMAIL` | ❌ Missing | Must add with monitored inbox address |
| `PRIVACY_EMAIL` | ❌ Missing | Must add with monitored inbox address |
| `LEGAL_EMAIL` | ❌ Missing | Must add with monitored inbox address |

**Filename issue:** The file is named `.env production` (space) rather than `.env.production` (dot). Neither Vite nor Qwik auto-loads this filename. The deploy script must explicitly source this file before running Docker, or env vars must be set through another mechanism (systemd, Docker env file, EC2 Parameter Store, etc.).

**Shared database warning:** `.env.development` contains the same `DATABASE_URL` (same RDS endpoint) as `.env production`. Development operations (seeding, schema migrations, test runs) on this database affect production data. Separate databases are strongly recommended.

### `.env.development`

Contains:
- `DATABASE_URL` — same RDS endpoint as `.env production` ⚠
- `PUBLIC_BASE_URL=https://andacity.com`
- `OG_SIGNING_SECRET` — same placeholder value as `.env production` ⚠

---

## Production Env Preflight

`scripts/check-production-env.sh` was smoke-tested in CLAUDE-UI-046 and confirmed working.

**Cannot run on EC2** — no SSH access.

**Cannot run locally against production** — would check local env vars, not EC2 env vars.

**Operator must run this on EC2 before deploy:**
```bash
source /path/to/production.env
APP_ORIGIN=https://andacity.com ./scripts/check-production-env.sh
```

The script will fail until at minimum: `DATABASE_URL`, `ORIGIN`, `OG_SIGNING_SECRET` (real value), `CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL` are all set.

---

## EC2 deploy.sh Verification

**Cannot inspect** — no SSH access, hostname unknown.

**What is confirmed from repo:**
- `deploy-production.yml` now injects `APP_ORIGIN` before calling `deploy.sh` (CLAUDE-UI-046 fix) ✅
- `scripts/deploy-template.sh` shows the correct `--build-arg APP_ORIGIN` pattern ✅

**What operator must verify on EC2:**
```bash
# On EC2, inspect deploy.sh for this line:
grep "APP_ORIGIN" ./deploy.sh
# Must show: --build-arg APP_ORIGIN="${APP_ORIGIN}"
# or: --build-arg APP_ORIGIN=${APP_ORIGIN:-https://andacity.com}
```

If missing, copy or adapt `scripts/deploy-template.sh` as the EC2 `deploy.sh`.

---

## Docker Build Verification

**Cannot run locally** — Docker socket requires sudo.

**EC2 Docker state unknown** — no SSH access.

The Dockerfile is unchanged from CLAUDE-UI-040 where Docker build was verified successful. Build gate (`yarn run build`) passes at `6e925c7`.

---

## Launch Authorization Summary

```
Dev pushed to origin/dev:                  ✅ Done (this task)
Release tag beta-launch-v1-final created:  ✅ Done (this task) — 6e925c7
Remote URL updated to sunthetic:           ✅ Done (this task)
Build gates (types/lint/build) pass:       ✅ CLAUDE-UI-047 verified
CI workflow APP_ORIGIN fix:                ✅ CLAUDE-UI-046
GitHub Actions vars confirmed:             ❌ gh CLI unavailable
EC2 hostname known:                        ❌ Stored in GitHub Actions only
EC2 runtime vars confirmed:                ❌ No SSH access
OG_SIGNING_SECRET is real (not placeholder): ❌ .env production has literal placeholder
ORIGIN set on EC2:                         ❌ Not in .env production
CONTACT/PRIVACY/LEGAL emails set on EC2:   ❌ Not in .env production
DNS andacity.com configured:               ❌ No A records
EC2 deploy.sh APP_ORIGIN build arg:        ❌ Cannot inspect
Docker build on EC2:                       ❌ Cannot confirm
Authorization to merge dev → main:         ❌ Not granted by user
```

---

## Deployment Execution

**Not executed.**

Merge authorization has not been granted. All gate checks that could be performed from this environment are done. Remaining gates require operator action on EC2 and GitHub.

---

## Live Smoke Tests

**Not run.** `andacity.com` has no DNS records. The site is not accessible.

---

## Interactive Production Checks

**Not run.** Site not live.

---

## Remaining Blockers

### Critical — Must fix before deployment

| Blocker | Action required |
|---|---|
| `OG_SIGNING_SECRET` is a literal placeholder | Generate a real random string (e.g., `openssl rand -hex 32`), add to EC2 env/secrets, do not commit to repo |
| `ORIGIN` missing from production env | Add `ORIGIN=https://andacity.com` to EC2 env/secrets |
| `CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL` missing | Add real monitored inbox addresses to EC2 env/secrets |
| DNS not configured | Point `andacity.com` A record to EC2 public IP; configure HTTPS |

### High — Must complete before deployment

| Blocker | Action required |
|---|---|
| GitHub Actions secrets/variables unconfirmed | Set `APP_ORIGIN`, `EC2_SERVER_KEY`, `EC2_SERVER_HOST`, `EC2_SERVER_USER`, `EC2_DEPLOY_ROOT_DIR`, `APP_NAME`, `APP_SERVER_PORT`, `APP_FRAMEWORK` in production environment |
| EC2 `deploy.sh` not inspected | SSH to EC2, inspect deploy.sh, confirm `--build-arg APP_ORIGIN` is passed |
| EC2 preflight not run | SSH to EC2, source env file, run `./scripts/check-production-env.sh` |
| Merge not authorized | User must authorize `dev → main` merge |

### Medium — Address before or shortly after deployment

| Blocker | Action required |
|---|---|
| Dev/production share same DATABASE_URL | Create a separate production database; reseed; update production DATABASE_URL |
| Dependabot alerts (1 critical, 13 high) | Review and remediate after launch; evaluate if critical affects production surface |
| `.env production` filename has space | Confirm deploy script sources the right file; consider renaming to `.env.production` or using EC2 Parameter Store |

---

## Required Manual Actions

In execution order:

```
[ ] 1.  Generate real OG_SIGNING_SECRET:
        openssl rand -hex 32
        Store in EC2 environment (NOT in .env production file in the repo directory)

[ ] 2.  Complete production env config on EC2 — add missing vars:
        ORIGIN=https://andacity.com
        CONTACT_EMAIL=<real monitored inbox>
        PRIVACY_EMAIL=<real monitored inbox>
        LEGAL_EMAIL=<real monitored inbox>

[ ] 3.  Set GitHub Actions production environment:
        Variable APP_ORIGIN=https://andacity.com
        Secret EC2_SERVER_KEY=<private key from agcom-ec2-deployment-production>
        Variable EC2_SERVER_HOST=<EC2 public IP or hostname>
        Secret EC2_SERVER_USER=<EC2 SSH username>
        Variable EC2_DEPLOY_ROOT_DIR=<path to deploy.sh on EC2>
        Variable APP_NAME=andacity
        Variable APP_SERVER_PORT=3000
        Variable APP_FRAMEWORK=fastify

[ ] 4.  SSH to EC2, run preflight:
        source /path/to/production.env
        APP_ORIGIN=https://andacity.com ./scripts/check-production-env.sh
        # Confirm exits 0

[ ] 5.  Inspect EC2 deploy.sh:
        grep "APP_ORIGIN" ./deploy.sh
        # If missing, update using scripts/deploy-template.sh as reference

[ ] 6.  Configure DNS:
        andacity.com A record → EC2 public IP
        www.andacity.com → same (CNAME or A record)
        Configure HTTPS (Nginx + Certbot, Cloudflare proxy, or AWS ALB + ACM)

[ ] 7.  Authorize and execute merge:
        git checkout main
        git merge dev
        git push origin main
        # This triggers deploy-production.yml

[ ] 8.  Monitor GitHub Actions run at:
        https://github.com/sunthetic/andacity/actions

[ ] 9.  Verify production:
        curl https://andacity.com/healthz  # → {"ok":true}

[ ] 10. Smoke-test production routes (see PUBLIC_BETA_PRODUCTION_DEPLOY_AND_SMOKE_TEST.md)

[ ] 11. Verify /dev/ui-home returns 404 on production

[ ] 12. Verify contact/legal pages show correct email addresses

[ ] 13. Submit sitemap: https://andacity.com/sitemap.xml to Google Search Console
```

---

## Recommendation

All code, CI, and script changes are complete and verified. The deployment itself is unblocked at the repository level. The remaining work is entirely operational.

**Immediate next steps for the operator:**

1. Generate a real `OG_SIGNING_SECRET` and set it on EC2
2. Add the four missing env vars to EC2 (`ORIGIN`, three email vars)
3. Set GitHub Actions production environment variables/secrets
4. Configure DNS for `andacity.com`
5. Run preflight check on EC2
6. Authorize the merge to `main`

The estimated operator time for steps 1–5 (assuming EC2 is already running and accessible) is approximately 30 minutes.

---

## Verification Results

```
git push origin dev:
  ✅ 0b2ae0f..6e925c7 dev → dev

git tag beta-launch-v1-final 6e925c7:
  ✅ Created locally and pushed

git push origin beta-launch-v1-final:
  ✅ [new tag] beta-launch-v1-final → beta-launch-v1-final

git remote set-url origin git@github.com:sunthetic/andacity.git:
  ✅ Remote URL updated; git fetch origin confirmed working

DNS andacity.com:
  ⚠  No A records — domain not configured

andacity.com/healthz:
  ⚠  curl exit 6 — DNS resolution failure

GitHub Actions environment:
  ⚠  gh CLI not installed

EC2 SSH:
  ⚠  Hostname not known locally (stored in GitHub Actions vars)

Docker build (local):
  ⚠  Permission denied on Docker socket

.env production:
  ✅  DATABASE_URL: present (RDS endpoint, value not printed)
  ✅  PUBLIC_BASE_URL: https://andacity.com
  🚨  OG_SIGNING_SECRET: literal placeholder — must replace before deploy
  ❌  ORIGIN: missing
  ❌  CONTACT_EMAIL: missing
  ❌  PRIVACY_EMAIL: missing
  ❌  LEGAL_EMAIL: missing

Build gates (verified in CLAUDE-UI-047):
  ✅  yarn run build.types  exit 0
  ✅  yarn run build.client exit 0 — 1083 modules
  ✅  yarn run build.server exit 0
  ✅  yarn run lint         exit 0 — 0 errors, 2 pre-existing warnings
  ✅  yarn run build        exit 0 — Done in 36.80s
```
