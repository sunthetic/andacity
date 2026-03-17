import { component$ } from "@builder.io/qwik";
import { HotelResultsEmptyState } from "~/components/search/hotels/HotelResultsEmptyState";
import { HotelResultsErrorState } from "~/components/search/hotels/HotelResultsErrorState";
import { HotelResultsList } from "~/components/search/hotels/HotelResultsList";
import { HotelResultsLoadingState } from "~/components/search/hotels/HotelResultsLoadingState";
import { HotelSearchSummary } from "~/components/search/hotels/HotelSearchSummary";
import type { HotelResultsRendererModel } from "~/types/search-ui";

export const HotelResultsRenderer = component$((props: HotelResultsRendererProps) => {
  if (props.model.state === "loading") {
    return <HotelResultsLoadingState model={props.model.loading} />;
  }

  if (props.model.state === "error") {
    return <HotelResultsErrorState model={props.model.error} />;
  }

  return (
    <div class="grid gap-6">
      <HotelSearchSummary summary={props.model.summary} />

      {props.model.state === "partial" ? (
        <div class="rounded-3xl border border-[color:var(--color-border)] bg-white/90 px-5 py-4 text-sm text-[color:var(--color-text-muted)] shadow-[var(--shadow-soft)]">
          <p class="font-semibold text-[color:var(--color-text)]">{props.model.loading.title}</p>
          <p class="mt-1">{props.model.loading.description}</p>
        </div>
      ) : null}

      {props.model.state === "empty" ? (
        <HotelResultsEmptyState model={props.model.empty} />
      ) : (
        <HotelResultsList cards={props.model.cards} />
      )}
    </div>
  );
});

type HotelResultsRendererProps = {
  model: HotelResultsRendererModel;
};
