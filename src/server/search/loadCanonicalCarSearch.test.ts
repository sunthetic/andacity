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
const helperModule: typeof import('./loadCanonicalCarSearch.ts') = await import(
  new URL('./loadCanonicalCarSearch.ts', import.meta.url).href
)
const searchServiceModule: typeof import('./searchService.ts') = await import(
  new URL('./searchService.ts', import.meta.url).href
)

const { clearSearchCache } = cacheModule
const { toCarSearchEntity } = searchEntityModule
const { loadCanonicalCarSearch } = helperModule
const { executeSearchRequest } = searchServiceModule

test.beforeEach(() => {
  clearSearchCache()
})

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
      href: '/car-rentals/hertz-lax-standard?pickupDate=2026-05-10&dropoffDate=2026-05-15',
    },
  )

test('loads canonical car searches into a page-friendly response shape', async () => {
  const provider: ProviderAdapter = {
    provider: 'car-test-provider',
    vertical: 'car',
    async search(params) {
      assert.equal(params.vertical, 'car')
      assert.equal(params.pickupLocation, 'LAX')
      assert.equal(params.dropoffLocation, 'LAX')
      assert.equal(params.pickupDate, '2026-05-10')
      assert.equal(params.dropoffDate, '2026-05-15')
      assert.equal(params.pickupLocationData?.airportCode, 'LAX')
      assert.equal(params.pickupLocationData?.citySlug, 'los-angeles-ca-us')
      return [buildCarEntity()]
    },
    async resolveInventory() {
      return null
    },
    async fetchPrice() {
      return null
    },
  }

  let now = 3000
  const response = await loadCanonicalCarSearch('/car-rentals/search/LAX/2026-05-10/2026-05-15', {
    executeSearchRequest: (request) =>
      executeSearchRequest(request, {
        getProvider: () => provider,
        resolveLocationBySearchSlug: async () => buildAirportLocation(),
      }),
    now: () => {
      now += 11
      return now
    },
  })

  assert.equal(response.status, 200)
  if ('error' in response) {
    assert.fail('expected a canonical car search success response')
  }

  assert.equal(response.request.type, 'car')
  assert.equal(response.request.airport, 'LAX')
  assert.equal(response.request.pickupDate, '2026-05-10')
  assert.equal(response.request.dropoffDate, '2026-05-15')
  assert.equal(response.results.length, 1)
  assert.equal(response.results[0]?.vertical, 'car')
  assert.deepEqual(response.metadata, {
    totalResults: 1,
    providersQueried: ['car-test-provider'],
    searchTime: 11,
  })
})

test('reuses shared search cache results for repeated canonical car routes', async () => {
  let searchCalls = 0
  const provider: ProviderAdapter = {
    provider: 'car-test-provider',
    vertical: 'car',
    async search() {
      searchCalls += 1
      return [buildCarEntity()]
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
      resolveLocationBySearchSlug: async () => buildAirportLocation(),
    })

  const first = await loadCanonicalCarSearch('/car-rentals/search/LAX/2026-05-10/2026-05-15', {
    executeSearchRequest: execute,
  })
  const second = await loadCanonicalCarSearch('/car-rentals/search/LAX/2026-05-10/2026-05-15', {
    executeSearchRequest: execute,
  })

  assert.equal(first.status, 200)
  assert.equal(second.status, 200)
  if ('error' in first || 'error' in second) {
    assert.fail('expected repeated canonical car search responses to succeed')
  }

  assert.equal(searchCalls, 1)
  assert.deepEqual(second.results, first.results)
  assert.ok(first.metadata.searchTime >= 0)
  assert.ok(second.metadata.searchTime >= 0)
})

test('returns structured validation errors for invalid canonical car dates', async () => {
  const response = await loadCanonicalCarSearch('/car-rentals/search/LAX/2026-05-15/2026-05-10')

  assert.equal(response.status, 400)
  assert.deepEqual(response, {
    status: 400,
    error: {
      code: 'INVALID_DATE_RANGE',
      field: 'dropoffDate',
      message: 'dropoffDate must be on or after pickupDate.',
      value: '2026-05-10',
    },
  })
})

test('returns structured validation errors for malformed car airport codes', async () => {
  const response = await loadCanonicalCarSearch('/car-rentals/search/LAX-airport/2026-05-10/2026-05-15')

  assert.equal(response.status, 400)
  assert.deepEqual(response, {
    status: 400,
    error: {
      code: 'INVALID_LOCATION_CODE',
      field: 'airport',
      message: 'airport must be a 3-letter airport code.',
      value: 'LAX-airport',
    },
  })
})
