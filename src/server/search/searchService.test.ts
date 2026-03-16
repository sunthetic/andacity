import assert from 'node:assert/strict'
import test from 'node:test'

import type { ProviderAdapter } from '~/lib/providers/providerAdapter'
import type { CanonicalLocation } from '~/types/location'

const cacheModule: typeof import('~/lib/search/search-cache.ts') = await import(
  new URL('../../lib/search/search-cache.ts', import.meta.url).href
)
const searchEntityModule: typeof import('~/lib/search/search-entity.ts') = await import(
  new URL('../../lib/search/search-entity.ts', import.meta.url).href
)
const searchServiceModule: typeof import('./searchService.ts') = await import(
  new URL('./searchService.ts', import.meta.url).href
)

const { clearSearchCache } = cacheModule
const { toCarSearchEntity, toFlightSearchEntity } = searchEntityModule
const {
  SearchExecutionError,
  clearIncrementalSearchSessions,
  executeSearchRequest,
  getIncrementalSearchSnapshot,
} = searchServiceModule

test.beforeEach(() => {
  clearSearchCache()
  clearIncrementalSearchSessions()
})

const buildFlightEntity = (flightNumber = '432', price = 318) =>
  toFlightSearchEntity(
    {
      itineraryId: 732,
      airline: 'Delta',
      airlineCode: 'DL',
      flightNumber,
      serviceDate: '2026-05-10',
      origin: 'New York (JFK)',
      destination: 'Los Angeles (LAX)',
      originCode: 'JFK',
      destinationCode: 'LAX',
      stops: 0,
      duration: '6h 3m',
      cabinClass: 'economy',
      fareCode: 'Y',
      price,
      currency: 'usd',
    },
    {
      departDate: '2026-05-10',
      priceAmountCents: price * 100,
      snapshotTimestamp: '2026-03-14T12:00:00.000Z',
    },
  )

const buildAirportLocation = (airportCode = 'LAX'): CanonicalLocation => ({
  locationId: `airport:${airportCode}`,
  searchSlug: airportCode.toLowerCase(),
  kind: 'airport',
  cityId: 1,
  airportId: 1,
  regionId: 1,
  citySlug: 'los-angeles-ca-us',
  cityName: 'Los Angeles',
  airportName: 'Los Angeles International Airport',
  airportCode,
  primaryAirportCode: airportCode,
  stateOrProvinceName: 'California',
  stateOrProvinceCode: 'CA',
  countryName: 'United States',
  countryCode: 'US',
  displayName: `Los Angeles International Airport (${airportCode})`,
})

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
    },
  )

