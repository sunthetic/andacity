import assert from 'node:assert/strict'
import test from 'node:test'

const {
  buildCarInventoryId,
  buildFlightInventoryId,
  buildHotelInventoryId,
} = await import(new URL('../inventory/inventory-id.ts', import.meta.url).href)
const {
  isSearchEntity,
  toBookableEntity,
  toCarSearchEntity,
  toFlightSearchEntity,
  toHotelSearchEntity,
} = await import(new URL('./search-entity.ts', import.meta.url).href)

test('maps a flight result into a canonical search entity', () => {
  const entity = toFlightSearchEntity(
    {
      itineraryId: 321,
      airline: 'Delta',
      airlineCode: 'DL',
      flightNumber: '123',
      serviceDate: '2026-04-01',
      origin: 'New York (JFK)',
      destination: 'Los Angeles (LAX)',
      originCode: 'JFK',
      destinationCode: 'LAX',
      stops: 1,
      duration: '6h 5m',
      cabinClass: 'economy',
      fareCode: 'Y',
      price: 399,
      currency: 'usd',
    },
    {
      departDate: '2026-04-01',
      priceAmountCents: 39900,
      snapshotTimestamp: '2026-03-12T12:00:00.000Z',
    },
  )

  assert.equal(
    entity.inventoryId,
    buildFlightInventoryId({
      airlineCode: 'DL',
      flightNumber: '123',
      departDate: '2026-04-01',
      originCode: 'JFK',
      destinationCode: 'LAX',
    }),
  )
  assert.equal(entity.vertical, 'flight')
  assert.deepEqual(entity.route, {
    origin: 'JFK',
    destination: 'LAX',
    departDate: '2026-04-01',
  })
  assert.equal(entity.metadata.stops, 1)
  assert.equal(entity.metadata.durationMinutes, 365)
  assert.equal(entity.price.amountCents, 39900)
  assert.equal(entity.price.currency, 'USD')
  assert.deepEqual(entity.bookableSnapshot, toBookableEntity(entity))
  assert.ok(isSearchEntity(entity))
})

test('maps a hotel result into a canonical search entity', () => {
  const entity = toHotelSearchEntity(
    {
      inventoryId: 555,
      slug: 'ace-hotel',
      name: 'Ace Hotel',
      neighborhood: 'Downtown',
      stars: 4,
      rating: 8.6,
      reviewCount: 321,
      priceFrom: 189,
      currency: 'usd',
      image: '/img/hotel.jpg',
    },
    {
      checkInDate: '2026-04-01',
      checkOutDate: '2026-04-05',
      occupancy: 2,
      roomType: 'suite',
      priceAmountCents: 18900,
      assumedStayDates: false,
      assumedOccupancy: false,
    },
  )

  assert.equal(
    entity.inventoryId,
    buildHotelInventoryId({
      hotelId: 555,
      checkInDate: '2026-04-01',
      checkOutDate: '2026-04-05',
      roomType: 'suite',
      occupancy: 2,
    }),
  )
  assert.equal(entity.vertical, 'hotel')
  assert.deepEqual(entity.stay, {
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    occupancy: 2,
  })
  assert.equal(entity.metadata.hotelId, '555')
  assert.equal(entity.metadata.rating, 8.6)
  assert.equal(entity.metadata.reviewCount, 321)
  assert.deepEqual(entity.bookableSnapshot, toBookableEntity(entity))
  assert.ok(isSearchEntity(entity))
})

test('maps a car result into a canonical search entity', () => {
  const entity = toCarSearchEntity(
    {
      inventoryId: 777,
      locationId: 'phx-airport',
      slug: 'hertz-phx',
      name: 'Hertz',
      pickupArea: 'Phoenix Sky Harbor',
      vehicleName: 'Toyota RAV4',
      category: 'SUV',
      transmission: 'Automatic',
      seats: 5,
      priceFrom: 67,
      currency: 'usd',
      image: '/img/car.jpg',
    },
    {
      providerLocationId: 'phx-airport',
      pickupDateTime: '2026-04-01T10:00',
      dropoffDateTime: '2026-04-05T10:00',
      vehicleClass: 'SUV',
      priceAmountCents: 6700,
      assumedRentalWindow: false,
    },
  )

  assert.equal(
    entity.inventoryId,
    buildCarInventoryId({
      providerLocationId: 'phx-airport',
      pickupDateTime: '2026-04-01T10:00',
      dropoffDateTime: '2026-04-05T10:00',
      vehicleClass: 'SUV',
    }),
  )
  assert.equal(entity.vertical, 'car')
  assert.deepEqual(entity.rental, {
    pickupDateTime: '2026-04-01T10:00',
    dropoffDateTime: '2026-04-05T10:00',
  })
  assert.equal(entity.metadata.providerLocationId, 'phx-airport')
  assert.equal(entity.metadata.vehicleClass, 'SUV')
  assert.equal(entity.metadata.seats, 5)
  assert.deepEqual(entity.bookableSnapshot, toBookableEntity(entity))
  assert.ok(isSearchEntity(entity))
})

test('rejects malformed canonical shapes and normalizes currency casing', () => {
  const entity = toHotelSearchEntity(
    {
      inventoryId: 42,
      slug: 'test-hotel',
      name: 'Test Hotel',
      neighborhood: 'River North',
      stars: 4,
      rating: 9.1,
      reviewCount: 80,
      priceFrom: 240,
      currency: 'usd',
    },
    {
      checkInDate: '2026-05-01',
      checkOutDate: '2026-05-03',
      occupancy: 2,
      roomType: 'standard',
      priceAmountCents: 24000,
    },
  )

  assert.equal(entity.price.currency, 'USD')
  assert.equal(isSearchEntity({ ...entity, inventoryId: '' }), false)
  assert.equal(
    isSearchEntity({
      ...entity,
      price: {
        ...entity.price,
        amountCents: Number.NaN,
      },
    }),
    false,
  )
  assert.equal(
    isSearchEntity({
      ...entity,
      title: '',
    }),
    false,
  )
})
