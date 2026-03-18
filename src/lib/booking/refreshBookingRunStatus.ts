import { getBooking } from "~/lib/booking/adapters/getBooking";
import { buildBookingExecutionSummary } from "~/lib/booking/buildBookingExecutionSummary";
import {
  getLatestBookingRunForCheckout,
  updateBookingItemExecution,
  updateBookingRun,
} from "~/lib/booking/getBookingRun";
import { sanitizeBookingRequestSnapshot } from "~/lib/booking/sanitizeBookingRequestSnapshot";
import { sanitizeBookingResponseSnapshot } from "~/lib/booking/sanitizeBookingResponseSnapshot";
import {
  getCheckoutSession,
  persistCheckoutSessionStatus,
} from "~/lib/checkout/getCheckoutSession";
import { getCheckoutPaymentSession } from "~/lib/payments/getCheckoutPaymentSession";

const normalizeTimestamp = (value: Date | string | number | null | undefined) => {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const refreshBookingRunStatus = async (
  checkoutSessionId: string,
  options: {
    now?: Date | string | number;
  } = {},
) => {
  const run = await getLatestBookingRunForCheckout(checkoutSessionId, {
    includeTerminal: true,
  });
  if (!run) return null;

  const inFlightItems = run.itemExecutions.filter(
    (item) => item.status === "processing",
  );

  if (inFlightItems.length > 0) {
    const checkoutSession = await getCheckoutSession(checkoutSessionId, {
      now: options.now ?? undefined,
      includeTerminal: true,
    });
    const paymentSession = await getCheckoutPaymentSession(run.paymentSessionId, {
      now: options.now ?? undefined,
      includeTerminal: true,
    });

    if (checkoutSession && paymentSession) {
      const checkoutItemsByKey = new Map(
        checkoutSession.items.map((item) => [
          `trip-item:${item.tripItemId}:${item.inventory.inventoryId}`,
          item,
        ]),
      );

      for (const itemExecution of inFlightItems) {
        const checkoutItem = checkoutItemsByKey.get(itemExecution.checkoutItemKey);
        if (!checkoutItem || !itemExecution.provider) {
          continue;
        }

        const result = await getBooking({
          checkoutSessionId: checkoutSession.id,
          bookingRunId: run.id,
          checkoutItemKey: itemExecution.checkoutItemKey,
          vertical: checkoutItem.vertical,
          provider: itemExecution.provider,
          canonicalEntityId: checkoutItem.entityId,
          canonicalBookableEntityId: checkoutItem.bookableEntityId,
          canonicalInventoryId: checkoutItem.inventory.inventoryId,
          checkoutItem,
          inventorySnapshot: {
            inventoryId: checkoutItem.inventory.inventoryId,
            providerInventoryId: checkoutItem.inventory.providerInventoryId,
            snapshotTimestamp: checkoutItem.snapshotTimestamp,
            pricing: checkoutItem.pricing,
            providerMetadata: checkoutItem.inventory.providerMetadata,
            bookableEntity: checkoutItem.inventory.bookableEntity,
            availability: checkoutItem.inventory.availability,
          },
          travelerContext: null,
          paymentContext: {
            paymentSessionId: paymentSession.id,
            provider: paymentSession.provider,
            status: paymentSession.status,
            providerPaymentIntentId: paymentSession.providerPaymentIntentId,
            currency: paymentSession.currency,
            amount: paymentSession.amountSnapshot.totalAmountCents,
            authorizedAt: paymentSession.authorizedAt,
            metadata: paymentSession.providerMetadata,
          },
          idempotencyKey: `${run.executionKey}:${itemExecution.checkoutItemKey}`,
          currency:
            toNullableText(checkoutItem.pricing.currencyCode)?.toUpperCase() ||
            paymentSession.currency,
          amount:
            checkoutItem.pricing.totalAmountCents ??
            paymentSession.amountSnapshot.items.find(
              (item) => item.inventoryId === checkoutItem.inventory.inventoryId,
            )?.totalAmountCents ??
            null,
          metadata: {
            checkoutItemKey: itemExecution.checkoutItemKey,
            bookingItemExecutionId: itemExecution.id,
          },
          providerBookingReference: itemExecution.providerBookingReference,
          requestSnapshot: itemExecution.requestSnapshotJson,
          responseSnapshot: itemExecution.responseSnapshotJson,
        });

        const completedAt =
          result.status === "pending"
            ? null
            : normalizeTimestamp(options.now) || new Date().toISOString();

        await updateBookingItemExecution(itemExecution.id, {
          status: result.status === "pending" ? "processing" : result.status,
          provider: result.provider,
          providerBookingReference: result.providerBookingReference,
          providerConfirmationCode: result.providerConfirmationCode,
          requestSnapshotJson:
            sanitizeBookingRequestSnapshot(result.requestSnapshot) ||
            itemExecution.requestSnapshotJson,
          responseSnapshotJson:
            sanitizeBookingResponseSnapshot(result.responseSnapshot) ||
            itemExecution.responseSnapshotJson,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage || result.message,
          completedAt,
          updatedAt: completedAt || options.now || new Date(),
        });
      }
    }
  }

  const refreshedRun =
    (await getLatestBookingRunForCheckout(checkoutSessionId, {
      includeTerminal: true,
    })) || run;
  const summary = buildBookingExecutionSummary(refreshedRun.itemExecutions);
  const updatedRun =
    (await updateBookingRun(refreshedRun.id, {
      status: summary.runStatus,
      summary,
      completedAt:
        summary.overallStatus === "processing" || summary.overallStatus === "pending"
          ? null
          : normalizeTimestamp(options.now) || new Date().toISOString(),
      updatedAt: normalizeTimestamp(options.now) || new Date().toISOString(),
    })) || refreshedRun;

  if (summary.overallStatus === "succeeded") {
    await persistCheckoutSessionStatus(checkoutSessionId, "completed", {
      now: options.now || new Date(),
    });
  }

  return updatedRun;
};
