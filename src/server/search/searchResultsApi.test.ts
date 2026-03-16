import assert from 'node:assert/strict'
import test from 'node:test'

import type { ProviderAdapter } from '~/lib/providers/providerAdapter'
import type { CanonicalLocation } from '~/types/location'

const cacheModule: typeof import('~/lib/search/search-cache.ts') = await import(
  new URL('../../lib/search/search-cache.ts', import.meta.url).href
)
const helperModule: typeof import('./searchResultsApi.ts') = await import(
  new URL('./searchResultsApi.ts', import.meta.url).href
)
const searchEntityModule: typeof import('~/lib/search/search-entity.ts') = await import(
  new URL('../../lib/search/search-entity.ts', import.meta.url).href
)
const searchServiceModule: typeof import('./searchService.ts') = await import(
  new URL('./searchService.ts', import.meta.url).href
)

const { clearSearchCache } = cacheModule
const { loadIncrementalSearchResultsApiResponse, loadSearchResultsApiResponse } = helperModule
const { toCarSearchEntity, toFlightSearchEntity, toHotelSearchEntity } = searchEntityModule
const {
  clearIncrementalSearchSessions,
  executeSearchRequest,
  getIncrementalSearchSnapshot,
} = searchServiceModule

test.beforeEach(() => {
  clearSearchCache()
  clearIncrementalSearchSessions()
})

const buildAirportLocation = (
  airportCode = 'LAX',
  citySlug = 'los-angeles-ca-us',
  cityName = 'Los Angeles',
): CanonicalLocation => ({
  locationId: `airport:${airportCode}`,
  searchSlug: airportCode.toLowerCase(),
  kind: 'airport',
  cityId: 1,
  airportId: 1,
  regionId: 1,
  citySlug,
  cityName,
  airportName: `${cityName} International Airport`,
  airportCode,
  primaryAirportCode: airportCode,
  stateOrProvinceName: citySlug.includes('fl') ? 'Florida' : 'California',
  stateOrProvinceCode: citySlug.includes('fl') ? 'FL' : 'CA',
  countryName: 'United States',
  countryCode: 'US',
  displayName: `${cityName} International Airport (${airportCode})`,
})

const buildCityLocation = (
  citySlug = 'las-vegas-nv-us',
  cityName = 'Las Vegas',
  primaryAirportCode = 'LAS',
): CanonicalLocation => ({
  locationId: `city:${citySlug}`,
  searchSlug: citySlug,
  kind: 'city',
  cityId: 1,
  airportId: null,
  regionId: 1,
  citySlug,
  cityName,
  airportName: null,
  airportCode: null,
  primaryAirportCode,
  stateOrProvinceName: 'Nevada',
  stateOrProvinceCode: 'NV',
  countryName: 'United States',
  countryCode: 'US',
  displayName: `${cityName}, Nevada, United States`,
})

const buildFlightEntity = () =>
  toFlightSearchEntity(
    {
      itineraryId: 732,
      airline: 'Delta',
      airlineCode: 'DL',
      flightNumber: '432',
      serviceDate: '2026-05-10',
      origin: 'Orlando (ORL)',
      destination: 'Los Angeles (LAX)',
      originCode: 'ORL',
      destinationCode: 'LAX',
      stops: 0,
      duration: '5h 37m',
      cabinClass: 'economy',
      fareCode: 'Y',
      price: 318,
      currency: 'usd',
    },
    {
      departDate: '2026-05-10',
      priceAmountCents: 31800,
      snapshotTimestamp: '2026-03-14T12:00:00.000Z',
    },
  )

const buildHotelEntity = () =>
  toHotelSearchEntity(
    {
      inventoryId: 555,
      slug: 'ace-hotel-las-vegas',
      name: 'Ace Hotel Las Vegas',
      neighborhood: 'The Strip',
      stars: 4,
      rating: 8.9,
      reviewCount: 512,
      priceFrom: 189,
      currency: 'usd',
      image: '/img/hotel.jpg',
    },
    {
      checkInDate: '2026-05-10',
      checkOutDate: '2026-05-15',
      occupancy: 2,
      roomType: 'king-suite',
      priceAmountCents: 18900,
      snapshotTimestamp: '2026-03-14T12:00:00.000Z',
      provider: 'hotel-test-provider',
      providerName: 'hotel-test-provider',
      providerOfferId: 'ace-flex-king',
      ratePlanId: 'flex-king',
    },
  )

