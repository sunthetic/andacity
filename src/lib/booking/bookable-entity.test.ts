import assert from 'node:assert/strict'
import test from 'node:test'

import type { TripItem } from '~/types/trips/trip'

const inventoryIdModule: typeof import('../inventory/inventory-id.ts') = await import(
  new URL('../inventory/inventory-id.ts', import.meta.url).href
)
const searchEntityModule: typeof import('../search/search-entity.ts') = await import(
  new URL('../search/search-entity.ts', import.meta.url).href
)
const bookableEntityModule: typeof import('./bookable-entity.ts') = await import(
  new URL('./bookable-entity.ts', import.meta.url).href
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

const {
  BookableEntityValidationError,
  buildBookableEntityPrice,
  isBookableEntity,
  toBookableEntityFromSavedItem,
  toBookableEntityFromSearchEntity,
  toBookableEntityFromTripItem,
} = bookableEntityModule

const buildTripItem = (overrides: Partial<TripItem> = {}): TripItem => ({
  id: 1,
  tripId: 10,
  itemType: 'hotel',
  inventoryId: buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'king-room',
    occupancy: 2,
  }),
  position: 0,
  locked: false,
  title: 'Ace Hotel',
  subtitle: 'Downtown · 4-star',
  startDate: '2026-04-01',
  endDate: '2026-04-05',
  snapshotPriceCents: 84900,
  snapshotCurrencyCode: 'USD',
  snapshotTimestamp: '2026-03-13T18:30:00.000Z',
  currentPriceCents: null,
  currentCurrencyCode: null,
  priceDriftStatus: 'unchanged',
  priceDriftCents: null,
  availabilityConfidence: {} as TripItem['availabilityConfidence'],
  freshness: undefined,
  availabilityStatus: 'valid',
  availabilityCheckedAt: '2026-03-13T18:45:00.000Z',
  availabilityExpiresAt: null,
  revalidation: {
    itemId: 1,
    inventoryId: buildHotelInventoryId({
      hotelId: 555,
      checkInDate: '2026-04-01',
      checkOutDate: '2026-04-05',
      roomType: 'king-room',
      occupancy: 2,
    }),
    checkedAt: '2026-03-13T18:45:00.000Z',
    status: 'ok',
    currentPriceCents: null,
    currentCurrencyCode: null,
    snapshotPriceCents: 84900,
    snapshotCurrencyCode: 'USD',
    priceDeltaCents: null,
    isAvailable: true,
    issues: [],
  },
  bookableEntity: null,
  imageUrl: '/img/hotel.jpg',
  meta: [],
  issues: [],
  startCityName: null,
  endCityName: null,
  liveCarLocationType: null,
  liveCarLocationName: null,
  hotelId: 555,
  flightItineraryId: null,
  carInventoryId: null,
  liveFlightServiceDate: null,
  liveFlightDepartureAt: null,
  liveFlightArrivalAt: null,
  liveFlightItineraryType: null,
  metadata: {
    provider: 'Ace Hotel',
  },
  createdAt: '2026-03-13T18:30:00.000Z',
  updatedAt: '2026-03-13T18:30:00.000Z',
  ...overrides,
})

test('maps a flight search entity into a canonical bookable entity', () => {
  const searchEntity = toFlightSearchEntity(
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
      snapshotTimestamp: '2026-03-13T18:30:00.000Z',
    },
  )

  const entity = toBookableEntityFromSearchEntity(searchEntity)

  assert.equal(entity.vertical, 'flight')
  assert.equal(entity.inventoryId, searchEntity.inventoryId)
  assert.equal(entity.price.amountCents, 39900)
  assert.equal(entity.price.currency, 'USD')
  assert.deepEqual(entity.bookingContext, {
    carrier: 'DL',
    flightNumber: '123',
    origin: 'JFK',
    destination: 'LAX',
    departDate: '2026-04-01',
  })
  assert.equal(entity.payload.source, 'search')
  assert.equal(entity.payload.priceSource, 'live')
  assert.ok(isBookableEntity(entity))
})

