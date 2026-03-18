import { getProviderCapabilities } from "~/lib/providers/getProviderCapabilities";
import { getProviderConfig } from "~/lib/providers/getProviderConfig";
import {
  buildStableBookingReference,
  buildStableConfirmationCode,
  prepareProviderCreateBooking,
} from "~/lib/providers/booking/shared";
import { mapHotelBookingError } from "~/lib/providers/hotel/booking/mapBookingError";
import { mapHotelBookingRequest } from "~/lib/providers/hotel/booking/mapBookingRequest";
import { mapHotelBookingResponse } from "~/lib/providers/hotel/booking/mapBookingResponse";
import type { HotelBookableEntity } from "~/types/bookable-entity";
import type { CreateProviderBookingInput } from "~/types/booking-adapter";

export const createHotelBooking = async (input: CreateProviderBookingInput) => {
  const config = getProviderConfig(input.provider);
  const capabilities = getProviderCapabilities(input.provider);

  if (!config.bookingEnabled || !capabilities.supportsBookingCreate) {
    return mapHotelBookingError(input, {
      code: "PROVIDER_DISABLED",
      message: `Provider "${input.provider}" is not configured for hotel booking.`,
    });
  }

  const prepared = await prepareProviderCreateBooking(input, input.provider);
  if (!prepared.ok) {
    return prepared.result;
  }

  const requestSnapshot = mapHotelBookingRequest(
    input,
    prepared.latestResolvedInventory,
  );

  try {
    const entity = prepared.latestResolvedInventory.entity as HotelBookableEntity;
    const payLater = entity.payload.policy?.payLater === true;
    const response = {
      reservationId: buildStableBookingReference("htl", input),
      confirmationCode: payLater
        ? null
        : buildStableConfirmationCode("H", input.idempotencyKey),
      status: payLater ? "pending_supplier_confirmation" : "confirmed",
      message: payLater
        ? "Hotel reservation created and awaiting supplier confirmation."
        : "Hotel reservation confirmed.",
      providerHotelId:
        entity.payload.providerMetadata?.providerHotelId || entity.bookingContext.hotelId,
      idempotencyKeyAccepted: capabilities.supportsIdempotencyKeys,
      checkedAt: prepared.latestResolvedInventory.checkedAt,
    };

    return mapHotelBookingResponse({
      bookingInput: input,
      requestSnapshot,
      response,
      latestResolvedInventory: prepared.latestResolvedInventory,
    });
  } catch (error) {
    return mapHotelBookingError(input, error, requestSnapshot);
  }
};
