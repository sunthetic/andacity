import { component$ } from "@builder.io/qwik";
import type { ConfirmationPageModel } from "~/lib/confirmation/getConfirmationPageModel";

export const ConfirmationSummaryCard = component$(
  (props: {
    summary: ConfirmationPageModel["summary"];
    tripReference: string;
  }) => {
    return (
      <aside class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          Confirmation summary
        </p>

        <div class="mt-4 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
            Total paid
          </p>
          <p class="mt-1 text-2xl font-semibold text-[color:var(--color-text-strong)]">
            {props.summary.totalPaidLabel || "Unavailable"}
          </p>
          <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
            {props.summary.currency || "Currency unavailable"}
          </p>
        </div>

        <dl class="mt-4 space-y-3 text-sm">
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[color:var(--color-text-muted)]">Trip</dt>
            <dd class="text-right font-medium text-[color:var(--color-text-strong)]">
              {props.tripReference}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[color:var(--color-text-muted)]">Items</dt>
            <dd class="text-right font-medium text-[color:var(--color-text-strong)]">
              {props.summary.itemCountLabel}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[color:var(--color-text-muted)]">Trip summary</dt>
            <dd class="text-right font-medium text-[color:var(--color-text-strong)]">
              {props.summary.tripSummary}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[color:var(--color-text-muted)]">Booking date</dt>
            <dd class="text-right font-medium text-[color:var(--color-text-strong)]">
              {props.summary.bookingDateLabel || "Unavailable"}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[color:var(--color-text-muted)]">Last updated</dt>
            <dd class="text-right font-medium text-[color:var(--color-text-strong)]">
              {props.summary.lastUpdatedLabel || "Unavailable"}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[color:var(--color-text-muted)]">Status</dt>
            <dd class="text-right font-medium text-[color:var(--color-text-strong)]">
              {props.summary.progressLabel}
            </dd>
          </div>
        </dl>
      </aside>
    );
  },
);
