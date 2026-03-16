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
const helperModule: typeof import('./loadCanonicalHotelSearch.ts') = await import(
  new URL('./loadCanonicalHotelSearch.ts', import.meta.url).href
)
const searchServiceModule: typeof import('./searchService.ts') = await import(
  new URL('./searchService.ts', import.meta.url).href
)

const { clearSearchCache } = cacheModule
const { toHotelSearchEntity } = searchEntityModule
const { loadCanonicalHotelSearch } = helperModule
const { executeSearchRequest } = searchServiceModule

test.beforeEach(() => {
  clearSearchCache()
})

const buildCityLocation = (citySlug = 'las-vegas-nv-us'): CanonicalLocation => ({
  locationId: `city:${citySlug}`,
  searchSlug: citySlug,
  kind: 'city',
  cityId: 1,
  airportId: null,
  regionId: 1,
  citySlug,
  cityName: 'Las Vegas',
  airportName: null,
  airportCode: null,
  primaryAirportCode: 'LAS',
  stateOrProvinceName: 'Nevada',
  stateOrProvinceCode: 'NV',
  countryName: 'United States',
  countryCode: 'US',
  displayName: 'Las Vegas, Nevada, United States',
})

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

test('loads canonical hotel searches into a page-friendly response shape', async () => {
  const provider: ProviderAdapter = {
    provider: 'hotel-test-provider',
    async search(params) {
      assert.equal(params.vertical, 'hotel')
      assert.equal(params.destination, 'las-vegas-nv-us')
      assert.equal(params.checkInDate, '2026-05-10')
      assert.equal(params.checkOutDate, '2026-05-15')
      assert.equal(params.destinationLocation?.citySlug, 'las-vegas-nv-us')
      return [buildHotelEntity()]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  let now = 2000
  const response = await loadCanonicalHotelSearch(
    '/hotels/search/las-vegas-nv-us/2026-05-10/2026-05-15',
    {
      executeSearchRequest: (request) =>
        executeSearchRequest(request, {
          getProvider: () => provider,
          resolveLocationBySearchSlug: async () => buildCityLocation(),
        }),
      now: () => {
        now += 7
        return now
      },
    },
  )

  assert.equal(response.status, 200)
  if ('error' in response) {
    assert.fail('expected a canonical hotel search success response')
  }

  assert.equal(response.request.type, 'hotel')
  assert.equal(response.request.city, 'las-vegas-nv-us')
  assert.equal(response.request.checkIn, '2026-05-10')
  assert.equal(response.request.checkOut, '2026-05-15')
  assert.equal(response.results.length, 1)
  assert.equal(response.results[0]?.vertical, 'hotel')
  assert.deepEqual(response.metadata, {
    totalResults: 1,
    providersQueried: ['hotel-test-provider'],
    searchTime: 7,
  })
})

test('reuses shared search cache results for repeated canonical hotel routes', async () => {
  let searchCalls = 0
  const provider: ProviderAdapter = {
    provider: 'hotel-test-provider',
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

  const execute = (request: Parameters<typeof executeSearchRequest>[0]) =>
    executeSearchRequest(request, {
      getProvider: () => provider,
      resolveLocationBySearchSlug: async () => buildCityLocation(),
    })

  const first = await loadCanonicalHotelSearch(
    '/hotels/search/las-vegas-nv-us/2026-05-10/2026-05-15',
    {
      executeSearchRequest: execute,
    },
  )
  const second = await loadCanonicalHotelSearch(
    '/hotels/search/las-vegas-nv-us/2026-05-10/2026-05-15',
    {
      executeSearchRequest: execute,
    },
  )

  assert.equal(first.status, 200)
  assert.equal(second.status, 200)
  if ('error' in first || 'error' in second) {
    assert.fail('expected repeated canonical hotel search responses to succeed')
  }

  assert.equal(searchCalls, 1)
  assert.deepEqual(second.results, first.results)
  assert.ok(first.metadata.searchTime >= 0)
  assert.ok(second.metadata.searchTime >= 0)
})

test('returns structured validation errors for invalid hotel dates', async () => {
  const response = await loadCanonicalHotelSearch(
    '/hotels/search/las-vegas-nv-us/2026-02-30/2026-03-02',
  )

  assert.equal(response.status, 400)
  assert.deepEqual(response, {
    status: 400,
    error: {
      code: 'INVALID_DATE',
      field: 'checkIn',
      message: 'checkIn must be a valid ISO date in YYYY-MM-DD format.',
      value: '2026-02-30',
    },
  })
})

test('returns structured validation errors for malformed hotel city slugs', async () => {
  const response = await loadCanonicalHotelSearch(
    '/hotels/search/las_vegas/2026-05-10/2026-05-15',
  )

  assert.equal(response.status, 400)
  assert.deepEqual(response, {
    status: 400,
    error: {
      code: 'INVALID_CITY_SLUG',
      field: 'city',
      message: 'city must be a lowercase kebab-case city slug.',
      value: 'las_vegas',
    },
  })
})
