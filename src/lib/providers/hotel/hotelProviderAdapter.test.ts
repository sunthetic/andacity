import assert from 'node:assert/strict'
import test from 'node:test'

import type { HotelSearchEntity } from '~/types/search-entity'

const inventoryIdModule: typeof import('../../inventory/inventory-id.ts') = await import(
  new URL('../../inventory/inventory-id.ts', import.meta.url).href
)
const adapterModule: typeof import('./hotelProviderAdapter.ts') = await import(
  new URL('./hotelProviderAdapter.ts', import.meta.url).href
)
const constantsModule: typeof import('./constants.ts') = await import(
  new URL('./constants.ts', import.meta.url).href
)
const mapParamsModule: typeof import('./mapHotelSearchParams.ts') = await import(
  new URL('./mapHotelSearchParams.ts', import.meta.url).href
)
const normalizeSearchModule: typeof import('./normalizeHotelSearchResult.ts') = await import(
  new URL('./normalizeHotelSearchResult.ts', import.meta.url).href
)
const normalizeInventoryModule: typeof import('./normalizeHotelInventory.ts') = await import(
  new URL('./normalizeHotelInventory.ts', import.meta.url).href
)
const providerRegistryModule: typeof import('../providerRegistry.ts') = await import(
  new URL('../providerRegistry.ts', import.meta.url).href
)

const { buildHotelInventoryId } = inventoryIdModule
const { createHotelProviderAdapter } = adapterModule
const { HOTEL_PROVIDER_NAME } = constantsModule
const { mapHotelSearchParams } = mapParamsModule
const { normalizeHotelSearchResult } = normalizeSearchModule
const { normalizeHotelInventory, normalizeHotelPriceQuote } = normalizeInventoryModule
const { getProvider } = providerRegistryModule

const buildRawOffer = (
  overrides: Partial<import('./hotelProviderClient.ts').HotelProviderRawOffer> = {},
): import('./hotelProviderClient.ts').HotelProviderRawOffer => ({
  provider: HOTEL_PROVIDER_NAME,
  hotelId: 555,
  hotelSlug: 'ace-hotel',
  hotelName: 'Ace Hotel',
  citySlug: 'new-york-city',
  cityName: 'New York',
  neighborhood: 'Downtown',
  stars: 4,
  rating: 8.8,
  reviewCount: 321,
  propertyType: 'hotel',
  currencyCode: 'USD',
  imageUrl: '/img/hotel.jpg',
  amenities: ['Pool', 'Wi-Fi'],
  brandName: 'Ace Hotels',
  checkInDate: '2026-04-01',
  checkOutDate: '2026-04-05',
  occupancy: 2,
  nights: 4,
  roomType: 'Deluxe King Suite',
  roomTypeToken: 'deluxe-king-suite',
  providerOfferId: 'ace-flex-king',
  ratePlanId: 'flexible-pay-later-breakfast-included',
  ratePlan: 'Flexible rate · Pay later · Breakfast included',
  boardType: 'breakfast-included',
  cancellationPolicy: 'free-cancellation',
  refundable: true,
  freeCancellation: true,
  payLater: true,
  inclusions: ['Breakfast included', 'Late checkout'],
  nightlyBaseCents: 18900,
  totalBaseCents: 75600,
  taxesCents: 0,
  mandatoryFeesCents: 0,
  totalPriceCents: 75600,
  cancellationBlurb: 'Free cancellation before check-in.',
  paymentBlurb: 'Pay at property',
  feesBlurb: 'No resort fees',
  freshnessTimestamp: '2026-03-13T20:00:00.000Z',
  isAvailable: true,
  ...overrides,
})

const buildInventoryId = () =>
  buildHotelInventoryId({
    provider: HOTEL_PROVIDER_NAME,
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'deluxe-king-suite',
    occupancy: 2,
    providerOfferId: 'ace-flex-king',
    ratePlanId: 'flexible-pay-later-breakfast-included',
    boardType: 'breakfast-included',
    cancellationPolicy: 'free-cancellation',
  })

