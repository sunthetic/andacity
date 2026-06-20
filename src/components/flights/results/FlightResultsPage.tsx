/**
 * CLAUDE-UI-016 — production flight route results page on the `--ui-*` system.
 *
 * Full page body (no <main> — root layout provides it). Replaces the legacy
 * Page + CanonicalFlightResultsSection + FlightResultsRenderer combination.
 *
 * All progressive-loading, filter, sort, and empty-state behavior is preserved
 * via FlightResultsSection (which replicates the CanonicalFlightResultsSection
 * logic on --ui-* tokens). Error/loading states are handled inline here with
 * --ui-* styling.
 *
 * Fare safety: no fake fares, urgency, seat counts, partnership, or guarantees.
 * All CTA hrefs come from the real FlightResultCardModel.ctaHref.
 */
import { component$ } from "@builder.io/qwik";
import { Button } from "~/components/ui/Button";
import { FlightResultsSection } from "~/components/flights/results/FlightResultsSection";
import { TRIP_HANDOFF_ITEMS } from "~/components/flights/results/flightResultsData";
import { buildFlightSearchEditorHref } from "~/components/search/flights/flightResultsRendererModel";
import type { CanonicalFlightSearchPageResult } from "~/server/search/loadCanonicalFlightSearchPage";
import type { FlightResultsRendererModel } from "~/types/search-ui";

const HEADING_FONT = "'Lexend Variable',var(--system-font-family)";

/* ------------------------------------------------------------------ */
/* Route header                                                       */
/* ------------------------------------------------------------------ */

const FlightRouteHeader = component$((props: FlightRouteHeaderProps) => (
  <section
    id="route-header"
    class="relative isolate overflow-hidden"
    style="background-image:var(--ui-hero)"
    aria-label={`Flight results for ${props.originCode} to ${props.destinationCode}`}
  >
    <div
      class="absolute inset-0 -z-10"
      style="background-image:var(--ui-hero-scrim)"
      aria-hidden="true"
    />

    <div class="mx-auto max-w-6xl px-4 pt-8 pb-7 md:pt-10 md:pb-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" class="mb-4">
        <ol
          class="flex flex-wrap items-center gap-2 text-[12px]"
          style="color:rgba(255,255,255,0.72)"
        >
          <li class="flex items-center gap-2">
            <a
              href="/"
              class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Home
            </a>
            <span aria-hidden="true">/</span>
          </li>
          <li class="flex items-center gap-2">
            <a
              href="/flights"
              class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Flights
            </a>
            <span aria-hidden="true">/</span>
          </li>
          <li aria-current="page" style="color:rgba(255,255,255,0.95)">
            {props.originCode} → {props.destinationCode}
          </li>
        </ol>
      </nav>

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style="background:rgba(255,255,255,0.16);color:#fff;border:1px solid rgba(255,255,255,0.26)"
            >
              {props.tripTypeLabel}
            </span>
            <span class="text-[12px]" style="color:rgba(255,255,255,0.82)">
              {props.departDateLabel}
              {props.returnDateLabel ? ` – ${props.returnDateLabel}` : null}
            </span>
          </div>

          <h1
            class="mt-2 text-3xl font-bold leading-[1.05] md:text-4xl"
            style={`color:#fff;font-family:${HEADING_FONT}`}
          >
            {props.originCode}
            <span aria-hidden="true" style="color:rgba(255,255,255,0.6)"> → </span>
            {props.destinationCode}
          </h1>

          <p class="mt-2 text-sm" style="color:rgba(255,255,255,0.88)">
            {props.resultCount != null
              ? `${props.resultCount.toLocaleString("en-US")} options · `
              : null}
            taxes and carrier fees included in every total.
          </p>
        </div>

        <a
          href={props.editSearchHref}
          class="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style="background:rgba(255,255,255,0.16);color:#fff;border:1px solid rgba(255,255,255,0.3);min-height:44px"
        >
          Edit search
        </a>
      </div>
    </div>
  </section>
));

type FlightRouteHeaderProps = {
  originCode: string;
  destinationCode: string;
  tripTypeLabel: string;
  departDateLabel: string;
  returnDateLabel?: string | null;
  resultCount?: number | null;
  editSearchHref: string;
};

/* ------------------------------------------------------------------ */
/* Loading state                                                      */
/* ------------------------------------------------------------------ */

const LoadingState = component$((props: { title: string; description: string }) => (
  <div class="mx-auto max-w-6xl px-4 py-10">
    <div
      class="py-10 text-center"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
    >
      <div
        class="mx-auto size-10 animate-pulse rounded-full text-[14px] flex items-center justify-center"
        style="background:var(--ui-accent-soft);color:var(--ui-accent)"
        aria-hidden="true"
      >
        ✈
      </div>
      <h2
        class="mt-4 text-base font-bold"
        style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
      >
        {props.title}
      </h2>
      <p class="mx-auto mt-2 max-w-[40ch] text-sm" style="color:var(--ui-text-muted)">
        {props.description}
      </p>

      {/* Skeleton rows */}
      <div class="mx-auto mt-6 max-w-2xl space-y-3 text-left" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            class="animate-pulse flex items-center gap-4 rounded-xl p-4"
            style="background:var(--ui-surface-muted)"
          >
            <div class="size-9 shrink-0 rounded-full" style="background:var(--ui-surface)" />
            <div class="flex-1 space-y-2">
              <div class="h-3 rounded" style="background:var(--ui-surface);width:55%" />
              <div class="h-2.5 rounded" style="background:var(--ui-surface);width:40%" />
            </div>
            <div class="h-7 w-16 rounded" style="background:var(--ui-surface)" />
          </div>
        ))}
      </div>
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Error state                                                        */
/* ------------------------------------------------------------------ */

