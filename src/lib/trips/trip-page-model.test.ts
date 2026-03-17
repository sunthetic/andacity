import assert from "node:assert/strict";
import test from "node:test";

import type { AvailabilityConfidenceModel } from "../inventory/availability-confidence.ts";
import type { InventoryFreshnessModel } from "../inventory/freshness.ts";
import type { TripDetails, TripItem } from "../../types/trips/trip.ts";

const inventoryIdModule: typeof import("../inventory/inventory-id.ts") = await import(
  new URL("../inventory/inventory-id.ts", import.meta.url).href
);
const tripPageModelModule: typeof import("./trip-page-model.ts") = await import(
  new URL("./trip-page-model.ts", import.meta.url).href
);

const {
  buildCarInventoryId,
  buildFlightInventoryId,
  buildHotelInventoryId,
} = inventoryIdModule;
const { mapTripDetailsToTripPageModel } = tripPageModelModule;

const freshness: InventoryFreshnessModel = {
  checkedAt: "2026-03-16T09:00:00.000Z",
  ageMs: 0,
  state: "just_checked",
  label: "Just checked",
  checkedLabel: "Checked just now",
  relativeLabel: "just now",
  detailLabel: "Checked moments ago.",
  stale: false,
  profile: "availability_revalidation",
};

const confidence: AvailabilityConfidenceModel = {
  state: "available_fresh",
  match: "exact",
  label: "Available",
  supportText: null,
  detailLabel: "Availability confirmed.",
  checkedAt: "2026-03-16T09:00:00.000Z",
  relativeLabel: "just now",
  stale: false,
  degraded: false,
};

const buildTripItem = (overrides: Partial<TripItem>): TripItem => {
  return {
    id: 1,
    tripId: 42,
    itemType: "hotel",
    inventoryId: "hotel:test",
    bookingSessionId: null,
    position: 0,
    locked: false,
    title: "Base item",
    subtitle: null,
    startDate: null,
    endDate: null,
    snapshotPriceCents: 10000,
    snapshotCurrencyCode: "USD",
    snapshotTimestamp: "2026-03-15T18:00:00.000Z",
    currentPriceCents: 10000,
    currentCurrencyCode: "USD",
    priceDriftStatus: "unchanged",
    priceDriftCents: 0,
    availabilityConfidence: confidence,
    freshness,
    availabilityStatus: "valid",
    availabilityCheckedAt: "2026-03-16T09:00:00.000Z",
    availabilityExpiresAt: "2026-03-16T15:00:00.000Z",
    revalidation: {
      itemId: 1,
      inventoryId: "hotel:test",
      checkedAt: "2026-03-16T09:00:00.000Z",
      status: "valid",
      message: "Base item still matches the saved inventory snapshot.",
      currentPriceCents: 10000,
      currentCurrencyCode: "USD",
      snapshotPriceCents: 10000,
      snapshotCurrencyCode: "USD",
      priceDeltaCents: 0,
      isAvailable: true,
      issues: [],
    },
    bookableEntity: null,
    imageUrl: null,
    meta: [],
    issues: [],
    startCityName: null,
    endCityName: null,
    liveCarLocationType: null,
    liveCarLocationName: null,
    hotelId: null,
    flightItineraryId: null,
    carInventoryId: null,
    liveFlightServiceDate: null,
    liveFlightDepartureAt: null,
    liveFlightArrivalAt: null,
    liveFlightItineraryType: null,
    inventorySnapshot: null,
    metadata: {},
    createdAt: "2026-03-15T18:00:00.000Z",
    updatedAt: "2026-03-16T08:00:00.000Z",
    ...overrides,
  };
};

const buildTripDetails = (items: TripItem[]): TripDetails => {
  return {
    id: 42,
    name: "Southwest spring break",
    status: "planning",
    itemCount: items.length,
    startDate: "2026-04-10",
    endDate: "2026-04-14",
    estimatedTotalCents: items.reduce((sum, item) => sum + item.snapshotPriceCents, 0),
    currencyCode: "USD",
    hasMixedCurrencies: false,
    updatedAt: "2026-03-16T12:00:00.000Z",
    bookingSessionId: "booking_session_1234567890",
    notes: null,
    metadata: {},
    editing: {
      autoRebalance: true,
      lockedItemCount: 0,
    },
    citiesInvolved: ["Phoenix", "Los Angeles"],
    pricing: {
      currencyCode: "USD",
      snapshotTotalCents: items.reduce((sum, item) => sum + item.snapshotPriceCents, 0),
      currentTotalCents: items.reduce(
        (sum, item) => sum + (item.currentPriceCents ?? item.snapshotPriceCents),
        0,
      ),
      priceDeltaCents: 0,
      hasMixedCurrencies: false,
      hasPartialPricing: false,
      driftCounts: {
        increased: 0,
        decreased: 0,
        unchanged: items.length,
        unavailable: 0,
      },
      verticals: [],
    },
    revalidation: {
      status: "all_valid",
      checkedAt: "2026-03-16T09:00:00.000Z",
      expiresAt: "2026-03-16T15:00:00.000Z",
      itemStatusCounts: {
        valid: items.length,
        price_changed: 0,
        unavailable: 0,
        error: 0,
      },
      summary: "All trip items still match the latest live inventory checks.",
    },
    intelligence: {
      status: "valid_itinerary",
      checkedAt: "2026-03-16T09:00:00.000Z",
      expiresAt: "2026-03-16T15:00:00.000Z",
      itemStatusCounts: {
        valid: items.length,
        unavailable: 0,
        stale: 0,
        price_only_changed: 0,
      },
      issueCounts: {
        warning: 0,
        blocking: 0,
      },
      issues: [],
    },
    bundling: {
      generatedAt: "2026-03-16T09:00:00.000Z",
      gaps: [],
      suggestions: [],
    },
    items,
  };
};

