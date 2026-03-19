import assert from "node:assert/strict";
import test from "node:test";

import type { CheckoutItemSnapshot } from "../../types/checkout.ts";
import type {
  CheckoutTravelerAssignment,
  CheckoutTravelerProfile,
} from "../../types/travelers.ts";

const validateModule: typeof import("./validateCheckoutTravelers.ts") =
  await import(new URL("./validateCheckoutTravelers.ts", import.meta.url).href);
const proceedModule: typeof import("./canCheckoutProceedWithTravelers.ts") =
  await import(
    new URL("./canCheckoutProceedWithTravelers.ts", import.meta.url).href
  );

const { validateCheckoutTravelers } = validateModule;
const { canCheckoutProceedWithTravelers } = proceedModule;

const baseItem = (overrides: Partial<CheckoutItemSnapshot>): CheckoutItemSnapshot => ({
  tripItemId: 1,
  itemType: "flight",
  vertical: "flight",
  entityId: 100,
  bookableEntityId: 100,
  inventory: {
    inventoryId: "flight:test",
    providerInventoryId: 100,
    hotelAvailabilitySnapshotId: null,
    availability: null,
    bookableEntity: null,
    providerMetadata: {},
  },
  title: "Test item",
  subtitle: null,
  imageUrl: null,
  meta: [],
  startDate: "2026-06-01",
  endDate: null,
  snapshotTimestamp: "2026-03-19T10:00:00.000Z",
  pricing: {
    currencyCode: "USD",
    baseAmountCents: 10000,
    taxesAmountCents: 500,
    feesAmountCents: 0,
    totalAmountCents: 10500,
  },
  ...overrides,
});

const profile = (
  id: string,
  role: CheckoutTravelerProfile["role"],
  overrides: Partial<CheckoutTravelerProfile> = {},
): CheckoutTravelerProfile => ({
  id,
  checkoutSessionId: "cko_test",
  type: "adult",
  role,
  firstName: "Alex",
  middleName: null,
  lastName: "Traveler",
  dateOfBirth: "1990-01-01",
  email: "alex@example.com",
  phone: "+1 555 123 4567",
  nationality: "US",
  documentType: "passport",
  documentNumber: "A1234567",
  documentExpiryDate: "2030-01-01",
  issuingCountry: "US",
  knownTravelerNumber: null,
  redressNumber: null,
  driverAge: 30,
  createdAt: "2026-03-19T10:00:00.000Z",
  updatedAt: "2026-03-19T10:00:00.000Z",
  ...overrides,
});

const assignment = (
  id: string,
  role: CheckoutTravelerAssignment["role"],
  checkoutItemKey: string | null,
  travelerProfileId: string,
  isPrimary = false,
): CheckoutTravelerAssignment => ({
  id,
  checkoutSessionId: "cko_test",
  checkoutItemKey,
  travelerProfileId,
  role,
  isPrimary,
  createdAt: "2026-03-19T10:00:00.000Z",
  updatedAt: "2026-03-19T10:00:00.000Z",
});

test("flags flight passenger count mismatches", async () => {
  const flight = baseItem({
    tripItemId: 2,
    itemType: "flight",
    vertical: "flight",
    inventory: {
      ...baseItem({}).inventory,
      inventoryId: "flight:2",
      providerMetadata: { passengers: 2 },
    },
  });
  const result = await validateCheckoutTravelers({
    checkoutSessionId: "cko_test",
    checkoutItems: [flight],
    profiles: [profile("trv_1", "passenger"), profile("trv_2", "primary_contact")],
    assignments: [
      assignment("asg_1", "passenger", "trip-item:2:flight:2", "trv_1"),
      assignment("asg_2", "primary_contact", null, "trv_2", true),
    ],
  });

  assert.equal(result.validationSummary.status, "incomplete");
  assert.equal(
    result.validationSummary.issues.some(
      (issue) => issue.code === "PASSENGER_COUNT_MISMATCH",
    ),
    true,
  );
});

test("requires a primary hotel guest", async () => {
  const hotel = baseItem({
    tripItemId: 3,
    itemType: "hotel",
    vertical: "hotel",
    inventory: {
      ...baseItem({}).inventory,
      inventoryId: "hotel:3",
      providerMetadata: { occupancy: 2 },
    },
  });
  const result = await validateCheckoutTravelers({
    checkoutSessionId: "cko_test",
    checkoutItems: [hotel],
    profiles: [profile("trv_contact", "primary_contact")],
    assignments: [assignment("asg_contact", "primary_contact", null, "trv_contact", true)],
  });

  assert.equal(
    result.validationSummary.issues.some(
      (issue) => issue.code === "MISSING_PRIMARY_GUEST",
    ),
    true,
  );
});

