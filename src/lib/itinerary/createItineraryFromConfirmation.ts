import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { itineraryItems, itineraries } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { createItineraryPublicRef } from "~/lib/itinerary/createItineraryPublicRef";
import { getItinerary } from "~/lib/itinerary/getItinerary";
import { mapConfirmationToItinerary } from "~/lib/itinerary/mapConfirmationToItinerary";
import { isUniqueViolationError } from "~/lib/itinerary/shared";
import type { CreateItineraryFromConfirmationInput } from "~/types/itinerary";

export const createItineraryFromConfirmation = async (
  input: CreateItineraryFromConfirmationInput,
) => {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const mapped = mapConfirmationToItinerary({
      ...input,
      publicRef: createItineraryPublicRef(),
    });

    if (!mapped.items.length) {
      throw new Error(
        "Itinerary creation requires at least one confirmed owned item.",
      );
    }

    try {
      await withCheckoutSchemaGuard(async () => {
        const db = getDb();
        await db.transaction(async (tx) => {
          await tx.insert(itineraries).values({
            id: mapped.itinerary.id,
            publicRef: mapped.itinerary.publicRef,
            tripId: mapped.itinerary.tripId,
            checkoutSessionId: mapped.itinerary.checkoutSessionId,
            paymentSessionId: mapped.itinerary.paymentSessionId,
            bookingRunId: mapped.itinerary.bookingRunId,
            confirmationId: mapped.itinerary.confirmationId,
            status: mapped.itinerary.status,
            currency: mapped.itinerary.currency,
            summaryJson: mapped.itinerary.summaryJson || {},
            ownerUserId: mapped.itinerary.ownerUserId,
            ownerSessionId: mapped.itinerary.ownerSessionId,
            createdAt: new Date(mapped.itinerary.createdAt),
            updatedAt: new Date(mapped.itinerary.updatedAt),
          });

          await tx.insert(itineraryItems).values(
            mapped.items.map((item) => ({
              id: item.id,
              itineraryId: item.itineraryId,
              confirmationItemId: item.confirmationItemId,
              bookingItemExecutionId: item.bookingItemExecutionId,
              checkoutItemKey: item.checkoutItemKey,
              vertical: item.vertical,
              status: item.status,
              canonicalEntityId: item.canonicalEntityId,
              canonicalBookableEntityId: item.canonicalBookableEntityId,
              canonicalInventoryId: item.canonicalInventoryId,
              provider: item.provider,
              providerBookingReference: item.providerBookingReference,
              providerConfirmationCode: item.providerConfirmationCode,
              title: item.title,
              subtitle: item.subtitle,
              startAt: item.startAt ? new Date(item.startAt) : null,
              endAt: item.endAt ? new Date(item.endAt) : null,
              locationSummary: item.locationSummary,
              detailsJson: item.detailsJson,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            })),
          );
        });
      });

      const itinerary = await getItinerary(mapped.itinerary.id);
      if (!itinerary) {
        throw new Error(
          `Itinerary ${mapped.itinerary.id} could not be loaded after creation.`,
        );
      }

      return itinerary;
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
      .select({ id: itineraries.id })
      .from(itineraries)
      .where(eq(itineraries.confirmationId, input.confirmation.id))
      .limit(1);

    return row || null;
  });

  if (existing) {
    const itinerary = await getItinerary(existing.id);
    if (itinerary) return itinerary;
  }

  throw new Error("Itinerary could not be created.");
};

