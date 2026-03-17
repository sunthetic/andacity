import { component$ } from "@builder.io/qwik";
import { CarResultsEmptyState } from "~/components/search/cars/CarResultsEmptyState";
import { CarResultsErrorState } from "~/components/search/cars/CarResultsErrorState";
import { CarResultsList } from "~/components/search/cars/CarResultsList";
import { CarResultsLoadingState } from "~/components/search/cars/CarResultsLoadingState";
import { CarSearchSummary } from "~/components/search/cars/CarSearchSummary";
import type { CarResultsRendererModel } from "~/types/search-ui";

export const CarResultsRenderer = component$((props: CarResultsRendererProps) => {
  if (props.model.state === "loading") {
    return <CarResultsLoadingState model={props.model.loading} />;
  }

  if (props.model.state === "error") {
    return <CarResultsErrorState model={props.model.error} />;
  }

  return (
    <div class="grid gap-6">
      <CarSearchSummary summary={props.model.summary} />

      {props.model.state === "partial" ? (
        <div class="rounded-3xl border border-[color:var(--color-border)] bg-white/90 px-5 py-4 text-sm text-[color:var(--color-text-muted)] shadow-[var(--shadow-soft)]">
          <p class="font-semibold text-[color:var(--color-text)]">{props.model.loading.title}</p>
          <p class="mt-1">{props.model.loading.description}</p>
        </div>
      ) : null}

      {props.model.state === "empty" ? (
        <CarResultsEmptyState model={props.model.empty} />
      ) : (
        <CarResultsList cards={props.model.cards} />
      )}
    </div>
  );
});

type CarResultsRendererProps = {
  model: CarResultsRendererModel;
};
