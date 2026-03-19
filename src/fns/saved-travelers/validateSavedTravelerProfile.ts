import type {
  CreateSavedTravelerProfileInput,
  SavedTravelerValidationIssue,
  SavedTravelerValidationResult,
} from "~/types/saved-travelers";
import { toNullableDate, toNullableText } from "~/fns/travelers/shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9().\-\s]{7,}$/;

const issue = (
  next: SavedTravelerValidationIssue,
): SavedTravelerValidationIssue => next;

export const validateSavedTravelerProfile = (
  input: Pick<
    CreateSavedTravelerProfileInput,
    | "ownerUserId"
    | "firstName"
    | "lastName"
    | "dateOfBirth"
    | "email"
    | "phone"
    | "documentExpiryDate"
  >,
): SavedTravelerValidationResult => {
  const issues: SavedTravelerValidationIssue[] = [];

  if (!toNullableText(input.ownerUserId)) {
    issues.push(
      issue({
        code: "MISSING_OWNER_USER",
        field: "ownerUserId",
        message: "An authenticated user is required to save traveler profiles.",
      }),
    );
  }

  if (!toNullableText(input.firstName)) {
    issues.push(
      issue({
        code: "MISSING_FIRST_NAME",
        field: "firstName",
        message: "First name is required to save a traveler profile.",
      }),
    );
  }

  if (!toNullableText(input.lastName)) {
    issues.push(
      issue({
        code: "MISSING_LAST_NAME",
        field: "lastName",
        message: "Last name is required to save a traveler profile.",
      }),
    );
  }

  if (input.dateOfBirth) {
    const normalizedDate = toNullableDate(input.dateOfBirth);
    const birthDate = normalizedDate ? new Date(normalizedDate) : null;

    if (!normalizedDate || !birthDate || Number.isNaN(birthDate.getTime())) {
      issues.push(
        issue({
          code: "INVALID_DATE_OF_BIRTH",
          field: "dateOfBirth",
          message: "Date of birth must use a valid calendar date.",
        }),
      );
    } else if (birthDate > new Date()) {
      issues.push(
        issue({
          code: "INVALID_DATE_OF_BIRTH",
          field: "dateOfBirth",
          message: "Date of birth must be in the past.",
        }),
      );
    }
  }

  if (input.email && !EMAIL_RE.test(String(input.email).trim())) {
    issues.push(
      issue({
        code: "INVALID_EMAIL",
        field: "email",
        message: "Email must use a valid format.",
      }),
    );
  }

  if (input.phone && !PHONE_RE.test(String(input.phone).trim())) {
    issues.push(
      issue({
        code: "INVALID_PHONE",
        field: "phone",
        message: "Phone must include at least 7 digits.",
      }),
    );
  }

  if (input.documentExpiryDate) {
    const normalizedDate = toNullableDate(input.documentExpiryDate);
    const expiryDate = normalizedDate ? new Date(normalizedDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      !normalizedDate ||
      !expiryDate ||
      Number.isNaN(expiryDate.getTime()) ||
      expiryDate < today
    ) {
      issues.push(
        issue({
          code: "DOCUMENT_EXPIRED",
          field: "documentExpiryDate",
          message: "Saved traveler documents must expire in the future.",
        }),
      );
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
};
