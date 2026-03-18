import { component$ } from "@builder.io/qwik";
import type { BookingRun } from "~/types/booking";

const toTitleCase = (value: string) =>
  String(value || "")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

const readProviderStatus = (value: Record<string, unknown> | null | undefined) =>
  toNullableText(value?.providerStatus) || toNullableText(value?.status);

const readProviderMessage = (value: Record<string, unknown> | null | undefined) =>
  toNullableText(value?.message);

export const CheckoutBookingItemStatusList = component$(
  (props: { bookingRun: BookingRun }) => {
    if (!props.bookingRun.itemExecutions.length) {
      return (
        <p class="text-sm text-[color:var(--color-text-muted)]">
          Booking details will appear here after execution starts.
        </p>
      );
    }

    return (
      <div class="space-y-3">
        {props.bookingRun.itemExecutions.map((item) => {
          const responseSnapshot =
            item.responseSnapshotJson && typeof item.responseSnapshotJson === "object"
              ? item.responseSnapshotJson
              : null;
          const providerStatus = readProviderStatus(responseSnapshot);
          const providerMessage = readProviderMessage(responseSnapshot);
          const detailMessage = item.errorMessage || providerMessage;

          return (
            <article
              key={item.id}
              class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                    {item.title}
                  </p>
                  <p class="mt-1 text-xs uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
                    {item.vertical} · {toTitleCase(item.status)}
                    {providerStatus ? ` · ${toTitleCase(providerStatus)}` : ""}
                  </p>
                  {detailMessage ? (
                    <p
                      class={[
                        "mt-2 text-sm",
                        item.status === "requires_manual_review" || item.errorMessage
                          ? "text-[color:#b45309]"
                          : "text-[color:var(--color-text-muted)]",
                      ]}
                    >
                      {detailMessage}
                    </p>
                  ) : null}
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
