import { component$ } from "@builder.io/qwik";
import type { ItineraryPageModel } from "~/fns/itinerary/getItineraryPageModel";

export const ItineraryHeader = component$(
  (props: { header: ItineraryPageModel["header"] }) => {
    const { header } = props;

    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
          Saved itinerary
        </p>

        <h1 class="mt-2 text-3xl font-semibold text-[color:var(--color-text-strong)]">
          {header.title}
        </h1>

        <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
          {header.statusLabel} · {header.statusDescription}
        </p>

        <div class="mt-5 flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-text-muted)]">
          <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-semibold uppercase tracking-[0.08em]">
            {header.ownershipLabel}
          </span>
          <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-mono font-semibold">
            {header.itineraryRef}
          </span>
          {header.bookingDateLabel ? (
            <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
              Booked {header.bookingDateLabel}
            </span>
          ) : null}
        </div>
      </section>
    );
  },
);
