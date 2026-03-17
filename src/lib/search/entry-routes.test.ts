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

test('buildCanonicalFlightSearchHref emits the canonical /flights/search route with query state', () => {
  const fromLocation = createLocation({
    locationId: 'loc-from',
    searchSlug: 'orlando-fl-us',
    airportCode: 'ORL',
    primaryAirportCode: 'ORL',
    displayName: 'Orlando (ORL)',
  })
  const toLocation = createLocation({
    locationId: 'loc-to',
    searchSlug: 'los-angeles-ca-us',
    airportCode: 'LAX',
    primaryAirportCode: 'LAX',
    displayName: 'Los Angeles (LAX)',
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
    '/flights/search/ORL-LAX/2026-06-10/return/2026-06-15?itineraryType=round-trip&fromLocationId=loc-from&toLocationId=loc-to&from=Orlando+%28ORL%29&to=Los+Angeles+%28LAX%29&depart=2026-06-10&return=2026-06-15&travelers=2&cabin=business',
  )
})

test('buildCanonicalFlightSearchHref omits round-trip-only fields for one-way searches', () => {
  const href = buildCanonicalFlightSearchHref({
    fromLocation: createLocation({
      locationId: 'loc-from',
      searchSlug: 'phoenix-az-us',
      airportCode: 'PHX',
      primaryAirportCode: 'PHX',
      displayName: 'Phoenix (PHX)',
    }),
    toLocation: createLocation({
      locationId: 'loc-to',
      searchSlug: 'seattle-wa-us',
      airportCode: 'SEA',
      primaryAirportCode: 'SEA',
      displayName: 'Seattle (SEA)',
    }),
    itineraryType: 'one-way',
    departDate: '2026-07-01',
    returnDate: '2026-07-05',
    travelers: '1',
    cabin: '',
  })

  assert.equal(
    href,
    '/flights/search/PHX-SEA/2026-07-01?itineraryType=one-way&fromLocationId=loc-from&toLocationId=loc-to&from=Phoenix+%28PHX%29&to=Seattle+%28SEA%29&depart=2026-07-01&travelers=1',
  )
})

test('buildCanonicalHotelSearchHref emits hotel routes with normalized query params', () => {
  const href = buildCanonicalHotelSearchHref({
    destinationLocation: createLocation({
      locationId: 'hotel-loc',
      searchSlug: 'miami-fl-us',
      citySlug: 'miami-fl-us',
      displayName: 'Miami, Florida',
    }),
    checkIn: '2026-08-11',
    checkOut: '2026-08-14',
    guests: '2 guests · 1 room',
  })

  assert.equal(
    href,
    '/hotels/search/miami-fl-us/2026-08-11/2026-08-14?destinationLocationId=hotel-loc&destination=Miami%2C+Florida&checkIn=2026-08-11&checkOut=2026-08-14&guests=2+guests+%C2%B7+1+room',
  )
})

test('buildCanonicalCarSearchHref emits car routes with pickup metadata', () => {
  const href = buildCanonicalCarSearchHref({
    pickupLocation: createLocation({
      locationId: 'car-loc',
      searchSlug: 'las-vegas-nv-us',
      airportCode: 'LAS',
      primaryAirportCode: 'LAS',
      displayName: 'Las Vegas Airport (LAS)',
    }),
    pickupDate: '2026-09-03',
    dropoffDate: '2026-09-08',
    drivers: '2',
  })

  assert.equal(
    href,
    '/car-rentals/search/LAS/2026-09-03/2026-09-08?pickupLocationId=car-loc&q=Las+Vegas+Airport+%28LAS%29&pickupDate=2026-09-03&dropoffDate=2026-09-08&drivers=2',
  )
})
