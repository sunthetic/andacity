import type { BookingConfirmationStatus } from "~/types/confirmation";

export const getConfirmationDisplayStatus = (
  status: BookingConfirmationStatus,
) => {
  switch (status) {
    case "confirmed":
      return {
        label: "Confirmed",
        description:
          "Your confirmed items are saved and ready for post-booking retrieval.",
        tone: "success" as const,
      };
    case "partial":
      return {
        label: "Partial Confirmation",
        description:
          "Some items are confirmed, while others still need follow-up.",
        tone: "warning" as const,
      };
    case "requires_manual_review":
      return {
        label: "Manual Review Required",
        description:
          "At least one item needs manual review before this confirmation is fully settled.",
        tone: "warning" as const,
      };
    case "failed":
      return {
        label: "Confirmation Failed",
        description: "We could not confirm any items from this booking run.",
        tone: "error" as const,
      };
    case "pending":
    default:
      return {
        label: "Pending Confirmation",
        description:
          "This confirmation is waiting on more booking results before it is final.",
        tone: "info" as const,
      };
  }
};
