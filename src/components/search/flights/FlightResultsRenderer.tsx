import { component$ } from "@builder.io/qwik";
import { FlightResultsEmptyState } from "~/components/search/flights/FlightResultsEmptyState";
import { FlightResultsErrorState } from "~/components/search/flights/FlightResultsErrorState";
import { FlightResultsList } from "~/components/search/flights/FlightResultsList";
import { FlightResultsLoadingState } from "~/components/search/flights/FlightResultsLoadingState";
import { FlightSearchSummary } from "~/components/search/flights/FlightSearchSummary";
import type { FlightResultsRendererModel } from "~/types/search-ui";

export const FlightResultsRenderer = component$((props: FlightResultsRendererProps) => {
  if (props.model.state === "loading") {
    return <FlightResultsLoadingState model={props.model.loading} />;
  }

  if (props.model.state === "error") {
    return <FlightResultsErrorState model={props.model.error} />;
  }

  return (
    <div class="grid gap-6">
      <FlightSearchSummary summary={props.model.summary} />

      {props.model.state === "partial" ? (
        <div class="rounded-3xl border border-[color:var(--color-border)] bg-white/90 px-5 py-4 text-sm text-[color:var(--color-text-muted)] shadow-[var(--shadow-soft)]">
          <p class="font-semibold text-[color:var(--color-text)]">{props.model.loading.title}</p>
          <p class="mt-1">{props.model.loading.description}</p>
        </div>
      ) : null}

      {props.model.state === "empty" ? (
        <FlightResultsEmptyState model={props.model.empty} />
      ) : (
        <FlightResultsList cards={props.model.cards} />
      )}
    </div>
  );
});

type FlightResultsRendererProps = {
  model: FlightResultsRendererModel;
};
