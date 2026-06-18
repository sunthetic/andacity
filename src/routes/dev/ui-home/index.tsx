/**
 * CLAUDE-UI-005 — Home page sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production host
 * (gated on the real request host, matching /dev/ui-palettes and /dev/ui-shell).
 * Renders a captivating, photography-first, whole-trip home page sample built on
 * the `--ui-*` foundation + CLAUDE-UI-002 primitives, inside the production
 * global shell (SiteHeader/SiteFooter from the root layout).
 *
 * It does NOT replace the production home page (src/routes/index.tsx). Approval
 * gate: see docs/ui-redesign/samples/HOME_PAGE_SAMPLE.md. Next: CLAUDE-UI-006.
 */
import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { shouldIndex } from "~/lib/seo/env";
import { HomeSample } from "~/components/dev/home/HomeSample";

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, "Not found");
  headers.set("x-robots-tag", "noindex, nofollow");
};

export default component$(() => (
  <>
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      ⚠ Home page sample — CLAUDE-UI-005. Not production. noindex · prod-gated.
      The production header/footer (already the new shell) wrap this sample
      body. Switch palette + light/dark from the header theme control.
    </div>
    <HomeSample />
  </>
));

export const head: DocumentHead = {
  title: "Home Page Sample (dev) | Andacity",
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    {
      name: "description",
      content:
        "Internal home page design sample built on the new --ui-* system. Not a production page.",
    },
  ],
};
