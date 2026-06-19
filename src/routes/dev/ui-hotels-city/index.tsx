/**
 * CLAUDE-UI-011 — Hotels by City page sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production
 * host (gated on the real request host, matching all other /dev/ui-* routes).
 * Renders a premium, city-specific, search-forward hotels-by-city concept built
 * on the `--ui-*` foundation + CLAUDE-UI-002 primitives, inside the production
 * global shell (SiteHeader/SiteFooter from the root layout).
 *
 * It does NOT replace the production /hotels/in/[citySlug] route.
 * See docs/ui-redesign/samples/HOTELS_CITY_SAMPLE.md for the approval gate.
 * Next (after approval): CLAUDE-UI-012 — Hotels by City Page Implementation.
 */
import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { shouldIndex } from "~/lib/seo/env";
import { HotelsCitySample } from "~/components/dev/hotels-city/HotelsCitySample";

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, "Not found");
  headers.set("x-robots-tag", "noindex, nofollow");
};

export default component$(() => (
  <>
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      ⚠ Hotels by City sample — CLAUDE-UI-011. Not production. noindex ·
      prod-gated. The production header/footer wrap this sample body. Switch
      palette + light/dark from the header theme control.
    </div>

    <HotelsCitySample />
  </>
));

export const head: DocumentHead = {
  title: "Hotels by City Sample (dev) | Andacity",
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    {
      name: "description",
      content:
        "Internal hotels-by-city page design sample built on the --ui-* system. Not a production page.",
    },
  ],
};
