/**
 * CLAUDE-UI-001 / CLAUDE-UI-002 — Palette + UI-system preview.
 *
 * DEV / DESIGN-PREVIEW ONLY. Not a production surface. Demonstrates the new
 * `--ui-*` theme system and shared primitives across all 12 theme states
 * (6 palettes x light/dark), plus a live, theme-switchable composition driven
 * by the visitor-facing ThemeController.
 *
 * Rendered by the noindex, prod-gated route at /dev/ui-palettes.
 */
import { component$ } from "@builder.io/qwik";
import { PALETTES, type PaletteId, type ThemeMode } from "~/lib/ui-theme/theme";
import { ThemeController } from "~/components/ui/theme/ThemeController";
import { PageShell } from "~/components/ui/PageShell";
import { HeroSection } from "~/components/ui/HeroSection";
import { SearchPanel } from "~/components/ui/SearchPanel";
import { ResponsiveSection } from "~/components/ui/ResponsiveSection";
import { HotelCard } from "~/components/ui/HotelCard";
import { FlightCard } from "~/components/ui/FlightCard";
import { CarCard } from "~/components/ui/CarCard";
import { DestinationCard } from "~/components/ui/DestinationCard";
import { TrustStrip } from "~/components/ui/TrustStrip";
import { FilterRail } from "~/components/ui/FilterRail";
import { ResultToolbar } from "~/components/ui/ResultToolbar";
import { ResultCard, ResultFact, ResultPrice } from "~/components/ui/ResultCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { SkeletonResults } from "~/components/ui/Skeleton";
import { Button } from "~/components/ui/Button";

/* ---- sample data -------------------------------------------------- */
const HOTEL = {
  name: "Memmo Alfama",
  area: "Alfama",
  rating: 9.4,
  reviewCount: 1204,
  stars: 5,
  priceTotal: "$612",
  priceQualifier: "Total · 3 nights",
  badges: ["Free cancellation", "Breakfast"],
};
const FLIGHT = {
  airline: "TAP Air",
  duration: "6h 40m",
  stops: "Nonstop",
  departTime: "07:20",
  departCode: "JFK",
  arriveTime: "19:00",
  arriveCode: "LIS",
  price: "$486",
};
const CAR = {
  name: "Intermediate SUV",
  spec: "Auto · 5 seats",
  pickup: "LIS Airport",
  pricePerDay: "$41",
};
const DEST = { name: "Lisbon", meta: "From $480 · 6h flights", tag: "Trending" };
const SEARCH_FIELDS = [
  { label: "Where to", value: "Lisbon, Portugal" },
  { label: "Dates", value: "Jun 14 – 20" },
  { label: "Travelers", value: "2 adults" },
];
const FILTER_GROUPS = [
  {
    title: "Popular",
    options: [
      { label: "Free cancellation", count: 182, checked: true },
      { label: "4+ stars", count: 96 },
      { label: "Breakfast included", count: 64 },
    ],
  },
];

/* ---- shared inline preview chrome (consumes --ui-*) --------------- */
const PreviewHeader = component$((props: { mode: ThemeMode }) => (
  <div
    class="flex items-center justify-between px-5 py-3.5"
    style="background:var(--ui-surface);border-bottom:1px solid var(--ui-border)"
  >
    <div class="flex items-center gap-6">
      <span class="text-lg font-extrabold tracking-tight" style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)">
        Anda<span style="color:var(--ui-primary)">city</span>
      </span>
      <nav class="hidden gap-4 text-[13px] md:flex" style="color:var(--ui-text-muted)">
        <span>Flights</span>
        <span>Hotels</span>
        <span>Cars</span>
        <span>Explore</span>
      </nav>
    </div>
    <div class="flex items-center gap-2">
      <span class="rounded-full px-3 py-1.5 text-[12px] font-semibold" style="border:1px solid var(--ui-border);color:var(--ui-text)">
        Trips
      </span>
      <span class="rounded-full px-3.5 py-1.5 text-[12px] font-semibold" style="background:var(--ui-primary);color:var(--ui-on-primary)">
        {props.mode === "dark" ? "Dark" : "Light"}
      </span>
    </div>
  </div>
));

const PreviewCta = component$(() => (
  <div class="relative overflow-hidden px-6 py-9 text-center" style="background-image:var(--ui-hero)">
    <div class="absolute inset-0" style="background-image:var(--ui-hero-scrim)" />
    <div class="relative">
      <h3 class="text-xl font-bold text-white md:text-2xl" style="font-family:'Lexend Variable',var(--system-font-family)">
        One trip, fully planned.
      </h3>
      <p class="mx-auto mt-1 max-w-[40ch] text-sm text-white/85">
        Save flights, stays, and cars to a single itinerary.
      </p>
      <div class="mt-4 flex justify-center">
        <button
          type="button"
          class="px-5 py-2.5 text-sm font-bold"
          style="background:var(--ui-surface);color:var(--ui-primary);border-radius:var(--ui-radius)"
        >
          Start a trip →
        </button>
      </div>
    </div>
  </div>
));

