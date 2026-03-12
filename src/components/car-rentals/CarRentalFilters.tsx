import { component$ } from "@builder.io/qwik";
import {
  ResultsFilterGroups,
  type ResultsFilterGroup,
} from "~/components/results/ResultsFilterGroups";
import type { BookingVertical } from "~/lib/analytics/booking-telemetry";

export const CarRentalFilters = component$((props: CarRentalFiltersProps) => {
  return (
    <ResultsFilterGroups
      groups={props.groups}
      disabled={props.disabled}
      telemetry={props.telemetry}
    />
  );
});

export type CarRentalFilterGroup = ResultsFilterGroup;

type CarRentalFiltersProps = {
  groups: CarRentalFilterGroup[];
  disabled?: boolean;
  telemetry?: {
    vertical: BookingVertical;
    surface: string;
  };
};
