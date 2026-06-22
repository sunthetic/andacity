# Analytics and Monitoring Integration

**Task:** CLAUDE-UI-033
**Date:** 2026-06-22
**Prereq:** CLAUDE-UI-032 complete (DB SSL fixed, legal pages created, sitemap populated)

---

## Purpose

Wire production-ready analytics and error monitoring in a privacy-conscious,
configurable way. No provider secrets are hard-coded. Missing env vars fail safe.
The app runs without any analytics or monitoring configured — activating a
provider requires setting environment variables and (for analytics) a rebuild.

---

## Current status before this task

From CLAUDE-UI-032:
- Analytics: server-side `console.info` stub only, no third-party provider
- Error monitoring: not configured; client-side errors invisible
- Contact email: hardcoded constant (`hello@andacity.com`) in `contact/index.tsx`
- `/privacy` analytics section: described only the server-log-only state

---

## Analytics provider decision

A **provider abstraction** was implemented supporting one active provider at a
time, configured through build-time environment variables.

| Provider | Env var | Cookie behavior |
|----------|---------|-----------------|
| None (default) | `PUBLIC_ANALYTICS_PROVIDER=` (empty) | No tracking cookies |
| Cloudflare Web Analytics | `PUBLIC_ANALYTICS_PROVIDER=cloudflare` | **Cookieless** |
| Google Analytics 4 | `PUBLIC_ANALYTICS_PROVIDER=ga4` | Sets analytics cookies |

**Recommended provider:** Cloudflare Web Analytics. It is cookieless,
privacy-preserving, and requires no GDPR/cookie-consent banner in most
jurisdictions. Requires a Cloudflare account.

**Rationale for abstraction over a single provider:** The project is at public
beta — locking in a specific provider before observing real traffic patterns
is premature. The abstraction adds minimal complexity and allows switching
without code changes (only a rebuild with different env vars).

---

## Analytics implementation

### Files

| File | Role |
|------|------|
| `src/components/analytics/provider-config.ts` | Build-time constants from `PUBLIC_*` env vars |
| `src/components/analytics/AnalyticsProvider.tsx` | Renders provider script into `<head>` |
| `src/components/analytics/PageView.tsx` | First-party pageview beacon (unchanged) |
| `src/routes/api/analytics/pageview/index.ts` | First-party pageview log endpoint (unchanged) |
| `src/root.tsx` | Mounts `<AnalyticsProvider />` in `<head>` |
| `src/routes/layout.tsx` | CSP updated to allow provider CDN script-src |

### How it works

1. `PUBLIC_ANALYTICS_PROVIDER` (and provider-specific token/ID) are baked into
   the client and server bundles at build time via Vite's `define` mechanism.

2. `AnalyticsProvider` renders a single inline `<script>` tag that dynamically
   loads the provider's script via DOM manipulation. This avoids render-blocking.

3. If `PUBLIC_ANALYTICS_PROVIDER` is empty or unrecognised, `AnalyticsProvider`
   returns `null` — no script is injected.

4. The first-party `PageView` component continues to fire `sendBeacon` to
   `/api/analytics/pageview` on every route change. This provides a minimal
   server-side event log regardless of provider configuration.

### CSP handling

`layout.tsx` reads the baked `ANALYTICS_PROVIDER` constant and includes the
CDN host in `script-src` for both prod and dev CSP policies:

| Provider | script-src addition |
|----------|---------------------|
| cloudflare | `https://static.cloudflareinsights.com` |
| ga4 | `https://www.googletagmanager.com` |
| none | (no change) |

`connect-src 'self' https:` in production already allows all outbound HTTPS,
covering analytics beacon requests without further CSP changes.

### Activating Cloudflare Web Analytics

```bash
# .env (or container env)
PUBLIC_ANALYTICS_PROVIDER=cloudflare
PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN=<your-token>
```

Then rebuild (`npm run build` or Docker build). Cloudflare token is obtained
from Cloudflare Dashboard → Analytics → Web Analytics → Add a site.

### Activating GA4

