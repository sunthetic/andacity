import { component$ } from "@builder.io/qwik";
import { ResultsShellLoadingState } from "~/components/search/results/ResultsShellLoadingState";
import type { HotelResultsLoadingStateModel } from "~/types/search-ui";

export const HotelResultsLoadingState = component$((props: HotelResultsLoadingStateProps) => {
  return (
    <ResultsShellLoadingState
      title={props.model.title}
      description={props.model.description}
      placeholderCount={props.model.placeholderCount}
      variant="list"
    />
  );
});

type HotelResultsLoadingStateProps = {
  model: HotelResultsLoadingStateModel;
};