const PreviewFooter = component$(() => (
  <div class="px-6 py-6" style="background:var(--ui-surface);border-top:1px solid var(--ui-border)">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <span class="text-base font-extrabold" style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)">
          Anda<span style="color:var(--ui-primary)">city</span>
        </span>
        <p class="mt-1 max-w-[28ch] text-[12px]" style="color:var(--ui-text-muted)">
          Find better trips. Book with confidence.
        </p>
      </div>
      <div class="flex gap-10 text-[12px]" style="color:var(--ui-text-muted)">
        <div>
          <div class="font-bold" style="color:var(--ui-text)">Product</div>
          <ul class="mt-1.5 space-y-1"><li>Flights</li><li>Hotels</li><li>Cars</li></ul>
        </div>
        <div>
          <div class="font-bold" style="color:var(--ui-text)">Explore</div>
          <ul class="mt-1.5 space-y-1"><li>Destinations</li><li>City guides</li></ul>
        </div>
      </div>
    </div>
  </div>
));

const PreviewMobile = component$(() => (
  <div class="mx-auto w-[280px] rounded-[30px] p-2.5" style="background:var(--ui-text);box-shadow:var(--ui-shadow-panel)">
    <div class="overflow-hidden rounded-[22px]" style="background:var(--ui-bg)">
      <div class="flex items-center justify-between px-4 py-2.5" style="background:var(--ui-surface);border-bottom:1px solid var(--ui-border)">
        <span class="text-sm font-extrabold" style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)">
          Anda<span style="color:var(--ui-primary)">city</span>
        </span>
        <span style="color:var(--ui-text-muted)">☰</span>
      </div>
      <div class="relative overflow-hidden" style="background-image:var(--ui-hero)">
        <div class="absolute inset-0" style="background-image:var(--ui-hero-scrim)" />
        <div class="relative px-4 py-6">
          <h4 class="max-w-[14ch] text-xl font-bold leading-tight text-white" style="font-family:'Lexend Variable',var(--system-font-family)">
            Where to next?
          </h4>
          <div class="mt-3 flex items-center justify-between p-2" style="background:var(--ui-surface);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-panel)">
            <span class="px-2 text-[12px] font-semibold" style="color:var(--ui-text-muted)">Search destinations</span>
            <span class="grid size-7 place-items-center rounded-full text-[13px]" style="background:var(--ui-primary);color:var(--ui-on-primary)">→</span>
          </div>
        </div>
      </div>
      <div class="p-3">
        <HotelCard model={HOTEL} />
      </div>
    </div>
  </div>
));

/* ---- one full composition (inherits --ui-* from the scope) -------- */
const Composition = component$((props: { mode: ThemeMode }) => (
  <div class="overflow-hidden" style="background:var(--ui-bg)">
    <PreviewHeader mode={props.mode} />

    <HeroSection
      eyebrow="Plan the whole trip"
      title="Calm confidence for the whole trip"
      subtitle="Flights, stays, and cars in one place — with the clarity of a great booking tool and the feel of a great trip."
    >
      <SearchPanel fields={SEARCH_FIELDS} actionLabel="Search" />
    </HeroSection>

    <div class="mx-auto max-w-6xl px-4">
      <ResponsiveSection eyebrow="Cards" title="Result cards" container={false}>
        <div q:slot="action">
          <Button variant="ghost" size="sm" label="View all" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HotelCard model={HOTEL} />
          <FlightCard model={FLIGHT} />
          <CarCard model={CAR} />
          <DestinationCard model={DEST} />
        </div>
        <div class="mt-4">
          <TrustStrip
            items={[
              { label: "Free cancellation" },
              { label: "Total price, no hidden fees" },
              { label: "24/7 support" },
            ]}
          />
        </div>
      </ResponsiveSection>

      <ResponsiveSection eyebrow="Results" title="Results + filters" container={false}>
        <div class="grid gap-3 lg:grid-cols-[220px_1fr]">
          <FilterRail groups={FILTER_GROUPS} priceLabel="Price / night" priceFill={0.62} />
          <div class="flex flex-col gap-3">
            <ResultToolbar
              resultCount="312 stays"
              sortLabel="Best value"
              activeChips={["Free cancellation", "4+ stars"]}
              showFiltersButton
            />
            <ResultCard hasMedia hasFacts hasTrust>
              <div q:slot="media" class="h-full min-h-[10rem]" />
              <div q:slot="identity">
                <div class="text-[12px]" style="color:var(--ui-accent)">★★★★★</div>
                <h3 class="text-base font-bold" style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)">
                  Hotel Avenida Palace
                </h3>
                <p class="text-[12px]" style="color:var(--ui-text-muted)">Baixa · 9.1 Superb (2,031)</p>
              </div>
              <div q:slot="facts" class="grid grid-cols-2 gap-2">
                <ResultFact label="Location" value="Baixa" />
                <ResultFact label="Guest score" value="9.1 / 10" />
                <ResultFact label="Room" value="King · breakfast" />
                <ResultFact label="Policy" value="Free cancellation" />
              </div>
              <div q:slot="price">
                <ResultPrice label="Total · 3 nights" amount="$804" qualifier="$268 / night" />
              </div>
              <div q:slot="action">
                <Button variant="primary" size="sm" full label="View stay" />
              </div>
              <div q:slot="trust">
                <TrustStrip items={[{ label: "Reserve now, pay at stay" }, { label: "Prices confirmed at checkout" }]} />
              </div>
            </ResultCard>
          </div>
        </div>
      </ResponsiveSection>
    </div>

    <PreviewCta />
    <PreviewFooter />
  </div>
));

