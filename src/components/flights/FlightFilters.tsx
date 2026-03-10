import { component$ } from "@builder.io/qwik";
import {
  ResultsFilterGroups,
  type ResultsFilterGroup,
} from "~/components/results/ResultsFilterGroups";

export const FlightFilters = component$((props: FlightFiltersProps) => {
  return <ResultsFilterGroups groups={props.groups} disabled={props.disabled} />;
});

export type FlightFilterGroup = ResultsFilterGroup;

type FlightFiltersProps = {
  groups: FlightFilterGroup[];
  disabled?: boolean;
};
