const REDACTED_VALUE = "[REDACTED]";

const OMIT_KEY_PATTERNS = [
  /^authorization$/i,
  /^proxy-authorization$/i,
];

const REDACT_KEY_PATTERNS = [
  /secret/i,
  /token/i,
  /password/i,
  /api[-_]?key/i,
  /client[-_]?secret/i,
  /card/i,
  /cvc/i,
  /cvv/i,
  /exp(ir(y|ation))?/i,
  /security[-_]?code/i,
  /^email$/i,
  /^phone$/i,
  /address/i,
  /postal/i,
  /zip/i,
  /traveler/i,
  /passenger/i,
  /first[-_]?name/i,
  /last[-_]?name/i,
  /full[-_]?name/i,
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const shouldOmitKey = (key: string) =>
  OMIT_KEY_PATTERNS.some((pattern) => pattern.test(key));

const shouldRedactKey = (key: string) =>
  REDACT_KEY_PATTERNS.some((pattern) => pattern.test(key));

export const sanitizeBookingSnapshotValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeBookingSnapshotValue(entry));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.entries(value).reduce<Record<string, unknown>>(
    (acc, [key, entry]) => {
      if (shouldOmitKey(key)) {
        return acc;
      }

      acc[key] = shouldRedactKey(key)
        ? REDACTED_VALUE
        : sanitizeBookingSnapshotValue(entry);
      return acc;
    },
    {},
  );
};

export const sanitizeBookingRequestSnapshot = (
  snapshot: Record<string, unknown> | null | undefined,
) => {
  if (!snapshot) return null;
  return sanitizeBookingSnapshotValue(snapshot) as Record<string, unknown>;
};
