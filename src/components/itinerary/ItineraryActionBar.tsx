import { component$ } from "@builder.io/qwik";
import type { ItineraryPageModel } from "~/fns/itinerary/getItineraryPageModel";

export const ItineraryActionBar = component$(
  (props: {
    actions: ItineraryPageModel["actions"];
  }) => {
    const { actions } = props;

    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          Post-booking actions
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          This itinerary is the canonical post-booking destination. More actions
          will be enabled in follow-up tasks.
        </p>

        <div class="mt-4 flex flex-wrap gap-3">
          <a
            href={actions.returnToSearchHref}
            class="rounded-lg bg-[color:var(--color-action)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Return to search
          </a>

          {actions.tripHref ? (
            <a
              href={actions.tripHref}
              class="rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
            >
              View trip
            </a>
          ) : null}

          <button
            type="button"
            disabled
            class="cursor-not-allowed rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-muted)] opacity-70"
          >
            {actions.modifyLabel}
          </button>

          <button
            type="button"
            disabled
            class="cursor-not-allowed rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-muted)] opacity-70"
          >
            {actions.cancelLabel}
          </button>
        </div>
      </section>
    );
  },
);
