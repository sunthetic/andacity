import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  CarBookableEntity,
  FlightBookableEntity,
  HotelBookableEntity,
} from '~/types/bookable-entity'
import type { TripItem } from '~/types/trips/trip'

const searchEntityModule: typeof import('../search/search-entity.ts') = await import(
  new URL('../search/search-entity.ts', import.meta.url).href
)
const bookableEntityModule: typeof import('./bookable-entity.ts') = await import(
  new URL('./bookable-entity.ts', import.meta.url).href
)
const bookingSessionStoreModule: typeof import('./bookingSessionStore.ts') = await import(
  new URL('./bookingSessionStore.ts', import.meta.url).href
)
const buildBookingSessionModule: typeof import('./buildBookingSession.ts') = await import(
  new URL('./buildBookingSession.ts', import.meta.url).href
)
const createBookingSessionModule: typeof import('./createBookingSession.ts') = await import(
  new URL('./createBookingSession.ts', import.meta.url).href
)
const getBookingSessionModule: typeof import('./getBookingSession.ts') = await import(
  new URL('./getBookingSession.ts', import.meta.url).href
)
const invalidateBookingSessionModule: typeof import('./invalidateBookingSession.ts') = await import(
  new URL('./invalidateBookingSession.ts', import.meta.url).href
)
const validateBookingSessionModule: typeof import('./validateBookingSession.ts') = await import(
  new URL('./validateBookingSession.ts', import.meta.url).href
)

const {
  toCarSearchEntity,
  toFlightSearchEntity,
  toHotelSearchEntity,
} = searchEntityModule

const { toBookableEntityFromSearchEntity } = bookableEntityModule
const { createInMemoryBookingSessionStore } = bookingSessionStoreModule
const { buildBookingSession } = buildBookingSessionModule
const { createBookingSession, createBookingSessionFromTripItem } = createBookingSessionModule
const { getBookingSession } = getBookingSessionModule
const { invalidateBookingSession } = invalidateBookingSessionModule
const { validateBookingSession } = validateBookingSessionModule

const CHECKED_AT = '2026-03-13T18:30:00.000Z'

const buildHotelEntity = (): HotelBookableEntity =>
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
        priceFrom: 199,
        currency: 'USD',
        image: '/img/hotel.jpg',
      },
      {
        checkInDate: '2026-04-01',
        checkOutDate: '2026-04-05',
        occupancy: 2,
        roomType: 'king-suite',
        priceAmountCents: 79600,
        snapshotTimestamp: CHECKED_AT,
        providerName: 'stayz',
        providerOfferId: 'ace-flex-king',
        ratePlanId: 'flex-king',
        ratePlan: 'Flexible King',
        boardType: 'breakfast',
        cancellationPolicy: 'free-cancel',
        providerMetadata: {
          providerName: 'stayz',
          providerHotelId: 'ace-555',
          providerOfferId: 'ace-flex-king',
          ratePlanId: 'flex-king',
          boardType: 'breakfast',
          cancellationPolicy: 'free-cancel',
          checkInDate: '2026-04-01',
          checkOutDate: '2026-04-05',
          occupancy: 2,
        },
        priceSummary: {
          nightlyBaseCents: 19900,
          totalBaseCents: 79600,
          taxesCents: 6200,
          mandatoryFeesCents: 1800,
          totalPriceCents: 87600,
          nights: 4,
        },
      },
    ),
  ) as HotelBookableEntity

const buildFlightEntity = (): FlightBookableEntity =>
  toBookableEntityFromSearchEntity(
    toFlightSearchEntity(
      {
        itineraryId: 321,
        airline: 'SkyJet',
        airlineCode: 'SJ',
        flightNumber: '120',
        serviceDate: '2026-04-01',
        origin: 'Denver',
        destination: 'Seattle',
        originCode: 'DEN',
        destinationCode: 'SEA',
        stops: 0,
        duration: '3h 2m',
        cabinClass: 'economy',
        fareCode: 'basic',
        price: 229,
        currency: 'USD',
      },
      {
        departDate: '2026-04-01',
        priceAmountCents: 22900,
        snapshotTimestamp: CHECKED_AT,
      },
    ),
  ) as FlightBookableEntity

