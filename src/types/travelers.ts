import type { BookableVertical } from "~/types/bookable-entity";

export const TRAVELER_TYPES = ["adult", "child", "infant"] as const;
export type TravelerType = (typeof TRAVELER_TYPES)[number];

export const TRAVELER_ROLES = [
  "passenger",
  "guest",
  "driver",
  "primary_contact",
] as const;
export type TravelerRole = (typeof TRAVELER_ROLES)[number];

export const TRAVELER_DOCUMENT_TYPES = [
  "passport",
  "drivers_license",
  "national_id",
] as const;
export type TravelerDocumentType = (typeof TRAVELER_DOCUMENT_TYPES)[number];

export const TRAVELER_VALIDATION_STATUSES = [
  "idle",
  "incomplete",
  "invalid",
  "complete",
] as const;
export type TravelerValidationStatus =
  (typeof TRAVELER_VALIDATION_STATUSES)[number];

export const TRAVELER_VALIDATION_ISSUE_CODES = [
  "MISSING_REQUIRED_FIELD",
  "INVALID_DATE_OF_BIRTH",
  "INVALID_EMAIL",
  "INVALID_PHONE",
  "MISSING_PRIMARY_GUEST",
  "MISSING_PRIMARY_DRIVER",
  "PASSENGER_COUNT_MISMATCH",
  "TRAVELER_ASSIGNMENT_MISSING",
  "DOCUMENT_REQUIRED",
  "DOCUMENT_EXPIRED",
  "DRIVER_AGE_INVALID",
] as const;
export type TravelerValidationIssueCode =
  (typeof TRAVELER_VALIDATION_ISSUE_CODES)[number];

export const TRAVELER_REQUIRED_FIELD_KEYS = [
  "firstName",
  "middleName",
  "lastName",
  "dateOfBirth",
  "email",
  "phone",
  "nationality",
  "documentType",
  "documentNumber",
  "documentExpiryDate",
  "issuingCountry",
  "knownTravelerNumber",
  "redressNumber",
  "driverAge",
] as const;
export type TravelerRequiredFieldKey =
  (typeof TRAVELER_REQUIRED_FIELD_KEYS)[number];

export type TravelerProfile = {
  id: string;
  type: TravelerType;
  role: TravelerRole;
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
};

export type CheckoutTravelerProfile = TravelerProfile & {
  checkoutSessionId: string;
  createdAt: string;
  updatedAt: string;
};

export type CheckoutTravelerAssignment = {
  id: string;
  checkoutSessionId: string;
  checkoutItemKey: string | null;
  travelerProfileId: string;
  role: TravelerRole;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RequiredTravelerGroup = {
  id: string;
  checkoutItemKey: string | null;
  vertical: BookableVertical | null;
  role: TravelerRole;
  travelerType: TravelerType | null;
  requiredCount: number;
  requiresPrimary: boolean;
  requiredFields: TravelerRequiredFieldKey[];
  optional: boolean;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
};

export type TravelerValidationIssue = {
  id: string;
  code: TravelerValidationIssueCode;
  message: string;
  severity: "warning" | "error";
  checkoutItemKey: string | null;
  travelerProfileId: string | null;
  assignmentId: string | null;
  groupId: string | null;
  role: TravelerRole | null;
  field: TravelerRequiredFieldKey | null;
};

export type TravelerValidationSummary = {
  status: TravelerValidationStatus;
  checkedAt: string;
  hasBlockingIssues: boolean;
  issueCount: number;
  missingTravelerCount: number;
  invalidTravelerCount: number;
  assignmentMismatchCount: number;
  issues: TravelerValidationIssue[];
};

export type CheckoutTravelerCollection = {
  checkoutSessionId: string;
  requirements: RequiredTravelerGroup[];
  profiles: CheckoutTravelerProfile[];
  assignments: CheckoutTravelerAssignment[];
  validationSummary: TravelerValidationSummary;
  hasCompleteTravelerDetails: boolean;
};

export type CheckoutTravelerRequirementState = {
  requirement: RequiredTravelerGroup;
  assignedProfiles: CheckoutTravelerProfile[];
  assignedCount: number;
  remainingCount: number;
  hasPrimaryAssignment: boolean;
};

export type CheckoutTravelerPageModel = {
  checkoutSessionId: string;
  requirements: RequiredTravelerGroup[];
  requirementStates: CheckoutTravelerRequirementState[];
  profiles: CheckoutTravelerProfile[];
  assignments: CheckoutTravelerAssignment[];
  validationSummary: TravelerValidationSummary;
  hasCompleteTravelerDetails: boolean;
};

export type BookingTraveler = {
  profileId: string;
  role: TravelerRole;
  type: TravelerType;
  isPrimary: boolean;
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
};

export type MappedCheckoutTravelersForBooking = {
  checkoutSessionId: string;
  checkoutItemKey: string;
  status: TravelerValidationStatus;
  issues: TravelerValidationIssue[];
  travelers: BookingTraveler[];
  primaryContact: BookingTraveler | null;
};
