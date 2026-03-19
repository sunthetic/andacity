import type { CreateProviderBookingInput } from "~/types/booking-adapter";
import type { HotelBookableEntity } from "~/types/bookable-entity";
import type { ResolvedInventoryRecord } from "~/types/inventory";

// Hotel request mapping belongs here so provider field names stay out of checkout state.
export const mapHotelBookingRequest = (
  input: CreateProviderBookingInput,
  latestResolvedInventory: ResolvedInventoryRecord,
) => {
  const entity = latestResolvedInventory.entity as HotelBookableEntity;

  return {
    bookingType: "hotel",
    checkoutSessionId: input.checkoutSessionId,
    bookingRunId: input.bookingRunId,
    checkoutItemKey: input.checkoutItemKey,
    inventoryId: input.canonicalInventoryId,
    hotelId: entity.bookingContext.hotelId,
    hotelSlug: entity.payload.hotelSlug || null,
    providerHotelId:
      entity.payload.providerMetadata?.providerHotelId || entity.bookingContext.hotelId,
    providerOfferId:
      entity.payload.providerMetadata?.providerOfferId || entity.payload.providerOfferId,
    ratePlanId:
      entity.payload.providerMetadata?.ratePlanId || entity.payload.ratePlanId,
    boardType:
      entity.payload.providerMetadata?.boardType || entity.payload.boardType || null,
    cancellationPolicy:
      entity.payload.providerMetadata?.cancellationPolicy ||
      entity.payload.cancellationPolicy ||
      null,
    checkInDate: entity.bookingContext.checkInDate,
    checkOutDate: entity.bookingContext.checkOutDate,
    roomType: entity.bookingContext.roomType,
    occupancy: entity.bookingContext.occupancy,
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
