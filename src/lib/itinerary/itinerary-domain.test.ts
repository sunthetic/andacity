import assert from "node:assert/strict";
import test from "node:test";

import type { BookingConfirmation } from "../../types/confirmation.ts";
import type { BookingRun } from "../../types/booking.ts";
import type { CheckoutSession } from "../../types/checkout.ts";
import type { CheckoutPaymentSession } from "../../types/payment.ts";
import type { OwnedItinerary } from "../../types/itinerary.ts";

const publicRefModule: typeof import("./createItineraryPublicRef.ts") =
  await import(new URL("./createItineraryPublicRef.ts", import.meta.url).href);
const mappingModule: typeof import("./mapConfirmationToItinerary.ts") =
  await import(new URL("./mapConfirmationToItinerary.ts", import.meta.url).href);
const statusModule: typeof import("./buildItineraryStatus.ts") = await import(
  new URL("./buildItineraryStatus.ts", import.meta.url).href
);
const createOrResumeModule: typeof import(
  "./createOrResumeItineraryFromConfirmation.ts"
) = await import(
  new URL("./createOrResumeItineraryFromConfirmation.ts", import.meta.url).href
);

const { createItineraryPublicRef } = publicRefModule;
const { mapConfirmationToItinerary } = mappingModule;
const { buildItineraryStatus } = statusModule;
const { createOrResumeItineraryFromConfirmation } = createOrResumeModule;

const buildCheckoutSession = (
  overrides: Partial<CheckoutSession> = {},
): CheckoutSession => {
  return {
    id: "cko_test",
    tripId: 42,
    status: "completed",
    revalidationStatus: "passed",
    revalidationSummary: null,
    lastRevalidatedAt: "2026-03-18T16:00:00.000Z",
    currencyCode: "USD",
    items: [
      {
        tripItemId: 101,
        itemType: "hotel",
        vertical: "hotel",
        entityId: 801,
        bookableEntityId: 802,
        inventory: {
          inventoryId: "hotel:ace-palm",
          providerInventoryId: 801,
          hotelAvailabilitySnapshotId: 91,
          availability: null,
          bookableEntity: {
            inventoryId: "hotel:ace-palm",
            vertical: "hotel",
            provider: "hotelbeds",
            title: "Ace Palm Hotel",
            subtitle: "Deluxe king room",
            imageUrl: null,
            href: null,
            snapshotTimestamp: "2026-03-18T16:00:00.000Z",
            price: { amountCents: 25000, currency: "USD" },
            bookingContext: {
              hotelId: "ace-palm",
              checkInDate: "2026-04-10",
              checkOutDate: "2026-04-14",
              roomType: "Deluxe king room",
              occupancy: 2,
            },
            payload: {
              source: "trip_item",
              priceSource: "snapshot",
              providerInventoryId: 801,
              hotelSlug: "ace-palm",
              propertySummary: {
                brandName: null,
                propertyType: "hotel",
                cityName: "Austin",
                neighborhood: "South Congress",
                addressLine: "123 Congress Ave",
                stars: 4,
                rating: 4.7,
                reviewCount: 1240,
                checkInTime: null,
                checkOutTime: null,
                summary: null,
                amenities: [],
                notes: [],
              },
              roomSummary: {
                roomName: "Deluxe king room",
                beds: "1 king bed",
                sizeSqft: 320,
                sleeps: 2,
                features: [],
                badges: [],
              },
              priceSummary: {
                nightlyBaseCents: 5000,
                totalBaseCents: 20000,
                taxesCents: 3000,
                mandatoryFeesCents: 2000,
                totalPriceCents: 25000,
                nights: 4,
              },
            },
          },
          providerMetadata: { provider: "hotelbeds" },
        },
        title: "Ace Palm Hotel",
        subtitle: "Deluxe king room",
        imageUrl: null,
        meta: ["4 nights", "2 guests"],
        startDate: "2026-04-10",
        endDate: "2026-04-14",
        snapshotTimestamp: "2026-03-18T16:00:00.000Z",
        pricing: {
          currencyCode: "USD",
          baseAmountCents: 20000,
          taxesAmountCents: 3000,
          feesAmountCents: 2000,
          totalAmountCents: 25000,
        },
      },
      {
        tripItemId: 202,
        itemType: "flight",
        vertical: "flight",
        entityId: 901,
        bookableEntityId: 902,
        inventory: {
          inventoryId: "flight:dal-den",
          providerInventoryId: 901,
          hotelAvailabilitySnapshotId: null,
          availability: null,
          bookableEntity: {
            inventoryId: "flight:dal-den",
            vertical: "flight",
            provider: "duffel",
            title: "Dallas to Denver",
            subtitle: "SkyJet 221",
            imageUrl: null,
            href: null,
            snapshotTimestamp: "2026-03-18T16:00:00.000Z",
            price: { amountCents: 18000, currency: "USD" },
            bookingContext: {
              carrier: "SkyJet",
              flightNumber: "221",
              origin: "DAL",
              destination: "DEN",
              departDate: "2026-04-14",
            },
            payload: {
              source: "trip_item",
              priceSource: "snapshot",
              providerInventoryId: 901,
              cabinClass: "economy",
              fareCode: "main",
              departureAt: "2026-04-14T15:00:00.000Z",
              arrivalAt: "2026-04-14T17:20:00.000Z",
              itineraryType: "one-way",
              segments: [],
            },
          },
          providerMetadata: { provider: "duffel" },
        },
        title: "Dallas to Denver",
        subtitle: "SkyJet 221",
        imageUrl: null,
        meta: ["Economy"],
        startDate: "2026-04-14",
        endDate: "2026-04-14",
        snapshotTimestamp: "2026-03-18T16:00:00.000Z",
        pricing: {
          currencyCode: "USD",
          baseAmountCents: 15000,
          taxesAmountCents: 2000,
          feesAmountCents: 1000,
          totalAmountCents: 18000,
        },
      },
    ],
    totals: {
      currencyCode: "USD",
      baseAmountCents: 35000,
      taxesAmountCents: 5000,
      feesAmountCents: 3000,
      totalAmountCents: 43000,
    },
    createdAt: "2026-03-18T16:00:00.000Z",
    updatedAt: "2026-03-18T16:10:00.000Z",
    expiresAt: "2026-03-18T17:00:00.000Z",
    completedAt: "2026-03-18T16:10:00.000Z",
    abandonedAt: null,
    ...overrides,
  };
};

