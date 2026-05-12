import { Slot, component$ } from "@builder.io/qwik";

export const BOOKING_SEARCH_SURFACE_CLASS =
  "rounded-[var(--radius-xl)] border border-white/55 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(228,233,252,0.88)_58%,rgba(224,245,241,0.86))] p-3 shadow-[var(--shadow-lg)] backdrop-blur md:p-4";

export const BOOKING_SEARCH_FIELD_CLASS =
  "flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-white/55 bg-white/76 px-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_6px_18px_rgba(20,40,90,0.06)] transition-colors hover:bg-white/90";

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
