import assert from 'node:assert/strict'
import test from 'node:test'

const inventoryIdModule: typeof import('../inventory/inventory-id.ts') = await import(
  new URL('../inventory/inventory-id.ts', import.meta.url).href
)
const cacheModule: typeof import('./search-cache.ts') = await import(
  new URL('./search-cache.ts', import.meta.url).href
)
const searchEntityModule: typeof import('./search-entity.ts') = await import(
  new URL('./search-entity.ts', import.meta.url).href
)
const normalizeModule: typeof import('./normalizeSearchResults.ts') = await import(
  new URL('./normalizeSearchResults.ts', import.meta.url).href
)
const routingModule: typeof import('../entities/routing.ts') = await import(
  new URL('../entities/routing.ts', import.meta.url).href
)
const flightConstantsModule: typeof import('../providers/flight/constants.ts') = await import(
  new URL('../providers/flight/constants.ts', import.meta.url).href
)
const hotelConstantsModule: typeof import('../providers/hotel/constants.ts') = await import(
  new URL('../providers/hotel/constants.ts', import.meta.url).href
)
const carConstantsModule: typeof import('../providers/car/constants.ts') = await import(
  new URL('../providers/car/constants.ts', import.meta.url).href
)

const { buildCarInventoryId, buildFlightInventoryId, buildHotelInventoryId } = inventoryIdModule
const { getCachedResults, getSearchCacheKey, setCachedResults, clearSearchCache } = cacheModule
const { toBookableEntity } = searchEntityModule
const { normalizeSearchResults } = normalizeModule
const { buildCarEntityHref, buildFlightEntityHref, buildHotelEntityHref } = routingModule
const { FLIGHT_PROVIDER_NAME } = flightConstantsModule
const { HOTEL_PROVIDER_NAME } = hotelConstantsModule
const { CAR_PROVIDER_NAME } = carConstantsModule

test.beforeEach(() => {
  clearSearchCache()
})

const buildFlightOffer = (
  overrides: Partial<import('../providers/flight/flightProviderClient.ts').FlightProviderRawOffer> = {},
): import('../providers/flight/flightProviderClient.ts').FlightProviderRawOffer => ({
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

const buildHotelOffer = (
  overrides: Partial<import('../providers/hotel/hotelProviderClient.ts').HotelProviderRawOffer> = {},
): import('../providers/hotel/hotelProviderClient.ts').HotelProviderRawOffer => ({
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
  roomSleeps: 3,
  beds: '1 king bed',
  sizeSqft: 420,
  providerOfferId: 'ace-flex-king',
  ratePlanId: 'flexible-pay-later-breakfast-included',
  ratePlan: 'Flexible rate · Pay later · Breakfast included',
  boardType: 'breakfast-included',
  cancellationPolicy: 'free-cancellation',
  refundable: true,
  freeCancellation: true,
  payLater: true,
  noResortFees: true,
  offerBadges: ['Breakfast included'],
  offerFeatures: ['Late checkout'],
  inclusions: ['Breakfast included', 'Late checkout'],
  addressLine: '123 Broadway, New York, NY',
  checkInTime: '3:00 PM',
  checkOutTime: '11:00 AM',
  summary: 'Boutique stay in lower Manhattan.',
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

const buildCarOffer = (
  overrides: Partial<import('../providers/car/carProviderClient.ts').CarProviderRawOffer> = {},
): import('../providers/car/carProviderClient.ts').CarProviderRawOffer => ({
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

test('routes raw provider offers into canonical entities for every vertical', () => {
  const flightResults = normalizeSearchResults(
    'flight',
    [buildFlightOffer()],
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

  assert.equal(flightResults.length, 1)
  assert.equal(
    flightResults[0]?.inventoryId,
    buildFlightInventoryId({
      airlineCode: 'DL',
      flightNumber: '123',
      departDate: '2026-04-01',
      originCode: 'JFK',
      destinationCode: 'LAX',
    }),
  )
  assert.equal(flightResults[0]?.href, buildFlightEntityHref(flightResults[0]!))
  assert.deepEqual(flightResults[0]?.bookableSnapshot, toBookableEntity(flightResults[0]!))

  const hotelResults = normalizeSearchResults(
    'hotel',
    [buildHotelOffer()],
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

  assert.equal(hotelResults.length, 1)
  assert.equal(
    hotelResults[0]?.inventoryId,
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
    }),
  )
  assert.equal(hotelResults[0]?.payload.providerMetadata?.providerOfferId, 'ace-flex-king')
  assert.equal(hotelResults[0]?.href, buildHotelEntityHref(hotelResults[0]!))

  const carResults = normalizeSearchResults(
    'car',
    [buildCarOffer()],
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

  assert.equal(carResults.length, 1)
  assert.equal(
    carResults[0]?.inventoryId,
    buildCarInventoryId({
      providerLocationId: 'phx-airport',
      pickupDateTime: '2026-04-01T10:00',
      dropoffDateTime: '2026-04-05T10:00',
      vehicleClass: 'suv',
    }),
  )
  assert.equal(carResults[0]?.payload.providerMetadata?.providerLocationId, 'phx-airport')
  assert.equal(carResults[0]?.href, buildCarEntityHref(carResults[0]!))
})

test('remains deterministic and cache-safe across repeated normalizations', () => {
  const params = {
    vertical: 'car' as const,
    pickupLocation: 'phoenix',
    dropoffLocation: 'phoenix',
    departDate: '2026-04-01',
    returnDate: '2026-04-05',
    driverAge: 30,
  }

  const first = normalizeSearchResults('car', [buildCarOffer()], params, {
    providerName: CAR_PROVIDER_NAME,
  })
  const second = normalizeSearchResults('car', [buildCarOffer()], params, {
    providerName: CAR_PROVIDER_NAME,
  })

  assert.deepEqual(first, second)

  const cacheParams = {
    citySlug: 'phoenix',
    pickupDate: '2026-04-01',
    dropoffDate: '2026-04-05',
    vehicleClasses: ['suv'],
  }
  const cacheKey = getSearchCacheKey('car', cacheParams)
  setCachedResults('car', cacheKey, cacheParams, first)

  assert.deepEqual(getCachedResults<typeof first>(cacheKey), first)
})

test('drops malformed results and de-duplicates canonical inventory ids in provider order', () => {
  const results = normalizeSearchResults(
    'hotel',
    [
      buildHotelOffer(),
      null,
      { provider: HOTEL_PROVIDER_NAME, hotelId: 555 },
      buildHotelOffer({
        brandName: 'Different brand name that should lose to the first canonical entity',
      }),
    ],
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

  assert.equal(results.length, 1)
  assert.equal(results[0]?.provider, 'Ace Hotels')
  assert.equal(results[0]?.payload.providerMetadata?.providerOfferId, 'ace-flex-king')
})
