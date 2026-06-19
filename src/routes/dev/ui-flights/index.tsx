/**
 * CLAUDE-UI-013 — Flights landing page sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production
 * host (gated on the real request host, matching all other /dev/ui-* routes).
 * Renders a premium, flight-native flights landing concept built on the
 * `--ui-*` foundation + CLAUDE-UI-002 primitives, inside the production global
 * shell (SiteHeader/SiteFooter from the root layout). The search module embeds
 * the REAL FlightsSearchCard, so submissions follow the genuine canonical
 * flight search flow.
 *
 * It does NOT replace the production /flights route.
 * See docs/ui-redesign/samples/FLIGHTS_SAMPLE.md for the approval gate.
 * Next (after approval): CLAUDE-UI-014 — Flights Landing Page Implementation.
 */
import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { shouldIndex } from "~/lib/seo/env";
import { FlightsLandingSample } from "~/components/dev/flights/FlightsLandingSample";

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, "Not found");
  headers.set("x-robots-tag", "noindex, nofollow");
};

export default component$(() => (
  <>
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      ⚠ Flights landing sample — CLAUDE-UI-013. Not production. noindex ·
      prod-gated. The production header/footer wrap this sample body. The search
      module is the real flight search. Switch palette + light/dark from the
      header theme control.
    </div>

    <FlightsLandingSample />
  </>
));

export const head: DocumentHead = {
  title: "Flights Landing Sample (dev) | Andacity",
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    {
      name: "description",
      content:
        "Internal flights landing page design sample built on the --ui-* system. Not a production page.",
    },
  ],
};
