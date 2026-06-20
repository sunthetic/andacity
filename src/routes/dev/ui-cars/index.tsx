/**
 * CLAUDE-UI-017 — Car rentals landing page sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production
 * host (gated on the real request host, matching all other /dev/ui-* routes).
 * Renders a premium, mobility-native car rentals landing concept built on the
 * `--ui-*` foundation + CLAUDE-UI-002 primitives, inside the production global
 * shell (SiteHeader/SiteFooter from the root layout). The search module embeds
 * the REAL CarRentalSearchCard, so submissions follow the genuine canonical
 * car-rental search flow.
 *
 * It does NOT replace the production /car-rentals route.
 * See docs/ui-redesign/samples/CARS_SAMPLE.md for the approval gate.
 * Next (after approval): CLAUDE-UI-018 — Car Rentals Landing Page Implementation.
 */
import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { shouldIndex } from "~/lib/seo/env";
import { CarsLandingSample } from "~/components/dev/cars/CarsLandingSample";

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, "Not found");
  headers.set("x-robots-tag", "noindex, nofollow");
};

export default component$(() => (
  <>
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      ⚠ Car rentals landing sample — CLAUDE-UI-017. Not production. noindex ·
      prod-gated. The production header/footer wrap this sample body. The search
      module is the real car-rental search. Switch palette + light/dark from the
      header theme control.
    </div>

    <CarsLandingSample />
  </>
));

export const head: DocumentHead = {
  title: "Car Rentals Landing Sample (dev) | Andacity",
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    {
      name: "description",
      content:
        "Internal car rentals landing page design sample built on the --ui-* system. Not a production page.",
    },
  ],
};
