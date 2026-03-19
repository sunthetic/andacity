import { asc, eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import {
  itineraryItems,
  itineraries,
} from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { getItineraryOwnershipByItineraryId } from "~/lib/ownership/getItineraryOwnershipByItineraryId";
import { buildNotificationSummary } from "~/fns/notifications/buildNotificationSummary";
import { getNotificationsForEntity } from "~/fns/notifications/getNotificationsForEntity";
import type { ItineraryOwnership } from "~/types/ownership";
import {
  isRecord,
  normalizeCurrencyCode,
  normalizeItineraryItemStatus,
  normalizeItineraryStatus,
  normalizeTimestamp,
  toNullableText,
  toPositiveInteger,
} from "~/lib/itinerary/shared";
import type {
  ItinerarySummary,
  OwnedItinerary,
  OwnedItineraryItem,
} from "~/types/itinerary";

type ItineraryRow = typeof itineraries.$inferSelect;
type ItineraryItemRow = typeof itineraryItems.$inferSelect;

const normalizeItinerarySummary = (
  value: unknown,
): Record<string, unknown> | null => {
  return isRecord(value) ? value : null;
};

export const mapItineraryItemRow = (
  row: ItineraryItemRow,
): OwnedItineraryItem => {
  return {
    id: row.id,
    itineraryId: row.itineraryId,
    confirmationItemId: row.confirmationItemId,
    bookingItemExecutionId: row.bookingItemExecutionId,
    checkoutItemKey: row.checkoutItemKey,
    vertical: row.vertical,
    status: normalizeItineraryItemStatus(row.status),
    canonicalEntityId: row.canonicalEntityId ?? null,
    canonicalBookableEntityId: row.canonicalBookableEntityId ?? null,
    canonicalInventoryId: toNullableText(row.canonicalInventoryId),
    provider: toNullableText(row.provider),
    providerBookingReference: toNullableText(row.providerBookingReference),
    providerConfirmationCode: toNullableText(row.providerConfirmationCode),
    title: row.title,
    subtitle: toNullableText(row.subtitle),
    startAt: normalizeTimestamp(row.startAt),
    endAt: normalizeTimestamp(row.endAt),
    locationSummary: toNullableText(row.locationSummary),
    detailsJson: isRecord(row.detailsJson) ? row.detailsJson : null,
    createdAt: normalizeTimestamp(row.createdAt) || new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updatedAt) || new Date().toISOString(),
  };
};

export const mapItineraryRow = (
  row: ItineraryRow,
  items: OwnedItineraryItem[] = [],
  ownership: ItineraryOwnership | null = null,
): OwnedItinerary => {
  return {
    id: row.id,
    publicRef: row.publicRef,
    tripId: row.tripId ?? null,
    checkoutSessionId: row.checkoutSessionId,
    paymentSessionId: row.paymentSessionId,
    bookingRunId: row.bookingRunId,
    confirmationId: row.confirmationId,
    status: normalizeItineraryStatus(row.status),
    currency: normalizeCurrencyCode(row.currency),
    summaryJson: normalizeItinerarySummary(row.summaryJson),
    ownerUserId: toNullableText(row.ownerUserId),
    ownerSessionId: toNullableText(row.ownerSessionId),
    createdAt: normalizeTimestamp(row.createdAt) || new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updatedAt) || new Date().toISOString(),
    ownership,
    items,
  };
};

export const listItineraryItems = async (
  itineraryId: string,
): Promise<OwnedItineraryItem[]> => {
  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(itineraryItems)
      .where(eq(itineraryItems.itineraryId, itineraryId))
      .orderBy(asc(itineraryItems.createdAt), asc(itineraryItems.checkoutItemKey));

    return rows.map((row) => mapItineraryItemRow(row));
  });
};

export const getItinerary = async (
  itineraryId: string,
): Promise<OwnedItinerary | null> => {
  const normalizedId = toNullableText(itineraryId);
  if (!normalizedId) return null;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, normalizedId))
      .limit(1);

    if (!row) return null;

    const items = await listItineraryItems(row.id);
    const ownership = await getItineraryOwnershipByItineraryId(row.id);
    const itinerary = mapItineraryRow(row, items, ownership);
    const notificationSummary = await (async () => {
      try {
        const notificationRecords = await getNotificationsForEntity({
          itineraryId: itinerary.id,
          eventTypes: ["itinerary_ready", "itinerary_claim_available"],
          limit: 20,
        });
        return buildNotificationSummary({
          records: notificationRecords,
          preferredEventTypes: ["itinerary_claim_available", "itinerary_ready"],
        });
      } catch {
        // Notification persistence should not block itinerary retrieval.
        return buildNotificationSummary({
          records: [],
          preferredEventTypes: ["itinerary_claim_available", "itinerary_ready"],
        });
      }
    })();

    return {
      ...itinerary,
      notificationSummary,
    };
  });
};
