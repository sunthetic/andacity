import { getActiveBookingRunForCheckout } from "~/lib/booking/getActiveBookingRunForCheckout";
import { getBookingExecutionKey } from "~/lib/booking/getBookingExecutionKey";
import { getLatestBookingRunForCheckout } from "~/lib/booking/getBookingRun";
import { getCheckoutSession } from "~/lib/checkout/getCheckoutSession";
import { getCheckoutReadinessState } from "~/lib/checkout/getCheckoutReadinessState";
import { isCheckoutSessionExpired } from "~/lib/checkout/isCheckoutSessionExpired";
import { attachCheckoutTravelerState } from "~/fns/travelers/attachCheckoutTravelerState";
import { canCheckoutProceedWithTravelers } from "~/fns/travelers/canCheckoutProceedWithTravelers";
import {
  getLatestCheckoutPaymentSessionRow,
  mapCheckoutPaymentSessionRow,
} from "~/lib/payments/getCheckoutPaymentSession";
import type { BookingEligibilityResult } from "~/types/booking";

const ALLOWED_PAYMENT_STATUSES = ["authorized", "succeeded"] as const;

const isAllowedPaymentStatus = (value: unknown) => {
  return ALLOWED_PAYMENT_STATUSES.includes(
    value as (typeof ALLOWED_PAYMENT_STATUSES)[number],
  );
};

export const getBookingEligibility = async (
  checkoutSessionId: string,
  options: {
    now?: Date | string | number;
  } = {},
): Promise<BookingEligibilityResult> => {
  const checkoutSession = await getCheckoutSession(checkoutSessionId, {
    now: options.now,
    includeTerminal: true,
  });
  const checkoutWithTravelers = checkoutSession
    ? await attachCheckoutTravelerState(checkoutSession)
    : checkoutSession;

  if (!checkoutWithTravelers) {
    return {
      ok: false,
      code: "CHECKOUT_NOT_FOUND",
      message: "Checkout session could not be found.",
      checkoutSession: null,
      paymentSession: null,
      executionKey: null,
      activeBookingRun: null,
      completedBookingRun: null,
    };
  }

  if (isCheckoutSessionExpired(checkoutWithTravelers, options.now)) {
    return {
      ok: false,
      code: "CHECKOUT_EXPIRED",
      message: "Checkout expired before booking could begin.",
      checkoutSession: checkoutWithTravelers,
      paymentSession: null,
      executionKey: null,
      activeBookingRun: null,
      completedBookingRun: null,
    };
  }

  if (
    checkoutWithTravelers.status !== "ready" ||
    getCheckoutReadinessState(checkoutWithTravelers, options) !== "ready"
  ) {
    return {
      ok: false,
      code: "CHECKOUT_NOT_READY",
      message:
        "Booking can only begin after the latest checkout revalidation passes.",
      checkoutSession: checkoutWithTravelers,
      paymentSession: null,
      executionKey: null,
      activeBookingRun: null,
      completedBookingRun: null,
    };
  }

  if (
    !canCheckoutProceedWithTravelers(
      checkoutWithTravelers.travelerValidationSummary || null,
    )
  ) {
    return {
      ok: false,
      code: "CHECKOUT_TRAVELERS_INCOMPLETE",
      message:
        "Booking is blocked until required traveler details are complete and valid.",
      checkoutSession: checkoutWithTravelers,
      paymentSession: null,
      executionKey: null,
      activeBookingRun: null,
      completedBookingRun: null,
    };
  }

  const activeBookingRun = await getActiveBookingRunForCheckout(
    checkoutWithTravelers.id,
  );
  const latestBookingRun = await getLatestBookingRunForCheckout(
    checkoutWithTravelers.id,
    {
      includeTerminal: true,
    },
  );
  const completedBookingRun =
    latestBookingRun?.summary?.overallStatus === "succeeded" ||
    latestBookingRun?.status === "succeeded"
      ? latestBookingRun
      : null;

  if (completedBookingRun) {
    return {
      ok: false,
      code: "BOOKING_ALREADY_COMPLETED",
      message: "This checkout already has a completed booking run.",
      checkoutSession: checkoutWithTravelers,
      paymentSession: null,
      executionKey: null,
      activeBookingRun,
      completedBookingRun,
    };
  }

  if (activeBookingRun) {
    return {
      ok: false,
      code: "BOOKING_ALREADY_IN_PROGRESS",
      message: "A booking run is already in progress for this checkout.",
      checkoutSession: checkoutWithTravelers,
      paymentSession: null,
      executionKey: null,
      activeBookingRun,
      completedBookingRun,
    };
  }

  const latestPaymentRow = await getLatestCheckoutPaymentSessionRow(
    checkoutWithTravelers.id,
    {
      includeTerminal: true,
    },
  );
  const paymentSession = latestPaymentRow
    ? mapCheckoutPaymentSessionRow(latestPaymentRow)
    : null;

  if (!paymentSession) {
    return {
      ok: false,
      code: "PAYMENT_NOT_FOUND",
      message: "No checkout payment session is available for booking.",
      checkoutSession: checkoutWithTravelers,
      paymentSession: null,
      executionKey: null,
      activeBookingRun,
      completedBookingRun,
    };
  }

  if (!isAllowedPaymentStatus(paymentSession.status)) {
    return {
      ok: false,
      code: "PAYMENT_NOT_AUTHORIZED",
      message:
        "Booking can only begin after payment is authorized or completed.",
      checkoutSession: checkoutWithTravelers,
      paymentSession,
      executionKey: null,
      activeBookingRun,
      completedBookingRun,
    };
  }

  const executionKey = getBookingExecutionKey(
    checkoutWithTravelers,
    paymentSession,
  );

  return {
    ok: true,
    code: "BOOKING_ELIGIBLE",
    message: "Checkout is eligible for booking execution.",
    checkoutSession: checkoutWithTravelers,
    paymentSession,
    executionKey,
    activeBookingRun,
    completedBookingRun,
  };
};
