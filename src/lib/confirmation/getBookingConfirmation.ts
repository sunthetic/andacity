import { asc, eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import {
  bookingConfirmationItems,
  bookingConfirmations,
} from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import {
  isRecord,
  normalizeBookingConfirmationStatus,
  normalizeConfirmationItemStatus,
  normalizeCurrencyCode,
  normalizeTimestamp,
  toNonNegativeInteger,
  toNullableText,
  toStringList,
} from "~/lib/confirmation/shared";
import type {
  BookingConfirmation,
  BookingConfirmationItem,
  BookingConfirmationSummary,
} from "~/types/confirmation";

type BookingConfirmationRow = typeof bookingConfirmations.$inferSelect;
type BookingConfirmationItemRow = typeof bookingConfirmationItems.$inferSelect;

const normalizeBookingConfirmationSummary = (
  value: unknown,
): BookingConfirmationSummary | null => {
  const input = isRecord(value) ? value : null;
  if (!input) return null;

  return {
    confirmationId: toNullableText(input.confirmationId) || "confirmation",
    publicRef: toNullableText(input.publicRef) || "CNF",
    status: normalizeBookingConfirmationStatus(input.status),
    statusLabel: toNullableText(input.statusLabel) || "Pending Confirmation",
    statusDescription:
      toNullableText(input.statusDescription) ||
      "Confirmation details are available.",
    totalItemCount: toNonNegativeInteger(input.totalItemCount) ?? 0,
    confirmedItemCount: toNonNegativeInteger(input.confirmedItemCount) ?? 0,
    pendingItemCount: toNonNegativeInteger(input.pendingItemCount) ?? 0,
    failedItemCount: toNonNegativeInteger(input.failedItemCount) ?? 0,
    requiresManualReviewCount:
      toNonNegativeInteger(input.requiresManualReviewCount) ?? 0,
    unresolvedItemCount: toNonNegativeInteger(input.unresolvedItemCount) ?? 0,
    confirmedItemTitles: toStringList(input.confirmedItemTitles),
    unresolvedItemTitles: toStringList(input.unresolvedItemTitles),
    currency: normalizeCurrencyCode(input.currency),
    totalAmountCents: toNonNegativeInteger(input.totalAmountCents),
    confirmedAt: normalizeTimestamp(input.confirmedAt as string | Date | null),
  };
};

export const mapBookingConfirmationItemRow = (
  row: BookingConfirmationItemRow,
): BookingConfirmationItem => {
  return {
    id: row.id,
    confirmationId: row.confirmationId,
    bookingItemExecutionId: row.bookingItemExecutionId,
    checkoutItemKey: row.checkoutItemKey,
    vertical: row.vertical,
    status: normalizeConfirmationItemStatus(row.status),
    title: row.title,
    subtitle: toNullableText(row.subtitle),
    startAt: normalizeTimestamp(row.startAt),
    endAt: normalizeTimestamp(row.endAt),
    locationSummary: toNullableText(row.locationSummary),
    provider: toNullableText(row.provider),
    providerBookingReference: toNullableText(row.providerBookingReference),
    providerConfirmationCode: toNullableText(row.providerConfirmationCode),
    detailsJson: isRecord(row.detailsJson) ? row.detailsJson : null,
    createdAt: normalizeTimestamp(row.createdAt) || new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updatedAt) || new Date().toISOString(),
  };
};

export const mapBookingConfirmationRow = (
  row: BookingConfirmationRow,
  items: BookingConfirmationItem[] = [],
): BookingConfirmation => {
  return {
    id: row.id,
    publicRef: row.publicRef,
    tripId: row.tripId,
    checkoutSessionId: row.checkoutSessionId,
    paymentSessionId: row.paymentSessionId,
    bookingRunId: row.bookingRunId,
    status: normalizeBookingConfirmationStatus(row.status),
    currency: normalizeCurrencyCode(row.currency),
    totalsJson: isRecord(row.totalsJson) ? row.totalsJson : null,
    summaryJson: normalizeBookingConfirmationSummary(row.summaryJson),
    confirmedAt: normalizeTimestamp(row.confirmedAt),
    createdAt: normalizeTimestamp(row.createdAt) || new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updatedAt) || new Date().toISOString(),
    items,
  };
};

export const listBookingConfirmationItems = async (
  confirmationId: string,
): Promise<BookingConfirmationItem[]> => {
  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(bookingConfirmationItems)
      .where(eq(bookingConfirmationItems.confirmationId, confirmationId))
      .orderBy(
        asc(bookingConfirmationItems.createdAt),
        asc(bookingConfirmationItems.checkoutItemKey),
      );

    return rows.map((row) => mapBookingConfirmationItemRow(row));
  });
};

export const getBookingConfirmation = async (
  confirmationId: string,
): Promise<BookingConfirmation | null> => {
  const normalizedId = toNullableText(confirmationId);
  if (!normalizedId) return null;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(bookingConfirmations)
      .where(eq(bookingConfirmations.id, normalizedId))
      .limit(1);

    if (!row) return null;

    const items = await listBookingConfirmationItems(row.id);
    return mapBookingConfirmationRow(row, items);
  });
};
