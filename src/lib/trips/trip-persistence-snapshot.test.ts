import assert from 'node:assert/strict'
import test from 'node:test'

const inventoryIdModule: typeof import('../inventory/inventory-id.ts') = await import(
  new URL('../inventory/inventory-id.ts', import.meta.url).href
)
const bookableEntityModule: typeof import('../booking/bookable-entity.ts') = await import(
  new URL('../booking/bookable-entity.ts', import.meta.url).href
)
const persistenceSnapshotModule: typeof import('./trip-persistence-snapshot.ts') = await import(
  new URL('./trip-persistence-snapshot.ts', import.meta.url).href
)

const { buildHotelInventoryId } = inventoryIdModule
const { toBookableEntityFromTripCandidate } = bookableEntityModule
const {
  buildHotelTripItemAvailabilitySnapshot,
  buildTripItemInventorySnapshotModel,
} = persistenceSnapshotModule

test('builds a persisted trip item inventory snapshot model from canonical bookable data', () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-05-12',
    checkOutDate: '2026-05-16',
    roomType: 'suite',
    occupancy: 2,
  })

  const bookableEntity = toBookableEntityFromTripCandidate(
    {
      itemType: 'hotel',
      inventoryId,
      providerInventoryId: 555,
      startDate: '2026-05-12',
      endDate: '2026-05-16',
      priceCents: 124900,
      currencyCode: 'USD',
      title: 'Andacity Suites',
      subtitle: 'Downtown stay',
      imageUrl: 'https://example.com/hotel.jpg',
      meta: ['Suite', 'Free cancellation'],
      metadata: {
        provider: 'hotelbeds',
        hotelSlug: 'andacity-suites',
      },
    },
    {
      source: 'trip_item',
      snapshotTimestamp: '2026-03-16T18:30:00.000Z',
    },
  )

  const snapshot = buildTripItemInventorySnapshotModel({
    id: 42,
    itemType: 'hotel',
    inventoryId,
    providerInventoryId: 555,
    hotelAvailabilitySnapshotId: 81,
    bookableEntity,
    availabilitySnapshot: {
      hotelAvailabilitySnapshotId: 81,
      snapshotTimestamp: '2026-03-16T18:30:00.000Z',
      checkInStart: '2026-05-10',
      checkInEnd: '2026-05-20',
      minNights: 2,
      maxNights: 7,
      blockedWeekdays: [2, 4],
    },
  })

  assert.equal(snapshot?.id, 42)
  assert.equal(snapshot?.providerInventoryId, 555)
  assert.equal(snapshot?.hotelAvailabilitySnapshotId, 81)
  assert.equal(snapshot?.bookableEntity?.inventoryId, inventoryId)
  assert.equal(snapshot?.availability?.itemType, 'hotel')

  if (!snapshot || !snapshot.availability || snapshot.availability.itemType !== 'hotel') {
    assert.fail('expected a persisted hotel availability snapshot')
  }

  assert.equal(snapshot.availability.checkInStart, '2026-05-10')
  assert.equal(snapshot.availability.maxNights, 7)
  assert.deepEqual(snapshot.availability.blockedWeekdays, [2, 4])
})

test('returns null for empty hotel availability snapshots and rejects mismatched bookable entities', () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 777,
    checkInDate: '2026-06-01',
    checkOutDate: '2026-06-03',
    roomType: 'queen',
    occupancy: 2,
  })

  const emptyAvailability = buildHotelTripItemAvailabilitySnapshot({})
  assert.equal(emptyAvailability, null)

  const mismatchedEntity = toBookableEntityFromTripCandidate(
    {
      itemType: 'hotel',
      inventoryId: buildHotelInventoryId({
        hotelId: 778,
        checkInDate: '2026-06-01',
        checkOutDate: '2026-06-03',
        roomType: 'queen',
        occupancy: 2,
      }),
      title: 'Wrong hotel',
      currencyCode: 'USD',
    },
    {
      source: 'trip_item',
    },
  )

  const snapshot = buildTripItemInventorySnapshotModel({
    itemType: 'hotel',
    inventoryId,
    providerInventoryId: 777,
    bookableEntity: mismatchedEntity,
    availabilitySnapshot: {},
  })

  assert.equal(snapshot?.providerInventoryId, 777)
  assert.equal(snapshot?.bookableEntity, null)
  assert.equal(snapshot?.availability, null)
})