const buildCarEntity = (): CarBookableEntity =>
  toBookableEntityFromSearchEntity(
    toCarSearchEntity(
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
        currency: 'USD',
        image: '/img/car.jpg',
      },
      {
        providerLocationId: 'phx-airport',
        pickupDateTime: '2026-04-01T10:00',
        dropoffDateTime: '2026-04-05T10:00',
        vehicleClass: 'suv',
        priceAmountCents: 26800,
        snapshotTimestamp: CHECKED_AT,
        assumedRentalWindow: false,
      },
    ),
  ) as CarBookableEntity

const buildHotelTripItem = (overrides: Partial<TripItem> = {}): TripItem => {
  const entity = buildHotelEntity()

  return {
    id: 91,
    tripId: 12,
    itemType: 'hotel',
    inventoryId: entity.inventoryId,
    position: 0,
    locked: false,
    title: entity.title,
    subtitle: entity.subtitle,
    startDate: entity.bookingContext.checkInDate,
    endDate: entity.bookingContext.checkOutDate,
    snapshotPriceCents: entity.price.amountCents || 0,
    snapshotCurrencyCode: entity.price.currency || 'USD',
    snapshotTimestamp: entity.snapshotTimestamp || CHECKED_AT,
    currentPriceCents: null,
    currentCurrencyCode: null,
    priceDriftStatus: 'unchanged',
    priceDriftCents: null,
    availabilityConfidence: {} as TripItem['availabilityConfidence'],
    freshness: undefined,
    availabilityStatus: 'valid',
    availabilityCheckedAt: CHECKED_AT,
    availabilityExpiresAt: '2026-03-14T00:30:00.000Z',
    revalidation: {
      itemId: 91,
      inventoryId: entity.inventoryId,
      checkedAt: CHECKED_AT,
      status: 'ok',
      currentPriceCents: null,
      currentCurrencyCode: null,
      snapshotPriceCents: entity.price.amountCents || 0,
      snapshotCurrencyCode: entity.price.currency || 'USD',
      priceDeltaCents: null,
      isAvailable: true,
      issues: [],
    },
    bookableEntity: null,
    imageUrl: entity.imageUrl,
    meta: [],
    issues: [],
    startCityName: null,
    endCityName: null,
    liveCarLocationType: null,
    liveCarLocationName: null,
    hotelId: Number(entity.bookingContext.hotelId),
    flightItineraryId: null,
    carInventoryId: null,
    liveFlightServiceDate: null,
    liveFlightDepartureAt: null,
    liveFlightArrivalAt: null,
    liveFlightItineraryType: null,
    metadata: {
      provider: 'stayz',
    },
    createdAt: CHECKED_AT,
    updatedAt: CHECKED_AT,
    ...overrides,
  }
}

test('creates an active booking session with canonical entity, live price, and provider metadata', async () => {
  const store = createInMemoryBookingSessionStore()
  const entity = buildHotelEntity()

  const session = await createBookingSession(entity.inventoryId, {
    store,
    sessionIdFactory: () => 'session-hotel',
    resolveInventoryRecordFn: async () => ({
      entity,
      checkedAt: CHECKED_AT,
      isAvailable: true,
    }),
    detectPriceDriftFn: async () => ({
      status: 'valid',
      oldPrice: {
        currency: 'USD',
        amount: 796,
      },
      newPrice: {
        currency: 'USD',
        amount: 876,
        nightly: 199,
        nights: 4,
        taxes: 62,
        fees: 18,
      },
    }),
  })

  assert.ok(session)
  assert.equal(session.sessionId, 'session-hotel')
  assert.equal(session.status, 'active')
  assert.equal(session.inventoryId, entity.inventoryId)
  assert.equal(session.entity.inventoryId, entity.inventoryId)
  assert.equal(session.price.amount, 876)
  assert.equal(session.providerMetadata.providerOfferId, 'ace-flex-king')
  assert.equal(session.providerMetadata.ratePlanId, 'flex-king')
  assert.equal(validateBookingSession(session), true)

  const stored = await getBookingSession('session-hotel', { store })
  assert.deepEqual(stored, session)
})

