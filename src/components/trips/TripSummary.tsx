import { component$ } from "@builder.io/qwik";
import { BeginCheckoutButton } from "~/components/checkout/BeginCheckoutButton";
import { TripCheckoutReadinessNotice } from "~/components/trips/TripCheckoutReadinessNotice";
import type { TripPageSummaryModel } from "~/lib/trips/trip-page-model";

export const TripSummary = component$(
  (props: { summary: TripPageSummaryModel }) => {
    const { summary } = props;

    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
              Persisted trip
            </p>
            <h1 class="mt-2 text-2xl font-semibold text-[color:var(--color-text-strong)]">
              {summary.name}
            </h1>
            <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
              <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-medium text-[color:var(--color-text-strong)]">
                {summary.reference}
              </span>
              <span>{summary.statusLabel}</span>
              <span aria-hidden="true">·</span>
              <span>
                {summary.totalItemCount} item
                {summary.totalItemCount === 1 ? "" : "s"}
              </span>
            </div>
            {summary.dateRangeLabel || summary.citiesLabel ? (
              <p class="mt-3 text-sm text-[color:var(--color-text-muted)]">
                {[summary.dateRangeLabel, summary.citiesLabel]
                  .filter((value): value is string => Boolean(value))
                  .join(" · ")}
              </p>
            ) : null}
          </div>

          <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] px-4 py-3 text-left sm:text-right">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
              Saved total
            </p>
            <p class="mt-1 text-xl font-semibold text-[color:var(--color-text-strong)]">
              {summary.savedTotalLabel}
            </p>
            <p class="mt-1 max-w-[24rem] text-xs text-[color:var(--color-text-muted)]">
              {summary.savedTotalContext}
            </p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-4">
          <SummaryMetric
            label="Flights"
            value={String(summary.itemCounts.flight)}
          />
          <SummaryMetric
            label="Hotels"
            value={String(summary.itemCounts.hotel)}
          />
          <SummaryMetric label="Cars" value={String(summary.itemCounts.car)} />
          <SummaryMetric label="Updated" value={summary.updatedLabel} />
        </div>

        {summary.bookingSessionLabel ? (
          <div class="mt-4 rounded-xl border border-dashed border-[color:var(--color-border)] px-3 py-3 text-sm text-[color:var(--color-text-muted)]">
            Booking session:{" "}
            <span class="font-medium text-[color:var(--color-text-strong)]">
              {summary.bookingSessionLabel}
            </span>
          </div>
        ) : null}

        <div class="mt-5 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] p-4">
          <div class="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div>
              <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                Manage this trip
              </p>
              <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Open the trip builder to update status, move items between
                trips, or delete this plan.
              </p>
              <div class="mt-4">
                <TripCheckoutReadinessNotice
                  readiness={summary.checkoutReadiness}
                />
              </div>
            </div>

            <div class="flex flex-col items-start gap-3 lg:items-end">
              <BeginCheckoutButton
                tripId={summary.tripId}
                disabled={!summary.checkoutReadiness.isReady}
                helperText="Pricing and availability will be confirmed before payment."
              />
              <a
                href={summary.continueHref}
                class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
              >
                Open builder
              </a>
              {summary.futureActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled
                  title={action.description}
                  class="cursor-not-allowed rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-muted)] opacity-70"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  },
);

const SummaryMetric = component$((props: { label: string; value: string }) => {
  return (
    <div class="rounded-xl border border-[color:var(--color-border-subtle)] px-3 py-3">
      <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
        {props.label}
      </p>
      <p class="mt-1 text-sm font-medium text-[color:var(--color-text-strong)]">
        {props.value}
      </p>
    </div>
  );
});
