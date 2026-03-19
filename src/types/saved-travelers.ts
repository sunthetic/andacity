import type { TravelerDocumentType, TravelerRole } from "~/types/travelers";

export const SAVED_TRAVELER_PROFILE_STATUSES = ["active", "archived"] as const;
export type SavedTravelerProfileStatus =
  (typeof SAVED_TRAVELER_PROFILE_STATUSES)[number];

export const SAVED_TRAVELER_PROFILE_TYPES = [
  "adult",
  "child",
  "infant",
] as const;
export type SavedTravelerProfileType =
  (typeof SAVED_TRAVELER_PROFILE_TYPES)[number];

export const SAVED_TRAVELER_VALIDATION_ISSUE_CODES = [
  "MISSING_OWNER_USER",
  "MISSING_FIRST_NAME",
  "MISSING_LAST_NAME",
  "INVALID_DATE_OF_BIRTH",
  "INVALID_EMAIL",
  "INVALID_PHONE",
  "DOCUMENT_EXPIRED",
] as const;
export type SavedTravelerValidationIssueCode =
  (typeof SAVED_TRAVELER_VALIDATION_ISSUE_CODES)[number];

export type SavedTravelerProfile = {
  id: string;
  ownerUserId: string;
  status: SavedTravelerProfileStatus;
  type: SavedTravelerProfileType;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  documentType: TravelerDocumentType | null;
  documentNumber: string | null;
  documentExpiryDate: string | null;
  issuingCountry: string | null;
  knownTravelerNumber: string | null;
  redressNumber: string | null;
  driverAge: number | null;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SavedTravelerSummary = {
  id: string;
  status: SavedTravelerProfileStatus;
  type: SavedTravelerProfileType;
  displayName: string;
  label: string | null;
  detail: string;
  badgeLabel: string | null;
  isDefault: boolean;
  hasContactDetails: boolean;
  hasDocumentDetails: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SavedTravelerValidationIssue = {
  code: SavedTravelerValidationIssueCode;
  field:
    | "ownerUserId"
    | "firstName"
    | "lastName"
    | "dateOfBirth"
    | "email"
    | "phone"
    | "documentExpiryDate";
  message: string;
};

export type SavedTravelerValidationResult = {
  ok: boolean;
  issues: SavedTravelerValidationIssue[];
};

export type CreateSavedTravelerProfileInput = {
  ownerUserId: string;
  status?: SavedTravelerProfileStatus | null;
  type?: SavedTravelerProfileType | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  documentType?: TravelerDocumentType | null;
  documentNumber?: string | null;
  documentExpiryDate?: string | null;
  issuingCountry?: string | null;
  knownTravelerNumber?: string | null;
  redressNumber?: string | null;
  driverAge?: number | string | null;
  label?: string | null;
  isDefault?: boolean | null;
  now?: Date | string | null;
};

export type UpdateSavedTravelerProfileInput = Omit<
  CreateSavedTravelerProfileInput,
  "ownerUserId"
> & {
  id: string;
};

export type ImportSavedTravelerToCheckoutInput = {
  checkoutSessionId: string;
  savedTravelerId: string;
  ownerUserId: string;
  role?: TravelerRole | null;
  checkoutItemKey?: string | null;
  isPrimary?: boolean | null;
  now?: Date | string | null;
};

export type CheckoutSavedTravelerSuggestion = {
  profile: SavedTravelerProfile;
  summary: SavedTravelerSummary;
  reasons: string[];
  score: number;
};
