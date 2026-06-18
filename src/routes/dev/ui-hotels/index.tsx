/**
 * CLAUDE-UI-007 — Hotels landing page sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production host
 * (gated on the real request host, matching /dev/ui-palettes, /dev/ui-shell,
 * and /dev/ui-home). Renders a premium, search-forward, photography-first hotels
 * landing sample built on the `--ui-*` foundation + CLAUDE-UI-002 primitives,
 * inside the production global shell (SiteHeader/SiteFooter from the root layout).
 *
 * It does NOT replace the production hotels page (src/routes/hotels/index.tsx).
 * Approval gate: see docs/ui-redesign/samples/HOTELS_SAMPLE.md. Next: CLAUDE-UI-008.
 */
import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { shouldIndex } from "~/lib/seo/env";
import { HotelsSample } from "~/components/dev/hotels/HotelsSample";
import { EmptyState } from "~/components/ui/EmptyState";
import { SkeletonResults } from "~/components/ui/Skeleton";

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, "Not found");
  headers.set("x-robots-tag", "noindex, nofollow");
};

export default component$(() => (
  <>
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      ⚠ Hotels landing sample — CLAUDE-UI-007. Not production. noindex ·
      prod-gated. The production header/footer (the new shell) wrap this sample
      body. Switch palette + light/dark from the header theme control.
    </div>

    <HotelsSample />

    {/* Loading & empty state references (design states, not part of the page flow) */}
    <div style="background:var(--ui-bg);color:var(--ui-text)">
      <div class="mx-auto max-w-6xl px-4 py-10">
        <p
          class="text-[11px] font-bold uppercase tracking-[0.14em]"
          style="color:var(--ui-text-muted)"
        >
          Design states (reference)
        </p>
        <h2
          class="mt-1 text-xl font-bold"
          style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
        >
          Loading & empty states
        </h2>

        <div class="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <div
              class="mb-2 text-[12px] font-semibold"
              style="color:var(--ui-text-secondary)"
            >
              Loading (skeleton)
            </div>
            <SkeletonResults count={4} />
          </div>
          <div>
            <div
              class="mb-2 text-[12px] font-semibold"
              style="color:var(--ui-text-secondary)"
            >
              No results
            </div>
            <EmptyState
              icon="🏨"
              title="No stays match these filters"
              description="Try widening your dates or removing a filter to see more options in this city."
              primary={{ label: "Clear filters", href: "/hotels" }}
              secondary={{ label: "Browse hotel cities", href: "/hotels/in" }}
            />
          </div>
        </div>
      </div>
    </div>
  </>
));

export const head: DocumentHead = {
  title: "Hotels Landing Sample (dev) | Andacity",
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    {
      name: "description",
      content:
        "Internal hotels landing page design sample built on the new --ui-* system. Not a production page.",
    },
  ],
};
