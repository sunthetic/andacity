import { component$ } from "@builder.io/qwik";

export const ItineraryAccessDenied = component$(
  (props: {
    title?: string;
    message: string;
    searchHref?: string;
    claimHref?: string | null;
  }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:rgba(220,38,38,0.16)] bg-[color:rgba(254,242,242,0.96)] p-6 shadow-[var(--shadow-sm)]">
        <p class="text-lg font-semibold text-[color:var(--color-text-strong)]">
          {props.title || "You don't have access to this itinerary"}
        </p>
        <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
          {props.message}
        </p>

        <div class="mt-5 flex flex-wrap gap-3">
          <a
            href={props.searchHref || "/"}
            class="rounded-lg bg-[color:var(--color-action)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Go to search
          </a>
          {props.claimHref ? (
            <a
              href={props.claimHref}
              class="rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
            >
              Try claim flow
            </a>
          ) : null}
        </div>
      </section>
    );
  },
);