test('registers the hotel adapter under both the concrete provider name and hotel alias', () => {
  assert.equal(getProvider(HOTEL_PROVIDER_NAME)?.provider, HOTEL_PROVIDER_NAME)
  assert.equal(getProvider('hotel')?.provider, 'hotel')
})

test('maps canonical hotel search params into a provider request shape', () => {
  const request = mapHotelSearchParams({
    vertical: 'hotel',
    destination: 'new-york',
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    adults: 2,
    rooms: 1,
    filters: {
      starRating: ['4', '5'],
      guestRating: ['8'],
      amenities: ['Pool', 'wifi'],
      priceRange: ['150-300'],
      refundableOnly: true,
      sort: 'price-asc',
    },
  })

  assert.deepEqual(request, {
    citySlug: 'new-york',
    cityName: 'New York',
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    occupancy: 2,
    rooms: 1,
    sort: 'price-asc',
    filters: {
      priceRanges: ['150-300'],
      starRatings: [4, 5],
      guestRatingMin: 4,
      amenities: ['pool', 'wifi'],
      refundableOnly: true,
    },
  })
})

test('normalizes a provider hotel offer into a canonical hotel search entity', () => {
  const entity = normalizeHotelSearchResult(
    buildRawOffer(),
    {
      vertical: 'hotel',
      destination: 'new-york-city',
      checkInDate: '2026-04-01',
      checkOutDate: '2026-04-05',
      occupancy: 2,
    },
    {
      providerName: HOTEL_PROVIDER_NAME,
    },
  )

  assert.ok(entity)
  assert.equal(entity?.inventoryId, buildInventoryId())
  assert.equal(entity?.vertical, 'hotel')
  assert.equal(entity?.payload.providerInventoryId, 555)
  assert.equal(entity?.payload.providerOfferId, 'ace-flex-king')
  assert.equal(entity?.payload.ratePlanId, 'flexible-pay-later-breakfast-included')
  assert.equal(entity?.payload.policy?.freeCancellation, true)
  assert.equal(entity?.payload.priceSummary?.totalPriceCents, 75600)
  assert.equal(entity?.payload.providerMetadata?.providerName, HOTEL_PROVIDER_NAME)
})

test('normalizes a resolved provider hotel offer into a canonical bookable entity', () => {
  const entity = normalizeHotelInventory(buildRawOffer(), buildInventoryId(), {
    providerName: HOTEL_PROVIDER_NAME,
    snapshotTimestamp: '2026-03-13T21:00:00.000Z',
  })

  assert.ok(entity)
  assert.equal(entity?.vertical, 'hotel')
  assert.equal(entity?.payload.providerInventoryId, 555)
  assert.equal(entity?.payload.providerOfferId, 'ace-flex-king')
  assert.equal(entity?.payload.boardType, 'breakfast-included')
  assert.equal(entity?.payload.policy?.refundable, true)
  assert.equal(entity?.payload.providerMetadata?.providerName, HOTEL_PROVIDER_NAME)
  assert.equal(entity?.snapshotTimestamp, '2026-03-13T21:00:00.000Z')
})

test('normalizes a live hotel price into a canonical price quote', () => {
  const quote = normalizeHotelPriceQuote({
    provider: HOTEL_PROVIDER_NAME,
    hotelId: 555,
    currencyCode: 'usd',
    nightlyBaseCents: 18900,
    totalBaseCents: 75600,
    taxesCents: 0,
    mandatoryFeesCents: 0,
    totalPriceCents: 75600,
    nights: 4,
  })

  assert.deepEqual(quote, {
    currency: 'USD',
    amount: 756,
    base: 756,
    nightly: 189,
    nights: 4,
    taxes: 0,
    fees: 0,
  })
})

