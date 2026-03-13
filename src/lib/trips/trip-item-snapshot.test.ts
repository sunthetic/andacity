import assert from 'node:assert/strict'
import test from 'node:test'

const inventoryIdModule: typeof import('../inventory/inventory-id.ts') = await import(
  new URL('../inventory/inventory-id.ts', import.meta.url).href
)
const tripItemSnapshotModule: typeof import('./trip-item-snapshot.ts') = await import(
  new URL('./trip-item-snapshot.ts', import.meta.url).href
)

const {
  buildCarInventoryId,
  buildFlightInventoryId,
  buildHotelInventoryId,
} = inventoryIdModule

const {
  TripItemSnapshotError,
  buildTripItemSnapshotMetadata,
  normalizeTripItemSnapshotCore,
} = tripItemSnapshotModule

test('normalizes a hotel inventory snapshot and writes bounded metadata', () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'king-room',
    occupancy: 2,
  })

  const snapshot = normalizeTripItemSnapshotCore({
    itemType: 'hotel',
    inventoryId,
    snapshotPriceCents: 84900,
    snapshotCurrencyCode: 'usd',
    snapshotTimestamp: '2026-03-12T18:45:00.000Z',
  })

  const metadata = buildTripItemSnapshotMetadata({
    itemType: 'hotel',
    inventoryId,
    providerInventoryId: 555,
    metadata: {
      priceDisplay: {
        baseAmount: 212.25,
      },
      previewCurrentPriceCents: 85900,
      smartBundling: {
        selectionMode: 'manual_override',
      },
    },
  })

  assert.equal(snapshot.inventoryId, inventoryId)
  assert.equal(snapshot.snapshotPriceCents, 84900)
  assert.equal(snapshot.snapshotCurrencyCode, 'USD')
  assert.equal(snapshot.snapshotTimestamp, '2026-03-12T18:45:00.000Z')
  assert.equal(metadata.providerInventoryId, 555)
  assert.equal(metadata.hotelId, '555')
  assert.equal(metadata.roomType, 'king-room')
  assert.equal(metadata.occupancy, 2)
  assert.equal(metadata.checkInDate, '2026-04-01')
  assert.equal(metadata.checkOutDate, '2026-04-05')
  assert.deepEqual(metadata.priceDisplay, {
    baseAmount: 212.25,
  })
  assert.deepEqual(metadata.smartBundling, {
    selectionMode: 'manual_override',
  })
  assert.equal('previewCurrentPriceCents' in metadata, false)
})

test('writes normalized flight metadata from the canonical inventory id', () => {
  const inventoryId = buildFlightInventoryId({
    airlineCode: 'DL',
    flightNumber: '123',
    departDate: '2026-04-01',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })

  const metadata = buildTripItemSnapshotMetadata({
    itemType: 'flight',
    inventoryId,
    metadata: {
      itineraryType: 'one-way',
    },
  })

  assert.equal(metadata.carrier, 'DL')
  assert.equal(metadata.flightNumber, '123')
  assert.equal(metadata.origin, 'JFK')
  assert.equal(metadata.destination, 'LAX')
  assert.equal(metadata.serviceDate, '2026-04-01')
  assert.equal(metadata.itineraryType, 'one-way')
})

test('writes normalized car metadata from the canonical inventory id', () => {
  const inventoryId = buildCarInventoryId({
    providerLocationId: 'phx-airport',
    pickupDateTime: '2026-04-01T10:00',
    dropoffDateTime: '2026-04-05T10:00',
    vehicleClass: 'SUV',
  })

  const metadata = buildTripItemSnapshotMetadata({
    itemType: 'car',
    inventoryId,
    providerInventoryId: 777,
    metadata: {
      transmission: 'Automatic',
      seats: 5,
    },
  })

  assert.equal(metadata.providerInventoryId, 777)
  assert.equal(metadata.providerLocationId, 'phx-airport')
  assert.equal(metadata.vehicleClass, 'suv')
  assert.equal(metadata.pickupDateTime, '2026-04-01T10-00')
  assert.equal(metadata.dropoffDateTime, '2026-04-05T10-00')
  assert.equal(metadata.transmission, 'Automatic')
  assert.equal(metadata.seats, 5)
})

test('rejects invalid or mismatched canonical inventory ids', () => {
  assert.throws(
    () =>
      normalizeTripItemSnapshotCore({
        itemType: 'hotel',
        inventoryId: '',
        snapshotPriceCents: 100,
        snapshotCurrencyCode: 'USD',
      }),
    (error: unknown) =>
      error instanceof TripItemSnapshotError &&
      error.message === 'Trip item inventoryId is required.',
  )

  const flightInventoryId = buildFlightInventoryId({
    airlineCode: 'DL',
    flightNumber: '123',
    departDate: '2026-04-01',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })

  assert.throws(
    () =>
      normalizeTripItemSnapshotCore({
        itemType: 'hotel',
        inventoryId: flightInventoryId,
        snapshotPriceCents: 100,
        snapshotCurrencyCode: 'USD',
      }),
    (error: unknown) =>
      error instanceof TripItemSnapshotError &&
      error.message ===
        'Trip item inventoryId must use the "hotel:" canonical prefix for hotel items.',
  )

  assert.throws(
    () =>
      normalizeTripItemSnapshotCore({
        itemType: 'car',
        inventoryId: '777',
        snapshotPriceCents: 100,
        snapshotCurrencyCode: 'USD',
      }),
    (error: unknown) =>
      error instanceof TripItemSnapshotError &&
      error.message === 'Trip item inventoryId "777" is not a canonical inventory ID.',
  )
})
