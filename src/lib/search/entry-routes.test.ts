import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildCanonicalCarSearchHref,
  buildCanonicalFlightSearchHref,
  buildCanonicalHotelSearchHref,
} from '~/lib/search/entry-routes'
import type { CanonicalLocation } from '~/types/location'

const createLocation = (
  overrides: Partial<CanonicalLocation>,
): CanonicalLocation => ({
  locationId: 'loc-1',
  searchSlug: 'default-city',
  kind: 'city',
  cityId: 1,
  airportId: null,
  regionId: null,
  citySlug: 'default-city',
  cityName: 'Default City',
  airportName: null,
  airportCode: null,
  primaryAirportCode: null,
  stateOrProvinceName: null,
  stateOrProvinceCode: null,
  countryName: 'United States',
  countryCode: 'US',
  displayName: 'Default City',
  ...overrides,
})

test('buildCanonicalFlightSearchHref emits the existing canonical search route with query state', () => {
  const fromLocation = createLocation({
    locationId: 'loc-from',
    searchSlug: 'denver-co',
    displayName: 'Denver, Colorado',
  })
  const toLocation = createLocation({
    locationId: 'loc-to',
    searchSlug: 'new-york-ny',
    displayName: 'New York, New York',
  })

  const href = buildCanonicalFlightSearchHref({
    fromLocation,
    toLocation,
    itineraryType: 'round-trip',
    departDate: '2026-06-10',
    returnDate: '2026-06-15',
    travelers: '2',
    cabin: 'business',
  })

  assert.equal(
    href,
    '/search/flights/from/denver-co/to/new-york-ny/round-trip/1?fromLocationId=loc-from&toLocationId=loc-to&depart=2026-06-10&return=2026-06-15&travelers=2&cabin=business',
  )
})

test('buildCanonicalFlightSearchHref omits round-trip-only fields for one-way searches', () => {
  const href = buildCanonicalFlightSearchHref({
    fromLocation: createLocation({
      locationId: 'loc-from',
      searchSlug: 'phoenix-az',
    }),
    toLocation: createLocation({
      locationId: 'loc-to',
      searchSlug: 'seattle-wa',
    }),
    itineraryType: 'one-way',
    departDate: '2026-07-01',
    returnDate: '2026-07-05',
    travelers: '1',
    cabin: '',
  })

  assert.equal(
    href,
    '/search/flights/from/phoenix-az/to/seattle-wa/one-way/1?fromLocationId=loc-from&toLocationId=loc-to&depart=2026-07-01&travelers=1',
  )
})

test('buildCanonicalHotelSearchHref emits hotel routes with normalized query params', () => {
  const href = buildCanonicalHotelSearchHref({
    destinationLocation: createLocation({
      locationId: 'hotel-loc',
      searchSlug: 'miami-fl',
    }),
    checkIn: '2026-08-11',
    checkOut: '2026-08-14',
    guests: '2 guests · 1 room',
  })

  assert.equal(
    href,
    '/search/hotels/miami-fl/1?destinationLocationId=hotel-loc&checkIn=2026-08-11&checkOut=2026-08-14&guests=2+guests+%C2%B7+1+room',
  )
})

test('buildCanonicalCarSearchHref emits car routes with pickup metadata', () => {
  const href = buildCanonicalCarSearchHref({
    pickupLocation: createLocation({
      locationId: 'car-loc',
      searchSlug: 'las-vegas-nv',
    }),
    pickupDate: '2026-09-03',
    dropoffDate: '2026-09-08',
    drivers: '2',
  })

  assert.equal(
    href,
    '/search/car-rentals/las-vegas-nv/1?pickupLocationId=car-loc&pickupDate=2026-09-03&dropoffDate=2026-09-08&drivers=2',
  )
})
