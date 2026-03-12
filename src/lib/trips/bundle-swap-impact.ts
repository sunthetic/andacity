import { readTripBundlingState } from "~/lib/trips/bundle-explainability";
import { formatMoneyFromCents } from "~/lib/pricing/price-display";
import type { TripEditBundleImpact } from "~/types/trips/trip";

const STRENGTH_RANK = {
  tentative: 0,
  moderate: 1,
  strong: 2,
} as const;

const buildStrengthSummary = (input: {
  currentLabel: string | null;
  currentLevel: keyof typeof STRENGTH_RANK | null;
  nextLabel: string | null;
  nextLevel: keyof typeof STRENGTH_RANK | null;
}) => {
  if (!input.currentLabel || !input.currentLevel) {
    return input.nextLabel
      ? `Updated bundle fit is ${input.nextLabel.toLowerCase()}.`
      : "Updated bundle fit is unavailable for this swap.";
  }

  if (!input.nextLabel || !input.nextLevel) {
    return "Updated bundle fit is unavailable for this swap.";
  }

  const delta =
    STRENGTH_RANK[input.nextLevel] - STRENGTH_RANK[input.currentLevel];

  if (delta > 0) {
    return `Bundle fit improves from ${input.currentLabel} to ${input.nextLabel}.`;
  }

  if (delta < 0) {
    return `Bundle fit softens from ${input.currentLabel} to ${input.nextLabel}.`;
  }

  return `Bundle fit stays at ${input.nextLabel}.`;
};

const buildSavingsSummary = (input: {
  currencyCode: string | null;
  currentDeltaCents: number | null;
  nextDeltaCents: number | null;
}) => {
  if (!input.currencyCode) {
    return {
      deltaCents: null,
      summary: "Savings delta is unavailable with the current bundle signals.",
    };
  }

  if (input.currentDeltaCents == null || input.nextDeltaCents == null) {
    return {
      deltaCents: null,
      summary: "Savings delta is unavailable because an exact-match price comparison is missing.",
    };
  }

  const deltaCents = input.nextDeltaCents - input.currentDeltaCents;
  if (deltaCents === 0) {
    return {
      deltaCents,
      summary: "Savings position stays unchanged against the cheapest exact match.",
    };
  }

  return {
    deltaCents,
    summary:
      deltaCents > 0
        ? `Savings position worsens by ${formatMoneyFromCents(
            deltaCents,
            input.currencyCode,
          )} versus the previous pick.`
        : `Savings position improves by ${formatMoneyFromCents(
            Math.abs(deltaCents),
            input.currencyCode,
          )} versus the previous pick.`,
  };
};

export const buildTripEditBundleImpact = (input: {
  currentMetadata: unknown;
  nextMetadata: unknown;
  focusItemId: number;
  nextTripItemIds: number[];
}): TripEditBundleImpact | null => {
  const currentState = readTripBundlingState(input.currentMetadata);
  const nextState = readTripBundlingState(input.nextMetadata);
  const activeState = nextState || currentState;

  if (!activeState) return null;

  const preservedRelatedItemIds = activeState.relatedItemIds.filter(
    (itemId) =>
      itemId !== input.focusItemId && input.nextTripItemIds.includes(itemId),
  );
  const strengthSummary = buildStrengthSummary({
    currentLabel: currentState?.explanation.strength.label || null,
    currentLevel: currentState?.explanation.strength.level || null,
    nextLabel: nextState?.explanation.strength.label || null,
    nextLevel: nextState?.explanation.strength.level || null,
  });
  const savings = buildSavingsSummary({
    currencyCode:
      nextState?.explanation.savings.currencyCode ||
      currentState?.explanation.savings.currencyCode ||
      null,
    currentDeltaCents:
      currentState?.explanation.savings.deltaFromCheapestExactMatchCents ?? null,
    nextDeltaCents:
      nextState?.explanation.savings.deltaFromCheapestExactMatchCents ?? null,
  });

  const limitations: string[] = [];
  if (!nextState?.explanation) {
    limitations.push(
      "Updated bundle rationale is unavailable for this swap, so treat it as an itinerary-only replacement.",
    );
  }
  if (
    activeState.relatedItemIds.length > 0 &&
    preservedRelatedItemIds.length !== activeState.relatedItemIds.length
  ) {
    limitations.push(
      "Some original bundle anchors no longer participate in this component's saved recommendation context.",
    );
  }
  if (activeState.selectionMode === "manual_override") {
    limitations.push(
      "This choice is saved as a manual override. Rollback restores the previous bundle pick.",
    );
  }

  const summaryParts = [
    activeState.selectionMode === "manual_override"
      ? "Manual override keeps the rest of the bundle intact where possible."
      : "Bundle scoring stays attached to this component.",
    preservedRelatedItemIds.length
      ? `Keeps ${preservedRelatedItemIds.length} linked component${
          preservedRelatedItemIds.length === 1 ? "" : "s"
        } in the saved bundle context.`
      : null,
    strengthSummary,
  ].filter(Boolean);

  return {
    selectionMode: activeState.selectionMode,
    summary: summaryParts.join(" "),
    preservedRelatedItemIds,
    strengthSummary,
    savingsDeltaCents: savings.deltaCents,
    savingsSummary: savings.summary,
    explanation: nextState?.explanation || null,
    limitations,
  };
};
