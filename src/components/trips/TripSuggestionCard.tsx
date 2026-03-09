import { component$, type QRL } from "@builder.io/qwik";
import type {
  TripBundlingSuggestion,
  TripItemCandidate,
} from "~/types/trips/trip";

export const TripSuggestionCard = component$(
  (props: {
    suggestion: TripBundlingSuggestion;
    loading: boolean;
    onAdd$: QRL<(candidate: TripItemCandidate) => Promise<void>>;
  }) => {
    const { suggestion } = props;

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

          <button
            type="button"
            class="t-btn-primary px-3 py-2 text-sm"
            disabled={props.loading}
            onClick$={() => props.onAdd$(suggestion.tripCandidate)}
          >
            {props.loading ? "Adding..." : suggestion.ctaLabel}
          </button>
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
              Snapshot price
            </p>
            <p class="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">
              {formatMoneyFromCents(
                suggestion.inventory.priceCents,
                suggestion.inventory.currencyCode,
              )}
            </p>
            <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              {formatDateRange(suggestion.startDate, suggestion.endDate)}
              {suggestion.cityName ? ` · ${suggestion.cityName}` : ""}
            </p>
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

const formatMoneyFromCents = (cents: number, currency: string) => {
  const amount = Math.max(0, Number(cents || 0)) / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || "USD"}`;
  }
};
