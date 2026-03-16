import assert from 'node:assert/strict'
import test from 'node:test'

import type { CarSearchEntity } from '~/types/search-entity'

const inventoryIdModule: typeof import('../../inventory/inventory-id.ts') = await import(
  new URL('../../inventory/inventory-id.ts', import.meta.url).href
)
const adapterModule: typeof import('./carProviderAdapter.ts') = await import(
  new URL('./carProviderAdapter.ts', import.meta.url).href
)
const constantsModule: typeof import('./constants.ts') = await import(
  new URL('./constants.ts', import.meta.url).href
)
const mapParamsModule: typeof import('./mapCarSearchParams.ts') = await import(
  new URL('./mapCarSearchParams.ts', import.meta.url).href
)
const normalizeSearchModule: typeof import('./normalizeCarSearchResult.ts') = await import(
  new URL('./normalizeCarSearchResult.ts', import.meta.url).href
)
const normalizeInventoryModule: typeof import('./normalizeCarInventory.ts') = await import(
  new URL('./normalizeCarInventory.ts', import.meta.url).href
)
const providerRegistryModule: typeof import('../providerRegistry.ts') = await import(
  new URL('../providerRegistry.ts', import.meta.url).href
)

const { buildCarInventoryId, buildFlightInventoryId } = inventoryIdModule
const { createCarProviderAdapter } = adapterModule
const { CAR_PROVIDER_NAME } = constantsModule
const { mapCarSearchParams } = mapParamsModule
const {
  normalizeCarSearchResult,
  buildCarPriceSummary,
} = normalizeSearchModule
const {
  normalizeCarInventory,
  normalizeCarPriceQuote,
} = normalizeInventoryModule
const { getProvider } = providerRegistryModule

const buildRawOffer = (
  overrides: Partial<import('./carProviderClient.ts').CarProviderRawOffer> = {},
): import('./carProviderClient.ts').CarProviderRawOffer => ({
  provider: CAR_PROVIDER_NAME,
  inventoryId: 777,
  inventorySlug: 'hertz-phx',
  rentalCompany: 'Hertz',
  citySlug: 'phoenix',
  cityName: 'Phoenix',
  providerLocationId: 'phx-airport',
  pickupLocationName: 'Phoenix Sky Harbor',
  dropoffLocationName: 'Phoenix Sky Harbor',
  pickupLocationType: 'airport',
  dropoffLocationType: 'airport',
  pickupAddressLine: '3400 E Sky Harbor Blvd',
  dropoffAddressLine: '3400 E Sky Harbor Blvd',
  pickupDateTime: '2026-04-01T10:00',
  dropoffDateTime: '2026-04-05T10:00',
  driverAge: 30,
  vehicleName: 'Toyota RAV4',
  vehicleClass: 'suv',
  vehicleCategory: 'SUV',
  transmission: 'automatic',
  seats: 5,
  doors: 4,
  luggageCapacity: '3 large + 1 small',
  airConditioning: true,
  fuelPolicy: 'Full-to-full',
  mileagePolicy: 'Unlimited mileage',
  ratePlanCode: 'suv-flex',
  ratePlan: 'Free cancellation · Pay at counter',
  freeCancellation: true,
  payAtCounter: true,
  securityDepositRequired: false,
  minDriverAge: 25,
  cancellationBlurb: 'Free cancellation before pickup.',
  paymentBlurb: 'Pay at counter',
  feesBlurb: 'Local surcharges excluded.',
  depositBlurb: 'No security deposit required.',
  inclusions: ['Unlimited mileage', 'Roadside assistance'],
  badges: ['Free cancellation', 'Popular'],
  features: ['Unlimited mileage', 'Air conditioning'],
  currencyCode: 'USD',
  priceDailyCents: 6700,
  totalBaseCents: 26800,
  taxesCents: 1200,
  mandatoryFeesCents: 800,
  totalPriceCents: 28800,
  days: 4,
  imageUrl: '/img/car.jpg',
  freshnessTimestamp: '2026-03-13T20:00:00.000Z',
  href: '/car-rentals/hertz-phx?pickupDate=2026-04-01&dropoffDate=2026-04-05',
  assumedRentalWindow: false,
  isAvailable: true,
  ...overrides,
})

