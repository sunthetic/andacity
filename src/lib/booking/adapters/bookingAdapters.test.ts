import assert from "node:assert/strict";
import test from "node:test";

import type {
  BookableEntity,
  CarBookableEntity,
  FlightBookableEntity,
  HotelBookableEntity,
} from "~/types/bookable-entity";
import type { CreateProviderBookingInput } from "~/types/booking-adapter";
import type { CheckoutItemSnapshot } from "~/types/checkout";
import type { ResolvedInventoryRecord } from "~/types/inventory";

const adaptersModule: typeof import("./createBooking.ts") = await import(
  new URL("./createBooking.ts", import.meta.url).href
);
const sanitizeModule: typeof import("../sanitizeBookingRequestSnapshot.ts") =
  await import(
    new URL("../sanitizeBookingRequestSnapshot.ts", import.meta.url).href
  );
const flightRequestModule: typeof import(
  "../../providers/flight/booking/mapBookingRequest.ts"
) = await import(
  new URL("../../providers/flight/booking/mapBookingRequest.ts", import.meta.url)
    .href
);
const hotelResponseModule: typeof import(
  "../../providers/hotel/booking/mapBookingResponse.ts"
) = await import(
  new URL(
    "../../providers/hotel/booking/mapBookingResponse.ts",
    import.meta.url,
  ).href
);
const carResponseModule: typeof import(
  "../../providers/car/booking/mapBookingResponse.ts"
) = await import(
  new URL("../../providers/car/booking/mapBookingResponse.ts", import.meta.url)
    .href
);

const { createBooking } = adaptersModule;
const { sanitizeBookingRequestSnapshot } = sanitizeModule;
const { mapFlightBookingRequest } = flightRequestModule;
const { mapHotelBookingResponse } = hotelResponseModule;
const { mapCarBookingResponse } = carResponseModule;

const getRequestedServiceDate = (entity: BookableEntity): string | null => {
  if (entity.vertical !== "flight") {
    return null;
  }

  return entity.payload.providerMetadata?.requestedServiceDate ?? null;
};

const getStartDate = (entity: BookableEntity): string | null => {
  if (entity.vertical === "hotel") {
    return entity.bookingContext.checkInDate;
  }

  if (entity.vertical === "car") {
    return entity.bookingContext.pickupDateTime;
  }

  return entity.bookingContext.departDate;
};

const getEndDate = (entity: BookableEntity): string | null => {
  if (entity.vertical === "hotel") {
    return entity.bookingContext.checkOutDate;
  }

  if (entity.vertical === "car") {
    return entity.bookingContext.dropoffDateTime;
  }

  return null;
};

const buildFlightEntity = (): FlightBookableEntity => ({
  inventoryId: "flight:DL:123:2026-04-01:JFK:LAX",
  vertical: "flight",
  provider: "flight-default",
  title: "Delta 123",
  subtitle: "JFK to LAX",
  imageUrl: null,
  href: "/flights/itinerary/test",
  snapshotTimestamp: "2026-03-18T12:00:00.000Z",
  price: {
    amountCents: 39900,
    currency: "USD",
  },
  bookingContext: {
    carrier: "DL",
    flightNumber: "123",
    origin: "JFK",
    destination: "LAX",
    departDate: "2026-04-01",
  },
  payload: {
    source: "search",
    priceSource: "live",
    providerInventoryId: 321,
    cabinClass: "economy",
    fareCode: "standard",
    departureAt: "2026-04-01T14:00:00.000Z",
    arrivalAt: "2026-04-01T20:05:00.000Z",
    itineraryType: "one-way",
    policy: {
      refundable: false,
      changeable: true,
      checkedBagsIncluded: 1,
      seatsRemaining: 4,
    },
    segments: [],
    providerMetadata: {
      providerName: "flight-default",
      itineraryType: "one-way",
      requestedServiceDate: "2026-04-01",
      serviceDate: "2026-04-01",
    },
  },
});

const buildHotelEntity = (): HotelBookableEntity => ({
  inventoryId:
    "hotel:hotel-default:555:2026-04-10:2026-04-14:deluxe-king-suite:2:ace-flex-king:flex-king:breakfast:free-cancellation",
  vertical: "hotel",
  provider: "hotel-default",
  title: "Ace Palm Hotel",
  subtitle: "Downtown",
  imageUrl: null,
  href: "/hotels/ace-palm",
  snapshotTimestamp: "2026-03-18T12:00:00.000Z",
  price: {
    amountCents: 75600,
    currency: "USD",
  },
  bookingContext: {
    hotelId: "555",
    checkInDate: "2026-04-10",
    checkOutDate: "2026-04-14",
    roomType: "deluxe-king-suite",
    occupancy: 2,
  },
  payload: {
    source: "search",
    priceSource: "live",
    providerInventoryId: 555,
    hotelSlug: "ace-palm",
    providerOfferId: "ace-flex-king",
    ratePlanId: "flex-king",
    ratePlan: "Flexible rate",
    boardType: "breakfast",
    cancellationPolicy: "free-cancellation",
    policy: {
      refundable: true,
      freeCancellation: true,
      payLater: true,
      cancellationLabel: "Free cancellation",
    },
    priceSummary: {
      nightlyBaseCents: 18900,
      totalBaseCents: 75600,
      taxesCents: 0,
      mandatoryFeesCents: 0,
      totalPriceCents: 75600,
      nights: 4,
    },
    propertySummary: null,
    roomSummary: null,
    inclusions: null,
    providerMetadata: {
      providerName: "hotel-default",
      providerHotelId: "555",
      providerOfferId: "ace-flex-king",
      ratePlanId: "flex-king",
      boardType: "breakfast",
      cancellationPolicy: "free-cancellation",
      checkInDate: "2026-04-10",
      checkOutDate: "2026-04-14",
      occupancy: 2,
    },
    assumedStayDates: false,
    assumedOccupancy: false,
  },
});

