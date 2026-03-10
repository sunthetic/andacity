import type {
  TripBundlingExplanation,
  TripBundlingGapType,
  TripBundlingExplanationStrength,
  TripBundlingPricePosition,
  TripBundlingPriority,
  TripBundlingSuggestionType,
  TripItemType,
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

const toBundlingExplanation = (
  value: unknown,
): TripBundlingExplanation | null => {
  const explanation = isRecord(value) ? value : null;
  if (!explanation) return null;

  const summary = toText(explanation.summary);
  const strength = isRecord(explanation.strength) ? explanation.strength : null;
  const savings = isRecord(explanation.savings) ? explanation.savings : null;
  const strengthLevel = toStrengthLevel(strength?.level);
  const strengthLabel = toText(strength?.label);
  const strengthReason = toText(strength?.reason);
  const currencyCode = toText(savings?.currencyCode);
  const savingsSummary = toText(savings?.summary);
  const addedComponentBaseCents = toAmountCents(
    savings?.addedComponentBaseCents,
  );
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
      deltaFromCheapestExactMatchCents:
        savings.deltaFromCheapestExactMatchCents == null
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

const toInteger = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

const toIntegerList = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => toInteger(entry))
    .filter((entry): entry is number => entry != null);
};

const toPriority = (value: unknown): TripBundlingPriority | null => {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return null;
};

const toGapType = (value: unknown): TripBundlingGapType | null => {
  if (
    value === "missing_return_flight" ||
    value === "missing_lodging" ||
    value === "arrival_ground_transport" ||
    value === "missing_car_rental" ||
    value === "date_coverage_gap" ||
    value === "large_idle_gap" ||
    value === "intercity_transfer_gap"
  ) {
    return value;
  }

  return null;
};

const toSuggestionType = (value: unknown): TripBundlingSuggestionType | null => {
  if (
    value === "add_return_flight" ||
    value === "add_hotel_near_arrival" ||
    value === "add_ground_transport_after_arrival" ||
    value === "add_car_rental_for_stay" ||
    value === "fill_missing_stay_dates" ||
    value === "add_connection_flight"
  ) {
    return value;
  }

  return null;
};

const toItemType = (value: unknown): TripItemType | null => {
  if (value === "hotel" || value === "flight" || value === "car") {
    return value;
  }

  return null;
};

export type TripBundlingState = {
  generatedAt: string | null;
  gapId: string | null;
  gapType: TripBundlingGapType | null;
  suggestionType: TripBundlingSuggestionType | null;
  relatedItemIds: number[];
  selectionMode: "recommended" | "manual_override";
  originalInventoryId: number | null;
  currentInventoryId: number | null;
  explanation: TripBundlingExplanation;
  context: {
    priority: TripBundlingPriority | null;
    itemType: TripItemType | null;
    title: string | null;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    cityId: number | null;
    cityName: string | null;
    originCityId: number | null;
    originCityName: string | null;
    destinationCityId: number | null;
    destinationCityName: string | null;
  } | null;
};

export const readTripBundlingState = (
  metadata: unknown,
): TripBundlingState | null => {
  const root = isRecord(metadata) ? metadata : null;
  const smartBundling =
    root && isRecord(root.smartBundling) ? root.smartBundling : null;
  if (!smartBundling) return null;

  const explanation = toBundlingExplanation(smartBundling.explanation);
  if (!explanation) return null;

  const context = isRecord(smartBundling.context) ? smartBundling.context : null;

  return {
    generatedAt: toText(smartBundling.generatedAt),
    gapId: toText(smartBundling.gapId),
    gapType: toGapType(smartBundling.gapType),
    suggestionType: toSuggestionType(smartBundling.suggestionType),
    relatedItemIds: toIntegerList(smartBundling.relatedItemIds),
    selectionMode:
      smartBundling.selectionMode === "manual_override"
        ? "manual_override"
        : smartBundling.manualOverride === true
          ? "manual_override"
          : "recommended",
    originalInventoryId: toInteger(smartBundling.originalInventoryId),
    currentInventoryId: toInteger(smartBundling.currentInventoryId),
    explanation,
    context: context
      ? {
          priority: toPriority(context.priority),
          itemType: toItemType(context.itemType),
          title: toText(context.title),
          description: toText(context.description),
          startDate: toText(context.startDate),
          endDate: toText(context.endDate),
          cityId: toInteger(context.cityId),
          cityName: toText(context.cityName),
          originCityId: toInteger(context.originCityId),
          originCityName: toText(context.originCityName),
          destinationCityId: toInteger(context.destinationCityId),
          destinationCityName: toText(context.destinationCityName),
        }
      : null,
  };
};

export const readTripBundlingExplanation = (
  metadata: unknown,
): TripBundlingExplanation | null => {
  return readTripBundlingState(metadata)?.explanation || null;
};
