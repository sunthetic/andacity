import type {
  TripCheckoutReadiness,
  TripCheckoutReadinessIssue,
} from "~/types/checkout";
import type { TripDetails, TripItem } from "~/types/trips/trip";

const normalizeCurrencyCode = (value: string | null | undefined) => {
  const token = String(value || "")
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(token) ? token : null;
};

const hasSnapshotPricing = (item: TripItem) => {
  return (
    Number.isFinite(item.snapshotPriceCents) &&
    item.snapshotPriceCents >= 0 &&
    normalizeCurrencyCode(item.snapshotCurrencyCode) != null
  );
};

const hasSupportedShape = (item: TripItem) => {
  if (
    item.itemType !== "flight" &&
    item.itemType !== "hotel" &&
    item.itemType !== "car"
  ) {
    return false;
  }

  if (
    item.bookableEntity &&
    item.bookableEntity.vertical !== item.itemType
  ) {
    return false;
  }

  if (
    item.inventorySnapshot?.bookableEntity &&
    item.inventorySnapshot.bookableEntity.vertical !== item.itemType
  ) {
    return false;
  }

  return true;
};

const hasCanonicalInventoryReference = (item: TripItem) => {
  if (!String(item.inventoryId || "").trim()) return false;

  if (item.itemType === "flight") {
    return Boolean(
      item.flightItineraryId ||
        item.inventorySnapshot?.providerInventoryId ||
        item.bookableEntity ||
        item.inventorySnapshot?.bookableEntity,
    );
  }

  if (item.itemType === "hotel") {
    return Boolean(
      item.hotelId ||
        item.inventorySnapshot?.hotelAvailabilitySnapshotId ||
        item.inventorySnapshot?.providerInventoryId ||
        item.bookableEntity ||
        item.inventorySnapshot?.bookableEntity,
    );
  }

  return Boolean(
    item.carInventoryId ||
      item.inventorySnapshot?.providerInventoryId ||
      item.bookableEntity ||
      item.inventorySnapshot?.bookableEntity,
  );
};

const buildIssue = (
  item: TripItem | null,
  issue: Omit<TripCheckoutReadinessIssue, "itemId" | "itemTitle">,
): TripCheckoutReadinessIssue => {
  return {
    ...issue,
    itemId: item?.id ?? null,
    itemTitle: item?.title ?? null,
  };
};

const describeReadiness = (
  trip: TripDetails | null | undefined,
  issues: TripCheckoutReadinessIssue[],
) => {
  if (!trip) return "No active trip available for checkout";
  if (!trip.items.length) return "Add at least one item to continue to checkout";
  if (!issues.length) return "Ready for checkout";
  return issues.length === 1
    ? issues[0].message
    : "Resolve the trip issues below before checkout can start";
};

export const getTripCheckoutReadiness = (
  trip: TripDetails | null | undefined,
): TripCheckoutReadiness => {
  const issues: TripCheckoutReadinessIssue[] = [];

  if (!trip) {
    issues.push(
      buildIssue(null, {
        code: "no_trip",
        message: "Create or select a trip before starting checkout.",
      }),
    );
  } else if (!trip.items.length) {
    issues.push(
      buildIssue(null, {
        code: "no_items",
        message: "Add at least one saved item to this trip before checkout.",
      }),
    );
  } else {
    for (const item of trip.items) {
      if (!hasSupportedShape(item)) {
        issues.push(
          buildIssue(item, {
            code: "unsupported_item_shape",
            message: `${item.title} is missing required trip snapshot structure for checkout.`,
          }),
        );
      }

      if (!hasSnapshotPricing(item)) {
        issues.push(
          buildIssue(item, {
            code: "missing_pricing_snapshot",
            message: `${item.title} is missing pricing data needed for checkout.`,
          }),
        );
      }

      if (!hasCanonicalInventoryReference(item)) {
        issues.push(
          buildIssue(item, {
            code: "missing_inventory_reference",
            message: `${item.title} is missing its inventory reference for checkout.`,
          }),
        );
      }
    }
  }

  return {
    isReady: issues.length === 0,
    issues,
    itemCount: trip?.items.length ?? 0,
    currency:
      normalizeCurrencyCode(trip?.pricing.currencyCode) ||
      normalizeCurrencyCode(trip?.currencyCode),
    estimatedTotal:
      trip?.pricing.snapshotTotalCents ?? trip?.estimatedTotalCents ?? null,
    readinessLabel: describeReadiness(trip, issues),
  };
};
