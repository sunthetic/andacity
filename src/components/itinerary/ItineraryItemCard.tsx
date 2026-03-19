import { component$ } from "@builder.io/qwik";
import type {
  ItineraryPageItemModel,
  ItineraryPageItemStatus,
} from "~/fns/itinerary/getItineraryPageModel";

const getStatusToneClasses = (status: ItineraryPageItemStatus) => {
  if (status === "confirmed" || status === "completed") {
    return "bg-[color:rgba(22,163,74,0.12)] text-[color:rgb(21,128,61)]";
  }

  if (status === "pending" || status === "in_progress") {
    return "bg-[color:rgba(37,99,235,0.12)] text-[color:rgb(29,78,216)]";
  }

  if (status === "manual_review" || status === "canceled") {
    return "bg-[color:rgba(217,119,6,0.14)] text-[color:rgb(180,83,9)]";
  }

  return "bg-[color:rgba(220,38,38,0.12)] text-[color:rgb(185,28,28)]";
};

export const ItineraryItemCard = component$(
  (props: {
    item: ItineraryPageItemModel;
    previewOnly?: boolean;
  }) => {
    const { item } = props;

    return (
      <article class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] p-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-[color:rgba(15,23,42,0.06)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
                {item.typeLabel}
              </span>
              <span
                class={[
                  "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
                  getStatusToneClasses(item.status),
                ]}
              >
                {item.statusLabel}
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
              {item.dateLabel ? (
                <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
                  {item.dateLabel}
                </span>
              ) : null}
              {item.locationLabel ? (
                <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
                  {item.locationLabel}
                </span>
              ) : null}
              {item.providerName ? (
                <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
                  {item.providerName}
                </span>
              ) : null}
            </div>
          </div>

          {item.confirmationCode || item.bookingReference ? (
            <div class="min-w-[190px] rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 text-xs text-[color:var(--color-text-muted)]">
              {item.confirmationCode ? (
                <p>
                  Confirmation code{" "}
                  <span class="font-mono font-semibold text-[color:var(--color-text-strong)]">
                    {item.confirmationCode}
                  </span>
                </p>
              ) : null}
              {item.bookingReference ? (
                <p class={item.confirmationCode ? "mt-2" : undefined}>
                  Booking reference{" "}
                  <span class="font-mono font-semibold text-[color:var(--color-text-strong)]">
                    {item.bookingReference}
                  </span>
                </p>
              ) : null}
            </div>
          ) : props.previewOnly ? (
            <div class="min-w-[190px] rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 text-xs text-[color:var(--color-text-muted)]">
              Claim this itinerary to view provider references.
            </div>
          ) : null}
        </div>
      </article>
    );
  },
);
