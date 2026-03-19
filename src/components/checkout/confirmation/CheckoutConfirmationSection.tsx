import { component$ } from "@builder.io/qwik";
import { CheckoutConfirmationItemList } from "~/components/checkout/confirmation/CheckoutConfirmationItemList";
import { CheckoutConfirmationStatusNotice } from "~/components/checkout/confirmation/CheckoutConfirmationStatusNotice";
import type { CheckoutBookingSummary } from "~/types/booking";
import type { BookingConfirmation } from "~/types/confirmation";

const isConfirmationReady = (bookingSummary: CheckoutBookingSummary) => {
  return (
    Boolean(bookingSummary.run) &&
    (bookingSummary.status === "succeeded" ||
      bookingSummary.status === "partial" ||
      bookingSummary.status === "requires_manual_review")
  );
};

export const CheckoutConfirmationSection = component$(
  (props: {
    confirmation: BookingConfirmation | null;
    bookingSummary: CheckoutBookingSummary;
    confirmationNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
  }) => {
    const { confirmation, bookingSummary, confirmationNotice } = props;
    const canPrepareConfirmation =
      !confirmation && isConfirmationReady(bookingSummary);
    const summary = confirmation?.summaryJson;

    return (
      <section
        id="checkout-confirmation"
        class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              Confirmation
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Confirmation turns normalized booking results into a durable,
              user-facing record that can be revisited later.
            </p>
          </div>
          {confirmation ? (
            <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
              {summary?.statusLabel || confirmation.status}
            </span>
          ) : null}
        </div>

        <div class="mt-5 space-y-4">
          <CheckoutConfirmationStatusNotice
            confirmation={confirmation}
            confirmationNotice={confirmationNotice}
          />

          {confirmation ? (
            <div class="space-y-4 rounded-xl bg-[color:var(--color-surface-muted,#f8fafc)] p-4">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="space-y-2 text-sm text-[color:var(--color-text-muted)]">
                  <p>
                    Reference{" "}
                    <span class="font-semibold text-[color:var(--color-text-strong)]">
                      {confirmation.publicRef}
                    </span>
                  </p>
                  {summary ? (
                    <p>
                      {summary.confirmedItemCount} confirmed of{" "}
                      {summary.totalItemCount} item
                      {summary.totalItemCount === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </div>

                <div class="flex flex-wrap gap-2">
                  <a
                    href={`/confirmation/${confirmation.publicRef}`}
                    class="rounded-lg bg-[color:var(--color-action)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Open confirmation
                  </a>
                  <form method="post">
                    <input type="hidden" name="intent" value="refresh-confirmation" />
                    <button
                      type="submit"
                      class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
                    >
                      Refresh confirmation
                    </button>
                  </form>
                </div>
              </div>

              <CheckoutConfirmationItemList items={confirmation.items} />
            </div>
          ) : canPrepareConfirmation ? (
            <form method="post" class="space-y-3">
              <input type="hidden" name="intent" value="create-confirmation" />
              <button
                type="submit"
                class="rounded-lg bg-[color:var(--color-action)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                Create confirmation record
              </button>
              <p class="text-sm text-[color:var(--color-text-muted)]">
                This stores the latest booking results as a durable confirmation
                record with item lineage and a public-safe reference.
              </p>
            </form>
          ) : (
            <p class="text-sm text-[color:var(--color-text-muted)]">
              Booking needs to finish in a confirmation-ready state before a
              durable confirmation can be created.
            </p>
          )}
        </div>
      </section>
    );
  },
);
