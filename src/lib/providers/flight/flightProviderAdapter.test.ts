import assert from 'node:assert/strict'
import test from 'node:test'

import type { FlightSearchEntity } from '~/types/search-entity'

const inventoryIdModule: typeof import('../../inventory/inventory-id.ts') = await import(
  new URL('../../inventory/inventory-id.ts', import.meta.url).href
)
const adapterModule: typeof import('./flightProviderAdapter.ts') = await import(
  new URL('./flightProviderAdapter.ts', import.meta.url).href
)
const constantsModule: typeof import('./constants.ts') = await import(
  new URL('./constants.ts', import.meta.url).href
)
const mapParamsModule: typeof import('./mapFlightSearchParams.ts') = await import(
  new URL('./mapFlightSearchParams.ts', import.meta.url).href
)
const normalizeSearchModule: typeof import('./normalizeFlightSearchResult.ts') = await import(
  new URL('./normalizeFlightSearchResult.ts', import.meta.url).href
)
const normalizeInventoryModule: typeof import('./normalizeFlightInventory.ts') = await import(
  new URL('./normalizeFlightInventory.ts', import.meta.url).href
)

const { buildFlightInventoryId } = inventoryIdModule
const { createFlightProviderAdapter } = adapterModule
const { FLIGHT_PROVIDER_NAME } = constantsModule
const { mapFlightSearchParams } = mapParamsModule
const { normalizeFlightSearchResult } = normalizeSearchModule
const { normalizeFlightInventory, normalizeFlightPriceQuote } = normalizeInventoryModule

const buildRawOffer = (
  overrides: Partial<import('./flightProviderClient.ts').FlightProviderRawOffer> = {},
): import('./flightProviderClient.ts').FlightProviderRawOffer => ({
  itineraryId: 321,
  airlineName: 'Delta',
  airlineCode: 'DL',
  itineraryType: 'one-way',
  serviceDate: '2026-04-01',
  requestedServiceDate: '2026-04-01',
  originCode: 'JFK',
  destinationCode: 'LAX',
  departureAt: '2026-04-01T14:00:00.000Z',
  arrivalAt: '2026-04-01T20:05:00.000Z',
  flightNumber: '123',
  stops: 0,
  durationMinutes: 365,
  cabinClass: 'economy',
  fareCode: 'standard',
  priceAmountCents: 39900,
  currencyCode: 'USD',
  refundable: false,
  changeable: true,
  checkedBagsIncluded: 1,
  seatsRemaining: 4,
  freshnessTimestamp: '2026-03-13T20:00:00.000Z',
  segments: [
    {
      segmentOrder: 0,
      marketingCarrier: 'Delta',
      marketingCarrierCode: 'DL',
      operatingCarrier: 'Delta',
      operatingCarrierCode: 'DL',
      flightNumber: '123',
      originCode: 'JFK',
      destinationCode: 'LAX',
      departureAt: '2026-04-01T14:00:00.000Z',
      arrivalAt: '2026-04-01T20:05:00.000Z',
      durationMinutes: 365,
    },
  ],
  ...overrides,
})

const buildInventoryId = () =>
  buildFlightInventoryId({
    airlineCode: 'DL',
    flightNumber: '123',
    departDate: '2026-04-01',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })

test('maps canonical flight search params into a provider request shape', () => {
  const request = mapFlightSearchParams({
    vertical: 'flight',
    origin: 'new-york',
    destination: 'LAX',
    departDate: '2026-04-01',
    returnDate: '2026-04-05',
    passengers: 2,
  })

  assert.deepEqual(request, {
    originIata: 'JFK',
    destinationIata: 'LAX',
    departDate: '2026-04-01',
    returnDate: '2026-04-05',
    passengers: 2,
    itineraryType: 'round-trip',
  })
})

