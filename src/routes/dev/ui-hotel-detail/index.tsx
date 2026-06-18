/**
 * CLAUDE-UI-009 — Hotel detail page sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production host
 * (gated on the real request host, matching the other /dev/ui-* previews).
 * Renders a premium, media-first hotel detail sample built on the `--ui-*`
 * foundation + CLAUDE-UI-002 primitives, inside the production global shell.
 *
 * All hotel content is ILLUSTRATIVE (fictional property, sample rooms/rates/
 * prices/rating). It does NOT replace the production hotel detail page
 * (src/routes/hotels/[slug]/index.tsx). Approval gate: see
 * docs/ui-redesign/samples/HOTEL_DETAIL_SAMPLE.md. Next: CLAUDE-UI-010.
 */
import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { shouldIndex } from "~/lib/seo/env";
import { HotelDetailSample } from "~/components/dev/hotel-detail/HotelDetailSample";
import { EmptyState } from "~/components/ui/EmptyState";
import { SkeletonCard, SkeletonLine } from "~/components/ui/Skeleton";

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, "Not found");
  headers.set("x-robots-tag", "noindex, nofollow");
};

/** Loading skeleton concept (gallery + content + rail). */
const DetailSkeleton = component$(() => (
  <div
    class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"
    role="status"
    aria-label="Loading hotel"
  >
    <div class="min-w-0">
      <div class="grid gap-2 lg:grid-cols-[1.7fr_1fr]">
        <div
          class="ui-skeleton h-60 sm:h-80 lg:h-[26rem]"
          style="background:var(--ui-surface-muted);border-radius:var(--ui-radius)"
        />
        <div class="hidden grid-cols-2 grid-rows-2 gap-2 lg:grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              class="ui-skeleton h-[12.6rem]"
              style="background:var(--ui-surface-muted);border-radius:var(--ui-radius)"
            />
          ))}
        </div>
      </div>
      <div class="mt-6 flex flex-col gap-2">
        <SkeletonLine w="40%" h="1.5rem" />
        <SkeletonLine w="80%" />
        <SkeletonLine w="65%" />
      </div>
      <div class="mt-6 flex flex-col gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
    <div
      class="ui-skeleton h-80"
      style="background:var(--ui-surface-muted);border-radius:var(--ui-radius-lg)"
    />
  </div>
));

export default component$(() => (
  <>
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      ⚠ Hotel detail sample — CLAUDE-UI-009. Not production. noindex ·
      prod-gated. Hotel, rooms, rates, prices, and rating are{" "}
      <em>illustrative sample data</em>. Switch palette + light/dark from the
      header theme control.
    </div>

    <HotelDetailSample />

    {/* Design states (reference) — not part of the page flow */}
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
          Loading state
        </h2>
        <div class="mt-4">
          <DetailSkeleton />
        </div>

        <h2
          class="mt-10 text-xl font-bold"
          style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
        >
          Fallback state (incomplete or unavailable hotel)
        </h2>
        <div class="mt-4">
          <EmptyState
            icon="🏨"
            title="We couldn’t load this stay"
            description="The hotel details are temporarily unavailable. Try again, or keep comparing nearby stays."
            primary={{ label: "Retry", href: "/dev/ui-hotel-detail" }}
            secondary={{
              label: "Browse Miami hotels",
              href: "/hotels/in/miami",
            }}
          />
        </div>
      </div>
    </div>
  </>
));

export const head: DocumentHead = {
  title: "Hotel Detail Sample (dev) | Andacity",
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    {
      name: "description",
      content:
        "Internal hotel detail page design sample built on the new --ui-* system. Illustrative data. Not a production page.",
    },
  ],
};
