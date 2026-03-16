import { component$ } from "@builder.io/qwik";
import { FlightEntityErrorState } from "~/components/entities/flights/FlightEntityErrorState";
import { FlightEntitySummary } from "~/components/entities/flights/FlightEntitySummary";
import { FlightEntityUnavailableState } from "~/components/entities/flights/FlightEntityUnavailableState";
import { FlightFareSummary } from "~/components/entities/flights/FlightFareSummary";
import { FlightSegmentList } from "~/components/entities/flights/FlightSegmentList";
import { Page } from "~/components/site/Page";
import { mapFlightEntityPageForUi } from "~/lib/entities/flights/page-model";
import type { BookableEntityPageLoadResult } from "~/types/bookable-entity-route";

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
  const model = mapFlightEntityPageForUi(props.page);

  return (
    <Page breadcrumbs={model.breadcrumbs}>
      <section
        class={[
          "mt-4 rounded-[32px] border px-6 py-7 shadow-[var(--shadow-soft)]",
          headerToneClass(model.header.tone),
        ]}
      >
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-action)]">
          {model.header.badge}
        </p>
        <h1 class="mt-3 max-w-[18ch] text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          {model.header.title}
        </h1>
        <p class="mt-3 max-w-[78ch] text-sm leading-6 text-[color:var(--color-text-muted)] lg:text-base">
          {model.header.description}
        </p>
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

      {!model.errorState && model.summary && model.fareSummary && model.cta ? (
        <section class="mt-6 grid gap-4 xl:grid-cols-[1.65fr,1fr]">
          <FlightEntitySummary summary={model.summary} status={model.status} />
          <FlightFareSummary fare={model.fareSummary} cta={model.cta} />
        </section>
      ) : null}

      {!model.errorState && model.summary && model.segments.length ? (
        <section class="mt-6">
          <FlightSegmentList segments={model.segments} />
        </section>
      ) : null}
    </Page>
  );
});

type FlightEntityPageProps = {
  page: BookableEntityPageLoadResult;
};
