import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import {
  bookingItemExecutions,
  bookingRuns,
} from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import {
  BOOKING_EXECUTION_STATUSES,
  BOOKING_ITEM_EXECUTION_STATUSES,
  BOOKING_RUN_STATUSES,
  type BookingExecutionSummary,
  type BookingItemExecution,
  type BookingItemExecutionStatus,
  type BookingRun,
  type BookingRunStatus,
} from "~/types/booking";
import type { BookableVertical } from "~/types/bookable-entity";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
};

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const normalizeBookingRunStatus = (value: unknown): BookingRunStatus => {
  return BOOKING_RUN_STATUSES.includes(value as BookingRunStatus)
    ? (value as BookingRunStatus)
    : "pending";
};

const normalizeBookingItemExecutionStatus = (
  value: unknown,
): BookingItemExecutionStatus => {
  return BOOKING_ITEM_EXECUTION_STATUSES.includes(
    value as BookingItemExecutionStatus,
  )
    ? (value as BookingItemExecutionStatus)
    : "pending";
};

const normalizeVertical = (value: unknown): BookableVertical => {
  return value === "flight" || value === "hotel" || value === "car"
    ? value
    : "hotel";
};

const normalizeBookingExecutionSummary = (
  value: unknown,
): BookingExecutionSummary | null => {
  const input = isRecord(value) ? value : null;
  if (!input) return null;

  const overallStatus = BOOKING_EXECUTION_STATUSES.includes(
    input.overallStatus as BookingExecutionSummary["overallStatus"],
  )
    ? (input.overallStatus as BookingExecutionSummary["overallStatus"])
    : "idle";
  const runStatus = normalizeBookingRunStatus(input.runStatus);
  const items = Array.isArray(input.items)
    ? input.items
        .map((entry) => {
          const item = isRecord(entry) ? entry : null;
          if (!item) return null;
          return {
            checkoutItemKey: toNullableText(item.checkoutItemKey) || "item",
            tripItemId: toPositiveInteger(item.tripItemId),
            title: toNullableText(item.title) || "Checkout item",
            vertical: normalizeVertical(item.vertical),
            provider: toNullableText(item.provider),
            status: normalizeBookingItemExecutionStatus(item.status),
            providerBookingReference: toNullableText(
              item.providerBookingReference,
            ),
            providerConfirmationCode: toNullableText(
              item.providerConfirmationCode,
            ),
            providerStatus: toNullableText(item.providerStatus),
            message: toNullableText(item.message),
            errorCode: toNullableText(item.errorCode),
            errorMessage: toNullableText(item.errorMessage),
            requiresManualReview: Boolean(item.requiresManualReview),
            isPendingConfirmation: Boolean(item.isPendingConfirmation),
          };
        })
        .filter(
          (entry): entry is BookingExecutionSummary["items"][number] =>
            Boolean(entry),
        )
    : [];

  return {
    overallStatus,
    runStatus,
    totalItemCount: toPositiveInteger(input.totalItemCount) ?? items.length,
    pendingCount: Number(input.pendingCount) || 0,
    processingCount: Number(input.processingCount) || 0,
    succeededCount: Number(input.succeededCount) || 0,
    failedCount: Number(input.failedCount) || 0,
    manualReviewCount: Number(input.manualReviewCount) || 0,
    skippedCount: Number(input.skippedCount) || 0,
    completedCount: Number(input.completedCount) || 0,
    pendingProviderConfirmationCount:
      Number(input.pendingProviderConfirmationCount) || 0,
    message: toNullableText(input.message) || "Booking status available.",
    items,
  };
};

export const createBookingRunId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `brn_${globalThis.crypto.randomUUID()}`;
  }

  return `brn_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

export const createBookingItemExecutionId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `bix_${globalThis.crypto.randomUUID()}`;
  }

  return `bix_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

type BookingRunRow = typeof bookingRuns.$inferSelect;
type BookingItemExecutionRow = typeof bookingItemExecutions.$inferSelect;

export const mapBookingItemExecutionRow = (
  row: BookingItemExecutionRow,
): BookingItemExecution => {
  return {
    id: row.id,
    bookingRunId: row.bookingRunId,
    checkoutItemKey: row.checkoutItemKey,
    tripItemId: row.tripItemId ?? null,
    title: row.title,
    vertical: normalizeVertical(row.vertical),
    provider: toNullableText(row.provider),
    status: normalizeBookingItemExecutionStatus(row.status),
    providerBookingReference: toNullableText(row.providerBookingReference),
    providerConfirmationCode: toNullableText(row.providerConfirmationCode),
    requestSnapshotJson: isRecord(row.requestSnapshotJson)
      ? row.requestSnapshotJson
      : null,
    responseSnapshotJson: isRecord(row.responseSnapshotJson)
      ? row.responseSnapshotJson
      : null,
    errorCode: toNullableText(row.errorCode),
    errorMessage: toNullableText(row.errorMessage),
    startedAt: normalizeTimestamp(row.startedAt),
    completedAt: normalizeTimestamp(row.completedAt),
    createdAt: normalizeTimestamp(row.createdAt) || new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updatedAt) || new Date().toISOString(),
  };
};

export const mapBookingRunRow = (
  row: BookingRunRow,
  itemExecutions: BookingItemExecution[] = [],
): BookingRun => {
  return {
    id: row.id,
    checkoutSessionId: row.checkoutSessionId,
    paymentSessionId: row.paymentSessionId,
    status: normalizeBookingRunStatus(row.status),
    executionKey: row.executionKey,
    startedAt: normalizeTimestamp(row.startedAt),
    completedAt: normalizeTimestamp(row.completedAt),
    createdAt: normalizeTimestamp(row.createdAt) || new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updatedAt) || new Date().toISOString(),
    summary: normalizeBookingExecutionSummary(row.summaryJson),
    itemExecutions,
  };
};