const buildCarEntity = () =>
  toCarSearchEntity(
    {
      inventoryId: 777,
      locationId: 'lax-airport',
      slug: 'hertz-lax-standard',
      name: 'Hertz',
      pickupArea: 'LAX Terminal B',
      vehicleName: 'Toyota RAV4',
      category: 'SUV',
      transmission: 'Automatic',
      seats: 5,
      priceFrom: 72,
      currency: 'usd',
      image: '/img/car.jpg',
    },
    {
      providerLocationId: 'lax-airport',
      pickupDateTime: '2026-05-10T10:00',
      dropoffDateTime: '2026-05-15T10:00',
      vehicleClass: 'suv',
      priceAmountCents: 7200,
      snapshotTimestamp: '2026-03-14T12:00:00.000Z',
      href: '/car-rentals/hertz-lax-standard?pickupDate=2026-05-10&dropoffDate=2026-05-15',
    },
  )

const withSearchService = (
  provider: ProviderAdapter,
  resolveLocationBySearchSlug: (searchSlug: string) => Promise<CanonicalLocation | null>,
) => ({
  executeSearchRequest: (request: Parameters<typeof executeSearchRequest>[0]) =>
    executeSearchRequest(request, {
      getProvider: () => provider,
      resolveLocationBySearchSlug,
    }),
})

const withSearchProviders = (
  providers: ProviderAdapter[],
  resolveLocationBySearchSlug: (searchSlug: string) => Promise<CanonicalLocation | null>,
) => ({
  executeSearchRequest: (request: Parameters<typeof executeSearchRequest>[0]) =>
    executeSearchRequest(request, {
      getProviders: () => providers,
      resolveLocationBySearchSlug,
    }),
  getIncrementalSearchSnapshot: (
    request: Parameters<typeof getIncrementalSearchSnapshot>[0],
    cursor: number,
  ) =>
    getIncrementalSearchSnapshot(request, cursor, {
      getProviders: () => providers,
      resolveLocationBySearchSlug,
    }),
})

