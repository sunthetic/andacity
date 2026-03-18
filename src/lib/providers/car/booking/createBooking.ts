import { getProviderCapabilities } from "~/lib/providers/getProviderCapabilities";
import { getProviderConfig } from "~/lib/providers/getProviderConfig";
import {
  buildStableBookingReference,
  buildStableConfirmationCode,
  prepareProviderCreateBooking,
} from "~/lib/providers/booking/shared";
import { mapCarBookingError } from "~/lib/providers/car/booking/mapBookingError";
import { mapCarBookingRequest } from "~/lib/providers/car/booking/mapBookingRequest";
import { mapCarBookingResponse } from "~/lib/providers/car/booking/mapBookingResponse";
import type { CarBookableEntity } from "~/types/bookable-entity";
import type { CreateProviderBookingInput } from "~/types/booking-adapter";

export const createCarBooking = async (input: CreateProviderBookingInput) => {
  const config = getProviderConfig(input.provider);
  const capabilities = getProviderCapabilities(input.provider);

  if (!config.bookingEnabled || !capabilities.supportsBookingCreate) {
    return mapCarBookingError(input, {
      code: "PROVIDER_DISABLED",
      message: `Provider "${input.provider}" is not configured for car booking.`,
    });
  }

  const prepared = await prepareProviderCreateBooking(input, input.provider);
  if (!prepared.ok) {
    return prepared.result;
  }

  const requestSnapshot = mapCarBookingRequest(
    input,
    prepared.latestResolvedInventory,
  );

  try {
    const entity = prepared.latestResolvedInventory.entity as CarBookableEntity;
    const requiresManualReview = entity.payload.policy?.securityDepositRequired === true;
    const response = {
      reservationId: buildStableBookingReference("car", input),
      confirmationCode: requiresManualReview
        ? null
        : buildStableConfirmationCode("C", input.idempotencyKey),
      status: requiresManualReview ? "requires_counter_review" : "confirmed",
      message: requiresManualReview
        ? "Rental hold created, but counter review is still required for deposit handling."
        : "Rental booking confirmed.",
      providerLocationId:
        entity.payload.providerMetadata?.providerLocationId ||
        entity.bookingContext.providerLocationId,
      idempotencyKeyAccepted: capabilities.supportsIdempotencyKeys,
      checkedAt: prepared.latestResolvedInventory.checkedAt,
    };

    return mapCarBookingResponse({
      bookingInput: input,
      requestSnapshot,
      response,
      latestResolvedInventory: prepared.latestResolvedInventory,
    });
  } catch (error) {
    return mapCarBookingError(input, error, requestSnapshot);
  }
};