test("maps persisted trip details into grouped trip page models", () => {
  const flightInventoryId = buildFlightInventoryId({
    airlineCode: "DL",
    flightNumber: "123",
    departDate: "2026-04-10",
    originCode: "JFK",
    destinationCode: "LAX",
  });
  const hotelInventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: "2026-04-10",
    checkOutDate: "2026-04-14",
    roomType: "king-suite",
    occupancy: 2,
  });
  const carInventoryId = buildCarInventoryId({
    providerLocationId: "phx-airport",
    pickupDateTime: "2026-04-10T10:00",
    dropoffDateTime: "2026-04-14T10:00",
    vehicleClass: "suv",
  });

  const trip = buildTripDetails([
    buildTripItem({
      id: 10,
      itemType: "flight",
      inventoryId: flightInventoryId,
      title: "Delta Air Lines",
      subtitle: "New York -> Los Angeles",
      startDate: "2026-04-10",
      endDate: "2026-04-10",
      snapshotPriceCents: 54000,
      meta: ["Nonstop", "Economy"],
      startCityName: "New York",
      endCityName: "Los Angeles",
      flightItineraryId: 321,
      liveFlightServiceDate: "2026-04-10",
      liveFlightDepartureAt: "2026-04-10T13:15:00.000Z",
      liveFlightArrivalAt: "2026-04-10T16:30:00.000Z",
      liveFlightItineraryType: "one-way",
      bookableEntity: {
        inventoryId: flightInventoryId,
        vertical: "flight",
        provider: "delta",
        title: "Delta Air Lines",
        subtitle: "JFK -> LAX",
        imageUrl: null,
        href: "/flights/itinerary/DL/123/2026-04-10/JFK/LAX",
        snapshotTimestamp: "2026-03-15T18:00:00.000Z",
        price: {
          amountCents: 54000,
          currency: "USD",
        },
        bookingContext: {
          carrier: "Delta",
          flightNumber: "123",
          origin: "JFK",
          destination: "LAX",
          departDate: "2026-04-10",
        },
        payload: {
          source: "trip_item",
          priceSource: "snapshot",
          providerInventoryId: 321,
          cabinClass: "economy",
          fareCode: "standard",
          departureAt: "2026-04-10T13:15:00.000Z",
          arrivalAt: "2026-04-10T16:30:00.000Z",
          itineraryType: "one-way",
          policy: null,
          segments: null,
          providerMetadata: null,
        },
      },
    }),
    buildTripItem({
      id: 11,
      itemType: "hotel",
      inventoryId: hotelInventoryId,
      title: "Ace Palm Hotel",
      subtitle: "Old Town · 4-star stay",
      startDate: "2026-04-10",
      endDate: "2026-04-14",
      snapshotPriceCents: 88000,
      meta: ["Flexible rate", "Free cancellation"],
      startCityName: "Phoenix",
      endCityName: "Phoenix",
      hotelId: 555,
      bookableEntity: {
        inventoryId: hotelInventoryId,
        vertical: "hotel",
        provider: "ace",
        title: "Ace Palm Hotel",
        subtitle: "Old Town · 4-star stay",
        imageUrl: null,
        href: "/hotels/stay/v1.555",
        snapshotTimestamp: "2026-03-15T18:00:00.000Z",
        price: {
          amountCents: 88000,
          currency: "USD",
        },
        bookingContext: {
          hotelId: "555",
          checkInDate: "2026-04-10",
          checkOutDate: "2026-04-14",
          roomType: "king-suite",
          occupancy: 2,
        },
        payload: {
          source: "trip_item",
          priceSource: "snapshot",
          providerInventoryId: 555,
          hotelSlug: "ace-palm-hotel",
          providerOfferId: null,
          ratePlanId: null,
          ratePlan: "Flexible rate",
          boardType: null,
          cancellationPolicy: null,
          policy: null,
          priceSummary: null,
          propertySummary: {
            brandName: "Ace",
            propertyType: "Hotel",
            cityName: "Phoenix",
            neighborhood: "Old Town",
            addressLine: null,
            stars: 4,
            rating: 8.8,
            reviewCount: 420,
            checkInTime: null,
            checkOutTime: null,
            summary: null,
            amenities: null,
            notes: null,
          },
          roomSummary: {
            roomName: "King Suite",
            beds: "1 king bed",
            sizeSqft: null,
            sleeps: 2,
            features: null,
            badges: null,
          },
          inclusions: null,
          providerMetadata: null,
          assumedStayDates: false,
          assumedOccupancy: false,
        },
      },
    }),
    buildTripItem({
      id: 12,
      itemType: "car",
      inventoryId: carInventoryId,
      title: "Toyota RAV4 or similar",
      subtitle: "SUV",
      startDate: "2026-04-10",
      endDate: "2026-04-14",
      snapshotPriceCents: 36000,
      meta: ["Automatic", "Unlimited mileage"],
      startCityName: "Phoenix",
      endCityName: "Phoenix",
      carInventoryId: 777,
      liveCarLocationType: "airport",
      liveCarLocationName: "Phoenix Sky Harbor",
      bookableEntity: {
        inventoryId: carInventoryId,
        vertical: "car",
        provider: "hertz",
        title: "Toyota RAV4 or similar",
        subtitle: "SUV",
        imageUrl: null,
        href: "/cars/rental/phx-airport/2026-04-10T10-00/2026-04-14T10-00/suv",
        snapshotTimestamp: "2026-03-15T18:00:00.000Z",
        price: {
          amountCents: 36000,
          currency: "USD",
        },
        bookingContext: {
          providerLocationId: "phx-airport",
          pickupDateTime: "2026-04-10T10:00",
          dropoffDateTime: "2026-04-14T10:00",
          vehicleClass: "SUV",
        },
        payload: {
          source: "trip_item",
          priceSource: "snapshot",
          providerInventoryId: 777,
          pickupLocationName: "Phoenix Sky Harbor",
          dropoffLocationName: "Phoenix Sky Harbor",
          pickupLocationType: "airport",
          dropoffLocationType: "airport",
          pickupAddressLine: null,
          dropoffAddressLine: null,
          transmissionType: "Automatic",
          seatingCapacity: 5,
          luggageCapacity: null,
          doors: null,
          airConditioning: true,
          fuelPolicy: null,
          mileagePolicy: null,
          ratePlanCode: null,
          ratePlan: null,
          policy: null,
          priceSummary: null,
          inclusions: null,
          badges: null,
          features: null,
          providerMetadata: {
            providerName: "Hertz",
            rentalCompany: "Hertz",
            providerLocationId: "phx-airport",
            providerOfferId: null,
            inventorySlug: null,
            pickupLocationName: "Phoenix Sky Harbor",
            dropoffLocationName: "Phoenix Sky Harbor",
            pickupLocationType: "airport",
            dropoffLocationType: "airport",
            pickupAddressLine: null,
            dropoffAddressLine: null,
            driverAge: null,
            ratePlanCode: null,
            ratePlan: null,
            fuelPolicy: null,
            mileagePolicy: null,
          },
        },
      },
    }),
  ]);

  const page = mapTripDetailsToTripPageModel(trip);

  assert.equal(page.summary.reference, "TRIP-000042");
  assert.equal(page.summary.totalItemCount, 3);
  assert.equal(page.summary.itemCounts.flight, 1);
  assert.equal(page.summary.itemCounts.hotel, 1);
  assert.equal(page.summary.itemCounts.car, 1);
  assert.equal(page.summary.continueHref, "/trips?trip=42");
  assert.deepEqual(
    page.groups.map((group) => group.itemType),
    ["flight", "hotel", "car"],
  );

  const flightGroup = page.groups[0];
  const hotelGroup = page.groups[1];
  const carGroup = page.groups[2];

  assert.equal(flightGroup.itemType, "flight");
  assert.equal(flightGroup.items[0].routeSummary, "JFK -> LAX");
  assert.equal(flightGroup.items[0].airlineSummary, "Delta 123");
  assert.equal(flightGroup.items[0].viewHref, "/flights/itinerary/DL/123/2026-04-10/JFK/LAX");

  assert.equal(hotelGroup.itemType, "hotel");
  assert.equal(hotelGroup.items[0].locationLabel, "Old Town · Phoenix");
  assert.match(hotelGroup.items[0].roomSummary || "", /King Suite/);

  assert.equal(carGroup.itemType, "car");
  assert.equal(carGroup.items[0].locationLabel, "Phoenix Sky Harbor");
  assert.match(carGroup.items[0].providerSummary || "", /Hertz/);
  assert.match(carGroup.items[0].vehicleSummary || "", /SUV/);
});

test("maps empty persisted trips into an empty grouped page model", () => {
  const page = mapTripDetailsToTripPageModel(buildTripDetails([]));

  assert.equal(page.isEmpty, true);
  assert.equal(page.summary.savedTotalLabel, "No items yet");
  assert.equal(page.summary.itemCounts.flight, 0);
  assert.equal(page.summary.itemCounts.hotel, 0);
  assert.equal(page.summary.itemCounts.car, 0);
  assert.deepEqual(page.groups, []);
});