/* ---- one palette/mode showcase cell ------------------------------- */
const Showcase = component$((props: { palette: PaletteId; mode: ThemeMode }) => {
  const meta = PALETTES.find((p) => p.id === props.palette);
  return (
    <div>
      <div class="mb-2 flex items-center justify-between">
        <span class="text-[13px] font-bold text-neutral-700">
          {meta?.name} · {props.mode === "dark" ? "Dark" : "Light"}
        </span>
        <span class="text-[11px] text-neutral-400">
          data-palette="{props.palette}" data-mode="{props.mode}"
        </span>
      </div>
      <PageShell palette={props.palette} mode={props.mode} class="overflow-hidden rounded-2xl ring-1 ring-black/10">
        <div class="grid gap-6 lg:grid-cols-[1fr_300px]">
          <Composition mode={props.mode} />
          <div class="p-4">
            <div class="mb-2 text-center text-[11px] font-bold uppercase tracking-wide" style="color:var(--ui-text-muted)">
              Mobile
            </div>
            <PreviewMobile />
          </div>
        </div>
      </PageShell>
    </div>
  );
});

/* ---- full preview page ------------------------------------------- */
export const PalettePreview = component$(() => (
  <div class="min-h-screen bg-neutral-100 text-neutral-900">
    <div class="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-100 px-4 py-2 text-[13px] font-semibold text-amber-900">
      <span>⚠ Design-direction preview — CLAUDE-UI-002. Not a production page. noindex · blocked on the production host.</span>
      <span class="font-normal">Use the live switcher below ↓</span>
    </div>

    <header class="mx-auto max-w-5xl px-4 pt-8">
      <h1 class="text-3xl font-extrabold tracking-tight">Andacity — UI System Foundation</h1>
      <p class="mt-2 max-w-[72ch] text-sm text-neutral-600">
        Six selectable palettes × light/dark = 12 theme states, built on the new
        <code class="mx-1 rounded bg-neutral-200 px-1.5 py-0.5 text-[12px]">--ui-*</code>
        token system. <strong>Skyglass Luxe</strong> is the default and appears first;
        <strong> Andacity Meridian</strong> is second. The live section below is driven by the
        visitor-facing <strong>ThemeController</strong> (applied to <code class="rounded bg-neutral-200 px-1 text-[12px]">&lt;html&gt;</code>);
        the matrix beneath shows every state at once. See
        <code class="mx-1 rounded bg-neutral-200 px-1.5 py-0.5 text-[12px]">docs/ui-redesign/UI_SYSTEM_FOUNDATION.md</code>.
      </p>
    </header>

    {/* Live, theme-switchable section */}
    <section class="mx-auto mt-8 max-w-5xl px-4">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border border-b-0 border-neutral-200 bg-white px-4 py-3">
        <div>
          <h2 class="text-lg font-bold">Live theme</h2>
          <p class="text-[12px] text-neutral-500">Switch palette + appearance — applies to this whole document.</p>
        </div>
        <ThemeController align="right" />
      </div>
      <PageShell class="overflow-hidden rounded-b-2xl ring-1 ring-black/10">
        <Composition mode="light" />
        <div class="border-t px-4 py-6" style="border-color:var(--ui-divider)">
          <ResponsiveSection eyebrow="States" title="Loading + empty" container={false}>
            <div class="grid gap-6 lg:grid-cols-2">
              <SkeletonResults count={4} />
              <EmptyState
                title="No stays match those filters"
                description="Try widening your dates or removing a filter to see more results."
                primary={{ label: "Clear filters", href: "#" }}
                secondary={{ label: "Edit search", href: "#" }}
              />
            </div>
          </ResponsiveSection>
        </div>
      </PageShell>
    </section>

    {/* Static 12-state matrix */}
    <main class="mx-auto max-w-5xl space-y-12 px-4 py-12">
      <h2 class="text-xl font-bold">All 12 theme states</h2>
      {PALETTES.map((p) => (
        <section key={p.id} class="space-y-6">
          <div class="border-b border-neutral-200 pb-2">
            <h3 class="text-lg font-bold text-neutral-900">{p.name}</h3>
            <p class="text-[12px] text-neutral-500">
              <span class="italic">“{p.tagline}”</span> · Logo compatibility: {p.logoCompat}
            </p>
          </div>
          <Showcase palette={p.id} mode="light" />
          <Showcase palette={p.id} mode="dark" />
        </section>
      ))}
    </main>

    <footer class="mx-auto max-w-5xl px-4 pb-16 text-[12px] text-neutral-500">
      CLAUDE-UI-002 · UI system foundation · no production page rewritten · next:
      CLAUDE-UI-003 (Global Shell Sample).
    </footer>
  </div>
));
