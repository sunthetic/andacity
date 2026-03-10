import { component$ } from "@builder.io/qwik";
import {
  ResultsFilterGroups,
  type ResultsFilterGroup,
} from "~/components/results/ResultsFilterGroups";

export const HotelFilters = component$((props: HotelFiltersProps) => {
  return <ResultsFilterGroups groups={props.groups} disabled={props.disabled} />;
});

export type HotelFilterGroup = ResultsFilterGroup;

type HotelFiltersProps = {
  groups: HotelFilterGroup[];
  disabled?: boolean;
};
