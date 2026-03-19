import { component$ } from "@builder.io/qwik";
import type { ItineraryPageModel } from "~/fns/itinerary/getItineraryPageModel";

export const ItinerarySummaryCard = component$(
  (props: { summary: ItineraryPageModel["summary"] }) => {
    const { summary } = props;

    return (
      <aside class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          Itinerary summary
        </p>

        <div class="mt-4 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
            Total paid
          </p>
          <p class="mt-1 text-2xl font-semibold text-[color:var(--color-text-strong)]">
            {summary.totalPaidLabel || "Unavailable"}
          </p>
          <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
            {summary.currency || "Currency unavailable"}
          </p>
        </div>

        <dl class="mt-4 space-y-3 text-sm">
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[color:var(--color-text-muted)]">Items</dt>
            <dd class="text-right font-medium text-[color:var(--color-text-strong)]">
              {summary.itemCountLabel}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[color:var(--color-text-muted)]">Dates</dt>
            <dd class="text-right font-medium text-[color:var(--color-text-strong)]">
              {summary.dateRangeLabel || "Unavailable"}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[color:var(--color-text-muted)]">Trip</dt>
            <dd class="text-right font-medium text-[color:var(--color-text-strong)]">
              {summary.tripDescription}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[color:var(--color-text-muted)]">Booked</dt>
            <dd class="text-right font-medium text-[color:var(--color-text-strong)]">
              {summary.bookingDateLabel || "Unavailable"}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[color:var(--color-text-muted)]">Last updated</dt>
            <dd class="text-right font-medium text-[color:var(--color-text-strong)]">
              {summary.lastUpdatedLabel || "Unavailable"}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[color:var(--color-text-muted)]">Progress</dt>
            <dd class="text-right font-medium text-[color:var(--color-text-strong)]">
              {summary.progressLabel}
            </dd>
          </div>
        </dl>
      </aside>
    );
  },
);