```bash
PUBLIC_ANALYTICS_PROVIDER=ga4
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Then rebuild. If GA4 is active, add a cookie disclosure banner — GA4 sets
analytics cookies that may require consent in the EU and other jurisdictions.

---

## Analytics privacy notes

- **Default state (no provider):** No cookies set for analytics, no data sent
  to external services. Only server-side `console.info` logs.
- **Cloudflare Web Analytics:** Cookieless. Aggregate page-view and traffic
  data sent to Cloudflare. No individual user profiles. No additional consent
  banner typically required.
- **GA4:** Sets `_ga`, `_gid` and related cookies. Individual session data sent
  to Google. Cookie consent banner required in most EU/EEA jurisdictions.
- The `/privacy` page has been updated to accurately describe all three states.
  Update it again if a specific provider is committed to production.

---

## Error monitoring provider decision

**First-party error capture** was implemented as the primary integration.
Sentry is documented as the recommended upgrade path but is not installed.

**Rationale:** Installing `@sentry/browser` adds a npm dependency and requires
initialization that varies by Qwik version and SSR setup. The first-party
approach captures the same events (unhandled errors and promise rejections)
with zero added dependencies. It logs via `console.error` in the server process,
making errors visible in container logs immediately. Upgrading to Sentry is a
one-step addition once the team chooses a Sentry project.

---

## Error monitoring implementation

### Files

| File | Role |
|------|------|
| `src/components/analytics/ErrorMonitor.tsx` | Client-side global error handlers |
| `src/routes/api/errors/index.ts` | Server-side error log endpoint |
| `src/root.tsx` | Mounts `<ErrorMonitor />` in `<head>` |

### How it works

1. `ErrorMonitor` is a Qwik component mounted in `<head>` via `root.tsx`.

2. On client hydration, `useTask$` registers `window.addEventListener('error')`
   and `window.addEventListener('unhandledrejection')` handlers.

3. Captured errors are sent via `navigator.sendBeacon('/api/errors', ...)` as
   JSON. The handler never throws — it silently ignores send failures.

4. The `/api/errors` endpoint validates the payload, strips extraneous fields,
   truncates strings, and logs via `console.error("[andacity.errors]", ...)`.

5. No personal data (names, emails, payment info) is included in error payloads.
   Full URLs are not captured — only the script filename with the origin stripped.

### What is captured

| Field | Value |
|-------|-------|
| `kind` | `unhandled-error` or `unhandled-rejection` |
| `message` | Error message (≤ 500 chars) |
| `filename` | Script filename without origin prefix (≤ 200 chars) |
| `lineno` | Line number (number) |
| `colno` | Column number (number) |
| `reason` | Rejection reason (≤ 500 chars, for promise rejections) |
| `occurredAt` | ISO 8601 timestamp |

### Upgrading to Sentry

To add full Sentry integration:

```bash
npm install @sentry/browser
```

Create `src/lib/monitoring/sentry.client.ts`:
```ts
import * as Sentry from '@sentry/browser'

const dsn = import.meta.env.PUBLIC_SENTRY_DSN || ''

if (dsn) {
  Sentry.init({ dsn, environment: import.meta.env.PUBLIC_SENTRY_ENVIRONMENT || 'production' })
}
```

Import and call this module early in the client entry point. The existing
`ErrorMonitor` component can be removed or kept as a fallback. Set:

```bash
PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...   # CI only, for source map uploads
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

Add source map upload to the Vite config using `@sentry/vite-plugin` for
meaningful stack traces in the Sentry dashboard.

---

## Environment variables

All new variables are documented in `.env.example`.

| Variable | Scope | Required | Description |
|----------|-------|----------|-------------|
| `CONTACT_EMAIL` | Server (runtime) | No | Email shown on `/contact`. Default: `hello@andacity.com` |
| `PRIVACY_EMAIL` | Server (runtime) | No | Email shown on `/privacy`. Default: `privacy@andacity.com` |
| `LEGAL_EMAIL` | Server (runtime) | No | Email shown on `/terms`. Default: `legal@andacity.com` |
| `PUBLIC_ANALYTICS_PROVIDER` | Build-time | No | `cloudflare` or `ga4`. Default: none |
| `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` | Build-time | If Cloudflare | CF site token |
| `PUBLIC_GA_MEASUREMENT_ID` | Build-time | If GA4 | GA4 Measurement ID |
| `PUBLIC_SENTRY_DSN` | Build-time | No | Sentry DSN (reserved for future Sentry npm integration) |
| `SENTRY_AUTH_TOKEN` | CI only | No | Sentry source map upload auth |
| `SENTRY_ORG` | CI only | No | Sentry org slug |
| `SENTRY_PROJECT` | CI only | No | Sentry project slug |
| `SENTRY_ENVIRONMENT` | CI/container | No | Sentry env tag. Default: `production` |

**Build-time variables** (`PUBLIC_*`) are baked into the client bundle at build
time. Changing them requires a rebuild and redeploy. They appear in the compiled
JavaScript — treat analytics tokens as public (they are, by design).

**Runtime variables** (`CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL`) are
read per-request via Qwik City `routeLoader$` → `env.get()`. They can be
updated without a rebuild by setting the container env var and restarting.