const ErrorState = component$(
  (props: {
    title: string;
    description: string;
    retryHref: string;
    retryLabel: string;
    backToSearchHref: string;
    backToSearchLabel: string;
  }) => (
    <div class="mx-auto max-w-6xl px-4 py-10">
      <section
        class="p-6"
        role="alert"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
      >
        <h2
          class="text-xl font-bold"
          style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
        >
          {props.title}
        </h2>
        <p class="mt-2 max-w-[64ch] text-sm" style="color:var(--ui-text-muted)">
          {props.description}
        </p>
        <div class="mt-5 flex flex-wrap gap-3">
          <a
            href={props.retryHref}
            class="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style="background:var(--ui-primary);color:var(--ui-on-primary)"
          >
            {props.retryLabel}
          </a>
          <a
            href={props.backToSearchHref}
            class="inline-flex items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style="border-color:var(--ui-border);color:var(--ui-text-secondary)"
          >
            {props.backToSearchLabel}
          </a>
        </div>
      </section>
    </div>
  ),
);

/* ------------------------------------------------------------------ */
/* Whole-trip handoff                                                 */
/* ------------------------------------------------------------------ */

const WholeTripHandoff = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-9"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2
      class="text-xl font-bold"
      style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
    >
      Picked a flight? Build the rest of the trip.
    </h2>
    <p class="mt-1 max-w-[60ch] text-sm" style="color:var(--ui-text-muted)">
      Add a hotel, a car, and a plan — all in one place.
    </p>

    <div class="mt-5 grid gap-4 sm:grid-cols-3">
      {TRIP_HANDOFF_ITEMS.map((item) => (
        <div
          key={item.title}
          class="flex flex-col p-4"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <div
            class="mb-3 h-20 w-full overflow-hidden"
            style="background-image:var(--ui-hero);border-radius:var(--ui-radius-sm)"
            role="img"
            aria-hidden="true"
          />
          <h3
            class="text-sm font-bold"
            style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
          >
            {item.title}
          </h3>
          <p class="mt-1.5 flex-1 text-[13px]" style="color:var(--ui-text-muted)">
            {item.body}
          </p>
          <div class="mt-3">
            <Button
              variant="secondary"
              size="sm"
              label={item.cta}
              href={item.href}
              ariaLabel={item.cta}
            />
          </div>
        </div>
      ))}
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Mobile sticky edit-search CTA                                      */
/* ------------------------------------------------------------------ */

const MobileEditCta = component$((props: { editSearchHref: string }) => (
  <div
    class="fixed inset-x-0 bottom-0 z-40 lg:hidden"
    style="background:var(--ui-surface);border-top:1px solid var(--ui-border);box-shadow:0 -8px 24px rgba(8,12,22,0.12)"
  >
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
      <div class="min-w-0">
        <div class="text-sm font-semibold" style="color:var(--ui-text)">
          Flight results
        </div>
        <div class="text-[12px]" style="color:var(--ui-text-muted)">
          Taxes &amp; fees included
        </div>
      </div>
      <a
        href={props.editSearchHref}
        class="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
        style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:44px"
      >
        Edit search
      </a>
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Page composition                                                   */
/* ------------------------------------------------------------------ */

export const FlightResultsPage = component$((props: FlightResultsPageProps) => {
  const data = props.data;
  const model = props.rendererModel;

  const request = "request" in data ? data.request : undefined;
  const editSearchHref = buildFlightSearchEditorHref(request);

  const originCode = request?.origin ?? "Origin";
  const destinationCode = request?.destination ?? "Destination";

  const summary = model.state !== "loading" && model.state !== "error" ? model.summary : null;

  const departDateLabel = summary?.departDateLabel ?? (request?.departDate ?? "");
  const returnDateLabel = summary?.returnDateLabel ?? (request?.returnDate ?? null);
  const tripTypeLabel = summary?.tripTypeLabel ?? (request?.returnDate ? "Round-trip" : "One-way");
  const resultCount = summary?.resultCount ?? null;

  const showResults =
    model.state === "results" || model.state === "partial" || model.state === "empty";

  return (
    <div style="background:var(--ui-bg);color:var(--ui-text);font-family:'Poppins',var(--system-font-family)">
      <FlightRouteHeader
        originCode={originCode}
        destinationCode={destinationCode}
        tripTypeLabel={tripTypeLabel}
        departDateLabel={departDateLabel}
        returnDateLabel={returnDateLabel}
        resultCount={resultCount}
        editSearchHref={editSearchHref}
      />

      {model.state === "loading" ? (
        <LoadingState
          title={model.loading.title}
          description={model.loading.description}
        />
      ) : model.state === "error" ? (
        <ErrorState
          title={model.error.title}
          description={model.error.description}
          retryHref={model.error.retryHref}
          retryLabel={model.error.retryLabel}
          backToSearchHref={model.error.backToSearchHref}
          backToSearchLabel={model.error.backToSearchLabel}
        />
      ) : showResults && "results" in data ? (
        <FlightResultsSection
          page={data}
          currentPath={props.currentPath}
          isNavigating={props.isNavigating}
          editSearchHref={editSearchHref}
        />
      ) : null}

      {showResults ? <WholeTripHandoff /> : null}

      {/* Spacer for mobile sticky CTA */}
      <div class="h-20 lg:hidden" />
      <MobileEditCta editSearchHref={editSearchHref} />
    </div>
  );
});

type FlightResultsPageProps = {
  data: CanonicalFlightSearchPageResult;
  rendererModel: FlightResultsRendererModel;
  currentPath: string;
  isNavigating: boolean;
};
