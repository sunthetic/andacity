import { component$ } from "@builder.io/qwik";
import { StripeElementsProvider } from "~/components/payments/StripeElementsProvider";
import type { CheckoutBookingSummary } from "~/types/booking";
import type { CheckoutPaymentSummary } from "~/types/payment";

export const CheckoutPaymentMethodForm = component$(
  (props: {
    paymentSummary: CheckoutPaymentSummary;
    bookingSummary: CheckoutBookingSummary;
  }) => {
    const { paymentSummary, bookingSummary } = props;

    if (!paymentSummary.checkoutReady) {
      return (
        <p class="text-sm text-[color:var(--color-text-muted)]">
          {paymentSummary.blockedReason ||
            "Payment is unavailable until checkout is ready."}
        </p>
      );
    }

    if (paymentSummary.canInitialize) {
      return (
        <form method="post" class="space-y-3">
          <input type="hidden" name="intent" value="create-payment" />
          <button
            type="submit"
            class="w-full rounded-lg bg-[color:var(--color-action)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Initialize secure payment
          </button>
          <p class="text-sm text-[color:var(--color-text-muted)]">
            This creates a provider-backed payment session from the latest
            revalidated checkout totals.
          </p>
        </form>
      );
    }

    const supportsStripeForm =
      paymentSummary.provider === "stripe" &&
      paymentSummary.clientSecret &&
      (paymentSummary.status === "draft" ||
        paymentSummary.status === "pending" ||
        paymentSummary.status === "requires_action");

    return (
      <div class="space-y-4">
        {supportsStripeForm ? (
          <StripeElementsProvider
            clientSecret={paymentSummary.clientSecret}
            amountLabel={paymentSummary.amountLabel}
          />
        ) : (
          <p class="text-sm text-[color:var(--color-text-muted)]">
            {paymentSummary.status === "authorized" ||
            paymentSummary.status === "succeeded"
              ? bookingSummary.hasCompletedBooking
                ? "Payment and booking are both complete for this checkout."
                : "Payment is ready. Continue to the booking step below."
              : "Resume or refresh the current payment session below."}
          </p>
        )}

        <div class="flex flex-wrap gap-3">
          {paymentSummary.canRefresh ? (
            <form method="post">
              <input type="hidden" name="intent" value="refresh-payment" />
              <button
                type="submit"
                class="rounded-lg border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
              >
                Refresh payment status
              </button>
            </form>
          ) : null}

          {paymentSummary.canCancel ? (
            <form method="post">
              <input type="hidden" name="intent" value="cancel-payment" />
              <button
                type="submit"
                class="rounded-lg border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:#b91c1c] hover:text-[color:#b91c1c]"
              >
                Cancel payment session
              </button>
            </form>
          ) : null}
        </div>
      </div>
    );
  },
);
