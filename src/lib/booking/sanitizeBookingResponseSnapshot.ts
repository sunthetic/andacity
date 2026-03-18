import { sanitizeBookingSnapshotValue } from "~/lib/booking/sanitizeBookingRequestSnapshot";

export const sanitizeBookingResponseSnapshot = (
  snapshot: Record<string, unknown> | null | undefined,
) => {
  if (!snapshot) return null;
  return sanitizeBookingSnapshotValue(snapshot) as Record<string, unknown>;
};
