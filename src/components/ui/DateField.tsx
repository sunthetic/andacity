import {
  component$,
  useSignal,
  useVisibleTask$,
  type Signal,
} from "@builder.io/qwik";
import {
  formatDateInput,
  formatIsoDateInputValue,
} from "~/lib/date/formatDateInput";
import {
  parseTypedDate,
  type ParsedTypedDate,
} from "~/lib/date/parseTypedDate";
import { getTodayIsoDate, normalizeIsoDate } from "~/lib/date/validateDate";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export const DateField = component$((props: DateFieldProps) => {
  const fallbackValue = useSignal(normalizeIsoDate(props.initialValue) || "");
  const isoValue = props.value || fallbackValue;
  const displayValue = useSignal(formatIsoDateInputValue(isoValue.value));
  const lastCommittedIso = useSignal(normalizeIsoDate(isoValue.value) || "");
  const pickerOpen = useSignal(false);
  const hasBlurred = useSignal(false);
  const suppressNextBlur = useSignal(false);
  const rootRef = useSignal<HTMLElement>();
  const inputRef = useSignal<HTMLInputElement>();
  const overlayId = props.overlayId || `${props.id}-calendar`;
  const errorId = `${props.id}-error`;
  const minIsoValue = normalizeIsoDate(props.minValue);
  const monthAnchor = useSignal(toMonthAnchor(isoValue.value, minIsoValue));

  const parsed = parseTypedDate(displayValue.value);
  const resolvedIsoValue = getResolvedIsoValue(parsed, minIsoValue);
  const calendarAnchorValue =
    resolvedIsoValue ||
    (parsed.status === "valid" ? parsed.isoValue : isoValue.value);
  const inlineMessage = getInlineMessage(
    parsed,
    props.required === true,
    hasBlurred.value,
    minIsoValue,
  );
  const weeks = buildCalendarWeeks(monthAnchor.value);
  const describedBy =
    [props.describedBy, inlineMessage ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => displayValue.value);
    track(() => inputRef.value);
    track(() => props.minValue);

    syncCustomValidity(
      inputRef.value,
      parseTypedDate(displayValue.value),
      props.required === true,
      normalizeIsoDate(props.minValue),
    );
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const nextIso = normalizeIsoDate(track(() => isoValue.value)) || "";
    if (nextIso === lastCommittedIso.value) return;

    lastCommittedIso.value = nextIso;
    displayValue.value = formatIsoDateInputValue(nextIso);
    monthAnchor.value = toMonthAnchor(nextIso, minIsoValue);
    hasBlurred.value = false;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    const open = track(() => pickerOpen.value);
    track(() => rootRef.value);

    if (!open || !(rootRef.value instanceof HTMLElement)) return;

    const rootEl = rootRef.value;
    window.requestAnimationFrame(() => {
      focusInitialCalendarTarget(rootEl);
    });

    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (rootEl.contains(event.target)) return;
      pickerOpen.value = false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      pickerOpen.value = false;

      const inputEl = inputRef.value;
      if (inputEl instanceof HTMLInputElement) {
        window.requestAnimationFrame(() => {
          inputEl.focus({ preventScroll: true });
        });
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);

    cleanup(() => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  return (
    <div ref={rootRef} class={["relative min-w-[10rem]", props.class]}>
      {props.name ? (
        <input
          type="hidden"
          name={props.name}
          value={resolvedIsoValue || ""}
          disabled={props.disabled}
        />
      ) : null}

      <div class="relative">
        <input
          ref={inputRef}
          id={props.id}
          type="text"
          value={displayValue.value}
          placeholder={props.placeholder || "MM/DD/YYYY"}
          inputMode={pickerOpen.value ? "none" : "numeric"}
          autoComplete="off"
          aria-label={props.ariaLabel}
          aria-controls={overlayId}
          aria-describedby={describedBy}
          aria-errormessage={inlineMessage ? errorId : undefined}
          aria-expanded={pickerOpen.value ? "true" : "false"}
          aria-haspopup="dialog"
          aria-invalid={inlineMessage ? "true" : "false"}
          class={[
            props.inputClass,
            "w-full min-w-0 pr-10",
            inlineMessage ? "text-[color:var(--color-danger,#b91c1c)]" : null,
          ]}
          disabled={props.disabled}
          readOnly={pickerOpen.value}
          required={props.required}
          onClick$={(_, inputEl) => {
            if (props.disabled) return;

            if (pickerOpen.value) {
              pickerOpen.value = false;

              window.requestAnimationFrame(() => {
                inputEl.focus({ preventScroll: true });
                const caret = inputEl.value.length;
                inputEl.setSelectionRange(caret, caret);
              });
              return;
            }

            pickerOpen.value = true;
            suppressNextBlur.value = true;
            monthAnchor.value = toMonthAnchor(calendarAnchorValue, minIsoValue);

            window.requestAnimationFrame(() => {
              inputEl.blur();
            });
          }}
          onInput$={(_, inputEl) => {
            if (pickerOpen.value) return;

            const nextDisplay = formatDateInput(inputEl.value);
            const nextParsed = parseTypedDate(nextDisplay);

            inputEl.value = nextParsed.displayValue;
            displayValue.value = nextParsed.displayValue;
            const nextIsoValue =
              nextParsed.status === "valid" ? nextParsed.isoValue : "";
            isoValue.value = nextIsoValue;
            lastCommittedIso.value = nextIsoValue;
            if (nextIsoValue) {
              monthAnchor.value = toMonthAnchor(nextIsoValue, minIsoValue);
            }

            syncCustomValidity(
              inputEl,
              nextParsed,
              props.required === true,
              minIsoValue,
            );
          }}
          onBlur$={(_, inputEl) => {
            if (suppressNextBlur.value) {
              suppressNextBlur.value = false;
              return;
            }

            hasBlurred.value = true;
            syncCustomValidity(
              inputEl,
              parseTypedDate(displayValue.value),
              props.required === true,
              minIsoValue,
            );
          }}
          onKeyDown$={(event, inputEl) => {
            if (props.disabled) return;

            if (
              (event.key === "ArrowDown" || event.key === "Enter") &&
              !pickerOpen.value
            ) {
              event.preventDefault();
              pickerOpen.value = true;
              suppressNextBlur.value = true;
              monthAnchor.value = toMonthAnchor(
                calendarAnchorValue,
                minIsoValue,
              );

              window.requestAnimationFrame(() => {
                inputEl.blur();
              });
              return;
            }

            if (event.key === "Escape" && pickerOpen.value) {
              event.preventDefault();
              pickerOpen.value = false;
              window.requestAnimationFrame(() => {
                inputEl.focus({ preventScroll: true });
              });
            }
          }}
        />

        <button
          type="button"
          aria-label={props.iconLabel || "Open date picker"}
          class="absolute inset-y-1 right-1 inline-flex w-8 items-center justify-center rounded-md text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={props.disabled}
          onClick$={() => {
            if (props.disabled) return;

            pickerOpen.value = true;
            suppressNextBlur.value = true;
            monthAnchor.value = toMonthAnchor(calendarAnchorValue, minIsoValue);

            window.requestAnimationFrame(() => {
              inputRef.value?.blur();
            });
          }}
        >
          <CalendarIcon />
        </button>
      </div>

      {inlineMessage ? (
        <p
          id={errorId}
          aria-live="polite"
          class="mt-1 text-xs text-[color:var(--color-danger,#b91c1c)]"
        >
          {inlineMessage}
        </p>
      ) : null}

      {pickerOpen.value ? (
        <div
          id={overlayId}
          role="dialog"
          aria-modal="false"
          aria-label={props.overlayLabel || "Calendar date picker"}
          class={[
            "absolute top-[calc(100%+0.5rem)] z-30 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 shadow-[var(--shadow-e3)]",
            props.overlayPosition === "right" ? "right-0" : "left-0",
          ]}
        >
          <div class="flex items-center justify-between gap-2">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
              aria-label="Show previous month"
              onClick$={() => {
                monthAnchor.value = shiftMonthAnchor(monthAnchor.value, -1);
              }}
            >
              <span aria-hidden="true">&lt;</span>
            </button>

            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {formatMonthLabel(monthAnchor.value)}
            </div>

            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
              aria-label="Show next month"
              onClick$={() => {
                monthAnchor.value = shiftMonthAnchor(monthAnchor.value, 1);
              }}
            >
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>

          <div class="mt-3 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                class="pb-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]"
              >
                {label}
              </div>
            ))}

            {weeks.flatMap((week) =>
              week.map((day) => {
                const isSelected = resolvedIsoValue === day.isoValue;
                const isDisabled = Boolean(
                  minIsoValue && day.isoValue < minIsoValue,
                );

                return (
                  <button
                    key={day.isoValue}
                    type="button"
                    disabled={isDisabled}
                    aria-label={formatDayLabel(day.isoValue)}
                    aria-current={day.isToday ? "date" : undefined}
                    aria-selected={isSelected ? "true" : "false"}
                    data-date-button="true"
                    data-date-in-month={day.inMonth ? "true" : "false"}
                    data-date-is-today={day.isToday ? "true" : "false"}
                    data-date-disabled={isDisabled ? "true" : "false"}
                    data-date-selected={isSelected ? "true" : "false"}
                    data-iso-value={day.isoValue}
                    class={[
                      "inline-flex h-9 items-center justify-center rounded-full text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]",
                      isDisabled
                        ? "cursor-not-allowed text-[color:var(--color-text-subtle)] opacity-45"
                        : isSelected
                          ? "bg-[color:var(--color-action)] text-white"
                          : day.inMonth
                            ? "text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-elevated)]"
                            : "text-[color:var(--color-text-subtle)] hover:bg-[color:var(--color-surface-elevated)]",
                    ]}
                    onClick$={() => {
                      const nextDisplay = formatIsoDateInputValue(day.isoValue);
                      displayValue.value = nextDisplay;
                      isoValue.value = day.isoValue;
                      lastCommittedIso.value = day.isoValue;
                      monthAnchor.value = toMonthAnchor(
                        day.isoValue,
                        minIsoValue,
                      );
                      pickerOpen.value = false;
                      hasBlurred.value = false;
                      syncCustomValidity(
                        inputRef.value,
                        parseTypedDate(nextDisplay),
                        props.required === true,
                        minIsoValue,
                      );

                      window.requestAnimationFrame(() => {
                        inputRef.value?.focus({ preventScroll: true });
                      });
                    }}
                    onKeyDown$={(event) => {
                      const delta = getCalendarMoveDelta(event.key);
                      if (delta == null) return;

                      event.preventDefault();

                      const nextIsoValue = clampIsoDateToMinimum(
                        shiftIsoDate(day.isoValue, delta),
                        minIsoValue,
                      );
                      monthAnchor.value = toMonthAnchor(
                        nextIsoValue,
                        minIsoValue,
                      );

                      const currentRoot = rootRef.value;
                      if (
                        currentRoot instanceof HTMLElement &&
                        focusCalendarDate(currentRoot, nextIsoValue)
                      ) {
                        return;
                      }

                      window.requestAnimationFrame(() => {
                        const nextRoot = rootRef.value;
                        if (!(nextRoot instanceof HTMLElement)) return;
                        focusCalendarDate(nextRoot, nextIsoValue);
                      });
                    }}
                  >
                    {day.dayOfMonth}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
});

const getConstraintMessage = (parsed: ParsedTypedDate, required: boolean) => {
  if (parsed.status === "valid") {
    return "";
  }

  if (parsed.status === "empty") {
    return required ? "Enter a date as MM/DD/YYYY." : "";
  }

  if (parsed.status === "incomplete") {
    return parsed.message;
  }

  if (parsed.status === "invalid") {
    return parsed.message;
  }

  return "";
};

const getInlineMessage = (
  parsed: ParsedTypedDate,
  required: boolean,
  hasBlurred: boolean,
  minIsoValue: string | null,
) => {
  const minimumMessage = getMinimumDateMessage(parsed, minIsoValue);
  if (minimumMessage) return minimumMessage;
  if (parsed.status === "invalid") return parsed.message;
  if (!hasBlurred) return "";
  return getConstraintMessage(parsed, required);
};

const syncCustomValidity = (
  inputEl: HTMLInputElement | undefined,
  parsed: ParsedTypedDate,
  required: boolean,
  minIsoValue: string | null,
) => {
  if (!(inputEl instanceof HTMLInputElement)) return;
  inputEl.setCustomValidity(
    getMinimumDateMessage(parsed, minIsoValue) ||
      getConstraintMessage(parsed, required),
  );
};

const focusInitialCalendarTarget = (rootEl: HTMLElement) => {
  const initialTarget =
    rootEl.querySelector<HTMLElement>(
      '[data-date-selected="true"]:not([disabled])',
    ) ||
    rootEl.querySelector<HTMLElement>(
      '[data-date-in-month="true"][data-date-is-today="true"]:not([disabled])',
    ) ||
    rootEl.querySelector<HTMLElement>(
      '[data-date-in-month="true"]:not([disabled])',
    ) ||
    rootEl.querySelector<HTMLElement>("[data-date-button]:not([disabled])");

  initialTarget?.focus({ preventScroll: true });
};

const focusCalendarDate = (rootEl: HTMLElement, isoValue: string) => {
  const target = rootEl.querySelector<HTMLElement>(
    `[data-iso-value="${isoValue}"]:not([disabled])`,
  );

  if (!(target instanceof HTMLElement)) return false;
  target.focus({ preventScroll: true });
  return true;
};

const toMonthAnchor = (
  value: string | null | undefined,
  minValue?: string | null,
) => {
  const normalizedValue =
    normalizeIsoDate(value) || normalizeIsoDate(minValue) || getTodayIsoDate();
  const clampedValue = clampIsoDateToMinimum(
    normalizedValue,
    normalizeIsoDate(minValue),
  );
  return `${clampedValue.slice(0, 7)}-01`;
};

const shiftMonthAnchor = (anchor: string, delta: number) => {
  const [yearText, monthText] = anchor.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return formatIsoDate(date);
};

const formatMonthLabel = (anchor: string) => {
  const [yearText, monthText] = anchor.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  return MONTH_LABEL_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
};

const buildCalendarWeeks = (anchor: string) => {
  const [yearText, monthText] = anchor.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const firstGridDate = new Date(firstOfMonth);
  firstGridDate.setUTCDate(
    firstGridDate.getUTCDate() - firstGridDate.getUTCDay(),
  );

  const todayIsoValue = getTodayIsoValue();
  const weeks: CalendarDay[][] = [];

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const week: CalendarDay[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const current = new Date(firstGridDate);
      current.setUTCDate(firstGridDate.getUTCDate() + weekIndex * 7 + dayIndex);
      const isoValue = formatIsoDate(current);

      week.push({
        isoValue,
        dayOfMonth: current.getUTCDate(),
        inMonth: current.getUTCMonth() === month - 1,
        isToday: isoValue === todayIsoValue,
      });
    }

    weeks.push(week);
  }

  return weeks;
};

const formatIsoDate = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

const shiftIsoDate = (isoValue: string, delta: number) => {
  const [yearText, monthText, dayText] = isoValue.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return formatIsoDate(date);
};

const getCalendarMoveDelta = (key: string) => {
  switch (key) {
    case "ArrowLeft":
      return -1;
    case "ArrowRight":
      return 1;
    case "ArrowUp":
      return -7;
    case "ArrowDown":
      return 7;
    default:
      return null;
  }
};

const getTodayIsoValue = () => {
  return getTodayIsoDate();
};

const getResolvedIsoValue = (
  parsed: ParsedTypedDate,
  minIsoValue: string | null,
) => {
  if (parsed.status !== "valid") return null;
  if (minIsoValue && parsed.isoValue < minIsoValue) return null;
  return parsed.isoValue;
};

const getMinimumDateMessage = (
  parsed: ParsedTypedDate,
  minIsoValue: string | null,
) => {
  if (parsed.status !== "valid" || !minIsoValue) return "";
  if (parsed.isoValue >= minIsoValue) return "";

  return `Choose a date on or after ${formatIsoDateInputValue(minIsoValue)}.`;
};

const clampIsoDateToMinimum = (
  isoValue: string,
  minIsoValue: string | null,
) => {
  if (!minIsoValue || isoValue >= minIsoValue) return isoValue;
  return minIsoValue;
};

const formatDayLabel = (isoValue: string) => {
  const [yearText, monthText, dayText] = isoValue.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);

  return DAY_LABEL_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)));
};

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
    <path
      d="M7 2v4M17 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

type CalendarDay = {
  isoValue: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
};

type DateFieldProps = {
  id: string;
  name?: string;
  value?: Signal<string>;
  initialValue?: string;
  placeholder?: string;
  ariaLabel?: string;
  describedBy?: string;
  iconLabel?: string;
  overlayId?: string;
  overlayLabel?: string;
  overlayPosition?: "left" | "right";
  class?: string;
  inputClass?: string;
  disabled?: boolean;
  required?: boolean;
  minValue?: string;
};
