import type { CreateProviderBookingInput } from "~/types/booking-adapter";
import type { FlightBookableEntity } from "~/types/bookable-entity";
import type { ResolvedInventoryRecord } from "~/types/inventory";

const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

// Keep provider field names and booking payload assembly inside the provider seam.
export const mapFlightBookingRequest = (
  input: CreateProviderBookingInput,
  latestResolvedInventory: ResolvedInventoryRecord,
) => {
  const entity = latestResolvedInventory.entity as FlightBookableEntity;

  return {
    bookingType: "flight",
    checkoutSessionId: input.checkoutSessionId,
    bookingRunId: input.bookingRunId,
    checkoutItemKey: input.checkoutItemKey,
    inventoryId: input.canonicalInventoryId,
    itineraryId: entity.payload.providerInventoryId,
    carrier: entity.bookingContext.carrier,
    flightNumber: entity.bookingContext.flightNumber,
    originCode: entity.bookingContext.origin,
    destinationCode: entity.bookingContext.destination,
    departDate: entity.bookingContext.departDate,
    cabinClass: entity.payload.cabinClass || null,
    fareCode: entity.payload.fareCode || null,
    requestedServiceDate:
      toNullableText(input.inventorySnapshot.providerMetadata?.requestedServiceDate) ||
      null,
    amount: {
      currency: input.currency,
      totalAmountCents: input.amount,
    },
    payment: {
      paymentSessionId: input.paymentContext.paymentSessionId,
      provider: input.paymentContext.provider,
      providerPaymentIntentId: input.paymentContext.providerPaymentIntentId,
    },
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata || null,
  };
};
