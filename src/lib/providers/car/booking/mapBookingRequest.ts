import type { CreateProviderBookingInput } from "~/types/booking-adapter";
import type { CarBookableEntity } from "~/types/bookable-entity";
import type { ResolvedInventoryRecord } from "~/types/inventory";

// Car provider request mapping stays isolated here so orchestration only sees canonical input/output.
export const mapCarBookingRequest = (
  input: CreateProviderBookingInput,
  latestResolvedInventory: ResolvedInventoryRecord,
) => {
  const entity = latestResolvedInventory.entity as CarBookableEntity;

  return {
    bookingType: "car",
    checkoutSessionId: input.checkoutSessionId,
    bookingRunId: input.bookingRunId,
    checkoutItemKey: input.checkoutItemKey,
    inventoryId: input.canonicalInventoryId,
    providerLocationId:
      entity.payload.providerMetadata?.providerLocationId ||
      entity.bookingContext.providerLocationId,
    inventorySlug: entity.payload.providerMetadata?.inventorySlug || null,
    pickupDateTime: entity.bookingContext.pickupDateTime,
    dropoffDateTime: entity.bookingContext.dropoffDateTime,
    vehicleClass: entity.bookingContext.vehicleClass,
    ratePlanCode:
      entity.payload.providerMetadata?.ratePlanCode || entity.payload.ratePlanCode,
    ratePlan: entity.payload.providerMetadata?.ratePlan || entity.payload.ratePlan,
    fuelPolicy:
      entity.payload.providerMetadata?.fuelPolicy || entity.payload.fuelPolicy,
    mileagePolicy:
      entity.payload.providerMetadata?.mileagePolicy || entity.payload.mileagePolicy,
    driverAge: entity.payload.providerMetadata?.driverAge || null,
    amount: {
      currency: input.currency,
      totalAmountCents: input.amount,
    },
    payment: {
      paymentSessionId: input.paymentContext.paymentSessionId,
      provider: input.paymentContext.provider,
      providerPaymentIntentId: input.paymentContext.providerPaymentIntentId,
    },
    travelers: input.travelerContext,
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata || null,
  };
};
