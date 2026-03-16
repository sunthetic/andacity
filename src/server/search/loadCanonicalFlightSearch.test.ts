import assert from 'node:assert/strict'
import test from 'node:test'

import type { ProviderAdapter } from '~/lib/providers/providerAdapter'

const cacheModule: typeof import('~/lib/search/search-cache.ts') = await import(
  new URL('../../lib/search/search-cache.ts', import.meta.url).href
)
const searchEntityModule: typeof import('~/lib/search/search-entity.ts') = await import(
  new URL('../../lib/search/search-entity.ts', import.meta.url).href
)
const helperModule: typeof import('./loadCanonicalFlightSearch.ts') = await import(
  new URL('./loadCanonicalFlightSearch.ts', import.meta.url).href
)
const searchServiceModule: typeof import('./searchService.ts') = await import(
  new URL('./searchService.ts', import.meta.url).href
)

const { clearSearchCache } = cacheModule
const { toFlightSearchEntity } = searchEntityModule
const { loadCanonicalFlightSearch } = helperModule
const { executeSearchRequest } = searchServiceModule

test.beforeEach(() => {
  clearSearchCache()
})

const buildFlightEntity = (serviceDate = '2026-05-10') =>
  toFlightSearchEntity(
    {
      itineraryId: 732,
      airline: 'Delta',
      airlineCode: 'DL',
      flightNumber: '432',
      serviceDate,
      origin: 'Orlando (ORL)',
      destination: 'Los Angeles (LAX)',
      originCode: 'ORL',
      destinationCode: 'LAX',
      stops: 0,
      duration: '5h 28m',
      cabinClass: 'economy',
      fareCode: 'Y',
      price: 318,
      currency: 'usd',
    },
    {
      departDate: serviceDate,
      priceAmountCents: 31800,
      snapshotTimestamp: '2026-03-14T12:00:00.000Z',
    },
  )

test('loads one-way canonical flight searches into a page-friendly response shape', async () => {
  const provider: ProviderAdapter = {
    provider: 'flight-test-provider',
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
  const response = await loadCanonicalFlightSearch('/flights/search/ORL-LAX/2026-05-10', {
    executeSearchRequest: (request) =>
      executeSearchRequest(request, {
        getProvider: () => provider,
        resolveLocationBySearchSlug: async () => null,
      }),
    now: () => {
      now += 9
      return now
    },
  })

  assert.equal(response.status, 200)
  if ('error' in response) {
    assert.fail('expected a canonical flight search success response')
  }

  assert.equal(response.request.type, 'flight')
  assert.equal(response.request.origin, 'ORL')
  assert.equal(response.request.destination, 'LAX')
  assert.equal(response.request.departDate, '2026-05-10')
  assert.equal(response.request.returnDate, undefined)
  assert.equal(response.results.length, 1)
  assert.equal(response.results[0]?.vertical, 'flight')
  assert.deepEqual(response.metadata, {
    totalResults: 1,
    providersQueried: ['flight-test-provider'],
    searchTime: 9,
  })
})

test('treats round-trip canonical flight searches as distinct from one-way searches', async () => {
  let searchCalls = 0
  const provider: ProviderAdapter = {
    provider: 'flight-test-provider',
    async search(params) {
      searchCalls += 1
      assert.equal(params.vertical, 'flight')
      assert.equal(params.origin, 'ORL')
      assert.equal(params.destination, 'LAX')

      if (params.returnDate) {
        assert.equal(params.returnDate, '2026-05-15')
      }

      return [buildFlightEntity(params.departDate || '2026-05-10')]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  const execute = (request: Parameters<typeof executeSearchRequest>[0]) =>
    executeSearchRequest(request, {
      getProvider: () => provider,
      resolveLocationBySearchSlug: async () => null,
    })

  const oneWay = await loadCanonicalFlightSearch('/flights/search/ORL-LAX/2026-05-10', {
    executeSearchRequest: execute,
  })
  const roundTrip = await loadCanonicalFlightSearch(
    '/flights/search/ORL-LAX/2026-05-10/return/2026-05-15',
    {
      executeSearchRequest: execute,
    },
  )

  assert.equal(oneWay.status, 200)
  assert.equal(roundTrip.status, 200)
  if ('error' in oneWay || 'error' in roundTrip) {
    assert.fail('expected both canonical flight search responses to succeed')
  }

  assert.equal(oneWay.request.returnDate, undefined)
  assert.equal(roundTrip.request.returnDate, '2026-05-15')
  assert.equal(searchCalls, 2)
})

test('reuses shared search cache results for repeated canonical flight routes', async () => {
  let searchCalls = 0
  const provider: ProviderAdapter = {
    provider: 'flight-test-provider',
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

  const execute = (request: Parameters<typeof executeSearchRequest>[0]) =>
    executeSearchRequest(request, {
      getProvider: () => provider,
      resolveLocationBySearchSlug: async () => null,
    })

  const first = await loadCanonicalFlightSearch('/flights/search/ORL-LAX/2026-05-10', {
    executeSearchRequest: execute,
  })
  const second = await loadCanonicalFlightSearch('/flights/search/ORL-LAX/2026-05-10', {
    executeSearchRequest: execute,
  })

  assert.equal(first.status, 200)
  assert.equal(second.status, 200)
  if ('error' in first || 'error' in second) {
    assert.fail('expected repeated canonical flight search responses to succeed')
  }

  assert.equal(searchCalls, 1)
  assert.deepEqual(second.results, first.results)
  assert.ok(first.metadata.searchTime >= 0)
  assert.ok(second.metadata.searchTime >= 0)
})

test('returns structured validation errors for invalid canonical flight routes', async () => {
  const response = await loadCanonicalFlightSearch('/flights/search/ORLL-LAX/2026-05-10')

  assert.equal(response.status, 400)
  assert.deepEqual(response, {
    status: 400,
    error: {
      code: 'INVALID_LOCATION_CODE',
      field: 'origin',
      message: 'origin must be a 3-letter airport code.',
      value: 'ORLL',
    },
  })
})