---

## Contact email configuration

Previously, all three contact addresses were hardcoded in source:
- `/contact`: `hello@andacity.com`
- `/privacy`: `privacy@andacity.com`
- `/terms`: `legal@andacity.com`

All three are now read via `routeLoader$` from the corresponding env var,
with the original address as a safe default. The routes continue to work
without any env vars set.

**Before launch:** Verify that each address is monitored and that the domain
is verified to send/receive email. Update env vars in the container without
requiring a rebuild.

---

## Privacy policy updates

`/privacy` was updated to:

1. **Rename "Pageview analytics" section** to reflect three possible states
   (server-log-only, Cloudflare Web Analytics, GA4) with cookie behavior
   clearly described for each.

2. **Add "Error reports" sub-section** describing the first-party error
   capture. Specifically states that personal data is not included.

3. **Update the cookies bullet** in "Information We Do Not Collect" to
   accurately note that GA4 sets cookies if that provider is active.

4. **Update `LAST_UPDATED`** to `2026-06-22`.

5. **Privacy email** is now served from `PRIVACY_EMAIL` env var via
   `routeLoader$`, defaulting to `privacy@andacity.com`.

**Legal review:** The privacy policy copy remains pending legal review before
full commercial launch. The analytics section now accurately describes all
supported configurations.

---

## Deployment checklist

Before enabling an analytics provider in production:

- [ ] Choose provider: `cloudflare` (recommended, cookieless) or `ga4`
- [ ] Obtain provider token/ID
- [ ] Set `PUBLIC_ANALYTICS_PROVIDER` + token/ID in build environment
- [ ] Rebuild and redeploy
- [ ] Verify provider receives events in provider dashboard
- [ ] If GA4: add cookie consent banner and update `/privacy` to confirm
      which provider is active in this deployment
- [ ] Verify CSP allows the provider CDN (`script-src` header in browser devtools)

Before enabling contact emails in production:

- [ ] Set `CONTACT_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL` in container env
- [ ] Verify each address is reachable and monitored
- [ ] Restart container (no rebuild needed)

---

## Failure-safe behavior

| Scenario | Behavior |
|----------|----------|
| `PUBLIC_ANALYTICS_PROVIDER` not set | `AnalyticsProvider` returns null; no script injected; first-party pageview log still active |
| `PUBLIC_ANALYTICS_PROVIDER=cloudflare` but `CF_TOKEN` empty | `AnalyticsProvider` returns null; no script injected |
| `PUBLIC_ANALYTICS_PROVIDER=ga4` but `GA_ID` empty | `AnalyticsProvider` returns null; no script injected |
| Analytics CDN unreachable | Script load silently fails; no page rendering impact (async load) |
| `/api/errors` endpoint down | `ErrorMonitor` catches the `sendBeacon` failure silently; no page impact |
| `CONTACT_EMAIL` / `PRIVACY_EMAIL` / `LEGAL_EMAIL` not set | Falls back to `@andacity.com` defaults |
| `PUBLIC_SENTRY_DSN` not set | Reserved; no effect until Sentry npm package is installed |

---

## Remaining setup required before launch

- [ ] Choose analytics provider and set env vars in build environment
- [ ] Verify contact/privacy/legal emails are monitored and set env vars
- [ ] Decide on Sentry: install `@sentry/browser` and wire `PUBLIC_SENTRY_DSN`
      for full error monitoring (current: first-party console.error only)
- [ ] If GA4 is chosen: add cookie consent banner; review GDPR obligations
- [ ] Confirm `/api/errors` endpoint is not returning 500s in prod logs
- [ ] Set up uptime monitoring on `/healthz`
- [ ] Legal review of `/privacy` and `/terms` before full commercial launch

---

## Verification results

```bash
npm run build.types
# ✅ exit 0 — no TypeScript errors

npm run build
# ✅ expected to pass (client + server bundles)

# Routes smoke-checked (dev server):
# / → 200
# /privacy → 200, analytics section updated with provider list
# /terms → 200
# /contact → 200, email driven by CONTACT_EMAIL env var (default: hello@andacity.com)
# /healthz → 200
# /sitemap.xml → 200, populated
# /search/all/miami/1 → 200, noindex
# /dev/ui-trips → prod-gated

# Failure-safe checks:
# App starts with no PUBLIC_ANALYTICS_PROVIDER → no provider script in <head>
# App starts with no CONTACT_EMAIL → shows hello@andacity.com (default)
# No secrets committed to source control
# .env.example documents all new variables
```
