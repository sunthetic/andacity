import { component$ } from "@builder.io/qwik";
import { formatMoneyFromCents } from "~/lib/pricing/price-display";
import type {
  CheckoutItemRevalidationResult,
  CheckoutItemSnapshot,
  CheckoutRevalidationStatus,
  CheckoutRevalidationSummary,
} from "~/types/checkout";

const toTitleCase = (value: string) =>
  String(value || "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const formatDateRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
) => {
  if (startDate && endDate && startDate !== endDate) {
    return `${startDate} to ${endDate}`;
  }
  return startDate || endDate || null;
};

const formatAmount = (
  amountCents: number | null | undefined,
  currencyCode: string | null | undefined,
) => {
  if (amountCents == null || !currencyCode) return "Unavailable";
  return formatMoneyFromCents(amountCents, currencyCode);
};

const buildResultMap = (
  summary: CheckoutRevalidationSummary | null,
): Map<number, CheckoutItemRevalidationResult> => {
  return new Map(
    (summary?.itemResults || []).map((result) => [result.tripItemId, result]),
  );
};

const getStatusClasses = (
  status: CheckoutItemRevalidationResult["status"] | "verifying",
) => {
  if (status === "passed") {
    return "bg-[color:rgba(22,163,74,0.12)] text-[color:rgb(21,128,61)]";
  }
  if (status === "price_changed") {
    return "bg-[color:rgba(217,119,6,0.14)] text-[color:rgb(180,83,9)]";
  }
  if (status === "unavailable") {
    return "bg-[color:rgba(220,38,38,0.12)] text-[color:rgb(185,28,28)]";
  }
  if (status === "changed") {
    return "bg-[color:rgba(249,115,22,0.14)] text-[color:rgb(194,65,12)]";
  }
  if (status === "failed") {
    return "bg-[color:rgba(15,23,42,0.08)] text-[color:var(--color-text-strong)]";
  }
  return "bg-[color:rgba(37,99,235,0.12)] text-[color:rgb(29,78,216)]";
};

export const CheckoutItemList = component$(
  (props: {
    items: CheckoutItemSnapshot[];
    revalidationSummary: CheckoutRevalidationSummary | null;
    revalidationStatus: CheckoutRevalidationStatus;
  }) => {
    const results = buildResultMap(props.revalidationSummary);

    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              Trip snapshot
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Checkout only uses canonical persisted trip items and their stored
              inventory snapshots.
            </p>
          </div>
        </div>

        <div class="mt-5 space-y-4">
          {props.items.map((item) => {
            const result = results.get(item.tripItemId) || null;
            const dateLabel = formatDateRange(item.startDate, item.endDate);
            const snapshotPriceLabel = formatAmount(
              item.pricing.totalAmountCents,
              item.pricing.currencyCode,
            );
            const currentPriceLabel = result
              ? formatAmount(
                  result.currentPricing?.totalAmountCents,
                  result.currentPricing?.currencyCode,
                )
              : null;
            const priceDeltaCents =
              result?.previousPricing.currencyCode &&
              result.currentPricing?.currencyCode &&
              result.previousPricing.currencyCode ===
                result.currentPricing.currencyCode &&
              result.previousPricing.totalAmountCents != null &&
              result.currentPricing.totalAmountCents != null
                ? result.currentPricing.totalAmountCents -
                  result.previousPricing.totalAmountCents
                : null;
            const badgeStatus =
              result?.status ||
              (props.revalidationStatus === "pending" ||
              props.revalidationStatus === "idle"
                ? "verifying"
                : "failed");

            return (
              <article
                key={`${item.tripItemId}:${item.inventory.inventoryId}`}
                class="rounded-xl border border-[color:var(--color-border-subtle)] p-4"
              >
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="rounded-full bg-[color:rgba(15,23,42,0.06)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
                        {toTitleCase(item.vertical)}
                      </span>
                      <span
                        class={[
                          "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
                          getStatusClasses(badgeStatus),
                        ]}
                      >
                        {badgeStatus === "verifying"
                          ? "Verifying"
                          : toTitleCase(badgeStatus)}
                      </span>
                      <span class="text-xs text-[color:var(--color-text-muted)]">
                        Canonical item #{item.tripItemId}
                      </span>
                    </div>
                    <h2 class="mt-3 text-lg font-semibold text-[color:var(--color-text-strong)]">
                      {item.title}
                    </h2>
                    {item.subtitle ? (
                      <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                        {item.subtitle}
                      </p>
                    ) : null}
                    <div class="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--color-text-muted)]">
                      {dateLabel ? (
                        <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
                          {dateLabel}
                        </span>
                      ) : null}
                      <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
                        {item.inventory.inventoryId}
                      </span>
                      {item.meta.slice(0, 3).map((entry) => (
                        <span
                          key={`${item.tripItemId}:${entry}`}
                          class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1"
                        >
                          {entry}
                        </span>
                      ))}
                    </div>

                    {result ? (
                      <div class="mt-4 rounded-xl bg-[color:var(--color-surface-muted,#f8fafc)] p-3 text-sm text-[color:var(--color-text-muted)]">
                        <p class="font-medium text-[color:var(--color-text-strong)]">
                          {result.message}
                        </p>
                        {result.status === "price_changed" ? (
                          <div class="mt-2 space-y-1">
                            <p>Stored total: {snapshotPriceLabel}</p>
                            <p>
                              Current total:{" "}
                              {currentPriceLabel || "Unavailable"}
                            </p>
                            {priceDeltaCents != null ? (
                              <p>
                                Delta: {priceDeltaCents >= 0 ? "+" : ""}
                                {formatAmount(
                                  priceDeltaCents,
                                  result.currentPricing?.currencyCode,
                                )}
                              </p>
                            ) : null}
                          </div>
                        ) : result.status === "passed" ? (
                          <p class="mt-2">
                            Confirmed total:{" "}
                            {currentPriceLabel || snapshotPriceLabel}
                          </p>
                        ) : result.status === "failed" ? (
                          <p class="mt-2">
                            Recheck availability to retry against the
                            provider-backed resolver.
                          </p>
                        ) : result.status === "unavailable" ? (
                          <p class="mt-2">
                            This item is no longer bookable for the saved
                            snapshot.
                          </p>
                        ) : (
                          <p class="mt-2">
                            Review this item in your trip before creating a
                            fresh checkout snapshot.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] px-3 py-3 text-right">
                    <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
                      Stored total
                    </p>
                    <p class="mt-1 text-base font-semibold text-[color:var(--color-text-strong)]">
                      {snapshotPriceLabel}
                    </p>
                    {result?.status === "price_changed" ? (
                      <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                        Current: {currentPriceLabel || "Unavailable"}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  },
);
