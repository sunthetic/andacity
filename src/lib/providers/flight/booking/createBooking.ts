import { getProviderCapabilities } from "~/lib/providers/getProviderCapabilities";
import { getProviderConfig } from "~/lib/providers/getProviderConfig";
import {
  buildStableBookingReference,
  buildStableConfirmationCode,
  prepareProviderCreateBooking,
} from "~/lib/providers/booking/shared";
import { mapFlightBookingError } from "~/lib/providers/flight/booking/mapBookingError";
import { mapFlightBookingRequest } from "~/lib/providers/flight/booking/mapBookingRequest";
import { mapFlightBookingResponse } from "~/lib/providers/flight/booking/mapBookingResponse";
import type { CreateProviderBookingInput } from "~/types/booking-adapter";

// Add new flight booking semantics here without leaking them into checkout orchestration.
export const createFlightBooking = async (
  input: CreateProviderBookingInput,
) => {
  const config = getProviderConfig(input.provider);
  const capabilities = getProviderCapabilities(input.provider);

  if (!config.bookingEnabled || !capabilities.supportsBookingCreate) {
    return mapFlightBookingError(input, {
      code: "PROVIDER_DISABLED",
      message: `Provider "${input.provider}" is not configured for flight booking.`,
    });
  }

  const prepared = await prepareProviderCreateBooking(input, input.provider);
  if (!prepared.ok) {
    return prepared.result;
  }

  const requestSnapshot = mapFlightBookingRequest(
    input,
    prepared.latestResolvedInventory,
  );

  try {
    const response = {
      bookingId: buildStableBookingReference("flt", input),
      recordLocator: buildStableConfirmationCode("F", input.idempotencyKey),
      status: "ticketed",
      message: "Flight itinerary ticketed successfully.",
      itineraryId: prepared.latestResolvedInventory.entity.payload.providerInventoryId,
      checkedAt: prepared.latestResolvedInventory.checkedAt,
      idempotencyKeyAccepted: capabilities.supportsIdempotencyKeys,
    };

    return mapFlightBookingResponse({
      bookingInput: input,
      requestSnapshot,
      response,
      latestResolvedInventory: prepared.latestResolvedInventory,
    });
  } catch (error) {
    return mapFlightBookingError(input, error, requestSnapshot);
  }
};