const buildPaymentSession = (
  overrides: Partial<CheckoutPaymentSession> = {},
): CheckoutPaymentSession => {
  return {
    id: "pay_test",
    checkoutSessionId: "cko_test",
    provider: "stripe",
    status: "authorized",
    paymentIntentStatus: "requires_capture",
    currency: "USD",
    amountSnapshot: {
      source: "checkout_snapshot",
      currency: "USD",
      baseAmountCents: 35000,
      taxesAmountCents: 5000,
      feesAmountCents: 3000,
      totalAmountCents: 43000,
      itemCount: 2,
      items: [],
    },
    revalidationFingerprint: "fingerprint_1",
    providerPaymentIntentId: "pi_test",
    providerClientSecret: "secret_test",
    providerMetadata: {},
    createdAt: "2026-03-18T16:00:00.000Z",
    updatedAt: "2026-03-18T16:10:00.000Z",
    authorizedAt: "2026-03-18T16:10:00.000Z",
    succeededAt: null,
    failedAt: null,
    canceledAt: null,
    expiresAt: "2026-03-18T17:00:00.000Z",
    ...overrides,
  };
};

const buildBookingRun = (
  overrides: Partial<BookingRun> = {},
): BookingRun => {
  return {
    id: "brn_test",
    checkoutSessionId: "cko_test",
    paymentSessionId: "pay_test",
    status: "partial",
    executionKey: "exec_test",
    startedAt: "2026-03-18T16:11:00.000Z",
    completedAt: "2026-03-18T16:14:00.000Z",
    createdAt: "2026-03-18T16:11:00.000Z",
    updatedAt: "2026-03-18T16:14:00.000Z",
    summary: null,
    itemExecutions: [
      {
        id: "bix_hotel",
        bookingRunId: "brn_test",
        checkoutItemKey: "trip-item:101:hotel:ace-palm",
        tripItemId: 101,
        title: "Ace Palm Hotel",
        vertical: "hotel",
        provider: "hotelbeds",
        status: "succeeded",
        providerBookingReference: "HB-123",
        providerConfirmationCode: "ACEPALM",
        requestSnapshotJson: null,
        responseSnapshotJson: null,
        errorCode: null,
        errorMessage: null,
        startedAt: "2026-03-18T16:11:00.000Z",
        completedAt: "2026-03-18T16:12:00.000Z",
        createdAt: "2026-03-18T16:11:00.000Z",
        updatedAt: "2026-03-18T16:12:00.000Z",
      },
      {
        id: "bix_flight",
        bookingRunId: "brn_test",
        checkoutItemKey: "trip-item:202:flight:dal-den",
        tripItemId: 202,
        title: "Dallas to Denver",
        vertical: "flight",
        provider: "duffel",
        status: "failed",
        providerBookingReference: null,
        providerConfirmationCode: null,
        requestSnapshotJson: null,
        responseSnapshotJson: null,
        errorCode: "PROVIDER_UNAVAILABLE",
        errorMessage: "Provider timed out.",
        startedAt: "2026-03-18T16:12:00.000Z",
        completedAt: "2026-03-18T16:14:00.000Z",
        createdAt: "2026-03-18T16:11:00.000Z",
        updatedAt: "2026-03-18T16:14:00.000Z",
      },
    ],
    ...overrides,
  };
};

