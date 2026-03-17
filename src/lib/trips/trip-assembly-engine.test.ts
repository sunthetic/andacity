import assert from 'node:assert/strict'
import test from 'node:test'

import type { BookableEntity } from '~/types/bookable-entity'
import type { BookingSession } from '~/types/booking'
import type { TripDetails, TripItem, TripItemCandidate } from '~/types/trips/trip'

const inventoryIdModule: typeof import('../inventory/inventory-id.ts') = await import(
  new URL('../inventory/inventory-id.ts', import.meta.url).href
)
const engineModule: typeof import('./trip-assembly-engine.ts') = await import(
  new URL('./trip-assembly-engine.ts', import.meta.url).href
)

const { buildHotelInventoryId, buildCarInventoryId } = inventoryIdModule
const {
  TRIP_ITEM_BOOKABLE_PRICE_SOURCE_KEY,
  TRIP_ITEM_BOOKABLE_SOURCE_KEY,
  TRIP_ITEM_BOOKING_SESSION_BINDING_KEY,
  TRIP_ITEM_BOOKING_SESSION_ID_KEY,
  TRIP_ITEM_BOOKING_SESSION_SOURCE_KEY,
  addBookableEntityToTrip,
  buildTripItemCandidateFromBookableEntity,
  removeItemFromTripAssembly,
} = engineModule

const NOW = '2026-03-16T18:30:00.000Z'

const buildTripItem = (overrides: Partial<TripItem> = {}): TripItem => ({
  id: 1,
  tripId: 7,
  itemType: 'hotel',
  inventoryId: buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'king-room',
    occupancy: 2,
  }),
  bookingSessionId: null,
  position: 0,
  locked: false,
  title: 'Ace Hotel',
  subtitle: 'Downtown',
  startDate: '2026-04-01',
  endDate: '2026-04-05',
  snapshotPriceCents: 84900,
  snapshotCurrencyCode: 'USD',
  snapshotTimestamp: NOW,
  currentPriceCents: null,
  currentCurrencyCode: null,
  priceDriftStatus: 'unchanged',
  priceDriftCents: null,
  availabilityConfidence: {} as TripItem['availabilityConfidence'],
  freshness: undefined,
  availabilityStatus: 'valid',
  availabilityCheckedAt: NOW,
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
    checkedAt: NOW,
    status: 'valid',
    message: 'Ace Hotel still matches the saved inventory snapshot.',
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
  inventorySnapshot: null,
  metadata: {},
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
})

const buildTripDetails = (overrides: Partial<TripDetails> = {}): TripDetails => ({
  id: 7,
  name: 'Spring trip',
  status: 'draft',
  itemCount: 0,
  startDate: null,
  endDate: null,
  estimatedTotalCents: 0,
  currencyCode: 'USD',
  hasMixedCurrencies: false,
  updatedAt: NOW,
  bookingSessionId: null,
  notes: null,
  metadata: {},
  editing: {
    autoRebalance: false,
    lockedItemCount: 0,
  },
  citiesInvolved: [],
  pricing: {
    currencyCode: 'USD',
    snapshotTotalCents: 0,
    currentTotalCents: 0,
    priceDeltaCents: 0,
    hasMixedCurrencies: false,
    hasPartialPricing: false,
    driftCounts: {
      increased: 0,
      decreased: 0,
      unchanged: 0,
      unavailable: 0,
    },
    verticals: [],
  },
  revalidation: {
    status: 'all_valid',
    checkedAt: NOW,
    expiresAt: null,
    itemStatusCounts: {
      valid: 0,
      price_changed: 0,
      unavailable: 0,
      error: 0,
    },
    summary: 'All trip items still match the latest live inventory checks.',
  },
  intelligence: {
    status: 'valid_itinerary',
    checkedAt: null,
    expiresAt: null,
    itemStatusCounts: {
      valid: 0,
      unavailable: 0,
      stale: 0,
      price_only_changed: 0,
    },
    issueCounts: {
      warning: 0,
      blocking: 0,
    },
    issues: [],
  },
  bundling: {
    generatedAt: NOW,
    gaps: [],
    suggestions: [],
  },
  items: [],
  ...overrides,
})

const buildHotelEntity = (overrides: Partial<BookableEntity> = {}): BookableEntity =>
  ({
    inventoryId: buildHotelInventoryId({
      hotelId: 555,
      checkInDate: '2026-04-01',
      checkOutDate: '2026-04-05',
      roomType: 'king-room',
      occupancy: 2,
    }),
    vertical: 'hotel',
    provider: 'booking.com',
    title: 'Ace Hotel',
    subtitle: 'Downtown',
    imageUrl: '/img/hotel.jpg',
    href: '/hotels/ace-hotel',
    snapshotTimestamp: NOW,
    price: {
      amountCents: 84900,
      currency: 'USD',
    },
    bookingContext: {
      hotelId: '555',
      checkInDate: '2026-04-01',
      checkOutDate: '2026-04-05',
      roomType: 'king-room',
      occupancy: 2,
    },
    payload: {
      source: 'search',
      priceSource: 'live',
      providerInventoryId: 555,
      hotelSlug: 'ace-hotel',
      ratePlanId: 'flex-king',
      ratePlan: 'Flexible',
      boardType: 'breakfast',
      cancellationPolicy: 'free-cancel',
    },
    ...overrides,
  }) as BookableEntity

