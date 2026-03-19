import type {
  CheckoutTravelerAssignment,
  CheckoutTravelerProfile,
  RequiredTravelerGroup,
  TravelerValidationIssue,
} from "~/types/travelers";

const createAssignmentIssue = (input: {
  code: TravelerValidationIssue["code"];
  message: string;
  checkoutItemKey?: string | null;
  travelerProfileId?: string | null;
  assignmentId?: string | null;
  groupId?: string | null;
  role?: TravelerValidationIssue["role"];
}) => {
  const id = [
    "traveler-assignment",
    input.code,
    input.groupId || "group",
    input.assignmentId || "assignment",
    input.travelerProfileId || "traveler",
  ].join(":");
  return {
    id,
    code: input.code,
    message: input.message,
    severity: "error",
    checkoutItemKey: input.checkoutItemKey || null,
    travelerProfileId: input.travelerProfileId || null,
    assignmentId: input.assignmentId || null,
    groupId: input.groupId || null,
    role: input.role || null,
    field: null,
  } satisfies TravelerValidationIssue;
};

const resolveMissingCountIssueCode = (group: RequiredTravelerGroup) => {
  if (group.role === "passenger") return "PASSENGER_COUNT_MISMATCH" as const;
  if (group.role === "guest" && group.requiresPrimary) {
    return "MISSING_PRIMARY_GUEST" as const;
  }
  if (group.role === "driver") return "MISSING_PRIMARY_DRIVER" as const;
  return "TRAVELER_ASSIGNMENT_MISSING" as const;
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

export const validateCheckoutTravelerAssignments = (input: {
  requirements: RequiredTravelerGroup[];
  profiles: CheckoutTravelerProfile[];
  assignments: CheckoutTravelerAssignment[];
}): TravelerValidationIssue[] => {
  const issues: TravelerValidationIssue[] = [];
  const profilesById = new Map(input.profiles.map((profile) => [profile.id, profile]));

  for (const assignment of input.assignments) {
    if (profilesById.has(assignment.travelerProfileId)) continue;
    issues.push(
      createAssignmentIssue({
        code: "TRAVELER_ASSIGNMENT_MISSING",
        message: "Traveler assignment references a profile that no longer exists.",
        checkoutItemKey: assignment.checkoutItemKey,
        travelerProfileId: assignment.travelerProfileId,
        assignmentId: assignment.id,
        role: assignment.role,
      }),
    );
  }

  for (const group of input.requirements) {
    const assignments = matchingAssignments(input.assignments, group).filter(
      (assignment) => profilesById.has(assignment.travelerProfileId),
    );
    const uniqueTravelerIds = new Set(
      assignments.map((assignment) => assignment.travelerProfileId),
    );
    const assignedCount = uniqueTravelerIds.size;

    if (assignedCount < group.requiredCount && !group.optional) {
      const missingCount = Math.max(0, group.requiredCount - assignedCount);
      issues.push(
        createAssignmentIssue({
          code: resolveMissingCountIssueCode(group),
          message:
            group.role === "passenger"
              ? `${missingCount} passenger assignment${missingCount === 1 ? "" : "s"} still missing.`
              : group.role === "driver"
                ? "Primary driver assignment is required."
                : group.role === "guest" && group.requiresPrimary
                  ? "A primary hotel guest must be assigned."
                  : `${missingCount} traveler assignment${missingCount === 1 ? "" : "s"} still missing.`,
          checkoutItemKey: group.checkoutItemKey,
          groupId: group.id,
          role: group.role,
        }),
      );
    }

    if (group.requiresPrimary && assignments.every((entry) => !entry.isPrimary)) {
      issues.push(
        createAssignmentIssue({
          code:
            group.role === "driver"
              ? "MISSING_PRIMARY_DRIVER"
              : group.role === "guest"
                ? "MISSING_PRIMARY_GUEST"
                : "TRAVELER_ASSIGNMENT_MISSING",
          message:
            group.role === "driver"
              ? "A primary driver assignment is required."
              : "A primary traveler assignment is required.",
          checkoutItemKey: group.checkoutItemKey,
          groupId: group.id,
          role: group.role,
        }),
      );
    }
  }

  return issues;
};