test('maps a hotel search entity into a canonical bookable entity', () => {
  const searchEntity = toHotelSearchEntity(
    {
      inventoryId: 555,
      slug: 'ace-hotel',
      name: 'Ace Hotel',
      neighborhood: 'Downtown',
      stars: 4,
      rating: 8.9,
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
      provider: 'Booking.com',
    },
  )

  const entity = toBookableEntityFromSearchEntity(searchEntity)

  assert.equal(entity.vertical, 'hotel')
  assert.equal(entity.bookingContext.hotelId, '555')
  assert.equal(entity.bookingContext.checkInDate, '2026-04-01')
  assert.equal(entity.bookingContext.checkOutDate, '2026-04-05')
  assert.equal(entity.bookingContext.roomType, 'suite')
  assert.equal(entity.bookingContext.occupancy, 2)
  assert.equal(entity.payload.source, 'search')
  assert.equal(entity.payload.priceSource, 'live')
})

test('maps a car search entity into a canonical bookable entity', () => {
  const searchEntity = toCarSearchEntity(
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

  const entity = toBookableEntityFromSearchEntity(searchEntity)

  assert.equal(entity.vertical, 'car')
  assert.equal(entity.bookingContext.providerLocationId, 'phx-airport')
  assert.equal(entity.bookingContext.pickupDateTime, '2026-04-01T10:00')
  assert.equal(entity.bookingContext.dropoffDateTime, '2026-04-05T10:00')
  assert.equal(entity.bookingContext.vehicleClass, 'SUV')
  assert.equal(entity.payload.source, 'search')
  assert.equal(entity.payload.priceSource, 'live')
})

test('prefers revalidated trip-item pricing when live price is available', () => {
  const inventoryId = buildFlightInventoryId({
    airlineCode: 'DL',
    flightNumber: '123',
    departDate: '2026-04-01',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })
  const item = buildTripItem({
    itemType: 'flight',
    inventoryId,
    title: 'Delta 123',
    subtitle: 'JFK to LAX',
    startDate: '2026-04-01',
    endDate: '2026-04-01',
    snapshotPriceCents: 39900,
    currentPriceCents: 44900,
    currentCurrencyCode: 'usd',
    hotelId: null,
    flightItineraryId: 321,
    metadata: {
      carrier: 'Delta',
    },
    revalidation: {
      itemId: 1,
      inventoryId,
      checkedAt: '2026-03-13T19:00:00.000Z',
      status: 'warning',
      currentPriceCents: 44900,
      currentCurrencyCode: 'usd',
      snapshotPriceCents: 39900,
      snapshotCurrencyCode: 'USD',
      priceDeltaCents: 5000,
      isAvailable: true,
      issues: [],
    },
  })

  const entity = toBookableEntityFromTripItem(item)

  assert.equal(entity.vertical, 'flight')
  assert.equal(entity.price.amountCents, 44900)
  assert.equal(entity.price.currency, 'USD')
  assert.equal(entity.payload.priceSource, 'live')
  assert.deepEqual(entity.bookingContext, {
    carrier: 'DL',
    flightNumber: '123',
    origin: 'JFK',
    destination: 'LAX',
    departDate: '2026-04-01',
  })
})

test('falls back to snapshot pricing when a trip item has no current price', () => {
  const item = buildTripItem({
    currentPriceCents: null,
    currentCurrencyCode: null,
    revalidation: {
      itemId: 1,
      inventoryId: buildHotelInventoryId({
        hotelId: 555,
        checkInDate: '2026-04-01',
        checkOutDate: '2026-04-05',
        roomType: 'king-room',
        occupancy: 2,
      }),
      checkedAt: '2026-03-13T19:00:00.000Z',
      status: 'ok',
      currentPriceCents: null,
      currentCurrencyCode: null,
      snapshotPriceCents: 84900,
      snapshotCurrencyCode: 'USD',
      priceDeltaCents: null,
      isAvailable: true,
      issues: [],
    },
  })

  const entity = toBookableEntityFromTripItem(item)

  assert.equal(entity.vertical, 'hotel')
  assert.equal(entity.price.amountCents, 84900)
  assert.equal(entity.price.currency, 'USD')
  assert.equal(entity.payload.priceSource, 'snapshot')
})

test('rejects trip items whose inventory prefix does not match the vertical', () => {
  const inventoryId = buildFlightInventoryId({
    airlineCode: 'DL',
    flightNumber: '123',
    departDate: '2026-04-01',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })

  assert.throws(
    () =>
      toBookableEntityFromTripItem(
        buildTripItem({
          itemType: 'hotel',
          inventoryId,
        }),
      ),
    BookableEntityValidationError,
  )
})

test('supports canonical saved items via tripCandidate and direct inventory ids', () => {
  const hotelInventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'suite',
    occupancy: 2,
  })
  const carInventoryId = buildCarInventoryId({
    providerLocationId: 'phx-airport',
    pickupDateTime: '2026-04-01T10:00',
    dropoffDateTime: '2026-04-05T10:00',
    vehicleClass: 'suv',
  })

  const candidateEntity = toBookableEntityFromSavedItem({
    id: hotelInventoryId,
    vertical: 'hotels',
    title: 'Ace Hotel',
    subtitle: 'Downtown',
    price: '$849 total',
    href: '/hotels/ace-hotel',
    image: '/img/hotel.jpg',
    tripCandidate: {
      itemType: 'hotel',
      inventoryId: hotelInventoryId,
      providerInventoryId: 555,
      priceCents: 84900,
      currencyCode: 'usd',
      title: 'Ace Hotel',
      subtitle: 'Downtown',
      metadata: {
        provider: 'Ace Hotel',
        hotelSlug: 'ace-hotel',
      },
    },
  })

  const displayOnlyEntity = toBookableEntityFromSavedItem({
    id: carInventoryId,
    vertical: 'cars',
    title: 'Hertz SUV',
    subtitle: 'Phoenix Sky Harbor',
    price: '$67/day',
    href: '/car-rentals/hertz-phx',
  })

  assert.ok(candidateEntity)
  assert.equal(candidateEntity?.vertical, 'hotel')
  assert.equal(candidateEntity?.price.amountCents, 84900)
  assert.equal(candidateEntity?.payload.priceSource, 'snapshot')

  assert.ok(displayOnlyEntity)
  assert.equal(displayOnlyEntity?.vertical, 'car')
  assert.equal(displayOnlyEntity?.price.amountCents, null)
  assert.equal(displayOnlyEntity?.price.displayText, '$67/day')
  assert.equal(displayOnlyEntity?.payload.priceSource, 'display_only')
})

