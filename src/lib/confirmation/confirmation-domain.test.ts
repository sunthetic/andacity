import assert from "node:assert/strict";
import test from "node:test";

import type { BookingRun } from "../../types/booking.ts";
import type { CheckoutSession } from "../../types/checkout.ts";
import type { CheckoutPaymentSession } from "../../types/payment.ts";

const publicRefModule: typeof import("./createBookingConfirmationPublicRef.ts") =
  await import(
    new URL("./createBookingConfirmationPublicRef.ts", import.meta.url).href
  );
const mappingModule: typeof import("./mapBookingRunToConfirmation.ts") =
  await import(new URL("./mapBookingRunToConfirmation.ts", import.meta.url).href);

const { createBookingConfirmationPublicRef } = publicRefModule;
const { mapBookingRunToConfirmation } = mappingModule;

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
        bookableEntityId: 801,
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
            price: {
              amountCents: 25000,
              currency: "USD",
            },
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
        bookableEntityId: 901,
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
            price: {
              amountCents: 18000,
              currency: "USD",
            },
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
              segments: [
                {
                  segmentOrder: 1,
                  marketingCarrier: "SkyJet",
                  marketingCarrierCode: "SJ",
                  operatingCarrier: "SkyJet",
                  operatingCarrierCode: "SJ",
                  flightNumber: "221",
                  originCode: "DAL",
                  destinationCode: "DEN",
                  departureAt: "2026-04-14T15:00:00.000Z",
                  arrivalAt: "2026-04-14T17:20:00.000Z",
                  durationMinutes: 140,
                },
              ],
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
      items: [
        {
          tripItemId: 101,
          inventoryId: "hotel:ace-palm",
          totalAmountCents: 25000,
          currency: "USD",
        },
        {
          tripItemId: 202,
          inventoryId: "flight:dal-den",
          totalAmountCents: 18000,
          currency: "USD",
        },
      ],
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

test("maps a partial booking run into a durable confirmation payload", () => {
  const mapped = mapBookingRunToConfirmation({
    bookingRun: buildBookingRun(),
    checkoutSession: buildCheckoutSession(),
    paymentSession: buildPaymentSession(),
    publicRef: "CNF-ABCDE-23456",
    now: "2026-03-18T16:15:00.000Z",
  });

  assert.equal(mapped.confirmation.publicRef, "CNF-ABCDE-23456");
  assert.equal(mapped.confirmation.status, "partial");
  assert.equal(mapped.confirmation.tripId, 42);
  assert.equal(mapped.confirmation.currency, "USD");
  assert.equal(mapped.items.length, 2);
  assert.equal(mapped.items[0]?.status, "confirmed");
  assert.equal(mapped.items[0]?.providerConfirmationCode, "ACEPALM");
  assert.equal(mapped.items[1]?.status, "failed");
  assert.equal(mapped.items[1]?.locationSummary, "DAL to DEN");
  assert.equal(mapped.confirmation.summaryJson?.confirmedItemCount, 1);
  assert.equal(mapped.confirmation.summaryJson?.failedItemCount, 1);
  assert.equal(mapped.confirmation.summaryJson?.statusLabel, "Partial Confirmation");
  assert.equal(mapped.confirmation.summaryJson?.totalAmountCents, 43000);
});

test("promotes manual-review items to a manual-review confirmation status", () => {
  const mapped = mapBookingRunToConfirmation({
    bookingRun: buildBookingRun({
      itemExecutions: [
        buildBookingRun().itemExecutions[0]!,
        {
          ...buildBookingRun().itemExecutions[1]!,
          id: "bix_review",
          status: "requires_manual_review",
          errorCode: null,
          errorMessage: "Manual review required.",
        },
      ],
    }),
    checkoutSession: buildCheckoutSession(),
    paymentSession: buildPaymentSession(),
    publicRef: "CNF-ZYXWV-98765",
    now: "2026-03-18T16:15:00.000Z",
  });

  assert.equal(mapped.confirmation.status, "requires_manual_review");
  assert.equal(mapped.items[1]?.status, "requires_manual_review");
  assert.equal(mapped.confirmation.summaryJson?.requiresManualReviewCount, 1);
});

test("creates human-safe booking confirmation references", () => {
  const refs = new Set(
    Array.from({ length: 50 }, () => createBookingConfirmationPublicRef()),
  );

  assert.equal(refs.size, 50);
  for (const ref of refs) {
    assert.match(ref, /^CNF-[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  }
});
