import { component$ } from "@builder.io/qwik";
import { ResultsEmpty } from "~/components/results/ResultsEmpty";
import type { FlightResultsEmptyStateModel } from "~/types/search-ui";

export const FlightResultsEmptyState = component$((props: FlightResultsEmptyStateProps) => {
  return (
    <ResultsEmpty
      title={props.model.title}
      description={props.model.description}
      primaryAction={props.model.primaryAction}
      secondaryAction={props.model.secondaryAction}
    />
  );
});

type FlightResultsEmptyStateProps = {
  model: FlightResultsEmptyStateModel;
};
