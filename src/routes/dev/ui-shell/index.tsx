/**
 * CLAUDE-UI-003 — Global shell sample preview route.
 *
 * DEV / DESIGN-SAMPLE ONLY: `noindex, nofollow` and 404s on the production host
 * (gated on the real request host, matching /dev/ui-palettes). Demonstrates a
 * sample global shell (header, nav, mobile nav, search, theme control, footer)
 * built on the `--ui-*` foundation. Does NOT replace the production shell.
 *
 * The route still renders inside the production root layout, so the current
 * production SiteHeader/SiteFooter appear around this page — useful for direct
 * contrast with the sample shell below.
 */
import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { shouldIndex } from "~/lib/seo/env";
import { SampleHeader } from "~/components/dev/shell/SampleHeader";
import { SampleFooter } from "~/components/dev/shell/SampleFooter";
import { SampleMobileShell } from "~/components/dev/shell/SampleMobileShell";
import { PageShell } from "~/components/ui/PageShell";
import { HeroSection } from "~/components/ui/HeroSection";
import { SearchPanel } from "~/components/ui/SearchPanel";
import { ResponsiveSection } from "~/components/ui/ResponsiveSection";
import { HotelCard } from "~/components/ui/HotelCard";
import { FlightCard } from "~/components/ui/FlightCard";
import { CarCard } from "~/components/ui/CarCard";
import { DestinationCard } from "~/components/ui/DestinationCard";
import { Button } from "~/components/ui/Button";

export const onRequest: RequestHandler = ({ url, headers, error }) => {
  if (shouldIndex(url)) throw error(404, "Not found");
  headers.set("x-robots-tag", "noindex, nofollow");
};

const SEARCH_FIELDS = [
  { label: "Where to", value: "Lisbon, Portugal" },
  { label: "Dates", value: "Jun 14 – 20" },
  { label: "Travelers", value: "2 adults" },
];
const HOTEL = { name: "Memmo Alfama", area: "Alfama", rating: 9.4, reviewCount: 1204, stars: 5, priceTotal: "$612", priceQualifier: "Total · 3 nights", badges: ["Free cancellation"] };
const FLIGHT = { airline: "TAP Air", duration: "6h 40m", stops: "Nonstop", departTime: "07:20", departCode: "JFK", arriveTime: "19:00", arriveCode: "LIS", price: "$486" };
const CAR = { name: "Intermediate SUV", spec: "Auto · 5 seats", pickup: "LIS Airport", pricePerDay: "$41" };
const DEST = { name: "Lisbon", meta: "From $480 · 6h flights", tag: "Trending" };

/** Tall sample page body so the sticky/condense header behavior is visible. */
const SampleBody = component$(() => (
  <>
    <HeroSection
      eyebrow="Plan the whole trip"
      title="Calm confidence for the whole trip"
      subtitle="Flights, stays, and cars in one place — fast to search, easy to trust."
    >
      <SearchPanel fields={SEARCH_FIELDS} actionLabel="Search" />
    </HeroSection>

    <div class="mx-auto max-w-6xl px-4">
      <ResponsiveSection eyebrow="Featured" title="Stays travelers love this week" container={false}>
        <div q:slot="action">
          <Button variant="ghost" size="sm" label="View all" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HotelCard model={HOTEL} />
          <FlightCard model={FLIGHT} />
          <CarCard model={CAR} />
          <DestinationCard model={DEST} />
        </div>
      </ResponsiveSection>

      <ResponsiveSection eyebrow="Discover" title="Where to next" container={false}>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DestinationCard model={{ name: "Porto", meta: "From $410 · wine country", tag: "Editor’s pick" }} />
          <DestinationCard model={{ name: "Barcelona", meta: "From $520 · beach + city" }} />
          <DestinationCard model={{ name: "Marrakech", meta: "From $640 · warm escape" }} />
        </div>
      </ResponsiveSection>
    </div>
  </>
));

const Phone = component$((props: { label: string; open?: boolean }) => (
  <div>
    <div class="mb-2 text-center text-[12px] font-bold uppercase tracking-wide text-neutral-500">{props.label}</div>
    <div class="mx-auto w-[300px] rounded-[32px] bg-neutral-900 p-3 shadow-2xl">
      <div class="h-[560px] overflow-hidden rounded-[24px]">
        <SampleMobileShell open={props.open} />
      </div>
    </div>
  </div>
));

export default component$(() => (
  <div class="bg-neutral-100">
    <div class="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900">
      ⚠ Global shell sample — CLAUDE-UI-003. Not production. noindex · prod-gated.
      The bar at the very top of the window is the <em>current</em> production header (for contrast); the sample shell is below.
    </div>

    <div class="mx-auto max-w-6xl px-4 pt-8">
      <h1 class="text-3xl font-extrabold tracking-tight text-neutral-900">Andacity — Global Shell Sample</h1>
      <p class="mt-2 max-w-[72ch] text-sm text-neutral-600">
        A premium, calm, fast shell built on the new <code class="rounded bg-neutral-200 px-1 text-[12px]">--ui-*</code>
        foundation. Use the theme control in the sample header to switch palette + light/dark live. Resize the window to
        see desktop → tablet → mobile behavior; phone frames below show the mobile header and open menu. See
        <code class="mx-1 rounded bg-neutral-200 px-1.5 py-0.5 text-[12px]">docs/ui-redesign/samples/GLOBAL_SHELL_SAMPLE.md</code>.
      </p>
    </div>

    {/* Live sample shell — sits just below the production header; scroll to see condense */}
    <section class="mx-auto mt-6 max-w-6xl px-4">
      <div class="mb-2 text-[12px] font-bold uppercase tracking-wide text-neutral-500">
        Live shell (scroll to see the header condense)
      </div>
      <div class="overflow-hidden rounded-2xl ring-1 ring-black/10">
        <PageShell>
          <SampleHeader stickyTop="var(--app-header-height)" />
          <SampleBody />
          <SampleFooter />
        </PageShell>
      </div>
    </section>

    {/* Mobile frames */}
    <section class="mx-auto mt-12 max-w-6xl px-4">
      <div class="mb-4 text-[12px] font-bold uppercase tracking-wide text-neutral-500">Mobile shell</div>
      <div class="grid justify-items-center gap-8 sm:grid-cols-2">
        <Phone label="Header collapsed" />
        <Phone label="Menu open" open />
      </div>
      <p class="mx-auto mt-4 max-w-[60ch] text-center text-[12px] text-neutral-500">
        Tablet behavior sits between these: the desktop nav persists, the search pill collapses to an icon, and Trips
        stays visible. Resize the live shell above to ~768–1024px to see it.
      </p>
    </section>

    <footer class="mx-auto max-w-6xl px-4 py-12 text-[12px] text-neutral-500">
      CLAUDE-UI-003 · global shell sample · no production shell replaced · next: CLAUDE-UI-004 (Global Shell Implementation) after approval.
    </footer>
  </div>
));

export const head: DocumentHead = {
  title: "Global Shell Sample (dev) | Andacity",
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    { name: "description", content: "Internal global shell design sample. Not a production page." },
  ],
};
