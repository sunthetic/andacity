import { $, component$, useSignal } from "@builder.io/qwik";
import { AsyncPendingButton } from "~/components/async/AsyncPendingButton";
import { RecoveryActionList } from "~/components/recovery/RecoveryActionList";
import { fromBookingState } from "~/fns/recovery/fromBookingState";
import { fromCheckoutState } from "~/fns/recovery/fromCheckoutState";
import { fromConfirmationState } from "~/fns/recovery/fromConfirmationState";
import { fromPaymentState } from "~/fns/recovery/fromPaymentState";
import { fromRevalidationState } from "~/fns/recovery/fromRevalidationState";
import { getPrimaryRecoveryAction } from "~/fns/recovery/getPrimaryRecoveryAction";
import { getSecondaryRecoveryActions } from "~/fns/recovery/getSecondaryRecoveryActions";
import type { CheckoutBookingSummary } from "~/types/booking";
import type { BookingConfirmation } from "~/types/confirmation";
import type {
  CheckoutRevalidationSummary,
  CheckoutSessionSummary,
} from "~/types/checkout";
import type { CheckoutPaymentSummary } from "~/types/payment";

const isRetryAllowed = (summary: CheckoutSessionSummary) => {
  return (
    summary.status !== "expired" &&
    summary.status !== "completed" &&
    summary.status !== "abandoned"
  );
};

const canPrepareConfirmation = (
  summary: CheckoutSessionSummary,
  bookingSummary: CheckoutBookingSummary,
) => {
  return (
    !summary.hasConfirmation &&
    Boolean(bookingSummary.run) &&
    (bookingSummary.status === "succeeded" ||
      bookingSummary.status === "partial" ||
      bookingSummary.status === "requires_manual_review")
  );
};

export const CheckoutActionBar = component$(
  (props: {
    summary: CheckoutSessionSummary;
    paymentSummary: CheckoutPaymentSummary;
    bookingSummary: CheckoutBookingSummary;
    confirmation?: BookingConfirmation | null;
    revalidationSummary?: CheckoutRevalidationSummary | null;
  }) => {
    const pending = useSignal(false);
    const activeRecovery =
      fromCheckoutState({ summary: props.summary }) ||
      fromRevalidationState({
        summary: props.summary,
        revalidationSummary: props.revalidationSummary,
      }) ||
      fromPaymentState({
        paymentSummary: props.paymentSummary,
        checkoutSessionId: props.summary.id,
        tripHref: props.summary.tripHref,
      }) ||
      fromBookingState({
        bookingSummary: props.bookingSummary,
        checkoutSessionId: props.summary.id,
        tripHref: props.summary.tripHref,
        confirmationRef: props.summary.confirmationPublicRef,
      }) ||
      fromConfirmationState({
        confirmation: props.confirmation || null,
        bookingStatus: props.bookingSummary.status,
        tripHref: props.summary.tripHref,
      });
    const primaryRecoveryAction = getPrimaryRecoveryAction(activeRecovery);
    const secondaryRecoveryActions =
      getSecondaryRecoveryActions(activeRecovery);
    const onSubmit$ = $(() => {
      if (!isRetryAllowed(props.summary) || pending.value) return;
      pending.value = true;
    });

    return (
      <aside class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          Next step
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {activeRecovery
            ? activeRecovery.message
            : props.summary.hasConfirmation
              ? "Your durable confirmation record is ready to open."
              : props.summary.hasCompleteTravelerDetails === false
                ? "Complete traveler details and assignments before payment can begin."
              : !props.paymentSummary.checkoutReady
                ? "Payment stays blocked until the latest pricing and availability check passes."
                : props.paymentSummary.status == null
                  ? "Initialize a payment session from the current checkout totals."
                  : props.bookingSummary.canExecute
                    ? "Payment is authorized. Complete booking to start the server-backed booking run."
                    : canPrepareConfirmation(
                          props.summary,
                          props.bookingSummary,
                        )
                      ? "Booking is confirmation-ready. Create the durable confirmation record next."
                      : props.bookingSummary.isProcessing
                        ? "Booking is already running. Refresh the checkout page to review the latest item statuses."
                        : props.bookingSummary.hasCompletedBooking
                          ? "Booking completed for this checkout."
                          : "Continue or refresh the active payment session below."}
        </p>

        <div class="mt-5 space-y-3">
          {activeRecovery ? (
            <RecoveryActionList
              actions={[
                ...(primaryRecoveryAction ? [primaryRecoveryAction] : []),
                ...secondaryRecoveryActions,
              ]}
            />
          ) : props.summary.hasConfirmation &&
            props.summary.confirmationPublicRef ? (
            <a
              href={`/confirmation/${props.summary.confirmationPublicRef}`}
              class="block w-full rounded-lg bg-[color:var(--color-action)] px-3 py-2 text-center text-sm font-medium text-white hover:opacity-90"
            >
              View confirmation
            </a>
          ) : canPrepareConfirmation(props.summary, props.bookingSummary) ? (
            <form method="post" onSubmit$={onSubmit$}>
              <input type="hidden" name="intent" value="create-confirmation" />
              <AsyncPendingButton
                type="submit"
                pending={pending.value}
                pendingLabel="Creating confirmation"
                class="w-full rounded-lg bg-[color:var(--color-action)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Create confirmation
              </AsyncPendingButton>
            </form>
          ) : props.bookingSummary.canExecute ? (
            <form method="post" onSubmit$={onSubmit$}>
              <input type="hidden" name="intent" value="execute-booking" />
              <AsyncPendingButton
                type="submit"
                pending={pending.value}
                pendingLabel="Starting booking"
                class="w-full rounded-lg bg-[color:var(--color-action)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Complete booking
              </AsyncPendingButton>
            </form>
          ) : (
            <a
              href={
                props.summary.hasCompleteTravelerDetails === false
                  ? "#checkout-travelers"
                  : props.paymentSummary.checkoutReady &&
                (props.paymentSummary.status === "authorized" ||
                  props.paymentSummary.status === "succeeded" ||
                  props.bookingSummary.run)
                  ? "#checkout-booking"
                  : "#checkout-payment"
              }
              class="block w-full rounded-lg bg-[color:var(--color-action)] px-3 py-2 text-center text-sm font-medium text-white hover:opacity-90"
            >
              {props.paymentSummary.checkoutReady
                ? props.summary.hasCompleteTravelerDetails === false
                  ? "Open traveler section"
                  : props.paymentSummary.status == null
                  ? "Start payment"
                  : props.bookingSummary.run
                    ? "Open booking section"
                    : "Open payment section"
                : "Review checkout blockers"}
            </a>
          )}

          {!activeRecovery && isRetryAllowed(props.summary) ? (
            <form method="post" onSubmit$={onSubmit$}>
              <input type="hidden" name="intent" value="revalidate" />
              <AsyncPendingButton
                type="submit"
                pending={pending.value}
                pendingLabel="Rechecking availability"
                class="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
              >
                Recheck availability
              </AsyncPendingButton>
            </form>
          ) : null}

          {!activeRecovery ? (
            <a
              href={props.summary.tripHref}
              class="block w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-center text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
            >
              Return to trip
            </a>
          ) : null}
        </div>
      </aside>
    );
  },
);