test('normalizes a provider offer into a canonical flight search entity', () => {
  const entity = normalizeFlightSearchResult(
    buildRawOffer(),
    {
      vertical: 'flight',
      origin: 'JFK',
      destination: 'LAX',
      departDate: '2026-04-01',
      passengers: 1,
    },
    {
      providerName: FLIGHT_PROVIDER_NAME,
    },
  )

  assert.ok(entity)
  assert.equal(entity?.inventoryId, buildInventoryId())
  assert.equal(entity?.vertical, 'flight')
  assert.equal(entity?.payload.providerInventoryId, 321)
  assert.equal(entity?.payload.departureAt, '2026-04-01T14:00:00.000Z')
  assert.equal(entity?.payload.arrivalAt, '2026-04-01T20:05:00.000Z')
  assert.equal(entity?.payload.policy?.changeable, true)
  assert.equal(entity?.payload.segments?.length, 1)
  assert.equal(entity?.payload.providerMetadata?.providerName, FLIGHT_PROVIDER_NAME)
})

test('normalizes a resolved provider offer into a canonical bookable entity', () => {
  const entity = normalizeFlightInventory(buildRawOffer(), buildInventoryId(), {
    providerName: FLIGHT_PROVIDER_NAME,
    snapshotTimestamp: '2026-03-13T21:00:00.000Z',
  })

  assert.ok(entity)
  assert.equal(entity?.vertical, 'flight')
  assert.equal(entity?.payload.providerInventoryId, 321)
  assert.equal(entity?.payload.departureAt, '2026-04-01T14:00:00.000Z')
  assert.equal(entity?.payload.policy?.refundable, false)
  assert.equal(entity?.payload.segments?.[0]?.operatingCarrierCode, 'DL')
  assert.equal(entity?.payload.providerMetadata?.providerName, FLIGHT_PROVIDER_NAME)
  assert.equal(entity?.snapshotTimestamp, '2026-03-13T21:00:00.000Z')
})

test('preserves fallback flight inventory ids when the provider omits airline code and flight number', () => {
  const inventoryId = buildFlightInventoryId({
    carrier: 'WestJet',
    flightNumber: 'FCBB80D25B9F',
    departDate: '2026-04-01',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })

  const entity = normalizeFlightInventory(
    buildRawOffer({
      airlineName: 'WestJet',
      airlineCode: null,
      flightNumber: null,
    }),
    inventoryId,
    {
      providerName: FLIGHT_PROVIDER_NAME,
      snapshotTimestamp: '2026-03-13T21:00:00.000Z',
    },
  )

  assert.ok(entity)
  assert.equal(entity?.inventoryId, inventoryId)
  assert.equal(entity?.payload.providerInventoryId, 321)
  assert.equal(entity?.payload.providerMetadata?.providerName, FLIGHT_PROVIDER_NAME)
})

test('keeps itinerary-id fallback routes stable without surfacing the fallback id as a flight label', () => {
  const inventoryId = buildFlightInventoryId({
    carrier: 'WestJet',
    flightNumber: '321',
    departDate: '2026-04-01',
    originCode: 'JFK',
    destinationCode: 'LAX',
  })

  const entity = normalizeFlightInventory(
    buildRawOffer({
      airlineName: 'WestJet',
      airlineCode: null,
      flightNumber: null,
    }),
    inventoryId,
    {
      providerName: FLIGHT_PROVIDER_NAME,
      snapshotTimestamp: '2026-03-13T21:00:00.000Z',
    },
  )

  assert.ok(entity)
  assert.equal(entity?.inventoryId, inventoryId)
  assert.equal(entity?.bookingContext.flightNumber, null)
  assert.equal(entity?.payload.providerInventoryId, 321)
})

test('normalizes a live provider price into a canonical price quote', () => {
  const quote = normalizeFlightPriceQuote({
    provider: FLIGHT_PROVIDER_NAME,
    itineraryId: 321,
    currencyCode: 'usd',
    priceAmountCents: 39900,
    refundable: false,
    changeable: true,
    checkedBagsIncluded: 1,
    seatsRemaining: 4,
  })

  assert.deepEqual(quote, {
    currency: 'USD',
    amount: 399,
  })
})

