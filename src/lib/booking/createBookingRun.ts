import { getDb } from "~/lib/db/client.server";
import {
  bookingItemExecutions,
  bookingRuns,
} from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import {
  createBookingItemExecutionId,
  createBookingRunId,
  getBookingRun,
} from "~/lib/booking/getBookingRun";
import type {
  BookingCreateItemSnapshot,
  BookingRun,
  CreateBookingRunInput,
} from "~/types/booking";

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const resolveProvider = (item: CreateBookingRunInput["checkoutSession"]["items"][number]) => {
  return (
    String(
      item.inventory.bookableEntity?.provider ||
        item.inventory.providerMetadata?.provider ||
        item.vertical,
    )
      .trim()
      .toLowerCase() || null
  );
};

const getCheckoutItemKey = (
  item: CreateBookingRunInput["checkoutSession"]["items"][number],
) => {
  return `trip-item:${item.tripItemId}:${item.inventory.inventoryId}`;
};

const buildItemSnapshots = (
  input: CreateBookingRunInput,
): BookingCreateItemSnapshot[] => {
  return input.checkoutSession.items.map((checkoutItem) => {
    const checkoutItemKey = getCheckoutItemKey(checkoutItem);
    const provider = resolveProvider(checkoutItem);

    return {
      checkoutItem,
      checkoutItemKey,
      provider,
      requestSnapshotJson: {
        checkoutItemKey,
        tripItemId: checkoutItem.tripItemId,
        inventoryId: checkoutItem.inventory.inventoryId,
        vertical: checkoutItem.vertical,
        title: checkoutItem.title,
        pricing: checkoutItem.pricing,
        providerMetadata: checkoutItem.inventory.providerMetadata,
      },
    };
  });
};

export const createBookingRun = async (
  input: CreateBookingRunInput,
): Promise<BookingRun> => {
  const createdAt = normalizeTimestamp(input.now);
  const bookingRunId = createBookingRunId();
  const itemSnapshots = buildItemSnapshots(input);

  await withCheckoutSchemaGuard(async () => {
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx.insert(bookingRuns).values({
        id: bookingRunId,
        checkoutSessionId: input.checkoutSession.id,
        paymentSessionId: input.paymentSession.id,
        status: "pending",
        executionKey: input.executionKey,
        summaryJson: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(createdAt),
        updatedAt: new Date(createdAt),
      });

      if (!itemSnapshots.length) return;

      await tx.insert(bookingItemExecutions).values(
        itemSnapshots.map((item) => ({
          id: createBookingItemExecutionId(),
          bookingRunId,
          checkoutItemKey: item.checkoutItemKey,
          tripItemId: item.checkoutItem.tripItemId,
          title: item.checkoutItem.title,
          vertical: item.checkoutItem.vertical,
          provider: item.provider,
          status: "pending" as const,
          providerBookingReference: null,
          providerConfirmationCode: null,
          requestSnapshotJson: item.requestSnapshotJson,
          responseSnapshotJson: null,
          errorCode: null,
          errorMessage: null,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(createdAt),
          updatedAt: new Date(createdAt),
        })),
      );
    });
  });

  const run = await getBookingRun(bookingRunId);
  if (!run) {
    throw new Error(`Booking run ${bookingRunId} could not be loaded after creation.`);
  }

  return run;
};
