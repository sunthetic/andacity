import assert from 'node:assert/strict'
import test from 'node:test'

import type { ProviderAdapter } from '~/lib/providers/providerAdapter'

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
const { toFlightSearchEntity } = searchEntityModule
const { SearchExecutionError, executeSearchRequest } = searchServiceModule

test.beforeEach(() => {
  clearSearchCache()
})

const buildFlightEntity = () =>
  toFlightSearchEntity(
    {
      itineraryId: 732,
      airline: 'Delta',
      airlineCode: 'DL',
      flightNumber: '432',
      serviceDate: '2026-05-10',
      origin: 'New York (JFK)',
      destination: 'Los Angeles (LAX)',
      originCode: 'JFK',
      destinationCode: 'LAX',
      stops: 0,
      duration: '6h 3m',
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

test('executes canonical searches through provider adapters and reuses cache hits', async () => {
  let searchCalls = 0
  const provider: ProviderAdapter = {
    provider: 'flight-test-provider',
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
  assert.equal(first.provider, 'flight-test-provider')
  assert.equal(first.results.length, 1)
  assert.deepEqual(second.results, first.results)
  assert.equal(first.searchKey, second.searchKey)
  assert.equal(searchCalls, 1)
})

test('returns structured location errors before provider execution when a canonical location cannot be resolved', async () => {
  let searchCalls = 0
  const provider: ProviderAdapter = {
    provider: 'hotel-test-provider',
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
      assert.equal(error.code, 'location_not_found')
      assert.equal(error.status, 404)
      return true
    },
  )

  assert.equal(searchCalls, 0)
})

test('returns provider_unavailable when no adapter is registered for the search vertical', async () => {
  await assert.rejects(
    () =>
      executeSearchRequest(
        {
          type: 'car',
          airport: 'LAX',
          departDate: '2026-05-10',
          returnDate: '2026-05-15',
        },
        {
          getProvider: () => null,
          resolveLocationBySearchSlug: async () => null,
        },
      ),
    (error: unknown) => {
      assert.ok(error instanceof SearchExecutionError)
      assert.equal(error.code, 'provider_unavailable')
      assert.equal(error.field, 'type')
      return true
    },
  )
})
