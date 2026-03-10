import { component$, type QRL } from "@builder.io/qwik";
import { AsyncPendingButton } from "~/components/async/AsyncPendingButton";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import {
  buildPriceDisplayFromMetadata,
  formatMoney,
  formatPriceQualifier,
} from "~/lib/pricing/price-display";
import type {
  TripBundlingSuggestion,
  TripItemCandidate,
} from "~/types/trips/trip";

export const TripSuggestionCard = component$(
  (props: {
    suggestion: TripBundlingSuggestion;
    loading: boolean;
    disabled?: boolean;
    onAdd$: QRL<(candidate: TripItemCandidate) => Promise<void>>;
  }) => {
    const { suggestion } = props;
    const priceDisplay = buildPriceDisplayFromMetadata(
      suggestion.tripCandidate.metadata,
      suggestion.inventory.currencyCode,
    );

    return (
      <article class="rounded-xl border border-[color:var(--color-border)] p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="t-badge">
                {formatItemTypeLabel(suggestion.itemType)}
              </span>
              <span class={priorityBadgeClass(suggestion.priority)}>
                {suggestion.priority.toUpperCase()}
              </span>
              <span class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                {suggestion.title}
              </span>
            </div>

            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {suggestion.description}
            </p>
          </div>

          <AsyncPendingButton
            class="t-btn-primary px-3 py-2 text-sm"
            pending={props.loading}
            pendingLabel="Adding..."
            disabled={props.disabled && !props.loading}
            onClick$={() => props.onAdd$(suggestion.tripCandidate)}
          >
            {suggestion.ctaLabel}
          </AsyncPendingButton>
        </div>

        <div class="mt-3 grid gap-3 rounded-xl border border-[color:var(--color-border)] px-3 py-3 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Suggested inventory
            </p>
            <p class="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">
              {suggestion.inventory.title}
            </p>
            {suggestion.inventory.subtitle ? (
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {suggestion.inventory.subtitle}
              </p>
            ) : null}
            {suggestion.inventory.meta.length ? (
              <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                {suggestion.inventory.meta.join(" · ")}
              </p>
            ) : null}
          </div>

          <div class="text-left md:text-right">
            <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Suggested price
            </p>
            <p class="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">
              {priceDisplay?.baseTotalAmount != null
                ? `${priceDisplay.baseTotalLabel} ${formatMoney(
                    priceDisplay.baseTotalAmount,
                    suggestion.inventory.currencyCode,
                  )}`
                : `${priceDisplay?.baseLabel || "Base price"} ${formatMoney(
                    priceDisplay?.baseAmount ??
                      suggestion.inventory.priceCents / 100,
                    suggestion.inventory.currencyCode,
                  )} ${formatPriceQualifier(priceDisplay?.baseQualifier)}`.trim()}
            </p>
            {priceDisplay?.baseTotalAmount != null ? (
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {priceDisplay.baseLabel}{" "}
                <span class="font-medium text-[color:var(--color-text)]">
                  {formatMoney(
                    priceDisplay.baseAmount,
                    suggestion.inventory.currencyCode,
                  )}
                </span>{" "}
                {formatPriceQualifier(priceDisplay.baseQualifier)}
              </p>
            ) : null}
            {priceDisplay?.totalAmount != null &&
            priceDisplay?.estimatedFeesAmount != null ? (
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {priceDisplay.totalLabel}{" "}
                <span class="font-medium text-[color:var(--color-text)]">
                  {formatMoney(
                    priceDisplay.totalAmount,
                    suggestion.inventory.currencyCode,
                  )}
                </span>
                <span class="ml-1">
                  incl.{" "}
                  {formatMoney(
                    priceDisplay.estimatedFeesAmount,
                    suggestion.inventory.currencyCode,
                  )}{" "}
                  est.
                </span>
              </p>
            ) : null}
            <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              {formatDateRange(suggestion.startDate, suggestion.endDate)}
              {suggestion.cityName ? ` · ${suggestion.cityName}` : ""}
            </p>
            {priceDisplay?.supportText ? (
              <p class="mt-1 max-w-[260px] text-xs text-[color:var(--color-text-muted)]">
                {priceDisplay.supportText}
              </p>
            ) : null}
            <div class="mt-3">
              <AvailabilityConfidence
                confidence={suggestion.inventory.availabilityConfidence}
                align="right"
              />
            </div>
            {suggestion.inventory.href ? (
              <a
                href={suggestion.inventory.href}
                class="mt-3 inline-flex rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 text-xs text-[color:var(--color-text-strong)]"
              >
                View option
              </a>
            ) : null}
          </div>
        </div>
      </article>
    );
  },
);

const formatItemTypeLabel = (value: TripBundlingSuggestion["itemType"]) => {
  if (value === "hotel") return "HOTEL";
  if (value === "flight") return "FLIGHT";
  return "CAR";
};

const priorityBadgeClass = (priority: TripBundlingSuggestion["priority"]) => {
  if (priority === "high") {
    return "rounded-full border border-[color:var(--color-error,#b91c1c)] bg-[color:rgba(185,28,28,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-error,#b91c1c)]";
  }
  if (priority === "medium") {
    return "rounded-full border border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-warning,#92400e)]";
  }
  return "rounded-full border border-[color:var(--color-text-muted)] bg-[color:rgba(15,23,42,0.05)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-text-muted)]";
};

const formatDateRange = (startDate: string | null, endDate: string | null) => {
  if (startDate && endDate && startDate !== endDate) {
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  }
  if (startDate) return formatDate(startDate);
  if (endDate) return formatDate(endDate);
  return "Dates not set";
};

const formatDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const [year, month, day] = value
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};
