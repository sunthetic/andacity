# Public Beta Deployment Reverification

**Task:** CLAUDE-UI-040
**Date:** 2026-06-23
**Predecessor:** CLAUDE-UI-034 — `PUBLIC_BETA_DEPLOYMENT_VERIFICATION.md`

---

## Purpose

Reverify that Andacity is deployable as a public beta candidate after all UI remediation from CLAUDE-UI-036 through CLAUDE-UI-039. These sessions redesigned `/hotels/in`, `/car-rentals/in`, migrated 9 shared components from `--color-*` to `--ui-*`, and applied a final full-surface QA pass (fixing the only remaining public legacy token in `layout.tsx`).

---

## Changes since CLAUDE-UI-034

| Task | Files changed | Deployment relevance |
|---|---|---|
| CLAUDE-UI-036 | `src/routes/hotels/in/index.tsx` | Route visual redesign; no new env vars; sitemap coverage unchanged |
| CLAUDE-UI-037 | `src/routes/car-rentals/in/index.tsx` | Route visual redesign; Schema.org `numberOfItems` bug removed |
| CLAUDE-UI-038 | 9 shared component files | CSS token migration only; no behavior changes; no new env vars |
| CLAUDE-UI-039 | `src/routes/layout.tsx` (1 line) | Legacy `--color-text` → `--ui-text` on root layout `<div>` |

No new environment variables, no changes to routing/auth/db/sessions/CSRF, no new third-party services.

---

## Build verification

All commands run from project root on 2026-06-23.

| Command | Result |
|---|---|
| `yarn run build.types` | ✅ exit 0 — Done in 2.34s |
| `yarn run lint` | ✅ exit 0 — 0 errors, 2 pre-existing warnings (SiteHeader:63, ThemeController:48 — `qwik/no-use-visible-task`) |
| `yarn run build.client` | ✅ exit 0 — ✓ built in 3.93s |
| `yarn run build.server` | ✅ exit 0 — ✓ Built server (ssr) modules in 9.37s |
| `yarn run build` | ✅ exit 0 — Done in 18.45s (types + client + server + lint) |

No new errors. The 2 pre-existing lint warnings are unchanged from CLAUDE-UI-034 and are intentional `useVisibleTask$` uses in SiteHeader (nav scroll detection) and ThemeController (localStorage read), both suppressed with `eslint-disable-next-line` comments.

---

## Docker build

Docker is installed locally (`Docker version 29.6.0` at `/usr/bin/docker`).

> Note: CLAUDE-UI-034 recorded Docker as not installed. It has since been installed.

Build command (do not run until env vars are set):

```bash
docker build \
  --build-arg APP_ORIGIN=https://andacity.com \
  --build-arg NODE_ENV=production \
  -t andacity:latest \
  .
```

Run command:

```bash
docker run \
  --rm \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e ORIGIN="https://andacity.com" \
  -e PUBLIC_BASE_URL="https://andacity.com" \
  -e OG_SIGNING_SECRET="..." \
  -e CONTACT_EMAIL="hello@andacity.com" \
  -e PRIVACY_EMAIL="privacy@andacity.com" \
  -e LEGAL_EMAIL="legal@andacity.com" \
  andacity:latest
```

---

## Environment variable checklist

Unchanged from CLAUDE-UI-034. No new env vars were introduced by CLAUDE-UI-036 through CLAUDE-UI-039.

| Variable | Required for public beta | Status |
|---|---|---|
| `DATABASE_URL` | Yes — DB connection string | Must set |
| `ORIGIN` | Yes — Qwik CSRF protection | Must set to `https://andacity.com` |
| `PUBLIC_BASE_URL` | Yes — canonical URLs, sitemaps, JSON-LD | Must set to `https://andacity.com` |
| `OG_SIGNING_SECRET` | Yes — OG image request signing | Must set (generate random string) |
| `CONTACT_EMAIL` | Yes — displayed on /contact | Must set |
| `PRIVACY_EMAIL` | Yes — displayed on /privacy | Must set |
| `LEGAL_EMAIL` | Yes — displayed on /terms | Must set |
| `DB_POOL_MAX` | No — defaults to 10 | Optional |
| `DB_READS_ENABLED` | No — defaults to off | Set `true` to enable read queries |
| `PUBLIC_ANALYTICS_PROVIDER` | No — defaults to first-party logging | Leave empty for initial beta |
| `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` | Only if provider=cloudflare | Defer |
| `PUBLIC_GA_MEASUREMENT_ID` | Only if provider=ga4 | Defer |
| `PUBLIC_SENTRY_DSN` | No — first-party error logging active regardless | Defer |

---

## SEO / indexing verification

### `shouldIndex()` gate

`src/lib/seo/env.ts` returns `true` only for `andacity.com` and `www.andacity.com`. All other origins (dev, staging, localhost) are non-indexing. Confirmed unchanged.

