import { component$ } from "@builder.io/qwik";
import { ResultsShellLoadingState } from "~/components/search/results/ResultsShellLoadingState";
import type { FlightResultsLoadingStateModel } from "~/types/search-ui";

export const FlightResultsLoadingState = component$((props: FlightResultsLoadingStateProps) => {
  return (
    <ResultsShellLoadingState
      title={props.model.title}
      description={props.model.description}
      placeholderCount={props.model.placeholderCount}
      variant="list"
    />
  );
});

type FlightResultsLoadingStateProps = {
  model: FlightResultsLoadingStateModel;
};
