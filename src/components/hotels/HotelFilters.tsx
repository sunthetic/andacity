import { component$ } from "@builder.io/qwik";
import {
  ResultsFilterGroups,
  type ResultsFilterGroup,
} from "~/components/results/ResultsFilterGroups";
import type { BookingVertical } from "~/lib/analytics/booking-telemetry";

export const HotelFilters = component$((props: HotelFiltersProps) => {
  return (
    <ResultsFilterGroups
      groups={props.groups}
      disabled={props.disabled}
      telemetry={props.telemetry}
    />
  );
});

export type HotelFilterGroup = ResultsFilterGroup;

type HotelFiltersProps = {
  groups: HotelFilterGroup[];
  disabled?: boolean;
  telemetry?: {
    vertical: BookingVertical;
    surface: string;
  };
};