test('returns null for saved items that cannot be adapted safely', () => {
  const entity = toBookableEntityFromSavedItem({
    id: 'ace-hotel',
    vertical: 'hotels',
    title: 'Ace Hotel',
    subtitle: 'Downtown',
    price: '$849 total',
    href: '/hotels/ace-hotel',
  })

  assert.equal(entity, null)
})

test('normalizes currency and rejects malformed canonical entities', () => {
  const price = buildBookableEntityPrice({
    amountCents: 24000,
    currency: 'usd',
    displayText: '$240 total',
  })

  assert.deepEqual(price, {
    amountCents: 24000,
    currency: 'USD',
    displayText: '$240 total',
  })

  assert.equal(
    isBookableEntity({
      inventoryId: 'not-canonical',
      vertical: 'hotel',
      provider: null,
      title: 'Invalid Hotel',
      subtitle: null,
      imageUrl: null,
      href: null,
      snapshotTimestamp: null,
      price,
      bookingContext: {
        hotelId: '555',
        checkInDate: '2026-04-01',
        checkOutDate: '2026-04-05',
        roomType: 'suite',
        occupancy: 2,
      },
      payload: {
        source: 'search',
        priceSource: 'live',
        providerInventoryId: 555,
        hotelSlug: 'ace-hotel',
      },
    }),
    false,
  )
})
