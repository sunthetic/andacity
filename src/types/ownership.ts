export const OWNERSHIP_MODES = ["anonymous", "user"] as const;
export type OwnershipMode = (typeof OWNERSHIP_MODES)[number];

export const OWNERSHIP_SOURCES = [
  "checkout_session",
  "confirmation_flow",
  "manual_claim",
  "auto_attach_on_signin",
] as const;
export type OwnershipSource = (typeof OWNERSHIP_SOURCES)[number];

export const ITINERARY_ACCESS_REASON_CODES = [
  "OWNER_MATCH",
  "CLAIMABLE_ANONYMOUS_ITINERARY",
  "NOT_FOUND",
  "ALREADY_CLAIMED_BY_USER",
  "SESSION_MISMATCH",
  "UNAUTHORIZED",
] as const;
export type ItineraryAccessReasonCode =
  (typeof ITINERARY_ACCESS_REASON_CODES)[number];

export const CLAIM_ITINERARY_REASON_CODES = [
  "CLAIM_SUCCEEDED",
  "CLAIM_ALREADY_OWNED",
  "CLAIM_INVALID_TOKEN",
  "CLAIM_UNAUTHORIZED",
  "CLAIM_NOT_AVAILABLE",
] as const;
export type ClaimItineraryOwnershipReasonCode =
  (typeof CLAIM_ITINERARY_REASON_CODES)[number];

export type ItineraryOwnership = {
  id: string;
  itineraryId: string;
  ownershipMode: OwnershipMode;
  ownerUserId: string | null;
  ownerSessionId: string | null;
  ownerClaimTokenHash: string | null;
  source: OwnershipSource;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CurrentOwnershipContext = {
  ownerUserId: string | null;
  ownerSessionId: string | null;
  claimTokensByItineraryRef: Record<string, string>;
};

export type ItineraryAccessResult = {
  ok: boolean;
  reasonCode: ItineraryAccessReasonCode;
  ownershipMode: OwnershipMode | null;
  isOwner: boolean;
  isClaimable: boolean;
  itineraryRef: string | null;
  message: string;
};

export type ClaimItineraryOwnershipInput = {
  itineraryRef: string;
  claimToken?: string | null;
  ownerUserId: string | null;
  ownerSessionId?: string | null;
  source?: OwnershipSource;
  now?: Date | string | null;
};

export type ClaimItineraryOwnershipResult = {
  ok: boolean;
  reasonCode: ClaimItineraryOwnershipReasonCode;
  ownershipMode: OwnershipMode | null;
  itineraryRef: string | null;
  message: string;
};

export type OwnershipDisplayState = {
  tone: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  href: string | null;
  label: string;
};
