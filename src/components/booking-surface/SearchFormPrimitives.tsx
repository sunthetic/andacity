import { Slot, component$ } from "@builder.io/qwik";

export const BOOKING_SEARCH_SURFACE_CLASS =
  "rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-3 shadow-[var(--shadow-lg)] md:p-4";

export const BOOKING_SEARCH_FIELD_CLASS =
  "flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 text-left transition-colors hover:border-[color:var(--color-border)]";

export const BOOKING_SEARCH_LABEL_CLASS =
  "text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]";

export const BOOKING_SEARCH_CONTROL_CLASS =
  "w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none placeholder:text-[color:var(--color-text-muted)]";

export const BookingSearchSurface = component$(
  (props: BookingSearchSurfaceProps) => {
    return (
      <div class={[BOOKING_SEARCH_SURFACE_CLASS, props.class]}>
        {props.title ? (
          <div class="mb-3 text-sm font-semibold text-[color:var(--color-text-strong)]">
            {props.title}
          </div>
        ) : null}
        <Slot />
      </div>
    );
  },
);

export const BookingSearchField = component$((props: BookingSearchFieldProps) => {
  return (
    <div class={[BOOKING_SEARCH_FIELD_CLASS, props.class]}>
      <label for={props.forId} class={BOOKING_SEARCH_LABEL_CLASS}>
        {props.label}
      </label>
      <div class="mt-0.5 min-w-0">
        <Slot />
      </div>
    </div>
  );
});

export const BookingValidationSummary = component$(
  (props: BookingValidationSummaryProps) => {
    if (!props.show || !props.errors.length) return null;

    return (
      <div class="mt-3 rounded-[var(--radius-lg)] border border-[color:var(--color-danger,#dc2626)] bg-[color:var(--color-danger-soft,#fef2f2)] px-4 py-3 text-left">
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-danger,#b91c1c)]">
          {props.title || "Check these fields"}
        </p>
        <ul class="mt-2 grid gap-1 text-sm text-[color:var(--color-danger,#b91c1c)]">
          {props.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  },
);

type BookingSearchSurfaceProps = {
  title?: string;
  class?: string;
};

type BookingSearchFieldProps = {
  label: string;
  forId: string;
  class?: string;
};

type BookingValidationSummaryProps = {
  errors: string[];
  show?: boolean;
  title?: string;
};