test('searches inventory through the flight provider adapter and returns canonical entities', async () => {
  const offer = buildRawOffer()
  const adapter = createFlightProviderAdapter({
    client: {
      async search(request) {
        assert.deepEqual(request, {
          originIata: 'JFK',
          destinationIata: 'LAX',
          departDate: '2026-04-01',
          returnDate: null,
          passengers: 1,
          itineraryType: 'one-way',
        })

        return {
          provider: FLIGHT_PROVIDER_NAME,
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
    vertical: 'flight',
    origin: 'JFK',
    destination: 'LAX',
    departDate: '2026-04-01',
    passengers: 1,
  })

  assert.equal(results.length, 1)
  const [firstResult] = results
  assert.equal(firstResult?.inventoryId, buildInventoryId())
  assert.equal(firstResult?.vertical, 'flight')
  if (!firstResult || firstResult.vertical !== 'flight') {
    assert.fail('expected a canonical flight search entity')
  }

  const flightResult = firstResult as FlightSearchEntity
  assert.equal(flightResult.payload.providerInventoryId, 321)
  assert.equal(flightResult.payload.providerMetadata?.providerName, FLIGHT_PROVIDER_NAME)
})

test('resolves inventory and fetches price through the flight provider adapter', async () => {
  const inventoryId = buildInventoryId()
  const offer = buildRawOffer()
  let resolveCalls = 0
  let priceCalls = 0

  const adapter = createFlightProviderAdapter({
    client: {
      async search() {
        return {
          provider: FLIGHT_PROVIDER_NAME,
          request: {
            originIata: 'JFK',
            destinationIata: 'LAX',
            departDate: '2026-04-01',
            returnDate: null,
            passengers: 1,
            itineraryType: 'one-way',
          },
          results: [],
        }
      },
      async resolveInventory(lookup) {
        resolveCalls += 1
        assert.ok(lookup.providerInventoryId == null || lookup.providerInventoryId === 321)
        assert.equal(lookup.parsedInventory.departDate, '2026-04-01')
        return offer
      },
      async fetchPrice(lookup) {
        priceCalls += 1
        assert.equal(lookup.parsedInventory.flightNumber, '123')
        return {
          provider: FLIGHT_PROVIDER_NAME,
          itineraryId: 321,
          currencyCode: 'USD',
          priceAmountCents: 39900,
          refundable: false,
          changeable: true,
          checkedBagsIncluded: 1,
          seatsRemaining: 4,
        }
      },
    },
  })

  const record = await adapter.resolveInventoryRecord?.({
    inventoryId,
    providerInventoryId: 321,
    checkedAt: '2026-03-13T20:00:00.000Z',
  })
  const entity = await adapter.resolveInventory(inventoryId)
  const price = await adapter.fetchPrice(inventoryId)

  assert.equal(resolveCalls, 2)
  assert.equal(priceCalls, 1)
  assert.equal(record?.entity.vertical, 'flight')
  assert.equal(record?.isAvailable, true)
  assert.equal(record?.checkedAt, '2026-03-13T20:00:00.000Z')
  if (!record || record.entity.vertical !== 'flight') {
    assert.fail('expected a canonical flight inventory record')
  }

  assert.equal(record.entity.payload.providerMetadata?.providerName, FLIGHT_PROVIDER_NAME)
  assert.equal(entity?.vertical, 'flight')
  if (!entity || entity.vertical !== 'flight') {
    assert.fail('expected a canonical flight bookable entity')
  }

  assert.equal(entity.payload.policy?.checkedBagsIncluded, 1)
  assert.deepEqual(price, {
    currency: 'USD',
    amount: 399,
  })
})

test('fails safely for malformed inventory ids and missing offers', async () => {
  const adapter = createFlightProviderAdapter({
    client: {
      async search() {
        return {
          provider: FLIGHT_PROVIDER_NAME,
          request: {
            originIata: 'JFK',
            destinationIata: 'LAX',
            departDate: '2026-04-01',
            returnDate: null,
            passengers: 1,
            itineraryType: 'one-way',
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

  assert.equal(await adapter.resolveInventory('not-canonical'), null)
  assert.equal(await adapter.fetchPrice('not-canonical'), null)
  assert.equal(await adapter.resolveInventory(buildInventoryId()), null)
  assert.equal(await adapter.fetchPrice(buildInventoryId()), null)
})

test('handles provider client failures without leaking provider-specific errors', async () => {
  const adapter = createFlightProviderAdapter({
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
      vertical: 'flight',
      origin: 'JFK',
      destination: 'LAX',
      departDate: '2026-04-01',
      passengers: 1,
    }),
    [],
  )
  assert.equal(await adapter.resolveInventory(buildInventoryId()), null)
  assert.equal(await adapter.fetchPrice(buildInventoryId()), null)
})
