import { component$ } from "@builder.io/qwik";

export const ResumeNotFound = component$(
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
        <p class="text-lg font-semibold text-[color:var(--color-text-strong)]">
          {props.title || "Trip link unavailable"}
        </p>
        <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
          {props.message ||
            "We couldn’t find a confirmation or itinerary for this link. Check the reference and try again."}
        </p>

        <div class="mt-5 flex flex-wrap gap-3">
          <a
            href={props.primaryHref || "/"}
            class="rounded-lg bg-[color:var(--color-action)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            {props.primaryLabel || "Start a new search"}
          </a>
          <a
            href={props.secondaryHref || "/trips"}
            class="rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
          >
            {props.secondaryLabel || "Go to trips"}
          </a>
        </div>
      </section>
    );
  },
);