const buildConfirmation = (
  overrides: Partial<BookingConfirmation> = {},
): BookingConfirmation => {
  return {
    id: "cnf_test",
    publicRef: "CNF-ABCDE-23456",
    tripId: 42,
    checkoutSessionId: "cko_test",
    paymentSessionId: "pay_test",
    bookingRunId: "brn_test",
    status: "partial",
    currency: "USD",
    totalsJson: {
      totalAmountCents: 43000,
    },
    summaryJson: {
      confirmationId: "cnf_test",
      publicRef: "CNF-ABCDE-23456",
      status: "partial",
      statusLabel: "Partial Confirmation",
      statusDescription: "One item failed while another succeeded.",
      totalItemCount: 2,
      confirmedItemCount: 1,
      pendingItemCount: 0,
      failedItemCount: 1,
      requiresManualReviewCount: 0,
      unresolvedItemCount: 1,
      confirmedItemTitles: ["Ace Palm Hotel"],
      unresolvedItemTitles: ["Dallas to Denver"],
      currency: "USD",
      totalAmountCents: 43000,
      confirmedAt: "2026-03-18T16:12:00.000Z",
      hasItinerary: false,
      itineraryRef: null,
      itineraryStatus: null,
    },
    confirmedAt: "2026-03-18T16:12:00.000Z",
    createdAt: "2026-03-18T16:15:00.000Z",
    updatedAt: "2026-03-18T16:15:00.000Z",
    items: [
      {
        id: "cfi_hotel",
        confirmationId: "cnf_test",
        bookingItemExecutionId: "bix_hotel",
        checkoutItemKey: "trip-item:101:hotel:ace-palm",
        vertical: "hotel",
        status: "confirmed",
        title: "Ace Palm Hotel",
        subtitle: "Deluxe king room",
        startAt: "2026-04-10T00:00:00.000Z",
        endAt: "2026-04-14T00:00:00.000Z",
        locationSummary: "Austin · South Congress · 123 Congress Ave",
        provider: "hotelbeds",
        providerBookingReference: "HB-123",
        providerConfirmationCode: "ACEPALM",
        detailsJson: {
          tripItemId: 101,
          inventoryId: "hotel:ace-palm",
        },
        createdAt: "2026-03-18T16:12:00.000Z",
        updatedAt: "2026-03-18T16:12:00.000Z",
      },
      {
        id: "cfi_flight",
        confirmationId: "cnf_test",
        bookingItemExecutionId: "bix_flight",
        checkoutItemKey: "trip-item:202:flight:dal-den",
        vertical: "flight",
        status: "failed",
        title: "Dallas to Denver",
        subtitle: "SkyJet 221",
        startAt: "2026-04-14T15:00:00.000Z",
        endAt: "2026-04-14T17:20:00.000Z",
        locationSummary: "DAL to DEN",
        provider: "duffel",
        providerBookingReference: null,
        providerConfirmationCode: null,
        detailsJson: {
          tripItemId: 202,
          inventoryId: "flight:dal-den",
        },
        createdAt: "2026-03-18T16:14:00.000Z",
        updatedAt: "2026-03-18T16:14:00.000Z",
      },
    ],
    ...overrides,
  };
};