const buildCarEntity = (overrides: Partial<BookableEntity> = {}): BookableEntity =>
  ({
    inventoryId: buildCarInventoryId({
      providerLocationId: 'phx-airport',
      pickupDateTime: '2026-04-01T10:00',
      dropoffDateTime: '2026-04-05T10:00',
      vehicleClass: 'suv',
    }),
    vertical: 'car',
    provider: 'hertz',
    title: 'Hertz SUV',
    subtitle: 'Phoenix Sky Harbor',
    imageUrl: '/img/car.jpg',
    href: '/car-rentals/hertz-phx',
    snapshotTimestamp: NOW,
    price: {
      amountCents: null,
      currency: null,
      displayText: '$67/day',
    },
    bookingContext: {
      providerLocationId: 'phx-airport',
      pickupDateTime: '2026-04-01T10:00',
      dropoffDateTime: '2026-04-05T10:00',
      vehicleClass: 'suv',
    },
    payload: {
      source: 'saved_item',
      priceSource: 'display_only',
      providerInventoryId: null,
      transmissionType: 'automatic',
      assumedRentalWindow: true,
    },
    ...overrides,
  }) as BookableEntity

const buildBookingSession = (
  entity: BookableEntity,
  overrides: Partial<BookingSession> = {},
): BookingSession => ({
  sessionId: 'bks_123',
  inventoryId: entity.inventoryId,
  vertical: entity.vertical,
  provider: entity.provider || entity.vertical,
  status: 'active',
  source: 'inventory',
  tripItemId: null,
  entity,
  price: {
    currency: 'USD',
    amount: 849,
  },
  providerMetadata: {
    inventoryId: entity.inventoryId,
    vertical: entity.vertical,
    provider: entity.provider || entity.vertical,
    providerName: entity.provider || entity.vertical,
  },
  createdAt: NOW,
  expiresAt: '2026-03-16T18:45:00.000Z',
  ...overrides,
})

test('builds a trip item candidate from a canonical entity with session-scoped metadata', () => {
  const entity = buildHotelEntity()

  const candidate = buildTripItemCandidateFromBookableEntity(entity, {
    priceQuote: {
      currency: 'USD',
      amount: 901,
    },
    bookingSessionId: 'bks_hotel',
    bookingSessionBinding: 'created',
    bookingSessionSource: 'inventory',
  })

  assert.equal(candidate.itemType, 'hotel')
  assert.equal(candidate.inventoryId, entity.inventoryId)
  assert.equal(candidate.providerInventoryId, 555)
  assert.equal(candidate.startDate, '2026-04-01')
  assert.equal(candidate.endDate, '2026-04-05')
  assert.equal(candidate.priceCents, 90100)
  assert.equal(candidate.currencyCode, 'USD')
  assert.deepEqual(candidate.meta, ['king-room', 'Flexible', 'breakfast'])
  assert.equal(candidate.metadata?.[TRIP_ITEM_BOOKING_SESSION_ID_KEY], 'bks_hotel')
  assert.equal(candidate.metadata?.[TRIP_ITEM_BOOKING_SESSION_BINDING_KEY], 'created')
  assert.equal(candidate.metadata?.[TRIP_ITEM_BOOKING_SESSION_SOURCE_KEY], 'inventory')
  assert.equal(candidate.metadata?.[TRIP_ITEM_BOOKABLE_SOURCE_KEY], 'search')
  assert.equal(candidate.metadata?.[TRIP_ITEM_BOOKABLE_PRICE_SOURCE_KEY], 'live')
  assert.equal(candidate.metadata?.providerInventoryId, 555)
  assert.equal(candidate.metadata?.provider, 'booking.com')
  assert.equal(candidate.metadata?.href, '/hotels/ace-hotel')
})

