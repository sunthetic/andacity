import { component$ } from "@builder.io/qwik";
import {
  ResultsFilterGroups,
  type ResultsFilterGroup,
} from "~/components/results/ResultsFilterGroups";
import type { BookingVertical } from "~/lib/analytics/booking-telemetry";

export const FlightFilters = component$((props: FlightFiltersProps) => {
  return (
    <ResultsFilterGroups
      groups={props.groups}
      disabled={props.disabled}
      telemetry={props.telemetry}
    />
  );
});

export type FlightFilterGroup = ResultsFilterGroup;

type FlightFiltersProps = {
  groups: FlightFilterGroup[];
  disabled?: boolean;
  telemetry?: {
    vertical: BookingVertical;
    surface: string;
  };
};
