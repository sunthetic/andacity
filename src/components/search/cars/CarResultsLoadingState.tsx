import { component$ } from "@builder.io/qwik";
import { ResultsShellLoadingState } from "~/components/search/results/ResultsShellLoadingState";
import type { CarResultsLoadingStateModel } from "~/types/search-ui";

export const CarResultsLoadingState = component$((props: CarResultsLoadingStateProps) => {
  return (
    <ResultsShellLoadingState
      title={props.model.title}
      description={props.model.description}
      placeholderCount={props.model.placeholderCount}
      variant="list"
    />
  );
});

type CarResultsLoadingStateProps = {
  model: CarResultsLoadingStateModel;
};
