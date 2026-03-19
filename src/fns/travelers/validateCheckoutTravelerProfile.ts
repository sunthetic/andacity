import type {
  CheckoutTravelerProfile,
  TravelerRequiredFieldKey,
  TravelerValidationIssue,
} from "~/types/travelers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9().\-\s]{7,}$/;

const createIssue = (input: {
  code: TravelerValidationIssue["code"];
  message: string;
  travelerProfileId: string;
  field?: TravelerValidationIssue["field"];
  checkoutItemKey?: string | null;
  role?: TravelerValidationIssue["role"];
  groupId?: string | null;
}) => {
  const id = [
    "traveler-profile",
    input.travelerProfileId,
    input.code,
    input.field || "field",
    input.groupId || "group",
  ].join(":");
  return {
    id,
    code: input.code,
    message: input.message,
    severity: "error",
    checkoutItemKey: input.checkoutItemKey || null,
    travelerProfileId: input.travelerProfileId,
    assignmentId: null,
    groupId: input.groupId || null,
    role: input.role || null,
    field: input.field || null,
  } satisfies TravelerValidationIssue;
};

const isMissingField = (
  profile: CheckoutTravelerProfile,
  field: TravelerRequiredFieldKey,
) => {
  const value = profile[field];
  if (typeof value === "number") return !Number.isFinite(value);
  if (typeof value === "string") return !String(value || "").trim();
  return value == null;
};

export const validateCheckoutTravelerProfile = (input: {
  profile: CheckoutTravelerProfile;
  requiredFields: TravelerRequiredFieldKey[];
  checkoutItemKey?: string | null;
  role?: TravelerValidationIssue["role"];
  groupId?: string | null;
  minimumDriverAge?: number | null;
  requiresPassport?: boolean;
}): TravelerValidationIssue[] => {
  const issues: TravelerValidationIssue[] = [];
  const { profile } = input;
  const requiredFields = Array.from(new Set(input.requiredFields));

  for (const field of requiredFields) {
    if (!isMissingField(profile, field)) continue;

    issues.push(
      createIssue({
        code: field === "documentType" || field === "documentNumber"
          ? "DOCUMENT_REQUIRED"
          : "MISSING_REQUIRED_FIELD",
        message:
          field === "documentType" || field === "documentNumber"
            ? "Required traveler document details are missing."
            : `${field} is required for this traveler assignment.`,
        travelerProfileId: profile.id,
        field,
        checkoutItemKey: input.checkoutItemKey,
        role: input.role,
        groupId: input.groupId,
      }),
    );
  }

  if (profile.dateOfBirth) {
    const birthDate = new Date(profile.dateOfBirth);
    const now = new Date();
    if (Number.isNaN(birthDate.getTime()) || birthDate > now) {
      issues.push(
        createIssue({
          code: "INVALID_DATE_OF_BIRTH",
          message: "Date of birth must be a valid date in the past.",
          travelerProfileId: profile.id,
          field: "dateOfBirth",
          checkoutItemKey: input.checkoutItemKey,
          role: input.role,
          groupId: input.groupId,
        }),
      );
    }
  }

  if (profile.email && !EMAIL_RE.test(profile.email)) {
    issues.push(
      createIssue({
        code: "INVALID_EMAIL",
        message: "Traveler email must be in a valid format.",
        travelerProfileId: profile.id,
        field: "email",
        checkoutItemKey: input.checkoutItemKey,
        role: input.role,
        groupId: input.groupId,
      }),
    );
  }

  if (profile.phone && !PHONE_RE.test(profile.phone)) {
    issues.push(
      createIssue({
        code: "INVALID_PHONE",
        message: "Traveler phone number must include at least 7 digits.",
        travelerProfileId: profile.id,
        field: "phone",
        checkoutItemKey: input.checkoutItemKey,
        role: input.role,
        groupId: input.groupId,
      }),
    );
  }

  if (profile.documentExpiryDate) {
    const expiry = new Date(profile.documentExpiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(expiry.getTime()) || expiry < today) {
      issues.push(
        createIssue({
          code: "DOCUMENT_EXPIRED",
          message: "Traveler document expiry date must be in the future.",
          travelerProfileId: profile.id,
          field: "documentExpiryDate",
          checkoutItemKey: input.checkoutItemKey,
          role: input.role,
          groupId: input.groupId,
        }),
      );
    }
  }

  if (input.requiresPassport && profile.documentType !== "passport") {
    issues.push(
      createIssue({
        code: "DOCUMENT_REQUIRED",
        message: "Passport details are required for this flight assignment.",
        travelerProfileId: profile.id,
        field: "documentType",
        checkoutItemKey: input.checkoutItemKey,
        role: input.role,
        groupId: input.groupId,
      }),
    );
  }

  if (input.role === "driver") {
    const minimumDriverAge = Math.max(
      16,
      Math.round(Number(input.minimumDriverAge || 21)),
    );
    if (
      profile.driverAge == null ||
      profile.driverAge < minimumDriverAge ||
      profile.driverAge > 100
    ) {
      issues.push(
        createIssue({
          code: "DRIVER_AGE_INVALID",
          message: `Driver age must be at least ${minimumDriverAge}.`,
          travelerProfileId: profile.id,
          field: "driverAge",
          checkoutItemKey: input.checkoutItemKey,
          role: input.role,
          groupId: input.groupId,
        }),
      );
    }

    if (profile.documentType && profile.documentType !== "drivers_license") {
      issues.push(
        createIssue({
          code: "DOCUMENT_REQUIRED",
          message: "Driver assignments require a driver's license document type.",
          travelerProfileId: profile.id,
          field: "documentType",
          checkoutItemKey: input.checkoutItemKey,
          role: input.role,
          groupId: input.groupId,
        }),
      );
    }
  }

  return issues;
};
