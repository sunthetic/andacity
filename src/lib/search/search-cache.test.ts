import assert from 'node:assert/strict'
import test from 'node:test'

const searchCacheModule: typeof import('./search-cache.ts') = await import(
  new URL('./search-cache.ts', import.meta.url).href
)
const searchEntityModule: typeof import('./search-entity.ts') = await import(
  new URL('./search-entity.ts', import.meta.url).href
)

const {
  clearSearchCache,
  getCachedResults,
  getSearchCacheKey,
  getSearchCacheTtlMs,
  invalidateSearchCache,
  setCachedResults,
} = searchCacheModule

const {
  toCarSearchEntity,
  toFlightSearchEntity,
  toHotelSearchEntity,
} = searchEntityModule

test.beforeEach(() => {
  clearSearchCache()
})

const buildFlightEntity = () =>
  toFlightSearchEntity(
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

const buildHotelEntity = () =>
  toHotelSearchEntity(
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

const buildCarEntity = () =>
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

test('builds deterministic flight cache keys from normalized inputs', () => {
  const first = getSearchCacheKey('flight', {
    origin: ' JFK ',
    destination: 'LAX',
    departDate: '2026-04-01',
    passengers: '1',
    cabinClass: ' Economy ',
    sort: 'Recommended',
    page: 1,
    pageSize: 6,
    departureWindows: ['Evening', 'Morning'],
    priceBand: '200-400',
    drawerOpen: true,
  })

  const second = getSearchCacheKey('flight', {
    originCode: 'jfk',
    destinationCode: ' lax ',
    departDate: '2026-04-01',
    passengers: 1,
    cabinClass: 'economy',
    sort: 'recommended',
    page: '1',
    pageSize: '6',
    filters: {
      departureWindows: ['morning', 'evening'],
      priceBand: '200-400',
    },
    expandedCardId: 'flight-1',
  })

  assert.equal(
    first,
    'flights:jfk:lax:2026-04-01:return=any:pax=1:trip=any:cabin=economy:sort=recommended:page=1:size=6:stops=any:depart=evening,morning:arrive=any:price=200-400',
  )
  assert.equal(first, second)
})

test('includes the flight return date in round-trip cache keys', () => {
  const key = getSearchCacheKey('flight', {
    origin: 'JFK',
    destination: 'LAX',
    departDate: '2026-04-01',
    returnDate: '2026-04-05',
    itineraryType: 'round-trip',
  })

  assert.equal(
    key,
    'flights:jfk:lax:2026-04-01:return=2026-04-05:pax=1:trip=round-trip:cabin=any:sort=recommended:page=1:size=6:stops=any:depart=any:arrive=any:price=any',
  )
})

test('ignores irrelevant hotel UI state and normalizes list filters', () => {
  const first = getSearchCacheKey('hotel', {
    query: ' New York City ',
    checkIn: '2026-04-01',
    checkOut: '2026-04-05',
    occupancy: '2',
    amenities: ['Pool', 'wifi', ' wifi '],
    starRating: ['5', '4'],
    guestRating: ['9', '8'],
    filtersOpen: true,
  })

  const second = getSearchCacheKey('hotel', {
    city: 'new-york-city',
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    adults: 2,
    filters: {
      amenities: ['wifi', 'pool'],
      starRating: ['4', '5'],
      guestRating: ['8', '9'],
    },
    compareDrawer: 'open',
  })

  assert.equal(
    first,
    'hotels:new-york-city:2026-04-01:2026-04-05:occ=2:rooms=1:sort=recommended:page=1:size=24:price=any:stars=4,5:rating=8,9:amenities=pool,wifi',
  )
  assert.equal(first, second)
})

test('builds compact airport-based cache keys for canonical car routes', () => {
  const key = getSearchCacheKey('car', {
    pickupLocation: 'LAX',
    pickupDate: '2026-05-10',
    dropoffDate: '2026-05-15',
    pickupType: 'airport',
  })

  assert.equal(key, 'car:LAX:2026-05-10:2026-05-15')
})

test('stores and returns canonical search entities', () => {
  const entity = buildHotelEntity()
  const params = {
    citySlug: 'nyc',
    checkIn: '2026-04-01',
    checkOut: '2026-04-05',
    occupancy: 2,
  }
  const key = getSearchCacheKey('hotel', params)

  setCachedResults('hotel', key, params, [entity])

  const cached = getCachedResults<Array<typeof entity>>(key)
  assert.deepEqual(cached, [entity])
})

test('treats expired entries as cache misses', () => {
  const entity = buildFlightEntity()
  const params = {
    origin: 'jfk',
    destination: 'lax',
    departDate: '2026-04-01',
  }
  const key = getSearchCacheKey('flight', params)

  setCachedResults('flight', key, params, [entity], {
    ttlMs: 0,
  })

  assert.equal(getCachedResults(key), null)
})

test('invalidates one key and clears the entire cache', () => {
  const hotelEntity = buildHotelEntity()
  const carEntity = buildCarEntity()
  const hotelParams = {
    citySlug: 'nyc',
    checkIn: '2026-04-01',
    checkOut: '2026-04-05',
  }
  const carParams = {
    citySlug: 'phoenix',
    pickupDate: '2026-04-01',
    dropoffDate: '2026-04-05',
  }

  const hotelKey = getSearchCacheKey('hotel', hotelParams)
  const carKey = getSearchCacheKey('car', carParams)

  setCachedResults('hotel', hotelKey, hotelParams, [hotelEntity])
  setCachedResults('car', carKey, carParams, [carEntity])

  invalidateSearchCache(hotelKey)
  assert.equal(getCachedResults(hotelKey), null)
  assert.deepEqual(getCachedResults(carKey), [carEntity])

  clearSearchCache()
  assert.equal(getCachedResults(carKey), null)
})

test('uses the configured TTLs per vertical', () => {
  assert.equal(getSearchCacheTtlMs('flight'), 5 * 60 * 1000)
  assert.equal(getSearchCacheTtlMs('hotel'), 10 * 60 * 1000)
  assert.equal(getSearchCacheTtlMs('car'), 10 * 60 * 1000)
})

test('returns the full normalized payload when callers store one alongside canonical entities', () => {
  const entity = buildCarEntity()
  const params = {
    citySlug: 'phoenix',
    pickupDate: '2026-04-01',
    dropoffDate: '2026-04-05',
    vehicleClasses: ['suv'],
  }
  const key = getSearchCacheKey('car', params)

  const pagePayload = {
    totalCount: 1,
    page: 1,
    pageSize: 1,
    totalPages: 1,
    activeSort: 'recommended',
    selectedFilters: {
      vehicleClasses: ['suv'],
      pickupType: '',
      transmission: '',
      seatsMin: null,
      priceBand: '',
    },
    facets: {
      vehicleClasses: [],
      pickupTypes: [],
      transmissions: [],
      seats: [],
    },
    results: [
      {
        id: 'car-1',
        slug: 'hertz-phx',
        searchEntity: entity,
      },
    ],
  }

  setCachedResults('car', key, params, pagePayload.results, {
    value: pagePayload,
  })

  const cached = getCachedResults<typeof pagePayload>(key)
  assert.deepEqual(cached, pagePayload)
})
