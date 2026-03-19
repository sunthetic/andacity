import { canCheckoutProceedWithTravelers } from "~/fns/travelers/canCheckoutProceedWithTravelers";
import { validateCheckoutTravelers } from "~/fns/travelers/validateCheckoutTravelers";
import type { CheckoutItemSnapshot } from "~/types/checkout";
import type {
  CheckoutTravelerAssignment,
  CheckoutTravelerCollection,
  CheckoutTravelerProfile,
} from "~/types/travelers";

export const buildCheckoutTravelerCollection = async (input: {
  checkoutSessionId: string;
  checkoutItems: CheckoutItemSnapshot[];
  profiles?: CheckoutTravelerProfile[] | null;
  assignments?: CheckoutTravelerAssignment[] | null;
  now?: Date | string | null;
}): Promise<CheckoutTravelerCollection> => {
  const validated = await validateCheckoutTravelers({
    checkoutSessionId: input.checkoutSessionId,
    checkoutItems: input.checkoutItems,
    profiles: input.profiles,
    assignments: input.assignments,
    now: input.now,
  });

  return {
    checkoutSessionId: input.checkoutSessionId,
    requirements: validated.requirements,
    profiles: validated.profiles,
    assignments: validated.assignments,
    validationSummary: validated.validationSummary,
    hasCompleteTravelerDetails: canCheckoutProceedWithTravelers(
      validated.validationSummary,
    ),
  };
};
