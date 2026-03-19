import type {
  CheckoutTravelerCollection,
  TravelerValidationSummary,
} from "~/types/travelers";

export const canCheckoutProceedWithTravelers = (
  value:
    | TravelerValidationSummary
    | Pick<CheckoutTravelerCollection, "validationSummary">
    | null
    | undefined,
) => {
  const summary = value
    ? "validationSummary" in value
      ? value.validationSummary
      : value
    : null;

  if (!summary) return false;
  if (summary.hasBlockingIssues) return false;
  return summary.status === "complete";
};
