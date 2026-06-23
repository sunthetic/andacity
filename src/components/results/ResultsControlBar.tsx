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
      <div
        class="rounded-xl backdrop-blur"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-panel)"
      >
        <div class="flex flex-col gap-3 p-3 md:p-4">
          <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div class="flex flex-wrap items-center gap-2 text-sm font-medium">
              <span
                class="rounded-full px-3 py-1.5 text-white"
                style="background:var(--ui-primary);box-shadow:0 8px 18px rgba(0,0,0,0.14)"
              >
                {props.resultCountLabel}
              </span>
              {props.busy ? (
                <AsyncInlineSpinner compact={true} label="Updating" />
              ) : null}
            </div>

            <div class="flex flex-wrap items-center gap-2">
              {props.onToggleFilters$ ? (
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                  style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text);box-shadow:var(--ui-shadow-card)"
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
                    <span
                      class="rounded-full px-2 py-0.5 text-xs text-white"
                      style="background:var(--ui-primary)"
                    >
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
                    "inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition",
                    props.disabled
                      ? "pointer-events-none cursor-not-allowed opacity-60"
                      : null,
                  ]}
                  style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-muted);box-shadow:var(--ui-shadow-card)"
                >
                  Clear all
                </a>
              ) : null}

              <label
                for={props.sortId}
                class="text-xs font-medium"
                style="color:var(--ui-text-muted)"
              >
                Sort
              </label>
              <select
                id={props.sortId}
                class="min-w-[11rem] rounded-xl px-3 py-2 text-sm outline-none"
                style="background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text);box-shadow:var(--ui-shadow-card)"
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
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition",
                    props.disabled
                      ? "pointer-events-none cursor-not-allowed opacity-60"
                      : null,
                  ]}
                  style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text);box-shadow:var(--ui-shadow-card)"
                  aria-label={`Remove ${chip.label}`}
                >
                  <span>{chip.label}</span>
                  <span aria-hidden="true" style="color:var(--ui-text-muted)">
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
