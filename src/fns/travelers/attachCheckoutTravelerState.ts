import { buildCheckoutTravelerCollection } from "~/fns/travelers/buildCheckoutTravelerCollection";
import type { CheckoutSession } from "~/types/checkout";

export const attachCheckoutTravelerState = async (
  checkoutSession: CheckoutSession,
): Promise<CheckoutSession> => {
  const collection = await buildCheckoutTravelerCollection({
    checkoutSessionId: checkoutSession.id,
    checkoutItems: checkoutSession.items,
  });

  return {
    ...checkoutSession,
    travelerValidationStatus: collection.validationSummary.status,
    travelerValidationSummary: collection.validationSummary,
    hasCompleteTravelerDetails: collection.hasCompleteTravelerDetails,
  };
};
