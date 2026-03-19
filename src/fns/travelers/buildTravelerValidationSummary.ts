import type {
  TravelerValidationIssue,
  TravelerValidationSummary,
} from "~/types/travelers";
import { normalizeTimestamp } from "~/fns/travelers/shared";

const INCOMPLETE_CODES = new Set<TravelerValidationIssue["code"]>([
  "MISSING_REQUIRED_FIELD",
  "MISSING_PRIMARY_GUEST",
  "MISSING_PRIMARY_DRIVER",
  "PASSENGER_COUNT_MISMATCH",
  "TRAVELER_ASSIGNMENT_MISSING",
  "DOCUMENT_REQUIRED",
]);

const INVALID_CODES = new Set<TravelerValidationIssue["code"]>([
  "INVALID_DATE_OF_BIRTH",
  "INVALID_EMAIL",
  "INVALID_PHONE",
  "DOCUMENT_EXPIRED",
  "DRIVER_AGE_INVALID",
]);

export const buildTravelerValidationSummary = (input: {
  issues: TravelerValidationIssue[];
  now?: Date | string | null;
}): TravelerValidationSummary => {
  const issues = input.issues;
  const hasIssues = issues.length > 0;
  const hasInvalid = issues.some((issue) => INVALID_CODES.has(issue.code));
  const hasIncomplete = issues.some((issue) => INCOMPLETE_CODES.has(issue.code));
  const assignmentMismatchCount = issues.filter(
    (issue) =>
      issue.code === "PASSENGER_COUNT_MISMATCH" ||
      issue.code === "TRAVELER_ASSIGNMENT_MISSING" ||
      issue.code === "MISSING_PRIMARY_GUEST" ||
      issue.code === "MISSING_PRIMARY_DRIVER",
  ).length;
  const missingTravelerCount = issues.filter((issue) =>
    INCOMPLETE_CODES.has(issue.code),
  ).length;
  const invalidTravelerCount = issues.filter((issue) =>
    INVALID_CODES.has(issue.code),
  ).length;

  return {
    status: hasIssues ? (hasInvalid ? "invalid" : hasIncomplete ? "incomplete" : "invalid") : "complete",
    checkedAt: normalizeTimestamp(input.now),
    hasBlockingIssues: hasIssues,
    issueCount: issues.length,
    missingTravelerCount,
    invalidTravelerCount,
    assignmentMismatchCount,
    issues,
  };
};