const buildInventoryId = () =>
  buildCarInventoryId({
    providerLocationId: 'phx-airport',
    pickupDateTime: '2026-04-01T10:00',
    dropoffDateTime: '2026-04-05T10:00',
    vehicleClass: 'suv',
  })

test('registers the car adapter under both the concrete provider name and car alias', () => {
  assert.equal(getProvider(CAR_PROVIDER_NAME)?.provider, CAR_PROVIDER_NAME)
  assert.equal(getProvider('car')?.provider, 'car')
})

test('maps canonical car search params into a provider request shape', () => {
  const request = mapCarSearchParams({
    vertical: 'car',
    pickupLocation: 'phoenix',
    dropoffLocation: 'Phoenix',
    pickupDate: '2026-04-01',
    dropoffDate: '2026-04-05',
    driverAge: 30,
    filters: {
      vehicleClass: ['SUV'],
      transmission: ['automatic'],
      pickupType: 'airport',
      seatsMin: 5,
      priceRange: ['50-100'],
      refundableOnly: true,
      sort: 'price-asc',
    },
  })

  assert.deepEqual(request, {
    citySlug: 'phoenix',
    cityName: 'Phoenix',
    pickupDate: '2026-04-01',
    dropoffDate: '2026-04-05',
    pickupDateTime: '2026-04-01T10:00',
    dropoffDateTime: '2026-04-05T10:00',
    driverAge: 30,
    sort: 'price-asc',
    filters: {
      vehicleClassKeys: ['suv'],
      pickupType: 'airport',
      transmission: 'automatic',
      seatsMin: 5,
      priceBand: '50-100',
      freeCancellationOnly: true,
      payAtCounterOnly: false,
    },
  })
})

test('normalizes a provider car offer into a canonical car search entity', () => {
  const entity = normalizeCarSearchResult(
    buildRawOffer(),
    {
      vertical: 'car',
      pickupLocation: 'phoenix',
      dropoffLocation: 'phoenix',
      departDate: '2026-04-01',
      returnDate: '2026-04-05',
      driverAge: 30,
    },
    {
      providerName: CAR_PROVIDER_NAME,
    },
  )

  assert.ok(entity)
  assert.equal(entity?.inventoryId, buildInventoryId())
  assert.equal(entity?.vertical, 'car')
  assert.equal(entity?.payload.providerInventoryId, 777)
  assert.equal(entity?.payload.vehicleClass, 'suv')
  assert.equal(entity?.payload.transmissionType, 'Automatic')
  assert.equal(entity?.payload.luggageCapacity, '3 large + 1 small')
  assert.equal(entity?.payload.priceSummary?.totalPriceCents, 28800)
  assert.equal(entity?.payload.providerMetadata?.providerName, CAR_PROVIDER_NAME)
  assert.equal(entity?.metadata.transmission, 'Automatic')
})

test('builds a normalized car price summary from provider data', () => {
  assert.deepEqual(buildCarPriceSummary(buildRawOffer()), {
    dailyBaseCents: 6700,
    totalBaseCents: 26800,
    taxesCents: 1200,
    mandatoryFeesCents: 800,
    totalPriceCents: 28800,
    days: 4,
  })
})

test('normalizes a resolved provider car offer into a canonical bookable entity', () => {
  const entity = normalizeCarInventory(buildRawOffer(), buildInventoryId(), {
    providerName: CAR_PROVIDER_NAME,
    snapshotTimestamp: '2026-03-13T21:00:00.000Z',
  })

  assert.ok(entity)
  assert.equal(entity?.vertical, 'car')
  assert.equal(entity?.payload.providerInventoryId, 777)
  assert.equal(entity?.payload.ratePlanCode, 'suv-flex')
  assert.equal(entity?.payload.policy?.freeCancellation, true)
  assert.equal(entity?.payload.priceSummary?.totalPriceCents, 28800)
  assert.equal(entity?.payload.providerMetadata?.providerName, CAR_PROVIDER_NAME)
  assert.equal(entity?.snapshotTimestamp, '2026-03-13T21:00:00.000Z')
})