test('searches hotel inventory through the provider adapter and returns canonical entities', async () => {
  const offer = buildRawOffer()
  const adapter = createHotelProviderAdapter({
    client: {
      async search(request) {
        assert.deepEqual(request, {
          citySlug: 'new-york',
          cityName: 'New York',
          checkInDate: '2026-04-01',
          checkOutDate: '2026-04-05',
          occupancy: 2,
          rooms: 1,
          sort: 'recommended',
          filters: {
            priceRanges: [],
            starRatings: [],
            guestRatingMin: null,
            amenities: [],
            refundableOnly: false,
          },
        })

        return {
          provider: HOTEL_PROVIDER_NAME,
          request,
          results: [offer],
        }
      },
      async resolveInventory() {
        return null
      },
      async fetchPrice() {
        return null
      },
    },
  })

  const results = await adapter.search({
    vertical: 'hotel',
    destination: 'new-york',
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    occupancy: 2,
    rooms: 1,
  })

  assert.equal(results.length, 1)
  const [firstResult] = results
  assert.equal(firstResult?.inventoryId, buildInventoryId())
  assert.equal(firstResult?.vertical, 'hotel')
  if (!firstResult || firstResult.vertical !== 'hotel') {
    assert.fail('expected a canonical hotel search entity')
  }

  const hotelResult = firstResult as HotelSearchEntity
  assert.equal(hotelResult.payload.providerOfferId, 'ace-flex-king')
  assert.equal(hotelResult.payload.providerMetadata?.providerName, HOTEL_PROVIDER_NAME)
})

test('resolves hotel inventory and fetches live hotel pricing through the adapter', async () => {
  const inventoryId = buildInventoryId()
  const offer = buildRawOffer()
  let resolveCalls = 0
  let priceCalls = 0

  const adapter = createHotelProviderAdapter({
    client: {
      async search() {
        return {
          provider: HOTEL_PROVIDER_NAME,
          request: {
            citySlug: 'new-york',
            cityName: 'New York',
            checkInDate: '2026-04-01',
            checkOutDate: '2026-04-05',
            occupancy: 2,
            rooms: 1,
            sort: 'recommended',
            filters: {
              priceRanges: [],
              starRatings: [],
              guestRatingMin: null,
              amenities: [],
              refundableOnly: false,
            },
          },
          results: [],
        }
      },
      async resolveInventory(lookup) {
        resolveCalls += 1
        assert.ok(lookup.providerInventoryId == null || lookup.providerInventoryId === 555)
        assert.equal(lookup.parsedInventory.provider, HOTEL_PROVIDER_NAME)
        assert.equal(lookup.parsedInventory.providerOfferId, 'ace-flex-king')
        assert.equal(lookup.parsedInventory.ratePlanId, 'flexible-pay-later-breakfast-included')
        return offer
      },
      async fetchPrice(lookup) {
        priceCalls += 1
        assert.equal(lookup.parsedInventory.providerOfferId, 'ace-flex-king')
        return {
          provider: HOTEL_PROVIDER_NAME,
          hotelId: 555,
          currencyCode: 'USD',
          nightlyBaseCents: 18900,
          totalBaseCents: 75600,
          taxesCents: 0,
          mandatoryFeesCents: 0,
          totalPriceCents: 75600,
          nights: 4,
        }
      },
    },
  })

  const record = await adapter.resolveInventoryRecord?.({
    inventoryId,
    providerInventoryId: 555,
    checkedAt: '2026-03-13T20:00:00.000Z',
  })
  const entity = await adapter.resolveInventory(inventoryId)
  const price = await adapter.fetchPrice(inventoryId)

  assert.equal(resolveCalls, 2)
  assert.equal(priceCalls, 1)
  assert.equal(record?.entity.vertical, 'hotel')
  assert.equal(record?.isAvailable, true)
  assert.equal(record?.checkedAt, '2026-03-13T20:00:00.000Z')
  if (!record || record.entity.vertical !== 'hotel') {
    assert.fail('expected a canonical hotel inventory record')
  }

  assert.equal(record.entity.payload.providerMetadata?.providerName, HOTEL_PROVIDER_NAME)
  assert.equal(entity?.vertical, 'hotel')
  if (!entity || entity.vertical !== 'hotel') {
    assert.fail('expected a canonical hotel bookable entity')
  }

  assert.equal(entity.payload.ratePlanId, 'flexible-pay-later-breakfast-included')
  assert.deepEqual(price, {
    currency: 'USD',
    amount: 756,
    base: 756,
    nightly: 189,
    nights: 4,
    taxes: 0,
    fees: 0,
  })
})

