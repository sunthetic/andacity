import { buildCheckoutTravelerCollection } from "~/fns/travelers/buildCheckoutTravelerCollection";
import type { CheckoutSession } from "~/types/checkout";
import type { CheckoutTravelerPageModel } from "~/types/travelers";

export const getCheckoutTravelerPageModel = async (
  checkoutSession: CheckoutSession,
): Promise<CheckoutTravelerPageModel> => {
  const collection = await buildCheckoutTravelerCollection({
    checkoutSessionId: checkoutSession.id,
    checkoutItems: checkoutSession.items,
  });
  const requirementStates = collection.requirements.map((requirement) => {
    const assignments = collection.assignments.filter(
      (assignment) =>
        assignment.role === requirement.role &&
        assignment.checkoutItemKey === requirement.checkoutItemKey,
    );
    const assignedProfiles = assignments
      .map((assignment) =>
        collection.profiles.find(
          (profile) => profile.id === assignment.travelerProfileId,
        ),
      )
      .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));
    const assignedCount = new Set(assignedProfiles.map((profile) => profile.id))
      .size;

    return {
      requirement,
      assignedProfiles,
      assignedCount,
      remainingCount: Math.max(0, requirement.requiredCount - assignedCount),
      hasPrimaryAssignment: assignments.some((assignment) => assignment.isPrimary),
    };
  });

  return {
    checkoutSessionId: collection.checkoutSessionId,
    requirements: collection.requirements,
    requirementStates,
    profiles: collection.profiles,
    assignments: collection.assignments,
    validationSummary: collection.validationSummary,
    hasCompleteTravelerDetails: collection.hasCompleteTravelerDetails,
  };
};