test('normalizes a live car price into a canonical price quote', () => {
  const quote = normalizeCarPriceQuote({
    provider: CAR_PROVIDER_NAME,
    inventoryId: 777,
    currencyCode: 'usd',
    dailyBaseCents: 6700,
    totalBaseCents: 26800,
    taxesCents: 1200,
    mandatoryFeesCents: 800,
    totalPriceCents: 28800,
    days: 4,
  })

  assert.deepEqual(quote, {
    currency: 'USD',
    amount: 288,
    base: 268,
    daily: 67,
    days: 4,
    taxes: 12,
    fees: 8,
  })
})

test('searches car inventory through the provider adapter and returns canonical entities', async () => {
  const offer = buildRawOffer()
  const adapter = createCarProviderAdapter({
    client: {
      async search(request) {
        assert.deepEqual(request, {
          citySlug: 'phoenix',
          cityName: 'Phoenix',
          pickupDate: '2026-04-01',
          dropoffDate: '2026-04-05',
          pickupDateTime: '2026-04-01T10:00',
          dropoffDateTime: '2026-04-05T10:00',
          driverAge: 30,
          sort: 'recommended',
          filters: {
            vehicleClassKeys: [],
            pickupType: '',
            transmission: '',
            seatsMin: null,
            priceBand: '',
            freeCancellationOnly: false,
            payAtCounterOnly: false,
          },
        })

        return {
          provider: CAR_PROVIDER_NAME,
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
    vertical: 'car',
    pickupLocation: 'phoenix',
    dropoffLocation: 'phoenix',
    departDate: '2026-04-01',
    returnDate: '2026-04-05',
    driverAge: 30,
  })

  assert.equal(results.length, 1)
  const [firstResult] = results
  assert.equal(firstResult?.inventoryId, buildInventoryId())
  assert.equal(firstResult?.vertical, 'car')
  if (!firstResult || firstResult.vertical !== 'car') {
    assert.fail('expected a canonical car search entity')
  }

  const carResult = firstResult as CarSearchEntity
  assert.equal(carResult.payload.providerInventoryId, 777)
  assert.equal(carResult.payload.providerMetadata?.providerName, CAR_PROVIDER_NAME)
})

test('resolves car inventory and fetches live car pricing through the adapter', async () => {
  const inventoryId = buildInventoryId()
  const offer = buildRawOffer()
  let resolveCalls = 0
  let priceCalls = 0

  const adapter = createCarProviderAdapter({
    client: {
      async search() {
        return {
          provider: CAR_PROVIDER_NAME,
          request: {
            citySlug: 'phoenix',
            cityName: 'Phoenix',
            pickupDate: '2026-04-01',
            dropoffDate: '2026-04-05',
            pickupDateTime: '2026-04-01T10:00',
            dropoffDateTime: '2026-04-05T10:00',
            driverAge: 30,
            sort: 'recommended',
            filters: {
              vehicleClassKeys: [],
              pickupType: '',
              transmission: '',
              seatsMin: null,
              priceBand: '',
              freeCancellationOnly: false,
              payAtCounterOnly: false,
            },
          },
          results: [],
        }
      },
      async resolveInventory(lookup) {
        resolveCalls += 1
        assert.ok(lookup.providerInventoryId == null || lookup.providerInventoryId === 777)
        assert.equal(lookup.parsedInventory.providerLocationId, 'phx-airport')
        assert.equal(lookup.parsedInventory.vehicleClass, 'suv')
        return offer
      },
      async fetchPrice(lookup) {
        priceCalls += 1
        assert.equal(lookup.parsedInventory.vehicleClass, 'suv')
        return {
          provider: CAR_PROVIDER_NAME,
          inventoryId: 777,
          currencyCode: 'USD',
          dailyBaseCents: 6700,
          totalBaseCents: 26800,
          taxesCents: 1200,
          mandatoryFeesCents: 800,
          totalPriceCents: 28800,
          days: 4,
        }
      },
    },
  })

  const record = await adapter.resolveInventoryRecord?.({
    inventoryId,
    providerInventoryId: 777,
    checkedAt: '2026-03-13T20:00:00.000Z',
  })
  const entity = await adapter.resolveInventory(inventoryId)
  const price = await adapter.fetchPrice(inventoryId)

  assert.equal(resolveCalls, 2)
  assert.equal(priceCalls, 1)
  assert.equal(record?.entity.vertical, 'car')
  assert.equal(record?.isAvailable, true)
  assert.equal(record?.checkedAt, '2026-03-13T20:00:00.000Z')
  if (!record || record.entity.vertical !== 'car') {
    assert.fail('expected a canonical car inventory record')
  }

  assert.equal(record.entity.payload.providerMetadata?.providerName, CAR_PROVIDER_NAME)
  assert.equal(entity?.vertical, 'car')
  if (!entity || entity.vertical !== 'car') {
    assert.fail('expected a canonical car bookable entity')
  }

  assert.equal(entity.payload.ratePlanCode, 'suv-flex')
  assert.deepEqual(price, {
    currency: 'USD',
    amount: 288,
    base: 268,
    daily: 67,
    days: 4,
    taxes: 12,
    fees: 8,
  })
})

test('fails safely for malformed inventory ids, mismatched verticals, and missing offers', async () => {
  const adapter = createCarProviderAdapter({
    client: {
      async search() {
        return {
          provider: CAR_PROVIDER_NAME,
          request: {
            citySlug: 'phoenix',
            cityName: 'Phoenix',
            pickupDate: '2026-04-01',
            dropoffDate: '2026-04-05',
            pickupDateTime: '2026-04-01T10:00',
            dropoffDateTime: '2026-04-05T10:00',
            driverAge: null,
            sort: 'recommended',
            filters: {
              vehicleClassKeys: [],
              pickupType: '',
              transmission: '',
              seatsMin: null,
              priceBand: '',
              freeCancellationOnly: false,
              payAtCounterOnly: false,
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

  const flightInventoryId = buildFlightInventoryId({
    airlineCode: 'DL',
    flightNumber: '123',
    departDate: '2026-04-01',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })

  assert.equal(await adapter.resolveInventory('not-canonical'), null)
  assert.equal(await adapter.fetchPrice('not-canonical'), null)
  assert.equal(await adapter.resolveInventory(flightInventoryId), null)
  assert.equal(await adapter.fetchPrice(flightInventoryId), null)
  assert.equal(await adapter.resolveInventory(buildInventoryId()), null)
  assert.equal(await adapter.fetchPrice(buildInventoryId()), null)
})

test('returns null for unavailable car offers', async () => {
  const inventoryId = buildInventoryId()
  const adapter = createCarProviderAdapter({
    client: {
      async search() {
        return {
          provider: CAR_PROVIDER_NAME,
          request: {
            citySlug: 'phoenix',
            cityName: 'Phoenix',
            pickupDate: '2026-04-01',
            dropoffDate: '2026-04-05',
            pickupDateTime: '2026-04-01T10:00',
            dropoffDateTime: '2026-04-05T10:00',
            driverAge: null,
            sort: 'recommended',
            filters: {
              vehicleClassKeys: [],
              pickupType: '',
              transmission: '',
              seatsMin: null,
              priceBand: '',
              freeCancellationOnly: false,
              payAtCounterOnly: false,
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
  const adapter = createCarProviderAdapter({
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
      vertical: 'car',
      pickupLocation: 'phoenix',
      dropoffLocation: 'phoenix',
      departDate: '2026-04-01',
      returnDate: '2026-04-05',
    }),
    [],
  )
  assert.equal(await adapter.resolveInventory(buildInventoryId()), null)
  assert.equal(await adapter.fetchPrice(buildInventoryId()), null)
})