test('fails safely for malformed inventory ids, mismatched providers, and missing offers', async () => {
  const adapter = createHotelProviderAdapter({
    client: {
      async search() {
        return {
          provider: HOTEL_PROVIDER_NAME,
          request: {
            citySlug: 'new-york',
            cityName: 'New York',
            checkInDate: '2026-04-01',
            checkOutDate: '2026-04-05',
            occupancy: 2,
            rooms: 1,
            sort: 'recommended',
            filters: {
              priceRanges: [],
              starRatings: [],
              guestRatingMin: null,
              amenities: [],
              refundableOnly: false,
            },
          },
          results: [],
        }
      },
      async resolveInventory() {
        return null
      },
      async fetchPrice() {
        return null
      },
    },
  })

  const otherProviderInventoryId = buildHotelInventoryId({
    provider: 'other-provider',
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'deluxe-king-suite',
    occupancy: 2,
    providerOfferId: 'ace-flex-king',
    ratePlanId: 'flexible-pay-later-breakfast-included',
    boardType: 'breakfast-included',
    cancellationPolicy: 'free-cancellation',
  })

  assert.equal(await adapter.resolveInventory('not-canonical'), null)
  assert.equal(await adapter.fetchPrice('not-canonical'), null)
  assert.equal(await adapter.resolveInventory(otherProviderInventoryId), null)
  assert.equal(await adapter.fetchPrice(otherProviderInventoryId), null)
  assert.equal(await adapter.resolveInventory(buildInventoryId()), null)
  assert.equal(await adapter.fetchPrice(buildInventoryId()), null)
})

test('returns null for unavailable hotel offers and handles room or rate-plan drift safely', async () => {
  const inventoryId = buildInventoryId()
  const adapter = createHotelProviderAdapter({
    client: {
      async search() {
        return {
          provider: HOTEL_PROVIDER_NAME,
          request: {
            citySlug: 'new-york',
            cityName: 'New York',
            checkInDate: '2026-04-01',
            checkOutDate: '2026-04-05',
            occupancy: 2,
            rooms: 1,
            sort: 'recommended',
            filters: {
              priceRanges: [],
              starRatings: [],
              guestRatingMin: null,
              amenities: [],
              refundableOnly: false,
            },
          },
          results: [],
        }
      },
      async resolveInventory() {
        return buildRawOffer({
          isAvailable: false,
        })
      },
      async fetchPrice() {
        return null
      },
    },
  })

  const unavailableRecord = await adapter.resolveInventoryRecord?.({
    inventoryId,
    checkedAt: '2026-03-13T20:00:00.000Z',
  })
  const entity = await adapter.resolveInventory(inventoryId)
  const price = await adapter.fetchPrice(inventoryId)

  assert.equal(unavailableRecord?.isAvailable, false)
  assert.equal(entity, null)
  assert.equal(price, null)
})

test('handles provider client failures without leaking provider-specific errors', async () => {
  const adapter = createHotelProviderAdapter({
    client: {
      async search() {
        throw new Error('provider timeout')
      },
      async resolveInventory() {
        throw new Error('provider timeout')
      },
      async fetchPrice() {
        throw new Error('provider timeout')
      },
    },
  })

  assert.deepEqual(
    await adapter.search({
      vertical: 'hotel',
      destination: 'new-york',
      checkInDate: '2026-04-01',
      checkOutDate: '2026-04-05',
      occupancy: 2,
      rooms: 1,
    }),
    [],
  )
  assert.equal(await adapter.resolveInventory(buildInventoryId()), null)
  assert.equal(await adapter.fetchPrice(buildInventoryId()), null)
})