### `/dev/ui-*` routes on production

All 5 `/dev/ui-*` routes call `if (shouldIndex(url)) throw error(404, 'Not found')`. On production, they 404 before rendering. Confirmed unchanged.

### Sitemap

`/sitemap.xml` includes all expected routes:

| Route | Priority |
|---|---|
| `/` | 1.0 |
| `/hotels`, `/flights`, `/car-rentals` | 0.9 |
| `/explore`, `/destinations` | 0.8 |
| `/hotels/in` | 0.7 ✅ |
| `/car-rentals/in` | 0.7 ✅ |
| `/hotels/in/[citySlug]` (all cities) | 0.7 |
| `/car-rentals/in/[citySlug]` (all cities) | 0.6 |
| `/destinations/[slug]` (all destinations) | 0.7 |
| `/privacy`, `/terms`, `/contact` | 0.3–0.4 |

`/car-rentals/[slug]` individual vehicle pages are correctly NOT included in the sitemap.

### Canonical / `robots.txt`

- `robots.txt`: `Allow: /`, `Disallow: /search/`, `Sitemap: ${origin}/sitemap.xml`
- All redesigned routes set canonical tags via `DocumentHead`
- `/hotels/in` canonical: `/hotels/in` ✅
- `/car-rentals/in` canonical: `/car-rentals/in` ✅
- No `noindex` directives added to any public route

---

## Analytics and error monitoring

No changes from CLAUDE-UI-034. For public beta:

- `PUBLIC_ANALYTICS_PROVIDER` should remain empty — first-party server logging only
- `/api/errors` endpoint collects client-side errors (console.error) regardless of Sentry configuration
- Add Cloudflare Web Analytics as a post-launch second step (cookieless, no consent banner required)

---

## Remaining deferred legacy tokens

The following components retain `--color-*` tokens but are classified as non-blocking for public beta:

| Component | Used on public pages | Notes |
|---|---|---|
| `UndoSnackbar` | All pages (transient toast only) | Fixed dark-bg `rgba(17,24,39,0.96)` — not theme-sensitive; visual impact minimal |
| `SaveButton` / `CompareButton` | `/hotels/[slug]`, `/car-rentals/[slug]` | Interactive widget buttons; function correctly; visual coherence deferred |
| `RecentlyViewedModule` | Detail pages (conditional render) | Below-fold, optional module |
| `CompareDrawer` | Detail pages (user-triggered) | Triggered only on user action; similar to deferred CompareSheet siblings |
| `AsyncSurfaceSkeleton` | `/trips` (logged-in only) | Not a public-beta surface |
| All checkout/confirmation/search/itinerary/my-trips/travelers components | Noindex routes | Post-beta cleanup |

These were audited in CLAUDE-UI-035 and accepted as deferred. CLAUDE-UI-039 QA classified the public surface as "Ready to resume public beta launch execution."

---

## Smoke test checklist

Run these routes after deploy and env var configuration:

| Route | Expected |
|---|---|
| `/` | Home page, correct theme |
| `/hotels/in` | All cities grid, hero, handoff section |
| `/car-rentals/in` | All cities grid, hero, handoff section |
| `/hotels/in/[any-slug]` | Hotel city page loads |
| `/car-rentals/in/[any-slug]` | Car rental city page loads |
| `/hotels/[any-slug]` | Hotel detail page loads |
| `/destinations/[any-slug]` | Destination page loads |
| `/privacy`, `/terms`, `/contact` | Content pages with breadcrumbs |
| `/404` | Custom 404 page |
| `/search` | Returns results or empty state (noindex) |
| `/sitemap.xml` | Valid XML with all routes |
| `/robots.txt` | `Allow: /`, correct sitemap URL |
| `/dev/ui-hotels` | 404 on production host |
| `/dev/ui-palettes` | 404 on production host |

---

## Rollback procedure

Unchanged from CLAUDE-UI-034:

1. Tag the current image before deploying: `docker tag andacity:latest andacity:pre-CLAUDE-UI-040`
2. If rollback needed: `docker run ... andacity:pre-CLAUDE-UI-040`
3. Git rollback: `git revert` the commits from CLAUDE-UI-036 through CLAUDE-UI-040 (or deploy the tagged pre-CLAUDE-UI-036 image)

---

## Classification

**Ready to deploy after environment variables are set.**

All builds pass. Sitemap verified. Dev route protection confirmed. SEO gates unchanged. Analytics/error monitoring unchanged. No new env vars required. Remaining legacy tokens are deferred non-blockers per CLAUDE-UI-039 QA.

Next step: set the 7 required environment variables listed above, then execute the Docker deploy per `PUBLIC_BETA_DEPLOYMENT_VERIFICATION.md` (CLAUDE-UI-034) deploy procedure.
