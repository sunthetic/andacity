import type { CheckoutTravelerProfile } from "~/types/travelers";

const REDACTED = "[REDACTED]";

const maskText = (value: string | null, visibleEnd = 2) => {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.length <= visibleEnd) return REDACTED;
  return `${REDACTED}${normalized.slice(-visibleEnd)}`;
};

export const sanitizeTravelerForLogs = (
  traveler: CheckoutTravelerProfile,
): Record<string, unknown> => {
  return {
    id: traveler.id,
    checkoutSessionId: traveler.checkoutSessionId,
    type: traveler.type,
    role: traveler.role,
    firstName: maskText(traveler.firstName, 1),
    middleName: traveler.middleName ? REDACTED : null,
    lastName: maskText(traveler.lastName, 1),
    dateOfBirth: traveler.dateOfBirth ? REDACTED : null,
    email: traveler.email ? REDACTED : null,
    phone: traveler.phone ? REDACTED : null,
    nationality: traveler.nationality ? traveler.nationality.toUpperCase() : null,
    documentType: traveler.documentType,
    documentNumber: traveler.documentNumber ? REDACTED : null,
    documentExpiryDate: traveler.documentExpiryDate ? REDACTED : null,
    issuingCountry: traveler.issuingCountry
      ? traveler.issuingCountry.toUpperCase()
      : null,
    knownTravelerNumber: maskText(traveler.knownTravelerNumber),
    redressNumber: maskText(traveler.redressNumber),
    driverAge: traveler.driverAge,
    createdAt: traveler.createdAt,
    updatedAt: traveler.updatedAt,
  };
};
