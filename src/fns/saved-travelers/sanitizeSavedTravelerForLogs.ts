import type { SavedTravelerProfile } from "~/types/saved-travelers";

const REDACTED = "[REDACTED]";

const maskText = (value: string | null, visibleEnd = 2) => {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.length <= visibleEnd) return REDACTED;
  return `${REDACTED}${normalized.slice(-visibleEnd)}`;
};

export const sanitizeSavedTravelerForLogs = (
  traveler: SavedTravelerProfile,
): Record<string, unknown> => {
  return {
    id: traveler.id,
    ownerUserId: traveler.ownerUserId,
    status: traveler.status,
    type: traveler.type,
    firstName: maskText(traveler.firstName, 1),
    middleName: traveler.middleName ? REDACTED : null,
    lastName: maskText(traveler.lastName, 1),
    dateOfBirth: traveler.dateOfBirth ? REDACTED : null,
    email: traveler.email ? REDACTED : null,
    phone: traveler.phone ? REDACTED : null,
    nationality: traveler.nationality?.toUpperCase() || null,
    documentType: traveler.documentType,
    documentNumber: traveler.documentNumber ? REDACTED : null,
    documentExpiryDate: traveler.documentExpiryDate ? REDACTED : null,
    issuingCountry: traveler.issuingCountry?.toUpperCase() || null,
    knownTravelerNumber: maskText(traveler.knownTravelerNumber),
    redressNumber: maskText(traveler.redressNumber),
    driverAge: traveler.driverAge,
    label: traveler.label ? REDACTED : null,
    isDefault: traveler.isDefault,
    createdAt: traveler.createdAt,
    updatedAt: traveler.updatedAt,
  };
};
