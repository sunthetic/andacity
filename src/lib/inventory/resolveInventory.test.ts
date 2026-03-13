import assert from 'node:assert/strict'
import test from 'node:test'

const inventoryIdModule: typeof import('./inventory-id.ts') = await import(
  new URL('./inventory-id.ts', import.meta.url).href
)
const searchEntityModule: typeof import('../search/search-entity.ts') = await import(
  new URL('../search/search-entity.ts', import.meta.url).href
)
const bookableEntityModule: typeof import('../booking/bookable-entity.ts') = await import(
  new URL('../booking/bookable-entity.ts', import.meta.url).href
)
const resolveInventoryModule: typeof import('./resolveInventory.ts') = await import(
  new URL('./resolveInventory.ts', import.meta.url).href
)

const {
  buildCarInventoryId,
  buildFlightInventoryId,
  buildHotelInventoryId,
} = inventoryIdModule

const {
  toCarSearchEntity,
  toFlightSearchEntity,
  toHotelSearchEntity,
} = searchEntityModule

const { toBookableEntityFromSearchEntity } = bookableEntityModule
const {
  resolveInventory,
  resolveInventoryRecord,
  resolveInventoryWithSnapshot,
} = resolveInventoryModule

const buildHotelEntity = () =>
  toBookableEntityFromSearchEntity(
    toHotelSearchEntity(
      {
        inventoryId: 555,
        slug: 'ace-hotel',
        name: 'Ace Hotel',
        neighborhood: 'Downtown',
        stars: 4,
        rating: 8.9,
        reviewCount: 321,
        priceFrom: 189,
        currency: 'USD',
        image: '/img/hotel.jpg',
      },
      {
        checkInDate: '2026-04-01',
        checkOutDate: '2026-04-05',
        occupancy: 2,
        roomType: 'suite',
        priceAmountCents: 18900,
        snapshotTimestamp: '2026-03-13T18:30:00.000Z',
      },
    ),
  )

const buildFlightEntity = () =>
  toBookableEntityFromSearchEntity(
    toFlightSearchEntity(
      {
        itineraryId: 321,
        airline: 'Delta',
        airlineCode: 'DL',
        flightNumber: '123',
        serviceDate: '2026-04-01',
        origin: 'JFK',
        destination: 'LAX',
        originCode: 'JFK',
        destinationCode: 'LAX',
        stops: 0,
        duration: '6h 5m',
        cabinClass: 'economy',
        fareCode: 'standard',
        price: 399,
        currency: 'USD',
      },
      {
        departDate: '2026-04-01',
        priceAmountCents: 39900,
        snapshotTimestamp: '2026-03-13T18:30:00.000Z',
      },
    ),
  )

const buildCarEntity = () =>
  toBookableEntityFromSearchEntity(
    toCarSearchEntity(
      {
        inventoryId: 777,
        locationId: 44,
        slug: 'hertz-phx',
        name: 'Hertz',
        pickupArea: 'Phoenix Sky Harbor',
        vehicleName: 'Toyota RAV4',
        category: 'SUV',
        transmission: 'Automatic',
        seats: 5,
        priceFrom: 67,
        currency: 'USD',
        image: '/img/car.jpg',
      },
      {
        providerLocationId: 44,
        pickupDateTime: '2026-04-01T10:00',
        dropoffDateTime: '2026-04-05T10:00',
        vehicleClass: 'suv',
        priceAmountCents: 6700,
        snapshotTimestamp: '2026-03-13T18:30:00.000Z',
      },
    ),
  )

test('returns null for malformed or non-canonical inventory ids', async () => {
  assert.equal(await resolveInventory('hotel:expedia:0f9921ab'), null)
  assert.equal(await resolveInventory('not-canonical'), null)
})

