import { formatSavedTravelerDisplayName } from "~/fns/saved-travelers/formatSavedTravelerDisplayName";
import type {
  SavedTravelerProfile,
  SavedTravelerSummary,
} from "~/types/saved-travelers";

const toSentenceCase = (value: string) => {
  return value ? `${value.slice(0, 1).toUpperCase()}${value.slice(1)}` : value;
};

export const buildSavedTravelerSummary = (
  traveler: SavedTravelerProfile,
): SavedTravelerSummary => {
  const hasContactDetails = Boolean(traveler.email || traveler.phone);
  const hasDocumentDetails = Boolean(
    traveler.documentType ||
      traveler.documentNumber ||
      traveler.documentExpiryDate,
  );
  const detailParts = [
    toSentenceCase(traveler.type),
    traveler.email || traveler.phone || null,
    hasDocumentDetails ? "Document on file" : null,
  ].filter((part): part is string => Boolean(part));

  return {
    id: traveler.id,
    status: traveler.status,
    type: traveler.type,
    displayName: formatSavedTravelerDisplayName(traveler),
    label: traveler.label,
    detail: detailParts.join(" · ") || "Reusable traveler profile",
    badgeLabel: traveler.isDefault
      ? "Default"
      : traveler.status === "archived"
        ? "Archived"
        : null,
    isDefault: traveler.isDefault,
    hasContactDetails,
    hasDocumentDetails,
    createdAt: traveler.createdAt,
    updatedAt: traveler.updatedAt,
  };
};