test('adds a canonical entity to a trip by attaching a matching active booking session', async () => {
  const currentTrip = buildTripDetails({
    bookingSessionId: 'bks_active',
  })
  const entity = buildHotelEntity()
  const session = buildBookingSession(entity, {
    sessionId: 'bks_active',
    price: {
      currency: 'USD',
      amount: 875,
    },
  })

  let capturedCandidate: TripItemCandidate | null = null
  let capturedTripBookingSessionId: string | null = null

  const updatedTrip = buildTripDetails({
    bookingSessionId: 'bks_active',
    itemCount: 1,
  })

  const trip = await addBookableEntityToTrip(
    {
      tripId: 7,
      entity,
      bookingSessionId: 'bks_active',
    },
    {
      deps: {
        getTripDetailsFn: async () => currentTrip,
        getBookingSessionFn: async () => session,
        addItemToTripFn: async (_tripId, candidate) => {
          capturedCandidate = candidate
          return updatedTrip
        },
        setTripBookingSessionFn: async (_tripId, bookingSessionId) => {
          capturedTripBookingSessionId = bookingSessionId
          return updatedTrip
        },
      },
    },
  )

  assert.equal(trip, updatedTrip)
  assert.ok(capturedCandidate)
  const addedCandidate = capturedCandidate as TripItemCandidate
  assert.equal(addedCandidate.priceCents, 87500)
  assert.equal(addedCandidate.metadata?.[TRIP_ITEM_BOOKING_SESSION_ID_KEY], 'bks_active')
  assert.equal(addedCandidate.metadata?.[TRIP_ITEM_BOOKING_SESSION_BINDING_KEY], 'attached')
  assert.equal(addedCandidate.metadata?.[TRIP_ITEM_BOOKING_SESSION_SOURCE_KEY], 'inventory')
  assert.equal(capturedTripBookingSessionId, 'bks_active')
})

test('falls back to live inventory resolution when a canonical entity has no persisted snapshot price', async () => {
  const currentTrip = buildTripDetails()
  const requestedEntity = buildCarEntity()
  const resolvedEntity = {
    ...buildCarEntity(),
    price: {
      amountCents: 6700,
      currency: 'USD',
    },
    payload: {
      source: 'search',
      priceSource: 'live',
      providerInventoryId: 777,
      transmissionType: 'automatic',
      assumedRentalWindow: false,
    },
  } as BookableEntity
  const session = buildBookingSession(resolvedEntity, {
    sessionId: 'bks_car',
    price: {
      currency: 'USD',
      amount: 67,
      daily: 67,
      days: 4,
    },
  })

  let persistedSession: BookingSession | null = null
  let capturedCandidate: TripItemCandidate | null = null

  const updatedTrip = buildTripDetails({
    bookingSessionId: 'bks_car',
    itemCount: 1,
  })

  const trip = await addBookableEntityToTrip(
    {
      tripId: 7,
      entity: requestedEntity,
    },
    {
      deps: {
        getTripDetailsFn: async () => currentTrip,
        createBookingSessionFn: async () => null,
        resolveInventoryRecordFn: async () => ({
          entity: resolvedEntity,
          checkedAt: NOW,
          isAvailable: true,
        }),
        buildBookingSessionFn: () => session,
        persistBookingSessionFn: async (value) => {
          persistedSession = value
          return value
        },
        addItemToTripFn: async (_tripId, candidate) => {
          capturedCandidate = candidate
          return updatedTrip
        },
        setTripBookingSessionFn: async () => updatedTrip,
      },
    },
  )

  assert.equal(trip, updatedTrip)
  assert.ok(persistedSession)
  assert.ok(capturedCandidate)
  const storedSession = persistedSession as BookingSession
  const createdCandidate = capturedCandidate as TripItemCandidate
  assert.equal(storedSession.sessionId, 'bks_car')
  assert.equal(createdCandidate.providerInventoryId, 777)
  assert.equal(createdCandidate.priceCents, 6700)
  assert.equal(createdCandidate.currencyCode, 'USD')
  assert.equal(createdCandidate.metadata?.[TRIP_ITEM_BOOKING_SESSION_BINDING_KEY], 'created')
  assert.equal(createdCandidate.metadata?.providerInventoryId, 777)
})

test('clears a trip booking session when removing the last item scoped to it', async () => {
  const currentTrip = buildTripDetails({
    bookingSessionId: 'bks_trip',
    itemCount: 1,
    items: [
      buildTripItem({
        metadata: {
          [TRIP_ITEM_BOOKING_SESSION_ID_KEY]: 'bks_trip',
        },
      }),
    ],
  })
  const nextTrip = buildTripDetails({
    bookingSessionId: 'bks_trip',
    itemCount: 0,
    items: [],
  })
  const clearedTrip = buildTripDetails({
    bookingSessionId: null,
    itemCount: 0,
    items: [],
  })

  let clearedBookingSessionId: string | null | undefined

  const trip = await removeItemFromTripAssembly(
    {
      tripId: 7,
      itemId: 1,
    },
    {
      deps: {
        getTripDetailsFn: async () => currentTrip,
        removeItemFromTripFn: async () => nextTrip,
        setTripBookingSessionFn: async (_tripId, bookingSessionId) => {
          clearedBookingSessionId = bookingSessionId
          return clearedTrip
        },
      },
    },
  )

  assert.equal(trip, clearedTrip)
  assert.equal(clearedBookingSessionId, null)
})
