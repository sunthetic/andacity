import assert from 'node:assert/strict'
import test from 'node:test'

type TripItemRevalidationResolver =
  import('./revalidate-trip-items.ts').TripItemRevalidationResolver

const inventoryIdModule: typeof import('../inventory/inventory-id.ts') = await import(
  new URL('../inventory/inventory-id.ts', import.meta.url).href
)
const revalidationModule: typeof import('./revalidate-trip-items.ts') = await import(
  new URL('./revalidate-trip-items.ts', import.meta.url).href
)

const {
  buildCarInventoryId,
  buildFlightInventoryId,
  buildHotelInventoryId,
} = inventoryIdModule

const {
  buildTripItemRevalidationIssue,
  getTripItemRevalidationStatus,
  revalidateTripItem,
  revalidateTripItems,
} = revalidationModule

const buildResolver = (
  overrides: Partial<TripItemRevalidationResolver> = {},
): TripItemRevalidationResolver => ({
  hotel: async () => null,
  flight: async () => null,
  car: async () => null,
  ...overrides,
})

test('returns valid when current inventory matches the saved snapshot', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'king-room',
    occupancy: 2,
  })

  const result = await revalidateTripItem(
    {
      itemId: 42,
      itemType: 'hotel',
      title: 'Ace Hotel',
      inventoryId,
      snapshotPriceCents: 84900,
      snapshotCurrencyCode: 'USD',
    },
    {
      hotel: async () => ({
        inventoryId,
        currentPriceCents: 84900,
        currentCurrencyCode: 'USD',
        isAvailable: true,
      }),
      flight: async () => null,
      car: async () => null,
    },
    {
      checkedAt: '2026-03-12T20:15:00.000Z',
    },
  )

  assert.equal(result.status, 'valid')
  assert.equal(result.message, 'Ace Hotel still matches the saved inventory snapshot.')
  assert.equal(result.currentPriceCents, 84900)
  assert.equal(result.currentCurrencyCode, 'USD')
  assert.equal(result.isAvailable, true)
  assert.equal(result.checkedAt, '2026-03-12T20:15:00.000Z')
  assert.deepEqual(result.issues, [])
})

test('surfaces price and currency drift as a normalized price_changed result', async () => {
  const inventoryId = buildFlightInventoryId({
    airlineCode: 'DL',
    flightNumber: '123',
    departDate: '2026-04-01',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })

  const result = await revalidateTripItem(
    {
      itemId: 7,
      itemType: 'flight',
      title: 'Delta 123',
      inventoryId,
      snapshotPriceCents: 39900,
      snapshotCurrencyCode: 'USD',
    },
    {
      hotel: async () => null,
      flight: async () => ({
        inventoryId,
        currentPriceCents: 44900,
        currentCurrencyCode: 'EUR',
        isAvailable: true,
      }),
      car: async () => null,
    },
  )

  assert.equal(result.status, 'price_changed')
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ['currency_changed', 'price_changed'],
  )
})

test('marks missing inventory as unavailable', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 999,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'standard',
    occupancy: 2,
  })

  const result = await revalidateTripItem(
    {
      itemId: 12,
      itemType: 'hotel',
      title: 'Missing Stay',
      inventoryId,
      snapshotPriceCents: 59900,
      snapshotCurrencyCode: 'USD',
    },
    buildResolver(),
  )

  assert.equal(result.status, 'unavailable')
  assert.deepEqual(result.issues.map((issue) => issue.code), ['inventory_missing'])
})

test('marks unavailable inventory as sold out', async () => {
  const inventoryId = buildCarInventoryId({
    providerLocationId: 'phx-airport',
    pickupDateTime: '2026-04-01T10:00',
    dropoffDateTime: '2026-04-05T10:00',
    vehicleClass: 'suv',
  })

  const result = await revalidateTripItem(
    {
      itemId: 21,
      itemType: 'car',
      title: 'SUV Rental',
      inventoryId,
      snapshotPriceCents: 26800,
      snapshotCurrencyCode: 'USD',
    },
    {
      hotel: async () => null,
      flight: async () => null,
      car: async () => ({
        inventoryId,
        currentPriceCents: 26800,
        currentCurrencyCode: 'USD',
        isAvailable: false,
      }),
    },
  )

  assert.equal(result.status, 'unavailable')
  assert.deepEqual(result.issues.map((issue) => issue.code), ['sold_out'])
})

