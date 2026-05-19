import { component$ } from "@builder.io/qwik";
import { EntitySearchFlowLinks } from "~/components/entities/EntitySearchFlowLinks";
import { FlightEntityErrorState } from "~/components/entities/flights/FlightEntityErrorState";
import { FlightEntitySummary } from "~/components/entities/flights/FlightEntitySummary";
import { FlightEntityUnavailableState } from "~/components/entities/flights/FlightEntityUnavailableState";
import { FlightFareSummary } from "~/components/entities/flights/FlightFareSummary";
import { FlightSegmentList } from "~/components/entities/flights/FlightSegmentList";
import { Page } from "~/components/site/Page";
import { getBookableEntitySearchHref } from "~/lib/entities/routing";
import { mapFlightEntityPageForUi } from "~/lib/entities/flights/page-model";
import type { BookableEntityPageLoadResult } from "~/types/bookable-entity-route";
import type { CanonicalLocation } from "~/types/location";

const headerToneClass = (tone: "neutral" | "warning" | "critical") => {
  if (tone === "critical") {
    return "border-[color:rgba(185,28,28,0.14)] bg-[linear-gradient(135deg,rgba(185,28,28,0.06),rgba(255,255,255,0.96))]";
  }

  if (tone === "warning") {
    return "border-[color:rgba(180,83,9,0.16)] bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0.96))]";
  }

  return "border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(14,116,144,0.08),rgba(255,255,255,0.96))]";
};

export const FlightEntityPage = component$((props: FlightEntityPageProps) => {
  const model = mapFlightEntityPageForUi(props.page, {
    airportLookup: props.airportLookup,
  });
  const entity =
    props.page.kind === "resolved" ||
    props.page.kind === "unavailable" ||
    props.page.kind === "revalidation_required"
      ? props.page.entity
      : null;

  return (
    <Page breadcrumbs={model.breadcrumbs}>
      <div class="t-detail-theme t-detail-theme-flights mx-auto max-w-5xl">
        <section
          class={[
            "mt-4 overflow-hidden rounded-[32px] border px-6 py-7 shadow-[var(--shadow-soft)]",
            headerToneClass(model.header.tone),
          ]}
        >
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-action)]">
            {model.header.badge}
          </p>
          <h1 class="mt-3 max-w-[24ch] text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
            {model.header.title}
          </h1>
          <p class="mt-3 max-w-[78ch] text-sm leading-6 text-[color:var(--color-text-muted)] lg:text-base">
            {model.header.description}
          </p>
          {model.summary ? (
            <div class="mt-6 grid gap-3 rounded-[28px] border border-[color:var(--color-border-default)] bg-[image:var(--detail-route-bg)] p-4 shadow-[var(--shadow-e2)] lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                  Depart
                </p>
                <p class="mt-1 truncate whitespace-nowrap text-[clamp(1.35rem,2.2vw,1.75rem)] font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                  {model.summary.departureTimeLabel}
                </p>
                <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  {model.summary.departureAirportLabel}
                </p>
              </div>

              <div class="flex items-center gap-3 text-[color:var(--color-action)] lg:min-w-52">
                <span class="h-3 w-3 rounded-full bg-[color:var(--color-action)] shadow-[0_0_0_5px_var(--color-action-soft)]" />
                <span class="h-px flex-1 bg-[linear-gradient(90deg,var(--color-action),var(--color-route))]" />
                <span class="rounded-full border border-[color:var(--color-border-default)] bg-white/88 px-3 py-1 text-xs font-semibold text-[color:var(--color-action)] shadow-[var(--shadow-sm)]">
                  {model.summary.durationLabel}
                </span>
                <span class="h-px flex-1 bg-[linear-gradient(90deg,var(--color-route),var(--color-action))]" />
                <span class="h-3 w-3 rounded-full bg-[color:var(--color-route)] shadow-[0_0_0_5px_var(--color-route-soft)]" />
              </div>

              <div class="min-w-0 lg:text-right">
                <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                  Arrive
                </p>
                <p class="mt-1 truncate whitespace-nowrap text-[clamp(1.35rem,2.2vw,1.75rem)] font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                  {model.summary.arrivalTimeLabel}
                </p>
                <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  {model.summary.arrivalAirportLabel}
                </p>
              </div>
            </div>
          ) : null}
          <EntitySearchFlowLinks
            searchHref={getBookableEntitySearchHref("flight")}
          />
        </section>

        {model.errorState ? (
          <section class="mt-6">
            <FlightEntityErrorState state={model.errorState} />
          </section>
        ) : null}

        {!model.errorState && model.unavailableState ? (
          <section class="mt-6">
            <FlightEntityUnavailableState state={model.unavailableState} />
          </section>
        ) : null}

        {!model.errorState &&
        model.summary &&
        model.fareSummary &&
        model.cta &&
        entity ? (
          <section class="mt-6 grid gap-4 lg:grid-cols-[1.5fr,0.95fr]">
            <FlightEntitySummary
              summary={model.summary}
              status={model.status}
            />
            <FlightFareSummary
              fare={model.fareSummary}
              cta={model.cta}
              entity={entity}
            />
          </section>
        ) : null}

        {!model.errorState && model.summary && model.segments.length ? (
          <section class="mt-6">
            <FlightSegmentList segments={model.segments} />
          </section>
        ) : null}
      </div>
    </Page>
  );
});

type FlightEntityPageProps = {
  page: BookableEntityPageLoadResult;
  airportLookup?: Record<string, CanonicalLocation | null>;
};
