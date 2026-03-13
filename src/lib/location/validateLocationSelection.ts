import { normalizeLocation } from "~/lib/location/normalizeLocation";
import type { CanonicalLocation, CanonicalLocationKind } from "~/types/location";

type ValidateLocationSelectionInput = {
  selection: unknown;
  rawValue?: unknown;
  required?: boolean;
  fieldLabel?: string;
  allowedKinds?: CanonicalLocationKind[];
};

export type ValidateLocationSelectionResult = {
  location: CanonicalLocation | null;
  error: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

export const parseLocationSelection = (
  value: unknown,
): CanonicalLocation | null => {
  if (!value) return null;

  let parsed = value;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;

    try {
      parsed = JSON.parse(text);
    } catch {
      return null;
    }
  }

  if (!isRecord(parsed)) return null;
  return normalizeLocation(parsed as Parameters<typeof normalizeLocation>[0]);
};

export const validateLocationSelection = (
  input: ValidateLocationSelectionInput,
): ValidateLocationSelectionResult => {
  const rawValue = toText(input.rawValue);
  const fieldLabel = input.fieldLabel || "location";
  const location = parseLocationSelection(input.selection);

  if (!location) {
    if (rawValue) {
      return {
        location: null,
        error: `Choose a valid ${fieldLabel} from the suggestions.`,
      };
    }

    if (input.required) {
      return {
        location: null,
        error: `Choose a ${fieldLabel}.`,
      };
    }

    return { location: null, error: null };
  }

  if (
    input.allowedKinds?.length &&
    !input.allowedKinds.includes(location.kind)
  ) {
    return {
      location: null,
      error: `Choose a supported ${fieldLabel}.`,
    };
  }

  if (rawValue && rawValue !== location.displayName) {
    return {
      location: null,
      error: `Choose a valid ${fieldLabel} from the suggestions.`,
    };
  }

  return {
    location,
    error: null,
  };
};
