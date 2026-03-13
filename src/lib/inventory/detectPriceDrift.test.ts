import assert from 'node:assert/strict'
import test from 'node:test'

const inventoryIdModule: typeof import('./inventory-id.ts') = await import(
  new URL('./inventory-id.ts', import.meta.url).href
)
const detectPriceDriftModule: typeof import('./detectPriceDrift.ts') = await import(
  new URL('./detectPriceDrift.ts', import.meta.url).href
)
const bookableEntityModule: typeof import('../booking/bookable-entity.ts') = await import(
  new URL('../booking/bookable-entity.ts', import.meta.url).href
)
const searchEntityModule: typeof import('../search/search-entity.ts') = await import(
  new URL('../search/search-entity.ts', import.meta.url).href
)

const { buildHotelInventoryId } = inventoryIdModule
const { detectPriceDrift } = detectPriceDriftModule
const { toBookableEntityFromSearchEntity } = bookableEntityModule
const { toHotelSearchEntity } = searchEntityModule

const buildHotelEntity = (inventoryId: string) =>
  toBookableEntityFromSearchEntity(
    toHotelSearchEntity(
      {
        inventoryId: 555,
        slug: 'ace-hotel',
        name: 'Ace Hotel',
        neighborhood: 'Downtown',
        stars: 4,
        rating: 8.9,
        reviewCount: 321,
        priceFrom: 189,
        currency: 'USD',
        image: '/img/hotel.jpg',
      },
      {
        checkInDate: '2026-04-01',
        checkOutDate: '2026-04-05',
        occupancy: 2,
        roomType: 'suite',
        priceAmountCents: 18900,
        snapshotTimestamp: '2026-03-13T18:30:00.000Z',
      },
    ),
  )

const buildProvider = (fetchPrice: () => Promise<import('~/types/pricing').PriceQuote | null>) => ({
  provider: 'hotel',
  async search() {
    return []
  },
  async resolveInventory() {
    return null
  },
  fetchPrice,
})

test('returns valid when the stored snapshot matches the live provider price', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'suite',
    occupancy: 2,
  })

  const result = await detectPriceDrift(
    inventoryId,
    {
      currency: 'USD',
      amount: 189,
    },
    {
      resolveInventoryFn: async () => buildHotelEntity(inventoryId),
      getProviderFn: () =>
        buildProvider(async () => ({
          currency: 'USD',
          amount: 189,
        })),
    },
  )

  assert.equal(result.status, 'valid')
  assert.deepEqual(result.oldPrice, {
    currency: 'USD',
    amount: 189,
  })
  assert.deepEqual(result.newPrice, {
    currency: 'USD',
    amount: 189,
  })
})

test('returns price_changed when the provider price differs from the snapshot', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'suite',
    occupancy: 2,
  })

  const result = await detectPriceDrift(
    inventoryId,
    {
      currency: 'USD',
      amount: 189,
    },
    {
      resolveInventoryFn: async () => buildHotelEntity(inventoryId),
      getProviderFn: () =>
        buildProvider(async () => ({
          currency: 'USD',
          amount: 219,
        })),
    },
  )

  assert.equal(result.status, 'price_changed')
  assert.deepEqual(result.newPrice, {
    currency: 'USD',
    amount: 219,
  })
})

test('returns unavailable when the inventory no longer resolves', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'suite',
    occupancy: 2,
  })

  const result = await detectPriceDrift(
    inventoryId,
    {
      currency: 'USD',
      amount: 189,
    },
    {
      resolveInventoryFn: async () => null,
      getProviderFn: () =>
        buildProvider(async () => ({
          currency: 'USD',
          amount: 189,
        })),
    },
  )

  assert.equal(result.status, 'unavailable')
  assert.equal(result.newPrice, null)
})

test('fails safely when inventory resolution throws', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'suite',
    occupancy: 2,
  })

  const result = await detectPriceDrift(
    inventoryId,
    {
      currency: 'USD',
      amount: 189,
    },
    {
      resolveInventoryFn: async () => {
        throw new Error('resolver timeout')
      },
      getProviderFn: () =>
        buildProvider(async () => ({
          currency: 'USD',
          amount: 189,
        })),
    },
  )

  assert.equal(result.status, 'unavailable')
  assert.equal(result.newPrice, null)
})

test('fails safely when the provider price lookup throws', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'suite',
    occupancy: 2,
  })

  const result = await detectPriceDrift(
    inventoryId,
    {
      currency: 'USD',
      amount: 189,
    },
    {
      resolveInventoryFn: async () => buildHotelEntity(inventoryId),
      getProviderFn: () =>
        buildProvider(async () => {
          throw new Error('provider timeout')
        }),
    },
  )

  assert.equal(result.status, 'unavailable')
  assert.equal(result.newPrice, null)
})

test('tolerates small rounding noise without flagging a price change', async () => {
  const inventoryId = buildHotelInventoryId({
    hotelId: 555,
    checkInDate: '2026-04-01',
    checkOutDate: '2026-04-05',
    roomType: 'suite',
    occupancy: 2,
  })

  const result = await detectPriceDrift(
    inventoryId,
    {
      currency: 'USD',
      amount: 189,
    },
    {
      resolveInventoryFn: async () => buildHotelEntity(inventoryId),
      getProviderFn: () =>
        buildProvider(async () => ({
          currency: 'USD',
          amount: 189.01,
        })),
    },
  )

  assert.equal(result.status, 'valid')
})