test("requires a primary car driver", async () => {
  const car = baseItem({
    tripItemId: 4,
    itemType: "car",
    vertical: "car",
    inventory: {
      ...baseItem({}).inventory,
      inventoryId: "car:4",
      providerMetadata: { minDriverAge: 25 },
    },
  });
  const result = await validateCheckoutTravelers({
    checkoutSessionId: "cko_test",
    checkoutItems: [car],
    profiles: [profile("trv_contact", "primary_contact")],
    assignments: [assignment("asg_contact", "primary_contact", null, "trv_contact", true)],
  });

  assert.equal(
    result.validationSummary.issues.some(
      (issue) => issue.code === "MISSING_PRIMARY_DRIVER",
    ),
    true,
  );
});

test("flags invalid traveler fields and driver age", async () => {
  const car = baseItem({
    tripItemId: 5,
    itemType: "car",
    vertical: "car",
    inventory: {
      ...baseItem({}).inventory,
      inventoryId: "car:5",
      providerMetadata: { minDriverAge: 30 },
    },
  });
  const badDriver = profile("trv_bad", "driver", {
    dateOfBirth: "2099-01-01",
    email: "invalid-email",
    phone: "abc",
    documentType: "national_id",
    driverAge: 20,
  });

  const result = await validateCheckoutTravelers({
    checkoutSessionId: "cko_test",
    checkoutItems: [car],
    profiles: [badDriver, profile("trv_contact", "primary_contact")],
    assignments: [
      assignment("asg_driver", "driver", "trip-item:5:car:5", "trv_bad", true),
      assignment("asg_contact", "primary_contact", null, "trv_contact", true),
    ],
  });

  const codes = new Set(result.validationSummary.issues.map((issue) => issue.code));
  assert.equal(codes.has("INVALID_DATE_OF_BIRTH"), true);
  assert.equal(codes.has("INVALID_EMAIL"), true);
  assert.equal(codes.has("INVALID_PHONE"), true);
  assert.equal(codes.has("DRIVER_AGE_INVALID"), true);
});

test("detects assignment mismatches to missing profiles", async () => {
  const flight = baseItem({
    tripItemId: 6,
    itemType: "flight",
    vertical: "flight",
    inventory: {
      ...baseItem({}).inventory,
      inventoryId: "flight:6",
      providerMetadata: { passengers: 1 },
    },
  });
  const result = await validateCheckoutTravelers({
    checkoutSessionId: "cko_test",
    checkoutItems: [flight],
    profiles: [profile("trv_contact", "primary_contact")],
    assignments: [
      assignment("asg_missing", "passenger", "trip-item:6:flight:6", "trv_missing"),
      assignment("asg_contact", "primary_contact", null, "trv_contact", true),
    ],
  });

  assert.equal(
    result.validationSummary.issues.some(
      (issue) => issue.code === "TRAVELER_ASSIGNMENT_MISSING",
    ),
    true,
  );
});

test("canCheckoutProceedWithTravelers only passes completed summaries", async () => {
  const summaryComplete = (
    await validateCheckoutTravelers({
      checkoutSessionId: "cko_test",
      checkoutItems: [
        baseItem({
          tripItemId: 7,
          itemType: "flight",
          vertical: "flight",
          inventory: {
            ...baseItem({}).inventory,
            inventoryId: "flight:7",
            providerMetadata: { passengers: 1 },
          },
        }),
      ],
      profiles: [
        profile("trv_passenger", "passenger"),
        profile("trv_contact", "primary_contact"),
      ],
      assignments: [
        assignment(
          "asg_passenger",
          "passenger",
          "trip-item:7:flight:7",
          "trv_passenger",
          true,
        ),
        assignment("asg_contact", "primary_contact", null, "trv_contact", true),
      ],
    })
  ).validationSummary;

  assert.equal(canCheckoutProceedWithTravelers(summaryComplete), true);
  assert.equal(
    canCheckoutProceedWithTravelers({
      ...summaryComplete,
      status: "incomplete",
      hasBlockingIssues: true,
    }),
    false,
  );
});