const buildCarEntity = (): CarBookableEntity => ({
  inventoryId: "car:phx-airport:2026-04-01T10:00:2026-04-05T10:00:suv",
  vertical: "car",
  provider: "car-default",
  title: "Toyota RAV4",
  subtitle: "Phoenix Sky Harbor",
  imageUrl: null,
  href: "/cars/rental/test",
  snapshotTimestamp: "2026-03-18T12:00:00.000Z",
  price: {
    amountCents: 28800,
    currency: "USD",
  },
  bookingContext: {
    providerLocationId: "phx-airport",
    pickupDateTime: "2026-04-01T10:00",
    dropoffDateTime: "2026-04-05T10:00",
    vehicleClass: "suv",
  },
  payload: {
    source: "search",
    priceSource: "live",
    providerInventoryId: 777,
    pickupLocationName: "Phoenix Sky Harbor",
    dropoffLocationName: "Phoenix Sky Harbor",
    pickupLocationType: "airport",
    dropoffLocationType: "airport",
    pickupAddressLine: "3400 E Sky Harbor Blvd",
    dropoffAddressLine: "3400 E Sky Harbor Blvd",
    transmissionType: "Automatic",
    seatingCapacity: 5,
    luggageCapacity: "3 large",
    doors: 4,
    airConditioning: true,
    fuelPolicy: "Full-to-full",
    mileagePolicy: "Unlimited mileage",
    ratePlanCode: "suv-flex",
    ratePlan: "Free cancellation",
    policy: {
      freeCancellation: true,
      payAtCounter: true,
      securityDepositRequired: true,
      airConditioning: true,
      minDriverAge: 25,
      cancellationLabel: "Free cancellation",
      paymentLabel: "Pay at counter",
      feesLabel: "Fees excluded",
      depositLabel: "Deposit required",
    },
    priceSummary: {
      dailyBaseCents: 6700,
      totalBaseCents: 26800,
      taxesCents: 1200,
      mandatoryFeesCents: 800,
      totalPriceCents: 28800,
      days: 4,
    },
    inclusions: ["Unlimited mileage"],
    badges: ["Popular"],
    features: ["Air conditioning"],
    providerMetadata: {
      providerName: "car-default",
      rentalCompany: "Hertz",
      providerLocationId: "phx-airport",
      providerOfferId: "suv-flex",
      inventorySlug: "hertz-phx",
      pickupLocationName: "Phoenix Sky Harbor",
      dropoffLocationName: "Phoenix Sky Harbor",
      pickupLocationType: "airport",
      dropoffLocationType: "airport",
      pickupAddressLine: "3400 E Sky Harbor Blvd",
      dropoffAddressLine: "3400 E Sky Harbor Blvd",
      driverAge: 30,
      ratePlanCode: "suv-flex",
      ratePlan: "Free cancellation",
      fuelPolicy: "Full-to-full",
      mileagePolicy: "Unlimited mileage",
    },
    assumedRentalWindow: false,
  },
});

const buildCheckoutItem = (
  vertical: CheckoutItemSnapshot["vertical"],
  entity: FlightBookableEntity | HotelBookableEntity | CarBookableEntity,
): CheckoutItemSnapshot => {
  const requestedServiceDate = getRequestedServiceDate(entity);
  const startDate = getStartDate(entity);
  const endDate = getEndDate(entity);

  return {
    tripItemId: 1,
    itemType: vertical,
    vertical,
    entityId: 100,
    bookableEntityId: 200,
    inventory: {
      inventoryId: entity.inventoryId,
      providerInventoryId: entity.payload.providerInventoryId,
      hotelAvailabilitySnapshotId: null,
      availability: null,
      bookableEntity: entity,
      providerMetadata: {
        provider: entity.provider,
        requestedServiceDate,
      },
    },
    title: entity.title,
    subtitle: entity.subtitle,
    imageUrl: entity.imageUrl,
    meta: [],
    startDate,
    endDate,
    snapshotTimestamp: "2026-03-18T12:00:00.000Z",
    pricing: {
      currencyCode: "USD",
      baseAmountCents:
        vertical === "flight"
          ? 39900
          : vertical === "hotel"
            ? 75600
            : 26800,
      taxesAmountCents: vertical === "car" ? 1200 : 0,
      feesAmountCents: vertical === "car" ? 800 : 0,
      totalAmountCents:
        vertical === "flight"
          ? 39900
          : vertical === "hotel"
            ? 75600
            : 28800,
    },
  };
};