test('raises inventory_mismatch when the item type does not match the canonical inventory prefix', async () => {
  const flightInventoryId = buildFlightInventoryId({
    airlineCode: 'DL',
    flightNumber: '123',
    departDate: '2026-04-01',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })

  const result = await revalidateTripItem(
    {
      itemId: 88,
      itemType: 'hotel',
      title: 'Wrong Prefix',
      inventoryId: flightInventoryId,
      snapshotPriceCents: 100,
      snapshotCurrencyCode: 'USD',
    },
    buildResolver(),
  )

  assert.equal(result.status, 'unavailable')
  assert.deepEqual(result.issues.map((issue) => issue.code), ['inventory_mismatch'])
})

test('raises snapshot_incomplete for malformed snapshot data', async () => {
  const result = await revalidateTripItem(
    {
      itemId: 99,
      itemType: 'hotel',
      title: 'Incomplete Snapshot',
      inventoryId: 'hotel:bad',
      snapshotPriceCents: null,
      snapshotCurrencyCode: null,
    },
    buildResolver(),
  )

  assert.equal(result.status, 'error')
  assert.deepEqual(result.issues.map((issue) => issue.code), ['snapshot_incomplete'])
})

test('returns a controlled error status when the provider lookup throws', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'standard',
    occupancy: 2,
  })

  const result = await revalidateTripItem(
    {
      itemId: 52,
      itemType: 'hotel',
      title: 'Retry Later Hotel',
      inventoryId,
      snapshotPriceCents: 40000,
      snapshotCurrencyCode: 'USD',
    },
    {
      hotel: async () => {
        throw new Error('provider timeout')
      },
      flight: async () => null,
      car: async () => null,
    },
  )

  assert.equal(result.status, 'error')
  assert.deepEqual(result.issues.map((issue) => issue.code), ['revalidation_failed'])
})

test('treats live pricing drift lookup failures as temporary revalidation errors', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'standard',
    occupancy: 2,
  })

  const result = await revalidateTripItem(
    {
      itemId: 53,
      itemType: 'hotel',
      title: 'Live Drift Hotel',
      inventoryId,
      snapshotPriceCents: 40000,
      snapshotCurrencyCode: 'USD',
    },
    {
      hotel: async () => ({
        inventoryId,
        currentPriceCents: null,
        currentCurrencyCode: null,
        isAvailable: true,
        priceDriftStatus: 'unavailable',
      }),
      flight: async () => null,
      car: async () => null,
    },
  )

  assert.equal(result.status, 'error')
  assert.deepEqual(result.issues.map((issue) => issue.code), ['inventory_unavailable'])
})

test('uses the shared price drift status to avoid false positives from rounding noise', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'suite',
    occupancy: 2,
  })

  const result = await revalidateTripItem(
    {
      itemId: 54,
      itemType: 'hotel',
      title: 'Rounded Hotel',
      inventoryId,
      snapshotPriceCents: 18900,
      snapshotCurrencyCode: 'USD',
    },
    {
      hotel: async () => ({
        inventoryId,
        currentPriceCents: 18901,
        currentCurrencyCode: 'USD',
        isAvailable: true,
        priceDriftStatus: 'valid',
      }),
      flight: async () => null,
      car: async () => null,
    },
  )

  assert.equal(result.status, 'valid')
  assert.deepEqual(result.issues, [])
})

test('detects current inventory identity drift as an unavailable item', async () => {
  const inventoryId = buildFlightInventoryId({
    airlineCode: 'DL',
    flightNumber: '123',
    departDate: '2026-04-01',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })
  const movedInventoryId = buildFlightInventoryId({
    airlineCode: 'DL',
    flightNumber: '123',
    departDate: '2026-04-02',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })

  const results = await revalidateTripItems(
    [
      {
        itemId: 70,
        itemType: 'flight',
        title: 'Date Drift Flight',
        inventoryId,
        snapshotPriceCents: 39900,
        snapshotCurrencyCode: 'USD',
      },
    ],
    {
      hotel: async () => null,
      flight: async () => ({
        inventoryId: movedInventoryId,
        currentPriceCents: 39900,
        currentCurrencyCode: 'USD',
        isAvailable: true,
      }),
      car: async () => null,
    },
  )

  assert.equal(results[0]?.status, 'unavailable')
  assert.deepEqual(results[0]?.issues.map((issue) => issue.code), ['date_changed'])
})

test('builds typed issues and derives the normalized revalidation status', () => {
  const warning = buildTripItemRevalidationIssue({
    code: 'price_changed',
    title: 'Price Drift Item',
  })
  const blocking = buildTripItemRevalidationIssue({
    code: 'inventory_missing',
    title: 'Missing Item',
  })

  assert.equal(warning.severity, 'warning')
  assert.equal(blocking.severity, 'blocking')
  assert.equal(getTripItemRevalidationStatus([warning]), 'price_changed')
  assert.equal(getTripItemRevalidationStatus([warning, blocking]), 'unavailable')
})