test('returns normalized flight one-way search results', async () => {
  const provider: ProviderAdapter = {
    provider: 'flight-test-provider',
    vertical: 'flight',
    async search(params) {
      assert.equal(params.vertical, 'flight')
      assert.equal(params.origin, 'ORL')
      assert.equal(params.destination, 'LAX')
      assert.equal(params.departDate, '2026-05-10')
      assert.equal(params.returnDate, undefined)
      return [buildFlightEntity()]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  let now = 1000
  const response = await loadSearchResultsApiResponse(
    '/api/search?type=flight&origin=ORL&destination=LAX&departDate=2026-05-10',
    {
      ...withSearchService(provider, async (searchSlug) => {
        const token = searchSlug.toUpperCase()
        if (token === 'ORL') return buildAirportLocation('ORL', 'orlando-fl-us', 'Orlando')
        if (token === 'LAX') return buildAirportLocation('LAX', 'los-angeles-ca-us', 'Los Angeles')
        return null
      }),
      now: () => {
        now += 9
        return now
      },
    },
  )

  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  if (!response.body.ok) {
    assert.fail('expected a successful flight api response')
  }

  assert.deepEqual(response.body.data.request, {
    type: 'flight',
    origin: 'ORL',
    destination: 'LAX',
    departDate: '2026-05-10',
  })
  assert.equal(response.body.data.results.length, 1)
  assert.equal(response.body.data.results[0]?.vertical, 'flight')
  assert.deepEqual(response.body.data.metadata, {
    vertical: 'flight',
    totalResults: 1,
    providersQueried: ['flight-test-provider'],
    cacheHit: false,
    searchTimeMs: 9,
  })
})

test('returns normalized flight round-trip search results', async () => {
  const provider: ProviderAdapter = {
    provider: 'flight-test-provider',
    vertical: 'flight',
    async search(params) {
      assert.equal(params.vertical, 'flight')
      assert.equal(params.returnDate, '2026-05-15')
      return [buildFlightEntity()]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const response = await loadSearchResultsApiResponse(
    '/api/search?type=flight&origin=ORL&destination=LAX&departDate=2026-05-10&returnDate=2026-05-15',
    withSearchService(provider, async (searchSlug) => {
      const token = searchSlug.toUpperCase()
      if (token === 'ORL') return buildAirportLocation('ORL', 'orlando-fl-us', 'Orlando')
      if (token === 'LAX') return buildAirportLocation('LAX', 'los-angeles-ca-us', 'Los Angeles')
      return null
    }),
  )

  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  if (!response.body.ok) {
    assert.fail('expected a successful round-trip flight api response')
  }

  assert.deepEqual(response.body.data.request, {
    type: 'flight',
    origin: 'ORL',
    destination: 'LAX',
    departDate: '2026-05-10',
    returnDate: '2026-05-15',
  })
  assert.equal(response.body.data.metadata.vertical, 'flight')
  assert.equal(response.body.data.metadata.cacheHit, false)
  assert.equal(response.body.data.metadata.totalResults, 1)
})

test('returns normalized hotel search results', async () => {
  const provider: ProviderAdapter = {
    provider: 'hotel-test-provider',
    vertical: 'hotel',
    async search(params) {
      assert.equal(params.vertical, 'hotel')
      assert.equal(params.destination, 'las-vegas-nv-us')
      assert.equal(params.checkInDate, '2026-05-10')
      assert.equal(params.checkOutDate, '2026-05-15')
      return [buildHotelEntity()]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const response = await loadSearchResultsApiResponse(
    '/api/search?type=hotel&city=las-vegas-nv-us&checkIn=2026-05-10&checkOut=2026-05-15',
    withSearchService(provider, async (searchSlug) =>
      searchSlug === 'las-vegas-nv-us' ? buildCityLocation() : null,
    ),
  )

  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  if (!response.body.ok) {
    assert.fail('expected a successful hotel api response')
  }

  assert.deepEqual(response.body.data.request, {
    type: 'hotel',
    city: 'las-vegas-nv-us',
    checkIn: '2026-05-10',
    checkOut: '2026-05-15',
  })
  assert.equal(response.body.data.results[0]?.vertical, 'hotel')
  assert.deepEqual(response.body.data.metadata, {
    vertical: 'hotel',
    totalResults: 1,
    providersQueried: ['hotel-test-provider'],
    cacheHit: false,
    searchTimeMs: response.body.data.metadata.searchTimeMs,
  })
  assert.ok(response.body.data.metadata.searchTimeMs >= 0)
})

test('returns normalized car search results', async () => {
  const provider: ProviderAdapter = {
    provider: 'car-test-provider',
    vertical: 'car',
    async search(params) {
      assert.equal(params.vertical, 'car')
      assert.equal(params.pickupLocation, 'LAX')
      assert.equal(params.dropoffLocation, 'LAX')
      assert.equal(params.pickupDate, '2026-05-10')
      assert.equal(params.dropoffDate, '2026-05-15')
      return [buildCarEntity()]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const response = await loadSearchResultsApiResponse(
    '/api/search?type=car&airport=LAX&pickupDate=2026-05-10&dropoffDate=2026-05-15',
    withSearchService(provider, async (searchSlug) =>
      searchSlug.toUpperCase() === 'LAX'
        ? buildAirportLocation('LAX', 'los-angeles-ca-us', 'Los Angeles')
        : null,
    ),
  )

  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  if (!response.body.ok) {
    assert.fail('expected a successful car api response')
  }

  assert.deepEqual(response.body.data.request, {
    type: 'car',
    airport: 'LAX',
    pickupDate: '2026-05-10',
    dropoffDate: '2026-05-15',
  })
  assert.equal(response.body.data.results[0]?.vertical, 'car')
  assert.equal(response.body.data.metadata.vertical, 'car')
  assert.equal(response.body.data.metadata.cacheHit, false)
  assert.equal(response.body.data.metadata.totalResults, 1)
})

test('marks cache misses in the search metadata', async () => {
  let searchCalls = 0
  const provider: ProviderAdapter = {
    provider: 'flight-test-provider',
    vertical: 'flight',
    async search() {
      searchCalls += 1
      return [buildFlightEntity()]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const response = await loadSearchResultsApiResponse(
    '/api/search?type=flight&origin=ORL&destination=LAX&departDate=2026-05-10',
    withSearchService(provider, async (searchSlug) => {
      const token = searchSlug.toUpperCase()
      if (token === 'ORL') return buildAirportLocation('ORL', 'orlando-fl-us', 'Orlando')
      if (token === 'LAX') return buildAirportLocation('LAX', 'los-angeles-ca-us', 'Los Angeles')
      return null
    }),
  )

  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  if (!response.body.ok) {
    assert.fail('expected a cache-miss response to succeed')
  }

  assert.equal(searchCalls, 1)
  assert.equal(response.body.data.metadata.cacheHit, false)
  assert.deepEqual(response.body.data.metadata.providersQueried, ['flight-test-provider'])
})

test('marks cache hits in the search metadata', async () => {
  let searchCalls = 0
  const provider: ProviderAdapter = {
    provider: 'hotel-test-provider',
    vertical: 'hotel',
    async search() {
      searchCalls += 1
      return [buildHotelEntity()]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const overrides = withSearchService(provider, async (searchSlug) =>
    searchSlug === 'las-vegas-nv-us' ? buildCityLocation() : null,
  )

  const first = await loadSearchResultsApiResponse(
    '/api/search?type=hotel&city=las-vegas-nv-us&checkIn=2026-05-10&checkOut=2026-05-15',
    overrides,
  )
  const second = await loadSearchResultsApiResponse(
    '/api/search?type=hotel&city=las-vegas-nv-us&checkIn=2026-05-10&checkOut=2026-05-15',
    overrides,
  )

  assert.equal(first.status, 200)
  assert.equal(second.status, 200)
  assert.equal(first.body.ok, true)
  assert.equal(second.body.ok, true)
  if (!first.body.ok || !second.body.ok) {
    assert.fail('expected cache-hit test responses to succeed')
  }

  assert.equal(searchCalls, 1)
  assert.equal(first.body.data.metadata.cacheHit, false)
  assert.equal(second.body.data.metadata.cacheHit, true)
  assert.deepEqual(second.body.data.metadata.providersQueried, [])
  assert.deepEqual(second.body.data.request, first.body.data.request)
})

test('returns incremental batches and cursor metadata for progressive polling', async () => {
  const fastProvider: ProviderAdapter = {
    provider: 'flight-fast',
    vertical: 'flight',
    async search() {
      await new Promise((resolve) => setTimeout(resolve, 5))
      return [buildFlightEntity()]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const slowProvider: ProviderAdapter = {
    provider: 'flight-slow',
    vertical: 'flight',
    async search() {
      await new Promise((resolve) => setTimeout(resolve, 20))
      return [
        toFlightSearchEntity(
          {
            itineraryId: 999,
            airline: 'United',
            airlineCode: 'UA',
            flightNumber: '999',
            serviceDate: '2026-05-10',
            origin: 'Orlando (ORL)',
            destination: 'Los Angeles (LAX)',
            originCode: 'ORL',
            destinationCode: 'LAX',
            stops: 0,
            duration: '5h 30m',
            cabinClass: 'economy',
            fareCode: 'Y',
            price: 355,
            currency: 'usd',
          },
          {
            departDate: '2026-05-10',
            priceAmountCents: 35500,
            snapshotTimestamp: '2026-03-14T12:00:00.000Z',
          },
        ),
      ]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const overrides = withSearchProviders(
    [slowProvider, fastProvider],
    async (searchSlug) => {
      const token = searchSlug.toUpperCase()
      if (token === 'ORL') return buildAirportLocation('ORL', 'orlando-fl-us', 'Orlando')
      if (token === 'LAX') return buildAirportLocation('LAX', 'los-angeles-ca-us', 'Los Angeles')
      return null
    },
  )

  const first = await loadIncrementalSearchResultsApiResponse(
    '/api/search?incremental=1&type=flight&origin=ORL&destination=LAX&departDate=2026-05-10',
    overrides,
  )

  assert.equal(first.status, 200)
  assert.equal(first.body.ok, true)
  if (!first.body.ok) {
    assert.fail('expected an incremental search bootstrap response')
  }

  assert.equal(first.body.data.metadata.status, 'loading')
  assert.equal(first.body.data.batches.length, 0)

  await new Promise((resolve) => setTimeout(resolve, 10))

  const partial = await loadIncrementalSearchResultsApiResponse(
    '/api/search?incremental=1&type=flight&origin=ORL&destination=LAX&departDate=2026-05-10&cursor=0',
    overrides,
  )

  assert.equal(partial.status, 200)
  assert.equal(partial.body.ok, true)
  if (!partial.body.ok) {
    assert.fail('expected a partial incremental search response')
  }

  assert.equal(partial.body.data.metadata.status, 'partial')
  assert.equal(partial.body.data.metadata.cursor, 1)
  assert.equal(partial.body.data.batches[0]?.provider, 'flight-fast')

  await new Promise((resolve) => setTimeout(resolve, 20))

  const complete = await loadIncrementalSearchResultsApiResponse(
    `/api/search?incremental=1&type=flight&origin=ORL&destination=LAX&departDate=2026-05-10&cursor=${partial.body.data.metadata.cursor}`,
    overrides,
  )

  assert.equal(complete.status, 200)
  assert.equal(complete.body.ok, true)
  if (!complete.body.ok) {
    assert.fail('expected a completed incremental search response')
  }

  assert.equal(complete.body.data.metadata.status, 'complete')
  assert.equal(complete.body.data.batches.length, 1)
  assert.equal(complete.body.data.batches[0]?.provider, 'flight-slow')
  assert.equal(complete.body.data.metadata.totalResults, 2)
})

test('returns structured errors for invalid search types', async () => {
  const response = await loadSearchResultsApiResponse('/api/search?type=cruise&airport=LAX')

  assert.equal(response.status, 400)
  assert.deepEqual(response.body, {
    ok: false,
    error: {
      code: 'INVALID_SEARCH_TYPE',
      field: 'type',
      message: 'type must be one of flight, hotel, or car.',
    },
  })
})

test('returns structured errors for missing required fields', async () => {
  const response = await loadSearchResultsApiResponse(
    '/api/search?type=flight&origin=ORL&departDate=2026-05-10',
  )

  assert.equal(response.status, 400)
  assert.deepEqual(response.body, {
    ok: false,
    error: {
      code: 'MISSING_REQUIRED_FIELD',
      field: 'destination',
      message: 'destination is required.',
    },
  })
})

test('returns structured errors for invalid location codes', async () => {
  const provider: ProviderAdapter = {
    provider: 'car-test-provider',
    vertical: 'car',
    async search() {
      assert.fail('provider search should not run for invalid car airport input')
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const response = await loadSearchResultsApiResponse(
    '/api/search?type=car&airport=ZZZ&pickupDate=2026-05-10&dropoffDate=2026-05-15',
    withSearchService(provider, async () => null),
  )

  assert.equal(response.status, 400)
  assert.deepEqual(response.body, {
    ok: false,
    error: {
      code: 'INVALID_LOCATION_CODE',
      field: 'airport',
      message: 'airport must reference a supported airport code.',
    },
  })
})

test('returns structured errors for invalid city slugs', async () => {
  const provider: ProviderAdapter = {
    provider: 'hotel-test-provider',
    vertical: 'hotel',
    async search() {
      assert.fail('provider search should not run for invalid hotel city input')
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const response = await loadSearchResultsApiResponse(
    '/api/search?type=hotel&city=not-a-real-supported-city&checkIn=2026-05-10&checkOut=2026-05-15',
    withSearchService(provider, async () => null),
  )

  assert.equal(response.status, 400)
  assert.deepEqual(response.body, {
    ok: false,
    error: {
      code: 'INVALID_CITY_SLUG',
      field: 'city',
      message: 'city must reference a supported city slug.',
    },
  })
})

test('returns structured errors for invalid date ranges', async () => {
  const response = await loadSearchResultsApiResponse(
    '/api/search?type=car&airport=LAX&pickupDate=2026-05-15&dropoffDate=2026-05-10',
  )

  assert.equal(response.status, 400)
  assert.deepEqual(response.body, {
    ok: false,
    error: {
      code: 'INVALID_DATE_RANGE',
      field: 'dropoffDate',
      message: 'dropoffDate must be on or after pickupDate.',
    },
  })
})

test('returns stable execution failures when provider search fails', async () => {
  const provider: ProviderAdapter = {
    provider: 'flight-test-provider',
    vertical: 'flight',
    async search() {
      throw new Error('provider timeout')
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const response = await loadSearchResultsApiResponse(
    '/api/search?type=flight&origin=ORL&destination=LAX&departDate=2026-05-10',
    withSearchService(provider, async (searchSlug) => {
      const token = searchSlug.toUpperCase()
      if (token === 'ORL') return buildAirportLocation('ORL', 'orlando-fl-us', 'Orlando')
      if (token === 'LAX') return buildAirportLocation('LAX', 'los-angeles-ca-us', 'Los Angeles')
      return null
    }),
  )

  assert.equal(response.status, 500)
  assert.deepEqual(response.body, {
    ok: false,
    error: {
      code: 'SEARCH_EXECUTION_FAILED',
      message: 'Search execution failed. Please try again.',
    },
  })
})
