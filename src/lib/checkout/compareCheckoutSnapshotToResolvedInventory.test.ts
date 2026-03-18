import assert from "node:assert/strict";
import test from "node:test";

import type { CheckoutItemSnapshot } from "../../types/checkout.ts";
import type { ResolvedInventoryRecord } from "../../types/inventory.ts";
import type { HotelBookableEntity } from "../../types/bookable-entity.ts";

const inventoryIdModule: typeof import("../inventory/inventory-id.ts") =
  await import(new URL("../inventory/inventory-id.ts", import.meta.url).href);
const compareModule: typeof import("./compareCheckoutSnapshotToResolvedInventory.ts") =
  await import(
    new URL("./compareCheckoutSnapshotToResolvedInventory.ts", import.meta.url)
      .href
  );

const { buildHotelInventoryId } = inventoryIdModule;
const { compareCheckoutSnapshotToResolvedInventory } = compareModule;

const buildInventoryId = (providerOfferId = "offer-abc") =>
  buildHotelInventoryId({
    provider: "expedia",
    hotelId: 123,
    checkInDate: "2026-04-10",
    checkOutDate: "2026-04-14",
    roomType: "deluxe",
    occupancy: 2,
    providerOfferId,
    ratePlanId: "rate-flex",
    boardType: "breakfast",
    cancellationPolicy: "flex",
  });

const buildHotelEntity = (
  overrides: Partial<HotelBookableEntity> = {},
): HotelBookableEntity => ({
  inventoryId: buildInventoryId(),
  vertical: "hotel",
  provider: "expedia",
  title: "Ace Palm Hotel",
  subtitle: "Downtown",
  imageUrl: null,
  href: "/hotels/ace-palm",
  snapshotTimestamp: "2026-03-16T09:00:00.000Z",
  price: {
    amountCents: 92000,
    currency: "USD",
  },
  bookingContext: {
    hotelId: "hotel-123",
    checkInDate: "2026-04-10",
    checkOutDate: "2026-04-14",
    roomType: "deluxe",
    occupancy: 2,
  },
  payload: {
    source: "search",
    priceSource: "live",
    providerInventoryId: 555,
    hotelSlug: "ace-palm",
    providerOfferId: "offer-abc",
    ratePlanId: "rate-flex",
    boardType: "breakfast",
    cancellationPolicy: "flex",
    priceSummary: {
      nightlyBaseCents: 20000,
      totalBaseCents: 80000,
      totalPriceCents: 92000,
      nights: 4,
      taxesCents: 8000,
      mandatoryFeesCents: 4000,
    },
    providerMetadata: {
      providerName: "Expedia",
      providerHotelId: "hotel-123",
      providerOfferId: "offer-abc",
      ratePlanId: "rate-flex",
      boardType: "breakfast",
      cancellationPolicy: "flex",
      checkInDate: "2026-04-10",
      checkOutDate: "2026-04-14",
      occupancy: 2,
    },
  },
  ...overrides,
});

const buildSnapshot = (
  overrides: Partial<CheckoutItemSnapshot> = {},
): CheckoutItemSnapshot => ({
  tripItemId: 8,
  itemType: "hotel",
  vertical: "hotel",
  entityId: 555,
  bookableEntityId: 555,
  inventory: {
    inventoryId: buildInventoryId(),
    providerInventoryId: 555,
    hotelAvailabilitySnapshotId: 12,
    availability: null,
    bookableEntity: buildHotelEntity(),
    providerMetadata: {
      provider: "expedia",
    },
  },
  title: "Ace Palm Hotel",
  subtitle: "Downtown",
  imageUrl: null,
  meta: [],
  startDate: "2026-04-10",
  endDate: "2026-04-14",
  snapshotTimestamp: "2026-03-16T09:00:00.000Z",
  pricing: {
    currencyCode: "USD",
    baseAmountCents: 80000,
    taxesAmountCents: 8000,
    feesAmountCents: 4000,
    totalAmountCents: 92000,
  },
  ...overrides,
});

const buildResolvedRecord = (
  overrides: Partial<ResolvedInventoryRecord> = {},
): ResolvedInventoryRecord => ({
  entity: buildHotelEntity(),
  checkedAt: "2026-03-16T09:05:00.000Z",
  isAvailable: true,
  ...overrides,
});

test("returns passed when the resolved inventory still matches the snapshot", () => {
  const result = compareCheckoutSnapshotToResolvedInventory({
    snapshot: buildSnapshot(),
    resolved: buildResolvedRecord(),
  });

  assert.equal(result.status, "passed");
  assert.equal(result.currentPricing?.totalAmountCents, 92000);
});

test("returns price_changed when price drift is detected", () => {
  const result = compareCheckoutSnapshotToResolvedInventory({
    snapshot: buildSnapshot(),
    resolved: buildResolvedRecord({
      entity: buildHotelEntity({
        price: {
          amountCents: 98000,
          currency: "USD",
        },
        payload: {
          ...buildHotelEntity().payload,
          priceSummary: {
            nightlyBaseCents: 21000,
            totalBaseCents: 84000,
            totalPriceCents: 98000,
            nights: 4,
            taxesCents: 9000,
            mandatoryFeesCents: 5000,
          },
        },
      }),
    }),
  });

  assert.equal(result.status, "price_changed");
  assert.equal(result.currentPricing?.totalAmountCents, 98000);
});

test("returns changed when materially different inventory resolves", () => {
  const result = compareCheckoutSnapshotToResolvedInventory({
    snapshot: buildSnapshot(),
    resolved: buildResolvedRecord({
      entity: buildHotelEntity({
        inventoryId:
          buildInventoryId("offer-new"),
        payload: {
          ...buildHotelEntity().payload,
          providerOfferId: "offer-new",
          providerMetadata: {
            ...buildHotelEntity().payload.providerMetadata,
            providerOfferId: "offer-new",
          } as HotelBookableEntity["payload"]["providerMetadata"],
        },
      }),
    }),
  });

  assert.equal(result.status, "changed");
  assert.match(result.message || "", /no longer matches/i);
});
