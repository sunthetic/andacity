import assert from "node:assert/strict";
import test from "node:test";

import type { CheckoutItemSnapshot } from "../../types/checkout.ts";
import type { CheckoutTravelerProfile } from "../../types/travelers.ts";
import type { SavedTravelerProfile } from "../../types/saved-travelers.ts";

const validationModule: typeof import("./validateSavedTravelerProfile.ts") =
  await import(
    new URL("./validateSavedTravelerProfile.ts", import.meta.url).href
  );
const checkoutMappingModule: typeof import("./mapCheckoutTravelerToSavedTraveler.ts") =
  await import(
    new URL("./mapCheckoutTravelerToSavedTraveler.ts", import.meta.url).href
  );
const savedMappingModule: typeof import("./mapSavedTravelerToCheckoutTraveler.ts") =
  await import(
    new URL("./mapSavedTravelerToCheckoutTraveler.ts", import.meta.url).href
  );
const summaryModule: typeof import("./buildSavedTravelerSummary.ts") =
  await import(new URL("./buildSavedTravelerSummary.ts", import.meta.url).href);
const saveabilityModule: typeof import("./canSaveTravelerFromCheckout.ts") =
  await import(
    new URL("./canSaveTravelerFromCheckout.ts", import.meta.url).href
  );
const suggestionModule: typeof import("./getCheckoutSavedTravelerSuggestions.ts") =
  await import(
    new URL("./getCheckoutSavedTravelerSuggestions.ts", import.meta.url).href
  );
const manageModule: typeof import("./canManageSavedTravelers.ts") =
  await import(new URL("./canManageSavedTravelers.ts", import.meta.url).href);

const { validateSavedTravelerProfile } = validationModule;
const { mapCheckoutTravelerToSavedTraveler } = checkoutMappingModule;
const { mapSavedTravelerToCheckoutTraveler } = savedMappingModule;
const { buildSavedTravelerSummary } = summaryModule;
const { canSaveTravelerFromCheckout } = saveabilityModule;
const { rankSavedTravelersForCheckout } = suggestionModule;
const { canManageSavedTravelers } = manageModule;

const baseCheckoutTraveler = (
  overrides: Partial<CheckoutTravelerProfile> = {},
): CheckoutTravelerProfile => ({
  id: "trv_checkout_1",
  checkoutSessionId: "cko_test",
  type: "adult",
  role: "passenger",
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

const baseSavedTraveler = (
  overrides: Partial<SavedTravelerProfile> = {},
): SavedTravelerProfile => ({
  id: "stv_1",
  ownerUserId: "usr_123",
  status: "active",
  type: "adult",
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
  label: "Work traveler",
  isDefault: false,
  createdAt: "2026-03-19T10:00:00.000Z",
  updatedAt: "2026-03-19T10:00:00.000Z",
  ...overrides,
});

const baseItem = (
  overrides: Partial<CheckoutItemSnapshot>,
): CheckoutItemSnapshot => ({
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

test("validateSavedTravelerProfile flags invalid reusable profile fields", () => {
  const result = validateSavedTravelerProfile({
    ownerUserId: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "2099-01-01",
    email: "invalid-email",
    phone: "abc",
    documentExpiryDate: "2020-01-01",
  });

  const codes = new Set(result.issues.map((issue) => issue.code));
  assert.equal(result.ok, false);
  assert.equal(codes.has("MISSING_OWNER_USER"), true);
  assert.equal(codes.has("MISSING_FIRST_NAME"), true);
  assert.equal(codes.has("MISSING_LAST_NAME"), true);
  assert.equal(codes.has("INVALID_DATE_OF_BIRTH"), true);
  assert.equal(codes.has("INVALID_EMAIL"), true);
  assert.equal(codes.has("INVALID_PHONE"), true);
  assert.equal(codes.has("DOCUMENT_EXPIRED"), true);
});

test("mapCheckoutTravelerToSavedTraveler strips checkout-scoped fields and preserves canonical data", () => {
  const mapped = mapCheckoutTravelerToSavedTraveler({
    traveler: baseCheckoutTraveler(),
    ownerUserId: "usr_123",
    isDefault: true,
  });

  assert.equal("checkoutSessionId" in mapped, false);
  assert.equal("role" in mapped, false);
  assert.equal(mapped.ownerUserId, "usr_123");
  assert.equal(mapped.firstName, "Alex");
  assert.equal(mapped.documentNumber, "A1234567");
  assert.equal(mapped.isDefault, true);
});

test("mapSavedTravelerToCheckoutTraveler copies saved profile data into a checkout payload", () => {
  const mapped = mapSavedTravelerToCheckoutTraveler({
    traveler: baseSavedTraveler(),
    role: "driver",
  });

  assert.equal(mapped.role, "driver");
  assert.equal(mapped.type, "adult");
  assert.equal(mapped.firstName, "Alex");
  assert.equal(mapped.driverAge, 30);
  assert.equal("ownerUserId" in mapped, false);
});

test("buildSavedTravelerSummary surfaces display copy and badges", () => {
  const summary = buildSavedTravelerSummary(
    baseSavedTraveler({
      isDefault: true,
    }),
  );

  assert.equal(summary.displayName, "Alex Traveler");
  assert.equal(summary.label, "Work traveler");
  assert.equal(summary.badgeLabel, "Default");
  assert.equal(summary.hasContactDetails, true);
  assert.equal(summary.hasDocumentDetails, true);
});

test("canSaveTravelerFromCheckout mirrors saved traveler validation expectations", () => {
  const result = canSaveTravelerFromCheckout({
    traveler: baseCheckoutTraveler({
      firstName: "",
      lastName: "",
      email: "invalid",
    }),
    ownerUserId: "usr_123",
  });

  assert.equal(result.ok, false);
  assert.equal(
    result.issues.some((issue) => issue.code === "MISSING_FIRST_NAME"),
    true,
  );
  assert.equal(
    result.issues.some((issue) => issue.code === "INVALID_EMAIL"),
    true,
  );
});

test("rankSavedTravelersForCheckout prioritizes default, document-ready profiles", () => {
  const ranked = rankSavedTravelersForCheckout({
    profiles: [
      baseSavedTraveler({
        id: "stv_low",
        isDefault: false,
        email: null,
        phone: null,
        documentType: null,
        documentNumber: null,
      }),
      baseSavedTraveler({
        id: "stv_high",
        isDefault: true,
        updatedAt: "2026-03-19T12:00:00.000Z",
      }),
    ],
    checkoutItems: [
      baseItem({
        tripItemId: 9,
        inventory: {
          ...baseItem({}).inventory,
          inventoryId: "flight:passport",
          providerMetadata: {
            passengers: 1,
            requiresPassport: true,
          },
        },
      }),
    ],
  });

  assert.equal(ranked[0]?.profile.id, "stv_high");
  assert.equal(ranked[0]?.reasons.includes("Default profile"), true);
  assert.equal(ranked[0]?.reasons.includes("Includes passport details"), true);
});

test("canManageSavedTravelers only enables account-owned profile management with a user id", () => {
  assert.equal(canManageSavedTravelers(null).ok, false);
  assert.equal(canManageSavedTravelers("usr_123").ok, true);
});