test('returns null when inventory cannot be resolved or is unavailable', async () => {
  const store = createInMemoryBookingSessionStore()
  const entity = buildHotelEntity()

  const missing = await createBookingSession(entity.inventoryId, {
    store,
    resolveInventoryRecordFn: async () => null,
    detectPriceDriftFn: async () => ({
      status: 'valid',
      oldPrice: null,
      newPrice: {
        currency: 'USD',
        amount: 876,
      },
    }),
  })

  assert.equal(missing, null)

  const unavailable = await createBookingSession(entity.inventoryId, {
    store,
    resolveInventoryRecordFn: async () => ({
      entity,
      checkedAt: CHECKED_AT,
      isAvailable: false,
    }),
    detectPriceDriftFn: async () => ({
      status: 'valid',
      oldPrice: null,
      newPrice: {
        currency: 'USD',
        amount: 876,
      },
    }),
  })

  assert.equal(unavailable, null)
})

test('fails closed when live pricing reports drift or throws', async () => {
  const store = createInMemoryBookingSessionStore()
  const entity = buildHotelEntity()

  const drifted = await createBookingSession(entity.inventoryId, {
    store,
    resolveInventoryRecordFn: async () => ({
      entity,
      checkedAt: CHECKED_AT,
      isAvailable: true,
    }),
    detectPriceDriftFn: async () => ({
      status: 'price_changed',
      oldPrice: {
        currency: 'USD',
        amount: 796,
      },
      newPrice: {
        currency: 'USD',
        amount: 899,
      },
    }),
  })

  assert.equal(drifted, null)

  const failed = await createBookingSession(entity.inventoryId, {
    store,
    resolveInventoryRecordFn: async () => ({
      entity,
      checkedAt: CHECKED_AT,
      isAvailable: true,
    }),
    detectPriceDriftFn: async () => {
      throw new Error('provider timeout')
    },
  })

  assert.equal(failed, null)
})

test('expires sessions on retrieval once the lifecycle window has elapsed', async () => {
  const store = createInMemoryBookingSessionStore()
  const entity = buildHotelEntity()

  const session = await createBookingSession(entity.inventoryId, {
    store,
    sessionIdFactory: () => 'session-expiring',
    ttlMs: 60_000,
    resolveInventoryRecordFn: async () => ({
      entity,
      checkedAt: CHECKED_AT,
      isAvailable: true,
    }),
    detectPriceDriftFn: async () => ({
      status: 'valid',
      oldPrice: {
        currency: 'USD',
        amount: 796,
      },
      newPrice: {
        currency: 'USD',
        amount: 876,
      },
    }),
  })

  assert.ok(session)

  const activeRead = await getBookingSession('session-expiring', {
    store,
    now: '2026-03-13T18:30:30.000Z',
  })
  assert.equal(activeRead?.status, 'active')

  const expiredRead = await getBookingSession('session-expiring', {
    store,
    now: '2026-03-13T18:31:30.000Z',
  })
  assert.equal(expiredRead, null)

  const expiredSession = await getBookingSession('session-expiring', {
    store,
    includeInactive: true,
    now: '2026-03-13T18:31:30.000Z',
  })
  assert.equal(expiredSession?.status, 'expired')
})

