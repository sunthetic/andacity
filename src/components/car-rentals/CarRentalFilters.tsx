import { component$ } from "@builder.io/qwik";
import {
  ResultsFilterGroups,
  type ResultsFilterGroup,
} from "~/components/results/ResultsFilterGroups";

export const CarRentalFilters = component$((props: CarRentalFiltersProps) => {
  return <ResultsFilterGroups groups={props.groups} disabled={props.disabled} />;
});

export type CarRentalFilterGroup = ResultsFilterGroup;

type CarRentalFiltersProps = {
  groups: CarRentalFilterGroup[];
  disabled?: boolean;
};
