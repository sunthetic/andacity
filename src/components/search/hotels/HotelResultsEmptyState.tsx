import { component$ } from "@builder.io/qwik";
import { ResultsEmpty } from "~/components/results/ResultsEmpty";
import type { HotelResultsEmptyStateModel } from "~/types/search-ui";

export const HotelResultsEmptyState = component$((props: HotelResultsEmptyStateProps) => {
  return (
    <ResultsEmpty
      title={props.model.title}
      description={props.model.description}
      primaryAction={props.model.primaryAction}
      secondaryAction={props.model.secondaryAction}
    />
  );
});

type HotelResultsEmptyStateProps = {
  model: HotelResultsEmptyStateModel;
};
