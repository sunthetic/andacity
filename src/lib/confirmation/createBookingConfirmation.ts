import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import {
  bookingConfirmationItems,
  bookingConfirmations,
} from "~/lib/db/schema";
import { createBookingConfirmationPublicRef } from "~/lib/confirmation/createBookingConfirmationPublicRef";
import { getBookingConfirmation } from "~/lib/confirmation/getBookingConfirmation";
import { mapBookingRunToConfirmation } from "~/lib/confirmation/mapBookingRunToConfirmation";
import { isUniqueViolationError } from "~/lib/confirmation/shared";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import type { CreateBookingConfirmationInput } from "~/types/confirmation";

export const createBookingConfirmation = async (
  input: CreateBookingConfirmationInput,
) => {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const mapped = mapBookingRunToConfirmation({
      ...input,
      publicRef: createBookingConfirmationPublicRef(),
    });

    try {
      await withCheckoutSchemaGuard(async () => {
        const db = getDb();
        await db.transaction(async (tx) => {
          await tx.insert(bookingConfirmations).values({
            id: mapped.confirmation.id,
            publicRef: mapped.confirmation.publicRef,
            tripId: mapped.confirmation.tripId,
            checkoutSessionId: mapped.confirmation.checkoutSessionId,
            paymentSessionId: mapped.confirmation.paymentSessionId,
            bookingRunId: mapped.confirmation.bookingRunId,
            status: mapped.confirmation.status,
            currency: mapped.confirmation.currency,
            totalsJson: mapped.confirmation.totalsJson || {},
            summaryJson: mapped.confirmation.summaryJson,
            confirmedAt: mapped.confirmation.confirmedAt
              ? new Date(mapped.confirmation.confirmedAt)
              : null,
            createdAt: new Date(mapped.confirmation.createdAt),
            updatedAt: new Date(mapped.confirmation.updatedAt),
          });

          if (!mapped.items.length) return;

          await tx.insert(bookingConfirmationItems).values(
            mapped.items.map((item) => ({
              id: item.id,
              confirmationId: item.confirmationId,
              bookingItemExecutionId: item.bookingItemExecutionId,
              checkoutItemKey: item.checkoutItemKey,
              vertical: item.vertical,
              status: item.status,
              title: item.title,
              subtitle: item.subtitle,
              startAt: item.startAt ? new Date(item.startAt) : null,
              endAt: item.endAt ? new Date(item.endAt) : null,
              locationSummary: item.locationSummary,
              provider: item.provider,
              providerBookingReference: item.providerBookingReference,
              providerConfirmationCode: item.providerConfirmationCode,
              detailsJson: item.detailsJson,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            })),
          );
        });
      });

      const confirmation = await getBookingConfirmation(mapped.confirmation.id);
      if (!confirmation) {
        throw new Error(
          `Booking confirmation ${mapped.confirmation.id} could not be loaded after creation.`,
        );
      }

      return confirmation;
    } catch (error) {
      if (isUniqueViolationError(error) && attempt + 1 < maxAttempts) {
        continue;
      }

      throw error;
    }
  }

  const existing = await withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const [row] = await db
      .select({ id: bookingConfirmations.id })
      .from(bookingConfirmations)
      .where(eq(bookingConfirmations.bookingRunId, input.bookingRun.id))
      .limit(1);

    return row || null;
  });

  if (existing) {
    const confirmation = await getBookingConfirmation(existing.id);
    if (confirmation) return confirmation;
  }

  throw new Error("Booking confirmation could not be created.");
};
