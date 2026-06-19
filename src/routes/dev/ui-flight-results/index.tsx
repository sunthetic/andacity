/**
 * CLAUDE-UI-015 — Flight route results page sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production
 * host (gated on the real request host, matching all other /dev/ui-* routes).
 * Renders a premium, comparison-first flight results concept built on the
 * `--ui-*` foundation + CLAUDE-UI-002 primitives, inside the production global
 * shell (SiteHeader/SiteFooter from the root layout).
 *
 * Sort options + the Stops/Departure/Arrival/Cabin/Price-band filters mirror
 * REAL production behavior; the flexible-date strip, airline/bag filters, and
 * fare-tier comparison are clearly labeled CONCEPT. All carriers and prices are
 * illustrative — no live fares, availability, or partnership claims.
 *
 * It does NOT replace the production /flights/search/[...route] route.
 * See docs/ui-redesign/samples/FLIGHT_RESULTS_SAMPLE.md for the approval gate.
 * Next (after approval): CLAUDE-UI-016 — Flight Route Results Implementation.
 */
import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { shouldIndex } from "~/lib/seo/env";
import { FlightResultsSample } from "~/components/dev/flight-results/FlightResultsSample";

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, "Not found");
  headers.set("x-robots-tag", "noindex, nofollow");
};

export default component$(() => (
  <>
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      ⚠ Flight route results sample — CLAUDE-UI-015. Not production. noindex ·
      prod-gated. Carriers and prices are illustrative. Sort + Stops/Window/Cabin/
      Price filters mirror production; airline/bag filters, the date strip, and
      fare-tier compare are labeled concept. Switch palette + light/dark from the
      header theme control.
    </div>

    <FlightResultsSample />
  </>
));

export const head: DocumentHead = {
  title: "Flight Results Sample (dev) | Andacity",
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    {
      name: "description",
      content:
        "Internal flight route results page design sample built on the --ui-* system. Not a production page.",
    },
  ],
};