test('routes hotel inventory resolution through the hotel provider resolver', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'suite',
    occupancy: 2,
  })
  let hotelCalls = 0

  const record = await resolveInventoryRecord(
    {
      inventoryId,
      checkedAt: '2026-03-13T20:00:00.000Z',
    },
    {
      resolvers: {
        hotel: async () => {
          hotelCalls += 1
          return {
            entity: buildHotelEntity(),
            checkedAt: '2026-03-13T20:00:00.000Z',
            isAvailable: true,
          }
        },
      },
    },
  )

  assert.equal(hotelCalls, 1)
  assert.equal(record?.entity.vertical, 'hotel')
  assert.equal(record?.isAvailable, true)
})

test('routes flight inventory resolution through the flight provider resolver', async () => {
  const inventoryId = buildFlightInventoryId({
    airlineCode: 'DL',
    flightNumber: '123',
    departDate: '2026-04-01',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })
  let flightCalls = 0

  const record = await resolveInventoryRecord(
    {
      inventoryId,
      providerInventoryId: 321,
      checkedAt: '2026-03-13T20:00:00.000Z',
    },
    {
      resolvers: {
        flight: async (input) => {
          flightCalls += 1
          assert.equal(input.providerInventoryId, 321)
          return {
            entity: buildFlightEntity(),
            checkedAt: '2026-03-13T20:00:00.000Z',
            isAvailable: true,
          }
        },
      },
    },
  )

  assert.equal(flightCalls, 1)
  assert.equal(record?.entity.vertical, 'flight')
})

test('routes car inventory resolution through the car provider resolver', async () => {
  const inventoryId = buildCarInventoryId({
    providerLocationId: 44,
    pickupDateTime: '2026-04-01T10:00',
    dropoffDateTime: '2026-04-05T10:00',
    vehicleClass: 'suv',
  })
  let carCalls = 0

  const record = await resolveInventoryRecord(
    {
      inventoryId,
      checkedAt: '2026-03-13T20:00:00.000Z',
    },
    {
      resolvers: {
        car: async () => {
          carCalls += 1
          return {
            entity: buildCarEntity(),
            checkedAt: '2026-03-13T20:00:00.000Z',
            isAvailable: true,
          }
        },
      },
    },
  )

  assert.equal(carCalls, 1)
  assert.equal(record?.entity.vertical, 'car')
})

test('computes snapshot validation statuses for valid, price-changed, and unavailable inventory', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'suite',
    occupancy: 2,
  })
  const entity = buildHotelEntity()

  const valid = await resolveInventoryWithSnapshot(
    {
      inventoryId,
      checkedAt: '2026-03-13T20:00:00.000Z',
      snapshot: {
        inventoryId,
        priceCents: 18900,
        currencyCode: 'USD',
      },
    },
    {
      resolvers: {
        hotel: async () => ({
          entity,
          checkedAt: '2026-03-13T20:00:00.000Z',
          isAvailable: true,
        }),
      },
    },
  )

  const priceChanged = await resolveInventoryWithSnapshot(
    {
      inventoryId,
      checkedAt: '2026-03-13T20:00:00.000Z',
      snapshot: {
        inventoryId,
        priceCents: 17900,
        currencyCode: 'USD',
      },
    },
    {
      resolvers: {
        hotel: async () => ({
          entity,
          checkedAt: '2026-03-13T20:00:00.000Z',
          isAvailable: true,
        }),
      },
    },
  )

  const unavailable = await resolveInventoryWithSnapshot(
    {
      inventoryId,
      checkedAt: '2026-03-13T20:00:00.000Z',
      snapshot: {
        inventoryId,
        priceCents: 18900,
        currencyCode: 'USD',
      },
    },
    {
      resolvers: {
        hotel: async () => ({
          entity,
          checkedAt: '2026-03-13T20:00:00.000Z',
          isAvailable: false,
        }),
      },
    },
  )

  assert.equal(valid?.snapshotStatus, 'valid')
  assert.equal(priceChanged?.snapshotStatus, 'price_changed')
  assert.equal(unavailable?.snapshotStatus, 'unavailable')
})
