/**
 * CLAUDE-UI-051 — Ledger results surface preview route.
 *
 * DEV / DESIGN-PREVIEW ONLY. Same gating contract as the other
 * `/dev/ui-*` routes: `noindex, nofollow` plus a hard 404 on any host
 * `shouldIndex` treats as live, so it can never ship publicly. Touches no
 * production page, no global shell, and does not change the default
 * palette for anyone.
 *
 * `?mode=dark` renders the dark counterpart; both are scoped through
 * PageShell rather than <html>, so neither leaks.
 */
import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { LedgerSample } from "~/components/dev/ledger/LedgerSample";
import { shouldBlockDevPreview } from "~/lib/seo/dev-preview";

export const onRequest: RequestHandler = (ev) => {
  // NB: uses shouldBlockDevPreview, not the `shouldIndex(url)` check the
  // sibling /dev/ui-* routes use — that one 404s on localhost whenever
  // PUBLIC_BASE_URL is set. See src/lib/seo/dev-preview.ts.
  if (shouldBlockDevPreview(ev)) {
    throw ev.error(404, "Not found");
  }

  ev.headers.set("x-robots-tag", "noindex, nofollow");
};

export default component$(() => {
  const loc = useLocation();
  const mode = loc.url.searchParams.get("mode") === "dark" ? "dark" : "light";
  return <LedgerSample mode={mode} />;
});

export const head: DocumentHead = {
  title: "Ledger Preview (dev) | Andacity",
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    {
      name: "description",
      content:
        "Internal preview of the Ledger comparison surface on the Baseline palette. Not a production page.",
    },
  ],
};