test('executes canonical searches through provider adapters and reuses cache hits', async () => {
  let searchCalls = 0
  const provider: ProviderAdapter = {
    provider: 'flight-test-provider',
    vertical: 'flight',
    async search(params) {
      searchCalls += 1
      assert.equal(params.vertical, 'flight')
      assert.equal(params.origin, 'JFK')
      assert.equal(params.destination, 'LAX')
      assert.equal(params.departDate, '2026-05-10')
      return [buildFlightEntity()]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const request = {
    type: 'flight' as const,
    origin: 'JFK',
    destination: 'LAX',
    departDate: '2026-05-10',
  }

  const first = await executeSearchRequest(request, {
    getProvider: () => provider,
    resolveLocationBySearchSlug: async () => null,
  })
  const second = await executeSearchRequest(request, {
    getProvider: () => provider,
    resolveLocationBySearchSlug: async () => null,
  })

  assert.equal(first.cacheHit, false)
  assert.equal(second.cacheHit, true)
  assert.deepEqual(first.providers, ['flight-test-provider'])
  assert.deepEqual(second.providers, [])
  assert.equal(first.results.length, 1)
  assert.deepEqual(second.results, first.results)
  assert.equal(first.searchKey, second.searchKey)
  assert.equal(searchCalls, 1)
})

test('returns structured location errors before provider execution when a canonical location cannot be resolved', async () => {
  let searchCalls = 0
  const provider: ProviderAdapter = {
    provider: 'hotel-test-provider',
    vertical: 'hotel',
    async search() {
      searchCalls += 1
      return []
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  await assert.rejects(
    () =>
      executeSearchRequest(
        {
          type: 'hotel',
          city: 'not-a-real-supported-city',
          checkIn: '2026-05-10',
          checkOut: '2026-05-15',
        },
        {
          getProvider: () => provider,
          resolveLocationBySearchSlug: async () => null,
        },
      ),
    (error: unknown) => {
      assert.ok(error instanceof SearchExecutionError)
      assert.equal(error.code, 'LOCATION_NOT_FOUND')
      assert.equal(error.status, 404)
      return true
    },
  )

  assert.equal(searchCalls, 0)
})

test('uses airport pickup dates to build canonical car cache keys and reuse car results', async () => {
  let searchCalls = 0
  const provider: ProviderAdapter = {
    provider: 'car-test-provider',
    vertical: 'car',
    async search(params) {
      searchCalls += 1
      assert.equal(params.vertical, 'car')
      assert.equal(params.pickupLocation, 'LAX')
      assert.equal(params.dropoffLocation, 'LAX')
      assert.equal(params.pickupDate, '2026-05-10')
      assert.equal(params.dropoffDate, '2026-05-15')
      assert.equal(params.departDate, '2026-05-10')
      assert.equal(params.returnDate, '2026-05-15')
      assert.equal(params.pickupLocationData?.airportCode, 'LAX')
      return [buildCarEntity()]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const request = {
    type: 'car' as const,
    airport: 'LAX',
    pickupDate: '2026-05-10',
    dropoffDate: '2026-05-15',
  }

  const first = await executeSearchRequest(request, {
    getProvider: () => provider,
    resolveLocationBySearchSlug: async () => buildAirportLocation(),
  })
  const second = await executeSearchRequest(request, {
    getProvider: () => provider,
    resolveLocationBySearchSlug: async () => buildAirportLocation(),
  })

  assert.equal(first.cacheHit, false)
  assert.equal(second.cacheHit, true)
  assert.deepEqual(first.providers, ['car-test-provider'])
  assert.deepEqual(second.providers, [])
  assert.equal(first.searchKey, 'car:LAX:2026-05-10:2026-05-15')
  assert.equal(second.searchKey, first.searchKey)
  assert.equal(searchCalls, 1)
  assert.deepEqual(second.results, first.results)
})

test('returns provider_unavailable when no adapter is registered for the search vertical', async () => {
  await assert.rejects(
    () =>
      executeSearchRequest(
        {
          type: 'car',
          airport: 'LAX',
          pickupDate: '2026-05-10',
          dropoffDate: '2026-05-15',
        },
        {
          getProvider: () => null,
          resolveLocationBySearchSlug: async () => null,
        },
      ),
    (error: unknown) => {
      assert.ok(error instanceof SearchExecutionError)
      assert.equal(error.code, 'PROVIDER_UNAVAILABLE')
      assert.equal(error.field, 'type')
      return true
    },
  )
})

test('returns incremental provider batches as providers finish', async () => {
  const fastProvider: ProviderAdapter = {
    provider: 'flight-fast',
    vertical: 'flight',
    async search() {
      await new Promise((resolve) => setTimeout(resolve, 5))
      return [buildFlightEntity('101', 299)]
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
      return [buildFlightEntity('202', 349)]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const request = {
    type: 'flight' as const,
    origin: 'JFK',
    destination: 'LAX',
    departDate: '2026-05-10',
  }

  const first = await getIncrementalSearchSnapshot(request, 0, {
    getProviders: () => [slowProvider, fastProvider],
    resolveLocationBySearchSlug: async () => null,
  })

  assert.equal(first.metadata.status, 'loading')
  assert.equal(first.batches.length, 0)

  await new Promise((resolve) => setTimeout(resolve, 10))

  const partial = await getIncrementalSearchSnapshot(request, 0, {
    getProviders: () => [slowProvider, fastProvider],
    resolveLocationBySearchSlug: async () => null,
  })

  assert.equal(partial.metadata.status, 'partial')
  assert.equal(partial.batches.length, 1)
  assert.equal(partial.batches[0]?.provider, 'flight-fast')
  assert.equal(partial.results.length, 1)

  await new Promise((resolve) => setTimeout(resolve, 20))

  const complete = await getIncrementalSearchSnapshot(request, partial.metadata.cursor, {
    getProviders: () => [slowProvider, fastProvider],
    resolveLocationBySearchSlug: async () => null,
  })

  assert.equal(complete.metadata.status, 'complete')
  assert.equal(complete.batches.length, 1)
  assert.equal(complete.batches[0]?.provider, 'flight-slow')
  assert.equal(complete.metadata.totalResults, 2)
  assert.deepEqual(complete.metadata.providersCompleted, ['flight-fast', 'flight-slow'])
  assert.equal(complete.results.length, 2)
})
