import { canRetryTransactionAction } from "~/fns/recovery/canRetryTransactionAction";
import type {
  RecoveryAction,
  RecoveryActionType,
  RecoveryMetadata,
  RecoveryReasonCode,
  RecoveryStage,
} from "~/types/recovery";

const ACTION_COPY: Record<
  RecoveryActionType,
  {
    label: string;
    description: string;
  }
> = {
  retry: {
    label: "Retry",
    description: "Try this step again using the latest persisted state.",
  },
  revalidate: {
    label: "Recheck availability",
    description: "Run checkout revalidation again before continuing.",
  },
  complete_travelers: {
    label: "Complete traveler details",
    description:
      "Open traveler details and finish required fields and assignments.",
  },
  return_to_trip: {
    label: "Return to trip",
    description: "Go back to the saved trip and review the latest items.",
  },
  resume_checkout: {
    label: "Resume checkout",
    description: "Open the current checkout session and continue from there.",
  },
  resume_payment: {
    label: "Resume payment",
    description: "Return to the payment step for the latest checkout totals.",
  },
  resume_booking: {
    label: "Resume booking",
    description: "Continue the server-backed booking step from this checkout.",
  },
  view_confirmation: {
    label: "View confirmation",
    description: "Open the durable confirmation record and review saved items.",
  },
  view_itinerary: {
    label: "View itinerary",
    description: "Open the durable itinerary created from confirmed items.",
  },
  start_new_search: {
    label: "Start a new search",
    description: "Search again for alternatives outside the current trip.",
  },
  manual_review: {
    label: "Manual review",
    description: "Review the items that still need manual follow-up.",
  },
  contact_support: {
    label: "Contact support",
    description: "Share the saved references with support for follow-up.",
  },
};

const buildAction = (input: {
  type: RecoveryActionType;
  emphasis: "primary" | "secondary";
  href?: string | null;
  intent?: string | null;
  label?: string;
  description?: string;
  disabled?: boolean;
}): RecoveryAction => {
  const fallback = ACTION_COPY[input.type];
  return {
    type: input.type,
    label: input.label || fallback.label,
    description: input.description || fallback.description,
    href: input.href ?? null,
    intent: input.intent ?? null,
    emphasis: input.emphasis,
    disabled: input.disabled,
  };
};

const actionHrefForType = (
  type: RecoveryActionType,
  metadata: RecoveryMetadata,
) => {
  switch (type) {
    case "return_to_trip":
      return typeof metadata.tripHref === "string"
        ? metadata.tripHref
        : "/trips";
    case "resume_checkout":
    case "resume_payment":
    case "resume_booking":
      return typeof metadata.checkoutSessionId === "string" &&
        metadata.checkoutSessionId
        ? `/checkout/${metadata.checkoutSessionId}`
        : null;
    case "complete_travelers":
      return typeof metadata.checkoutSessionId === "string" &&
        metadata.checkoutSessionId
        ? `/checkout/${metadata.checkoutSessionId}#checkout-travelers`
        : null;
    case "view_confirmation":
      return typeof metadata.confirmationHref === "string"
        ? metadata.confirmationHref
        : typeof metadata.confirmationRef === "string" &&
            metadata.confirmationRef
          ? `/confirmation/${metadata.confirmationRef}`
          : null;
    case "view_itinerary":
      return typeof metadata.itineraryHref === "string"
        ? metadata.itineraryHref
        : typeof metadata.itineraryRef === "string" && metadata.itineraryRef
          ? `/itinerary/${metadata.itineraryRef}`
          : null;
    case "start_new_search":
      return "/";
    default:
      return null;
  }
};

const actionIntentForType = (
  type: RecoveryActionType,
  stage: RecoveryStage,
) => {
  switch (type) {
    case "retry":
      if (stage === "payment") return "create-payment";
      if (stage === "booking") return "execute-booking";
      if (stage === "confirmation") return "create-confirmation";
      if (stage === "itinerary") return "create-itinerary";
      return null;
    case "revalidate":
      return "revalidate";
    case "resume_payment":
      return "create-payment";
    case "resume_booking":
      return "execute-booking";
    default:
      return null;
  }
};

const actionPlanByReason = (
  reasonCode: RecoveryReasonCode,
): RecoveryActionType[] => {
  switch (reasonCode) {
    case "TRIP_EMPTY":
      return ["return_to_trip", "start_new_search"];
    case "TRIP_NOT_FOUND":
    case "TRIP_INVALID":
      return ["return_to_trip", "start_new_search"];
    case "CHECKOUT_EXPIRED":
      return ["return_to_trip", "resume_checkout"];
    case "CHECKOUT_NOT_FOUND":
      return ["return_to_trip", "start_new_search"];
    case "CHECKOUT_NOT_READY":
      return ["revalidate", "return_to_trip"];
    case "CHECKOUT_TRAVELERS_INCOMPLETE":
    case "CHECKOUT_TRAVELERS_INVALID":
    case "TRAVELER_ASSIGNMENT_MISMATCH":
      return ["complete_travelers", "revalidate", "return_to_trip"];
    case "CHECKOUT_CREATE_FAILED":
    case "CHECKOUT_RESUME_FAILED":
      return ["resume_checkout", "return_to_trip"];
    case "REVALIDATION_FAILED":
      return ["revalidate", "return_to_trip"];
    case "PRICE_CHANGED":
      return ["revalidate", "return_to_trip"];
    case "INVENTORY_UNAVAILABLE":
      return ["return_to_trip", "start_new_search"];
    case "PAYMENT_PROVIDER_UNAVAILABLE":
    case "PAYMENT_FAILED":
      return ["resume_payment", "return_to_trip"];
    case "PAYMENT_REQUIRES_ACTION":
      return ["resume_payment", "return_to_trip"];
    case "PAYMENT_SESSION_STALE":
      return ["resume_payment", "revalidate"];
    case "BOOKING_PARTIAL":
      return ["view_confirmation", "manual_review", "return_to_trip"];
    case "BOOKING_FAILED":
      return ["resume_booking", "return_to_trip"];
    case "BOOKING_REQUIRES_MANUAL_REVIEW":
      return ["view_confirmation", "manual_review", "contact_support"];
    case "CONFIRMATION_PENDING":
      return ["view_confirmation", "return_to_trip"];
    case "CONFIRMATION_FAILED":
      return ["retry", "return_to_trip"];
    case "ITINERARY_CREATE_FAILED":
      return ["retry", "view_confirmation"];
    case "UNKNOWN_TRANSACTION_ERROR":
    default:
      return ["retry", "return_to_trip"];
  }
};

export const getRecoveryActions = (input: {
  stage: RecoveryStage;
  reasonCode: RecoveryReasonCode;
  metadata?: RecoveryMetadata;
}): RecoveryAction[] => {
  const metadata = input.metadata || {};

  return actionPlanByReason(input.reasonCode)
    .map((type, index) => {
      const action = buildAction({
        type,
        emphasis: index === 0 ? "primary" : "secondary",
        href: actionHrefForType(type, metadata),
        intent: actionIntentForType(type, input.stage),
      });
      const allowed = canRetryTransactionAction({
        actionType: action.type,
        stage: input.stage,
        metadata,
      });

      if (!allowed) {
        if (
          action.type === "resume_checkout" ||
          action.type === "resume_payment"
        ) {
          return null;
        }
        return {
          ...action,
          disabled: true,
        };
      }

      if (
        !action.href &&
        !action.intent &&
        action.type !== "manual_review" &&
        action.type !== "contact_support"
      ) {
        return null;
      }

      return action;
    })
    .filter((action): action is RecoveryAction => Boolean(action));
};
