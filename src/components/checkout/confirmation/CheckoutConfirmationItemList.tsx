import { component$ } from "@builder.io/qwik";
import type { BookingConfirmationItem } from "~/types/confirmation";

const toTitleCase = (value: string) =>
  String(value || "")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const formatDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const formatDateRange = (
  startAt: string | null | undefined,
  endAt: string | null | undefined,
) => {
  const start = formatDate(startAt);
  const end = formatDate(endAt);
  if (start && end && start !== end) return `${start} to ${end}`;
  return start || end || null;
};

const getStatusClasses = (status: BookingConfirmationItem["status"]) => {
  if (status === "confirmed") {
    return "bg-[color:rgba(22,163,74,0.12)] text-[color:rgb(21,128,61)]";
  }
  if (status === "requires_manual_review") {
    return "bg-[color:rgba(217,119,6,0.14)] text-[color:rgb(180,83,9)]";
  }
  if (status === "failed") {
    return "bg-[color:rgba(220,38,38,0.12)] text-[color:rgb(185,28,28)]";
  }
  return "bg-[color:rgba(37,99,235,0.12)] text-[color:rgb(29,78,216)]";
};

export const CheckoutConfirmationItemList = component$(
  (props: {
    items: BookingConfirmationItem[];
  }) => {
    if (!props.items.length) {
      return (
        <p class="text-sm text-[color:var(--color-text-muted)]">
          Confirmation items will appear here when a confirmation is created.
        </p>
      );
    }

    return (
      <div class="space-y-3">
        {props.items.map((item) => {
          const dateLabel = formatDateRange(item.startAt, item.endAt);

          return (
            <article
              key={item.id}
              class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] p-4"
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
                        getStatusClasses(item.status),
                      ]}
                    >
                      {toTitleCase(item.status)}
                    </span>
                  </div>

                  <p class="mt-3 text-sm font-semibold text-[color:var(--color-text-strong)]">
                    {item.title}
                  </p>
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
                    {item.locationSummary ? (
                      <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
                        {item.locationSummary}
                      </span>
                    ) : null}
                    {item.provider ? (
                      <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
                        {item.provider}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div class="text-right text-xs text-[color:var(--color-text-muted)]">
                  {item.providerConfirmationCode ? (
                    <p>Confirmation {item.providerConfirmationCode}</p>
                  ) : null}
                  {item.providerBookingReference ? (
                    <p class="mt-1">Reference {item.providerBookingReference}</p>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  },
);
