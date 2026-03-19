import { component$ } from "@builder.io/qwik";

export const ConfirmationNotFound = component$(
  (props: {
    title?: string;
    message?: string;
    primaryHref?: string;
    primaryLabel?: string;
    secondaryHref?: string;
    secondaryLabel?: string;
  }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
          Confirmation
        </p>
        <h1 class="mt-2 text-2xl font-semibold text-[color:var(--color-text-strong)]">
          {props.title || "We couldn’t find this confirmation"}
        </h1>
        <p class="mt-3 max-w-2xl text-sm text-[color:var(--color-text-muted)]">
          {props.message ||
            "The confirmation reference may be missing, invalid, or no longer available."}
        </p>
        <div class="mt-5 flex flex-wrap gap-3">
          <a
            href={props.primaryHref || "/trips"}
            class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
          >
            {props.primaryLabel || "Go to trip"}
          </a>
          <a
            href={props.secondaryHref || "/"}
            class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
          >
            {props.secondaryLabel || "Start a new search"}
          </a>
        </div>
      </section>
    );
  },
);
