import type {
  TripBundlingExplanation,
  TripBundlingExplanationStrength,
  TripBundlingPricePosition,
} from "~/types/trips/trip";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toText = (value: unknown) => {
  const text = String(value || "").trim();
  return text || null;
};

const toStringList = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => toText(entry))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 4);
};

const toAmountCents = (value: unknown) => {
  if (value == null || value === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  return Math.max(0, Math.round(parsed));
};

const toNullableAmountCents = (value: unknown) => {
  if (value == null || value === "") return null;
  return toAmountCents(value);
};

const toStrengthLevel = (
  value: unknown,
): TripBundlingExplanationStrength | null => {
  if (value === "strong" || value === "moderate" || value === "tentative") {
    return value;
  }

  return null;
};

const toPricePosition = (value: unknown): TripBundlingPricePosition => {
  if (
    value === "lowest_exact_match" ||
    value === "above_lowest_exact_match" ||
    value === "unknown"
  ) {
    return value;
  }

  return "unknown";
};

export const readTripBundlingExplanation = (
  metadata: unknown,
): TripBundlingExplanation | null => {
  const root = isRecord(metadata) ? metadata : null;
  const smartBundling = root && isRecord(root.smartBundling)
    ? root.smartBundling
    : null;
  const explanation = smartBundling && isRecord(smartBundling.explanation)
    ? smartBundling.explanation
    : null;

  if (!explanation) return null;

  const summary = toText(explanation.summary);
  const strength = isRecord(explanation.strength) ? explanation.strength : null;
  const savings = isRecord(explanation.savings) ? explanation.savings : null;
  const strengthLevel = toStrengthLevel(strength?.level);
  const strengthLabel = toText(strength?.label);
  const strengthReason = toText(strength?.reason);
  const currencyCode = toText(savings?.currencyCode);
  const savingsSummary = toText(savings?.summary);
  const addedComponentBaseCents = toAmountCents(savings?.addedComponentBaseCents);
  const selectedComponentBaseCents = toAmountCents(
    savings?.selectedComponentBaseCents,
  );

  if (
    !summary ||
    !strengthLevel ||
    !strengthLabel ||
    !strengthReason ||
    !savings ||
    !currencyCode ||
    !savingsSummary ||
    addedComponentBaseCents == null ||
    selectedComponentBaseCents == null
  ) {
    return null;
  }

  return {
    summary,
    why: toStringList(explanation.why),
    savings: {
      currencyCode,
      currentTripBaseTotalCents: toNullableAmountCents(
        savings.currentTripBaseTotalCents,
      ),
      addedComponentBaseCents,
      projectedBundleBaseTotalCents: toNullableAmountCents(
        savings.projectedBundleBaseTotalCents,
      ),
      selectedComponentBaseCents,
      cheapestExactMatchBaseCents: toNullableAmountCents(
        savings.cheapestExactMatchBaseCents,
      ),
      deltaFromCheapestExactMatchCents: savings.deltaFromCheapestExactMatchCents == null
        ? null
        : Math.round(Number(savings.deltaFromCheapestExactMatchCents)),
      pricePosition: toPricePosition(savings.pricePosition),
      summary: savingsSummary,
    },
    constraints: toStringList(explanation.constraints),
    tradeoffs: toStringList(explanation.tradeoffs),
    strength: {
      level: strengthLevel,
      label: strengthLabel,
      reason: strengthReason,
    },
    missingSignals: toStringList(explanation.missingSignals),
  };
};
