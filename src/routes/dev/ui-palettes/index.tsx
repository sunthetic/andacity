/**
 * CLAUDE-UI-001 — Palette + Visual Direction preview route.
 *
 * DEV / DESIGN-PREVIEW ONLY. This route:
 *   - is `noindex, nofollow` (x-robots-tag + robots meta), and
 *   - 404s on the production host (any host `shouldIndex` treats as live),
 * so it can never ship publicly. It does not modify any production page,
 * the global shell, or the production token system.
 */
import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { PalettePreview } from "~/components/dev/PalettePreview";
import { shouldIndex } from "~/lib/seo/env";

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  // Gate on the actual incoming request host, not `getPublicBaseUrl`/
  // `PUBLIC_BASE_URL` — dev and staging intentionally set that env var to
  // https://andacity.com for canonical-URL generation, which would make
  // this route 404 itself everywhere except real production.
  if (shouldIndex(url)) {
    throw error(404, "Not found");
  }

  headers.set("x-robots-tag", "noindex, nofollow");
};

export default component$(() => <PalettePreview />);

export const head: DocumentHead = {
  title: "Palette Preview (dev) | Andacity",
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    {
      name: "description",
      content:
        "Internal design-direction preview for the Andacity UI reimagination. Not a production page.",
    },
  ],
};
