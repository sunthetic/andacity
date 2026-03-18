import { component$ } from "@builder.io/qwik";
import { CheckoutBookingItemStatusList } from "~/components/checkout/booking/CheckoutBookingItemStatusList";
import { CheckoutBookingStatusNotice } from "~/components/checkout/booking/CheckoutBookingStatusNotice";
import type { CheckoutBookingSummary } from "~/types/booking";

export const CheckoutBookingSection = component$(
  (props: {
    bookingSummary: CheckoutBookingSummary;
    bookingNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
  }) => {
    const { bookingSummary, bookingNotice } = props;

    return (
      <section
        id="checkout-booking"
        class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              Booking
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Booking runs on the server and may complete item by item across
              flights, stays, and cars.
            </p>
          </div>
          <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
            {bookingSummary.statusLabel}
          </span>
        </div>

        <div class="mt-5 space-y-4">
          <CheckoutBookingStatusNotice
            bookingSummary={bookingSummary}
            bookingNotice={bookingNotice}
          />

          {bookingSummary.run ? (
            <div class="rounded-xl bg-[color:var(--color-surface-muted,#f8fafc)] p-4">
              <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div class="text-sm text-[color:var(--color-text-muted)]">
                  {bookingSummary.run.summary
                    ? `${bookingSummary.run.summary.completedCount} of ${bookingSummary.run.summary.totalItemCount} items resolved`
                    : "Booking run created."}
                </div>
                {bookingSummary.canRefresh ? (
                  <form method="post">
                    <input type="hidden" name="intent" value="refresh-booking" />
                    <button
                      type="submit"
                      class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
                    >
                      Refresh booking status
                    </button>
                  </form>
                ) : null}
              </div>

              <CheckoutBookingItemStatusList bookingRun={bookingSummary.run} />
            </div>
          ) : bookingSummary.canExecute ? (
            <form method="post" class="space-y-3">
              <input type="hidden" name="intent" value="execute-booking" />
              <button
                type="submit"
                class="rounded-lg bg-[color:var(--color-action)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                Complete booking
              </button>
              <p class="text-sm text-[color:var(--color-text-muted)]">
                This will create a durable booking run for the current checkout
                session and record each item result separately.
              </p>
            </form>
          ) : (
            <p class="text-sm text-[color:var(--color-text-muted)]">
              {bookingSummary.statusDescription}
            </p>
          )}
        </div>
      </section>
    );
  },
);
