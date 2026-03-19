import { buildTravelerValidationSummary } from "~/fns/travelers/buildTravelerValidationSummary";
import { getCheckoutTravelerRequirements } from "~/fns/travelers/getCheckoutTravelerRequirements";
import { getCheckoutTravelerAssignments } from "~/fns/travelers/getCheckoutTravelerAssignments";
import { getCheckoutTravelers } from "~/fns/travelers/getCheckoutTravelers";
import { validateCheckoutTravelerAssignments } from "~/fns/travelers/validateCheckoutTravelerAssignments";
import { validateCheckoutTravelerProfile } from "~/fns/travelers/validateCheckoutTravelerProfile";
import type { CheckoutItemSnapshot } from "~/types/checkout";
import type {
  CheckoutTravelerAssignment,
  CheckoutTravelerProfile,
  RequiredTravelerGroup,
  TravelerValidationSummary,
} from "~/types/travelers";

export type ValidateCheckoutTravelersResult = {
  requirements: RequiredTravelerGroup[];
  profiles: CheckoutTravelerProfile[];
  assignments: CheckoutTravelerAssignment[];
  validationSummary: TravelerValidationSummary;
};

const matchingAssignments = (
  assignments: CheckoutTravelerAssignment[],
  group: RequiredTravelerGroup,
) => {
  return assignments.filter((assignment) => {
    if (assignment.role !== group.role) return false;
    if (group.checkoutItemKey == null) {
      return assignment.checkoutItemKey == null;
    }
    return assignment.checkoutItemKey === group.checkoutItemKey;
  });
};

export const validateCheckoutTravelers = async (input: {
  checkoutSessionId: string;
  checkoutItems: CheckoutItemSnapshot[];
  profiles?: CheckoutTravelerProfile[] | null;
  assignments?: CheckoutTravelerAssignment[] | null;
  now?: Date | string | null;
}): Promise<ValidateCheckoutTravelersResult> => {
  const profiles =
    input.profiles ||
    (await getCheckoutTravelers(String(input.checkoutSessionId || "").trim()));
  const assignments =
    input.assignments ||
    (await getCheckoutTravelerAssignments(
      String(input.checkoutSessionId || "").trim(),
    ));
  const requirements = getCheckoutTravelerRequirements(input.checkoutItems);
  const profileIssues = requirements.flatMap((group) => {
    const assigned = matchingAssignments(assignments, group);
    const requiresPassport = Boolean(group.metadata?.requiresPassport);
    const minimumDriverAge =
      typeof group.metadata?.minimumDriverAge === "number"
        ? group.metadata.minimumDriverAge
        : null;

    return assigned.flatMap((assignment) => {
      const profile = profiles.find(
        (entry) => entry.id === assignment.travelerProfileId,
      );
      if (!profile) return [];

      return validateCheckoutTravelerProfile({
        profile,
        requiredFields: group.requiredFields,
        checkoutItemKey: group.checkoutItemKey,
        role: group.role,
        groupId: group.id,
        minimumDriverAge,
        requiresPassport,
      });
    });
  });

  const assignmentIssues = validateCheckoutTravelerAssignments({
    requirements,
    profiles,
    assignments,
  });
  const validationSummary = buildTravelerValidationSummary({
    issues: [...profileIssues, ...assignmentIssues],
    now: input.now,
  });

  return {
    requirements,
    profiles,
    assignments,
    validationSummary,
  };
};
