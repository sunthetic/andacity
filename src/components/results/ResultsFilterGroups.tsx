import { component$ } from "@builder.io/qwik";
import {
  trackBookingEvent,
  type BookingVertical,
} from "~/lib/analytics/booking-telemetry";

export const ResultsFilterGroups = component$(
  (props: ResultsFilterGroupsProps) => {
    return (
      <div class="grid gap-5">
        {props.groups.map((group) => (
          <section key={group.title}>
            <h4 class="inline-flex rounded-full bg-[color:var(--color-route-soft)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-route)]">
              {group.title}
            </h4>
            <div class="mt-2 flex flex-wrap gap-2">
              {group.options.map((option) => (
                <a
                  key={`${group.title}-${option.label}`}
                  href={option.href}
                  onClick$={() => {
                    if (!props.telemetry) return;

                    trackBookingEvent("booking_filter_toggled", {
                      vertical: props.telemetry.vertical,
                      surface: props.telemetry.surface,
                      filter_group: group.title,
                      filter_value: option.telemetryValue || option.label,
                      action: option.active ? "remove" : "add",
                    });
                  }}
                  aria-disabled={props.disabled || undefined}
                  tabIndex={props.disabled ? -1 : undefined}
                  class={[
                    "rounded-full px-3 py-1 text-xs font-semibold shadow-[var(--shadow-sm)] transition",
                    option.active
                      ? "bg-[linear-gradient(135deg,var(--color-action),var(--color-route))] text-white"
                      : "bg-[color:var(--color-surface-1)] text-[color:var(--color-text)] hover:bg-[color:var(--color-highlight-soft)] hover:text-[color:var(--color-highlight)]",
                    props.disabled
                      ? "pointer-events-none cursor-not-allowed opacity-60"
                      : null,
                  ]}
                  aria-current={option.active ? "page" : undefined}
                >
                  {option.label}
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  },
);

export type ResultsFilterOption = {
  label: string;
  href: string;
  active?: boolean;
  telemetryValue?: string;
};

export type ResultsFilterGroup = {
  title: string;
  options: ResultsFilterOption[];
};

export type ResultsFilterChip = {
  label: string;
  href: string;
};

type ResultsFilterGroupsProps = {
  groups: ResultsFilterGroup[];
  disabled?: boolean;
  telemetry?: {
    vertical: BookingVertical;
    surface: string;
  };
};

export const buildResultsFilterChips = (
  groups: ResultsFilterGroup[],
): ResultsFilterChip[] => {
  return groups.flatMap((group) =>
    group.options
      .filter((option) => option.active)
      .map((option) => ({
        label: `${group.title}: ${option.label}`,
        href: option.href,
      })),
  );
};
