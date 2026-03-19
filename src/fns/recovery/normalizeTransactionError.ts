import { mapBookingAdapterError } from "~/lib/booking/mapBookingAdapterError";
import { CheckoutSessionTransitionError } from "~/lib/checkout/createOrResumeCheckoutSession";
import { CheckoutSessionError } from "~/lib/checkout/getCheckoutSession";
import { CheckoutPaymentSessionError } from "~/lib/payments/createCheckoutPaymentSession";
import type { TransactionError } from "~/types/transaction-error";
import type { RecoveryReasonCode, RecoveryStage } from "~/types/recovery";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object";
};

const normalizeReasonCode = (
  code: string,
  stage: RecoveryStage,
): RecoveryReasonCode => {
  switch (code) {
    case "TRIP_EMPTY":
    case "TRIP_NOT_FOUND":
    case "TRIP_INVALID":
    case "CHECKOUT_EXPIRED":
    case "CHECKOUT_NOT_FOUND":
    case "CHECKOUT_NOT_READY":
    case "CHECKOUT_CREATE_FAILED":
    case "CHECKOUT_RESUME_FAILED":
    case "REVALIDATION_FAILED":
    case "PRICE_CHANGED":
    case "INVENTORY_UNAVAILABLE":
    case "PAYMENT_PROVIDER_UNAVAILABLE":
    case "PAYMENT_FAILED":
    case "PAYMENT_REQUIRES_ACTION":
    case "PAYMENT_SESSION_STALE":
    case "BOOKING_PARTIAL":
    case "BOOKING_FAILED":
    case "BOOKING_REQUIRES_MANUAL_REVIEW":
    case "CONFIRMATION_PENDING":
    case "CONFIRMATION_FAILED":
    case "ITINERARY_CREATE_FAILED":
      return code;
    case "PAYMENT_INTENT_CREATE_FAILED":
    case "PAYMENT_SESSION_CANCELED":
      return "PAYMENT_FAILED";
    case "BOOKING_ALREADY_IN_PROGRESS":
      return "BOOKING_FAILED";
    case "BOOKING_INELIGIBLE":
      return "CHECKOUT_NOT_READY";
    case "CONFIRMATION_INELIGIBLE":
      return "CONFIRMATION_FAILED";
    case "ITINERARY_INELIGIBLE":
      return "ITINERARY_CREATE_FAILED";
    default:
      if (stage === "payment") return "PAYMENT_FAILED";
      if (stage === "booking") return "BOOKING_FAILED";
      if (stage === "confirmation") return "CONFIRMATION_FAILED";
      if (stage === "itinerary") return "ITINERARY_CREATE_FAILED";
      return "UNKNOWN_TRANSACTION_ERROR";
  }
};

export const normalizeTransactionError = (
  error: unknown,
  defaults: {
    stage: RecoveryStage;
    code?: RecoveryReasonCode;
    safeUserMessage?: string;
  },
): TransactionError => {
  if (error instanceof CheckoutSessionTransitionError) {
    return {
      code: normalizeReasonCode(error.code, defaults.stage),
      stage: defaults.stage,
      message: error.message,
      retryable: true,
      safeUserMessage:
        defaults.safeUserMessage ||
        "Checkout could not be continued right now.",
      details: {
        rawCode: error.code,
      },
    };
  }

  if (error instanceof CheckoutPaymentSessionError) {
    return {
      code: normalizeReasonCode(error.code, defaults.stage),
      stage: defaults.stage,
      message: error.message,
      retryable:
        error.code !== "CHECKOUT_EXPIRED" &&
        error.code !== "CHECKOUT_NOT_READY",
      safeUserMessage:
        defaults.safeUserMessage || "Payment could not be prepared right now.",
      details: {
        rawCode: error.code,
      },
    };
  }

  if (error instanceof CheckoutSessionError) {
    return {
      code: defaults.code || "UNKNOWN_TRANSACTION_ERROR",
      stage: defaults.stage,
      message: error.message,
      retryable: false,
      safeUserMessage:
        defaults.safeUserMessage ||
        "The saved checkout record could not be loaded safely.",
      details: {
        rawCode: error.code,
      },
    };
  }

  if (defaults.stage === "booking") {
    const bookingError = mapBookingAdapterError(error);
    return {
      code: normalizeReasonCode(bookingError.errorCode, defaults.stage),
      stage: defaults.stage,
      message: bookingError.errorMessage,
      retryable: bookingError.errorCode !== "INVENTORY_UNAVAILABLE",
      safeUserMessage:
        defaults.safeUserMessage || "Booking could not be completed right now.",
      details: {
        rawCode: bookingError.errorCode,
      },
    };
  }

  const source = isRecord(error) ? error : null;
  const message =
    ((typeof source?.message === "string" ||
      typeof source?.message === "number") &&
      String(source.message).trim()) ||
    (error instanceof Error && error.message.trim()) ||
    defaults.safeUserMessage ||
    "The transaction step could not be completed.";
  const rawCode =
    (typeof source?.code === "string" || typeof source?.code === "number") &&
    String(source.code).trim()
      ? String(source.code).trim()
      : null;

  return {
    code: defaults.code || normalizeReasonCode(rawCode || "", defaults.stage),
    stage: defaults.stage,
    message,
    retryable: true,
    safeUserMessage:
      defaults.safeUserMessage ||
      "The transaction step could not be completed.",
    details: rawCode
      ? {
          rawCode,
        }
      : null,
  };
};