test("creates human-safe itinerary references", () => {
  const refs = new Set(
    Array.from({ length: 50 }, () => createItineraryPublicRef()),
  );

  assert.equal(refs.size, 50);
  for (const ref of refs) {
    assert.match(ref, /^ITN-[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  }
});

test("maps a partial confirmation into a durable itinerary payload with itemized booking states", () => {
  const mapped = mapConfirmationToItinerary({
    confirmation: buildConfirmation(),
    bookingRun: buildBookingRun(),
    checkoutSession: buildCheckoutSession(),
    paymentSession: buildPaymentSession(),
    publicRef: "ITN-ABCDE-23456",
    now: "2026-03-18T16:16:00.000Z",
    ownerUserId: null,
    ownerSessionId: null,
  });

  assert.equal(mapped.itinerary.publicRef, "ITN-ABCDE-23456");
  assert.equal(mapped.itinerary.status, "partial");
  assert.equal(mapped.items.length, 2);
  assert.equal(mapped.items[0]?.confirmationItemId, "cfi_hotel");
  assert.equal(mapped.items[1]?.confirmationItemId, "cfi_flight");
  assert.equal(mapped.items[1]?.status, "failed");
  assert.equal(mapped.items[0]?.canonicalEntityId, 801);
  assert.equal(mapped.items[0]?.canonicalBookableEntityId, 802);
  assert.equal(mapped.items[0]?.canonicalInventoryId, "hotel:ace-palm");
  assert.equal(mapped.items[0]?.providerConfirmationCode, "ACEPALM");
  assert.equal(mapped.itinerary.summaryJson?.itemCount, 2);
});

test("derives itinerary lifecycle status from owned item timing", () => {
  const upcomingStatus = buildItineraryStatus({
    confirmationStatus: "confirmed",
    confirmationItems: [{ status: "confirmed" }],
    itineraryItems: [
      {
        status: "confirmed",
        startAt: "2026-04-10T00:00:00.000Z",
        endAt: "2026-04-14T00:00:00.000Z",
      },
    ],
    now: "2026-03-18T16:16:00.000Z",
  });
  const completedStatus = buildItineraryStatus({
    confirmationStatus: "confirmed",
    confirmationItems: [{ status: "confirmed" }],
    itineraryItems: [
      {
        status: "completed",
        startAt: "2026-03-01T00:00:00.000Z",
        endAt: "2026-03-02T00:00:00.000Z",
      },
    ],
    now: "2026-03-18T16:16:00.000Z",
  });

  assert.equal(upcomingStatus, "upcoming");
  assert.equal(completedStatus, "completed");
});

test("resumes an existing itinerary instead of creating a duplicate", async () => {
  const existingItinerary: OwnedItinerary = {
    id: "itn_existing",
    publicRef: "ITN-EXIST-12345",
    tripId: 42,
    checkoutSessionId: "cko_test",
    paymentSessionId: "pay_test",
    bookingRunId: "brn_test",
    confirmationId: "cnf_test",
    status: "partial",
    currency: "USD",
    summaryJson: { itemCount: 1 },
    ownerUserId: null,
    ownerSessionId: null,
    createdAt: "2026-03-18T16:16:00.000Z",
    updatedAt: "2026-03-18T16:16:00.000Z",
    ownership: null,
    items: [],
  };

  const result = await createOrResumeItineraryFromConfirmation(
    "cnf_test",
    {},
    {
      getItineraryForConfirmation: async (confirmationId: string) => {
        return confirmationId === "cnf_test" ? existingItinerary : null;
      },
      createOrResumeItineraryOwnership: async () => ({
        ownership: buildOwnershipBridge(),
        claimToken: null,
        created: false,
      }),
    },
  );

  assert.equal(result.created, false);
  assert.equal(result.itinerary.id, "itn_existing");
  assert.equal(result.itinerary.publicRef, "ITN-EXIST-12345");
});

const buildOwnershipBridge = () => ({
  id: "ito_existing",
  itineraryId: "itn_existing",
  ownershipMode: "anonymous" as const,
  ownerUserId: null,
  ownerSessionId: null,
  ownerClaimTokenHash: null,
  source: "confirmation_flow" as const,
  claimedAt: null,
  createdAt: "2026-03-18T16:16:00.000Z",
  updatedAt: "2026-03-18T16:16:00.000Z",
});
