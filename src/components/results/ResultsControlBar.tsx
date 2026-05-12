import { component$ } from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { AsyncInlineSpinner } from "~/components/async/AsyncInlineSpinner";
import {
  trackBookingEvent,
  type BookingVertical,
} from "~/lib/analytics/booking-telemetry";
import type { ResultsSortOption } from "~/components/results/ResultsSort";
import type { ResultsFilterChip } from "~/components/results/ResultsFilterGroups";

export const ResultsControlBar = component$((props: ResultsControlBarProps) => {
  const navigate = useNavigate();
  const activeFilterChips = props.activeFilterChips || [];
  const activeSort = props.sortOptions.find((option) => option.active);
  const activeSortValue = activeSort?.value || props.sortOptions[0]?.value || "";
  const activeFilterCount = activeFilterChips.length;

  return (
    <section
      class={["sticky z-20", props.class]}
      style={{ top: "var(--sticky-top-offset)" }}
    >
      <div class="rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(228,233,252,0.72),rgba(224,245,241,0.68))] shadow-[var(--shadow-lg)] backdrop-blur">
        <div class="flex flex-col gap-3 p-3 md:p-4">
          <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div class="flex flex-wrap items-center gap-2 text-sm font-medium text-[color:var(--color-text)]">
              <span>{props.resultCountLabel}</span>
              {props.busy ? (
                <AsyncInlineSpinner compact={true} label="Updating" />
              ) : null}
            </div>

            <div class="flex flex-wrap items-center gap-2">
              {props.onToggleFilters$ ? (
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-white/78 px-3 py-2 text-sm font-medium text-[color:var(--color-text)] shadow-[var(--shadow-sm)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={props.disabled}
                  onClick$={() => {
                    if (props.telemetry) {
                      trackBookingEvent("booking_filter_panel_toggled", {
                        vertical: props.telemetry.vertical,
                        surface: props.telemetry.surface,
                        action: "toggle",
                        active_filter_count: activeFilterCount,
                      });
                    }

                    return props.onToggleFilters$?.();
                  }}
                >
                  <span>Filters</span>
                  {activeFilterCount ? (
                    <span class="rounded-full bg-[color:var(--color-action)] px-2 py-0.5 text-xs text-white">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>
              ) : null}

              {activeFilterCount && props.clearAllHref ? (
                <a
                  href={props.clearAllHref}
                  onClick$={() => {
                    if (!props.telemetry) return;

                    trackBookingEvent("booking_filters_cleared", {
                      vertical: props.telemetry.vertical,
                      surface: props.telemetry.surface,
                      active_filter_count: activeFilterCount,
                    });
                  }}
                  aria-disabled={props.disabled || undefined}
                  tabIndex={props.disabled ? -1 : undefined}
                  class={[
                    "inline-flex items-center rounded-full bg-white/54 px-3 py-2 text-sm font-medium text-[color:var(--color-text-muted)] shadow-[var(--shadow-sm)] transition hover:bg-white hover:text-[color:var(--color-text)]",
                    props.disabled
                      ? "pointer-events-none cursor-not-allowed opacity-60"
                      : null,
                  ]}
                >
                  Clear all
                </a>
              ) : null}

              <label
                for={props.sortId}
                class="text-xs font-medium text-[color:var(--color-text-subtle)]"
              >
                Sort
              </label>
              <select
                id={props.sortId}
                class="min-w-[11rem] rounded-xl bg-white/82 px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_6px_16px_rgba(15,23,42,0.06)] outline-none focus-visible:shadow-[var(--ring-focus)]"
                disabled={props.disabled}
                value={activeSortValue}
                onChange$={(event) => {
                  const nextValue = (event.target as HTMLSelectElement).value;
                  const nextOption = props.sortOptions.find(
                    (option) => option.value === nextValue,
                  );

                  if (nextOption) {
                    const currentHref =
                      window.location.pathname + window.location.search;
                    if (nextOption.href === currentHref) return;

                    if (props.telemetry) {
                      trackBookingEvent("booking_filter_toggled", {
                        vertical: props.telemetry.vertical,
                        surface: props.telemetry.surface,
                        filter_group: "sort",
                        filter_value: nextOption.value,
                        action: "set",
                      });
                    }

                    void navigate(nextOption.href, {
                      replaceState: false,
                      scroll: false,
                    });
                  }
                }}
              >
                {props.sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeFilterCount ? (
            <div class="flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <a
                  key={`${chip.label}-${chip.href}`}
                  href={chip.href}
                  onClick$={() => {
                    if (!props.telemetry) return;

                    trackBookingEvent("booking_filter_toggled", {
                      vertical: props.telemetry.vertical,
                      surface: props.telemetry.surface,
                      filter_group: "active-chip",
                      filter_value: chip.label,
                      action: "remove",
                    });
                  }}
                  aria-disabled={props.disabled || undefined}
                  tabIndex={props.disabled ? -1 : undefined}
                  class={[
                    "inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-[color:var(--color-text)] shadow-[var(--shadow-sm)] transition hover:bg-white",
                    props.disabled
                      ? "pointer-events-none cursor-not-allowed opacity-60"
                      : null,
                  ]}
                  aria-label={`Remove ${chip.label}`}
                >
                  <span>{chip.label}</span>
                  <span aria-hidden="true" class="text-[color:var(--color-text-muted)]">
                    ×
                  </span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
});

type ResultsControlBarProps = {
  resultCountLabel: string;
  sortId: string;
  sortOptions: ResultsSortOption[];
  activeFilterChips?: ResultsFilterChip[];
  clearAllHref?: string;
  onToggleFilters$?: QRL<() => void>;
  busy?: boolean;
  disabled?: boolean;
  class?: string;
  telemetry?: {
    vertical: BookingVertical;
    surface: string;
  };
};
