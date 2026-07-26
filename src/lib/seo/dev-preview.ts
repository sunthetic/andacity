/**
 * CLAUDE-UI-051 — Guard for the `/dev/ui-*` design-preview routes.
 *
 * Why this exists
 * ---------------
 * Every `/dev/ui-*` route gates itself with `shouldIndex(url)` and a comment
 * stating that it deliberately uses "the actual incoming request host, not
 * `getPublicBaseUrl`/`PUBLIC_BASE_URL`" — because dev and staging set that
 * env var to https://andacity.com for canonical-URL generation.
 *
 * That mitigation does not hold. With `PUBLIC_BASE_URL=https://andacity.com`
 * present (which is exactly what `.env.example` ships), the `url` handed to
 * `onRequest` resolves with `host === "andacity.com"`, so `shouldIndex(url)`
 * returns true and the route throws 404 — in dev, on localhost. Reproduced:
 *
 *   PUBLIC_BASE_URL set   → url.host = "andacity.com"    → 404
 *   PUBLIC_BASE_URL unset → url.host = "127.0.0.1:5175"  → 200
 *
 * Net effect: the entire design-preview harness is unreachable in precisely
 * the two environments it was built for. It only "works" when the env var is
 * absent, which is not the documented configuration.
 *
 * The fix
 * -------
 * Gate on the raw `Host` request header, which is the actual transport-level
 * host and cannot be rewritten by `PUBLIC_BASE_URL`. `shouldIndex` is kept as
 * a second, independent condition so the production hostnames stay blocked
 * even if the header check is ever loosened — two locks, not one.
 */
import type { RequestEventCommon } from "@builder.io/qwik-city";
import { shouldIndex } from "./env";

/** Hosts on which the preview routes are allowed to render. */
const isLocalHost = (host: string): boolean => {
  const h = host.toLowerCase().split(":")[0];
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "[::1]" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    // staging is explicitly noindex and is a valid place to review UI work
    h === "stage.andacity.apps.sunthetic.media"
  );
};

/**
 * Returns true when a design-preview route must 404.
 *
 * Denies unless the transport host is recognised as local/staging, and denies
 * outright on any host `shouldIndex` treats as live.
 */
export const shouldBlockDevPreview = (ev: RequestEventCommon): boolean => {
  const rawHost = ev.request.headers.get("host") ?? "";

  if (shouldIndex(ev.url)) {
    // Never serve on a canonical production hostname, whatever the header says.
    if (isLocalHost(rawHost)) {
      // url was rewritten by PUBLIC_BASE_URL but the real connection is local.
      return false;
    }
    return true;
  }

  return !isLocalHost(rawHost);
};
