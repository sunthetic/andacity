import { component$ } from "@builder.io/qwik";
import type { CheckoutRevalidationSummary } from "~/types/checkout";

export const CheckoutRevalidationSummaryCard = component$(
  (props: { revalidationSummary: CheckoutRevalidationSummary | null }) => {
    const summary = props.revalidationSummary;

    return (
      <aside class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          Revalidation summary
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          Server-backed checkout readiness is derived from the latest canonical
          inventory check.
        </p>

        {summary ? (
          <div class="mt-5 space-y-3">
            <SummaryRow
              label="Blocking issues"
              value={summary.blockingIssueCount}
            />
            <SummaryRow
              label="Price changes"
              value={summary.priceChangeCount}
            />
            <SummaryRow label="Unavailable" value={summary.unavailableCount} />
            <SummaryRow label="Changed" value={summary.changedCount} />
            <SummaryRow label="Failed" value={summary.failedCount} />
          </div>
        ) : (
          <p class="mt-5 text-sm text-[color:var(--color-text-muted)]">
            No persisted revalidation summary is available yet.
          </p>
        )}
      </aside>
    );
  },
);

const SummaryRow = component$((props: { label: string; value: number }) => {
  return (
    <div class="flex items-center justify-between gap-3">
      <span class="text-sm text-[color:var(--color-text-muted)]">
        {props.label}
      </span>
      <span class="text-sm font-semibold text-[color:var(--color-text-strong)]">
        {props.value}
      </span>
    </div>
  );
});