test('supports explicit invalidation and hides invalid sessions from active reads', async () => {
  const store = createInMemoryBookingSessionStore()
  const entity = buildHotelEntity()

  const session = await createBookingSession(entity.inventoryId, {
    store,
    sessionIdFactory: () => 'session-invalid',
    resolveInventoryRecordFn: async () => ({
      entity,
      checkedAt: CHECKED_AT,
      isAvailable: true,
    }),
    detectPriceDriftFn: async () => ({
      status: 'valid',
      oldPrice: {
        currency: 'USD',
        amount: 796,
      },
      newPrice: {
        currency: 'USD',
        amount: 876,
      },
    }),
  })

  assert.ok(session)

  const invalidated = await invalidateBookingSession('session-invalid', { store })
  assert.equal(invalidated?.status, 'invalid')

  const activeRead = await getBookingSession('session-invalid', { store })
  assert.equal(activeRead, null)

  const inactiveRead = await getBookingSession('session-invalid', {
    store,
    includeInactive: true,
  })
  assert.equal(inactiveRead?.status, 'invalid')
})

test('creates booking sessions for flight, hotel, and car inventory', async () => {
  const store = createInMemoryBookingSessionStore()
  const entities = [buildFlightEntity(), buildHotelEntity(), buildCarEntity()]

  for (const [index, entity] of entities.entries()) {
    const session = await createBookingSession(entity.inventoryId, {
      store,
      sessionIdFactory: () => `session-${entity.vertical}-${index}`,
      resolveInventoryRecordFn: async () => ({
        entity,
        checkedAt: CHECKED_AT,
        isAvailable: true,
      }),
      detectPriceDriftFn: async () => ({
        status: 'valid',
        oldPrice:
          entity.price.amountCents != null && entity.price.currency
            ? {
                currency: entity.price.currency,
                amount: entity.price.amountCents / 100,
              }
            : null,
        newPrice: {
          currency: entity.price.currency || 'USD',
          amount: (entity.price.amountCents || 0) / 100,
        },
      }),
    })

    assert.ok(session)
    assert.equal(session.vertical, entity.vertical)
    assert.equal(session.status, 'active')
  }
})

test('creates a booking session from a trip item reference and preserves trip source details', async () => {
  const store = createInMemoryBookingSessionStore()
  const entity = buildHotelEntity()
  const tripItem = buildHotelTripItem()
  let snapshotAmount: number | null = null

  const session = await createBookingSessionFromTripItem(tripItem, {
    store,
    sessionIdFactory: () => 'session-trip-item',
    resolveInventoryRecordFn: async (input) => {
      assert.equal(input.providerInventoryId, tripItem.hotelId)

      return {
        entity,
        checkedAt: CHECKED_AT,
        isAvailable: true,
      }
    },
    detectPriceDriftFn: async (_inventoryId, oldPrice) => {
      snapshotAmount = oldPrice.amount

      return {
        status: 'valid',
        oldPrice,
        newPrice: {
          currency: 'USD',
          amount: 876,
        },
      }
    },
  })

  assert.equal(snapshotAmount, 796)
  assert.ok(session)
  assert.equal(session.source, 'trip_item')
  assert.equal(session.tripItemId, tripItem.id)
})

test('returns null when provider handoff metadata cannot be built', async () => {
  const store = createInMemoryBookingSessionStore()
  const carEntity = buildCarEntity()
  const malformed = buildBookingSession({
    entity: {
      ...carEntity,
      bookingContext: {
        providerLocationId: null,
        pickupDateTime: null,
        dropoffDateTime: null,
        vehicleClass: null,
      },
    },
    price: {
      currency: 'USD',
      amount: 268,
    },
    createdAt: CHECKED_AT,
  })

  assert.equal(malformed, null)

  const badSession = await createBookingSession(carEntity.inventoryId, {
    store,
    resolveInventoryRecordFn: async () => ({
      entity: {
        ...carEntity,
        bookingContext: {
          providerLocationId: null,
          pickupDateTime: null,
          dropoffDateTime: null,
          vehicleClass: null,
        },
      },
      checkedAt: CHECKED_AT,
      isAvailable: true,
    }),
    detectPriceDriftFn: async () => ({
      status: 'valid',
      oldPrice: {
        currency: 'USD',
        amount: 268,
      },
      newPrice: {
        currency: 'USD',
        amount: 268,
      },
    }),
  })

  assert.equal(badSession, null)
})