const buildInput = (
  vertical: CreateProviderBookingInput["vertical"],
  provider: string,
  entity: FlightBookableEntity | HotelBookableEntity | CarBookableEntity,
): CreateProviderBookingInput => {
  const checkoutItem = buildCheckoutItem(vertical, entity);
  return {
    checkoutSessionId: "cko_test",
    bookingRunId: "brn_test",
    checkoutItemKey: "trip-item:1:test",
    vertical,
    provider,
    canonicalEntityId: 100,
    canonicalBookableEntityId: 200,
    canonicalInventoryId: entity.inventoryId,
    checkoutItem,
    inventorySnapshot: {
      inventoryId: entity.inventoryId,
      providerInventoryId: entity.payload.providerInventoryId,
      snapshotTimestamp: "2026-03-18T12:00:00.000Z",
      pricing: checkoutItem.pricing,
      providerMetadata: checkoutItem.inventory.providerMetadata,
      bookableEntity: entity,
      availability: null,
    },
    latestResolvedInventory: {
      entity,
      checkedAt: "2026-03-18T12:00:00.000Z",
      isAvailable: true,
    } satisfies ResolvedInventoryRecord,
    travelerContext: null,
    paymentContext: {
      paymentSessionId: "pay_test",
      provider: "stripe",
      status: "authorized",
      providerPaymentIntentId: "pi_test",
      currency: "USD",
      amount: checkoutItem.pricing.totalAmountCents || 0,
      authorizedAt: "2026-03-18T12:00:00.000Z",
      metadata: {
        paymentIntentStatus: "requires_capture",
      },
    },
    idempotencyKey: "idem_test_key_123",
    currency: "USD",
    amount: checkoutItem.pricing.totalAmountCents,
    metadata: {
      checkoutItemKey: "trip-item:1:test",
    },
  };
};

test("flight booking request mapping forwards canonical and idempotent fields", () => {
  const input = buildInput("flight", "flight-default", buildFlightEntity());
  const request = mapFlightBookingRequest(
    input,
    input.latestResolvedInventory as ResolvedInventoryRecord,
  );

  assert.equal(request.idempotencyKey, "idem_test_key_123");
  assert.equal(request.itineraryId, 321);
  assert.equal(request.payment.providerPaymentIntentId, "pi_test");
  assert.equal(request.carrier, "DL");
});

test("hotel booking response normalization preserves pending confirmation", () => {
  const input = buildInput("hotel", "hotel-default", buildHotelEntity());
  const result = mapHotelBookingResponse({
    bookingInput: input,
    requestSnapshot: {
      idempotencyKey: input.idempotencyKey,
    },
    response: {
      reservationId: "htl_123",
      confirmationCode: null,
      status: "pending_supplier_confirmation",
      message: "Awaiting supplier confirmation.",
    },
    latestResolvedInventory: input.latestResolvedInventory as ResolvedInventoryRecord,
  });

  assert.equal(result.status, "pending");
  assert.equal(result.providerBookingReference, "htl_123");
  assert.equal(result.providerConfirmationCode, null);
  assert.equal(result.providerStatus, "pending_supplier_confirmation");
});

test("car booking response normalization elevates manual review states", () => {
  const input = buildInput("car", "car-default", buildCarEntity());
  const result = mapCarBookingResponse({
    bookingInput: input,
    requestSnapshot: {
      idempotencyKey: input.idempotencyKey,
    },
    response: {
      reservationId: "car_123",
      confirmationCode: null,
      status: "requires_counter_review",
      message: "Counter review required.",
    },
    latestResolvedInventory: input.latestResolvedInventory as ResolvedInventoryRecord,
  });

  assert.equal(result.status, "requires_manual_review");
  assert.equal(result.requiresManualReview, true);
  assert.equal(result.errorCode, "VALIDATION_ERROR");
});

test("adapter dispatch fails fast for unsupported providers", async () => {
  const input = buildInput("hotel", "mystery-provider", buildHotelEntity());
  const result = await createBooking(input);

  assert.equal(result.status, "failed");
  assert.equal(result.errorCode, "UNSUPPORTED_PROVIDER");
});

test("snapshot sanitization redacts sensitive fields before persistence", () => {
  const sanitized = sanitizeBookingRequestSnapshot({
    authorization: "Bearer secret",
    payment: {
      clientSecret: "cs_test_123",
      cardNumber: "4242424242424242",
    },
    traveler: {
      email: "traveler@example.com",
      firstName: "Ada",
    },
    idempotencyKey: "idem_safe",
  });

  assert.deepEqual(sanitized, {
    payment: {
      clientSecret: "[REDACTED]",
      cardNumber: "[REDACTED]",
    },
    traveler: "[REDACTED]",
    idempotencyKey: "idem_safe",
  });
});