export const listBookingItemExecutions = async (
  bookingRunId: string,
): Promise<BookingItemExecution[]> => {
  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(bookingItemExecutions)
      .where(eq(bookingItemExecutions.bookingRunId, bookingRunId))
      .orderBy(
        asc(bookingItemExecutions.createdAt),
        asc(bookingItemExecutions.checkoutItemKey),
      );

    return rows.map((row) => mapBookingItemExecutionRow(row));
  });
};

export const getBookingRun = async (
  bookingRunId: string,
): Promise<BookingRun | null> => {
  const normalizedId = toNullableText(bookingRunId);
  if (!normalizedId) return null;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(bookingRuns)
      .where(eq(bookingRuns.id, normalizedId))
      .limit(1);

    if (!row) return null;

    const itemExecutions = await listBookingItemExecutions(row.id);
    return mapBookingRunRow(row, itemExecutions);
  });
};

export const getBookingRunByExecutionKey = async (
  executionKey: string,
): Promise<BookingRun | null> => {
  const normalizedKey = toNullableText(executionKey);
  if (!normalizedKey) return null;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(bookingRuns)
      .where(eq(bookingRuns.executionKey, normalizedKey))
      .limit(1);

    if (!row) return null;

    const itemExecutions = await listBookingItemExecutions(row.id);
    return mapBookingRunRow(row, itemExecutions);
  });
};

export const getLatestBookingRunRowForCheckout = async (
  checkoutSessionId: string,
  options: {
    includeTerminal?: boolean;
  } = {},
): Promise<BookingRunRow | null> => {
  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const filters = [eq(bookingRuns.checkoutSessionId, checkoutSessionId)];
    if (!options.includeTerminal) {
      filters.push(
        sql`${bookingRuns.status} in ('pending', 'processing')`,
      );
    }

    const [row] = await db
      .select()
      .from(bookingRuns)
      .where(and(...filters))
      .orderBy(desc(bookingRuns.updatedAt), desc(bookingRuns.createdAt))
      .limit(1);

    return row || null;
  });
};

export const getLatestBookingRunForCheckout = async (
  checkoutSessionId: string,
  options: {
    includeTerminal?: boolean;
  } = {},
): Promise<BookingRun | null> => {
  const row = await getLatestBookingRunRowForCheckout(checkoutSessionId, options);
  if (!row) return null;
  const itemExecutions = await listBookingItemExecutions(row.id);
  return mapBookingRunRow(row, itemExecutions);
};

export const updateBookingRun = async (
  bookingRunId: string,
  input: {
    status?: BookingRunStatus;
    summary?: BookingExecutionSummary | null;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    updatedAt?: Date | string | number;
  },
) => {
  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const updatedAt = normalizeTimestamp(
      input.updatedAt instanceof Date || typeof input.updatedAt === "string"
        ? input.updatedAt
        : input.updatedAt != null
          ? new Date(input.updatedAt)
          : new Date(),
    );
    if (!updatedAt) return getBookingRun(bookingRunId);

    await db
      .update(bookingRuns)
      .set({
        status: input.status,
        summaryJson: input.summary || null,
        startedAt:
          input.startedAt === undefined
            ? undefined
            : input.startedAt
              ? new Date(String(input.startedAt))
              : null,
        completedAt:
          input.completedAt === undefined
            ? undefined
            : input.completedAt
              ? new Date(String(input.completedAt))
              : null,
        updatedAt: new Date(updatedAt),
      })
      .where(eq(bookingRuns.id, bookingRunId));

    return getBookingRun(bookingRunId);
  });
};

export const updateBookingItemExecution = async (
  bookingItemExecutionId: string,
  input: {
    status?: BookingItemExecutionStatus;
    provider?: string | null;
    providerBookingReference?: string | null;
    providerConfirmationCode?: string | null;
    requestSnapshotJson?: Record<string, unknown> | null;
    responseSnapshotJson?: Record<string, unknown> | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    updatedAt?: Date | string | number;
  },
) => {
  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const updatedAt = normalizeTimestamp(
      input.updatedAt instanceof Date || typeof input.updatedAt === "string"
        ? input.updatedAt
        : input.updatedAt != null
          ? new Date(input.updatedAt)
          : new Date(),
    );
    if (!updatedAt) return null;

    await db
      .update(bookingItemExecutions)
      .set({
        status: input.status,
        provider: input.provider,
        providerBookingReference: input.providerBookingReference,
        providerConfirmationCode: input.providerConfirmationCode,
        requestSnapshotJson: input.requestSnapshotJson,
        responseSnapshotJson: input.responseSnapshotJson,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        startedAt:
          input.startedAt === undefined
            ? undefined
            : input.startedAt
              ? new Date(String(input.startedAt))
              : null,
        completedAt:
          input.completedAt === undefined
            ? undefined
            : input.completedAt
              ? new Date(String(input.completedAt))
              : null,
        updatedAt: new Date(updatedAt),
      })
      .where(eq(bookingItemExecutions.id, bookingItemExecutionId));

    const [row] = await db
      .select()
      .from(bookingItemExecutions)
      .where(eq(bookingItemExecutions.id, bookingItemExecutionId))
      .limit(1);

    return row ? mapBookingItemExecutionRow(row) : null;
  });
};
