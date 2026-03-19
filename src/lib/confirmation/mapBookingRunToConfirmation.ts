import { buildBookingConfirmationSummary } from "~/lib/confirmation/buildBookingConfirmationSummary";
import { buildConfirmationStatus } from "~/lib/confirmation/buildConfirmationStatus";
import { mapBookingItemExecutionToConfirmationItem } from "~/lib/confirmation/mapBookingItemExecutionToConfirmationItem";
import {
  createBookingConfirmationId,
  normalizeCurrencyCode,
  normalizeTimestamp,
} from "~/lib/confirmation/shared";
import type { CreateBookingConfirmationInput } from "~/types/confirmation";

const findConfirmedAt = (
  items: ReturnType<typeof mapBookingItemExecutionToConfirmationItem>[],
  now: Date | string | null | undefined,
) => {
  const firstConfirmed = items.find((item) => item.status === "confirmed");
  if (!firstConfirmed) return null;

  return (
    firstConfirmed.updatedAt ||
    normalizeTimestamp(now) ||
    new Date().toISOString()
  );
};

export const mapBookingRunToConfirmation = (
  input: CreateBookingConfirmationInput & {
    confirmationId?: string | null;
    publicRef: string;
  },
) => {
  const confirmationId = input.confirmationId || createBookingConfirmationId();
  const timestamp =
    normalizeTimestamp(input.now) ||
    input.bookingRun.completedAt ||
    input.bookingRun.updatedAt ||
    new Date().toISOString();
  const items = input.bookingRun.itemExecutions.map((bookingItemExecution) =>
    mapBookingItemExecutionToConfirmationItem({
      confirmationId,
      bookingItemExecution,
      checkoutSession: input.checkoutSession,
      now: timestamp,
    }),
  );
  const status = buildConfirmationStatus(items);
  const confirmedAt = findConfirmedAt(items, input.now);
  const confirmation = {
    id: confirmationId,
    publicRef: input.publicRef,
    tripId: input.checkoutSession.tripId,
    checkoutSessionId: input.checkoutSession.id,
    paymentSessionId: input.paymentSession.id,
    bookingRunId: input.bookingRun.id,
    status,
    currency:
      normalizeCurrencyCode(input.checkoutSession.currencyCode) ||
      normalizeCurrencyCode(input.paymentSession.currency),
    totalsJson: {
      ...input.checkoutSession.totals,
    } satisfies Record<string, unknown>,
    summaryJson: null,
    confirmedAt,
    createdAt: timestamp,
    updatedAt: timestamp,
    items,
  };

  return {
    confirmation: {
      ...confirmation,
      summaryJson: buildBookingConfirmationSummary(confirmation),
    },
    items,
  };
};
