import assert from 'node:assert/strict'
import test from 'node:test'

const routeParserModule: typeof import('./routeParser.ts') = await import(
  new URL('./routeParser.ts', import.meta.url).href
)

const {
  SearchRouteError,
  parseSearchRequestInput,
  parseSearchRoute,
} = routeParserModule

test('parses one-way and round-trip flight search routes', () => {
  assert.deepEqual(parseSearchRoute('/flights/search/orl-lax/2026-05-10'), {
    type: 'flight',
    origin: 'ORL',
    destination: 'LAX',
    departDate: '2026-05-10',
  })

  assert.deepEqual(
    parseSearchRoute('/flights/search/ORL-LAX/2026-05-10/return/2026-05-15'),
    {
      type: 'flight',
      origin: 'ORL',
      destination: 'LAX',
      departDate: '2026-05-10',
      returnDate: '2026-05-15',
    },
  )
})

test('parses hotel and car search routes into canonical search requests', () => {
  assert.deepEqual(
    parseSearchRoute('/hotels/search/las-vegas-nv-us/2026-05-10/2026-05-15'),
    {
      type: 'hotel',
      city: 'las-vegas-nv-us',
      checkIn: '2026-05-10',
      checkOut: '2026-05-15',
    },
  )

  assert.deepEqual(parseSearchRoute('/cars/search/lax/2026-05-10/2026-05-15'), {
    type: 'car',
    airport: 'LAX',
    departDate: '2026-05-10',
    returnDate: '2026-05-15',
  })
})

test('parses direct SearchRequest query input with route-compatible validation', () => {
  const input = new URLSearchParams({
    type: 'hotel',
    city: 'miami-fl-us',
    checkIn: '2026-06-01',
    checkOut: '2026-06-05',
  })

  assert.deepEqual(parseSearchRequestInput(input), {
    type: 'hotel',
    city: 'miami-fl-us',
    checkIn: '2026-06-01',
    checkOut: '2026-06-05',
  })
})

test('returns malformed route errors for unsupported route patterns', () => {
  assert.throws(
    () => parseSearchRoute('/flights/search/orllax/2026-05-10'),
    (error: unknown) => {
      assert.ok(error instanceof SearchRouteError)
      assert.equal(error.code, 'malformed_route')
      return true
    },
  )
})

test('returns invalid date errors for impossible or inverted date ranges', () => {
  assert.throws(
    () => parseSearchRoute('/hotels/search/las-vegas/2026-02-30/2026-03-02'),
    (error: unknown) => {
      assert.ok(error instanceof SearchRouteError)
      assert.equal(error.code, 'invalid_date')
      assert.equal(error.field, 'checkIn')
      return true
    },
  )

  assert.throws(
    () => parseSearchRoute('/cars/search/LAX/2026-05-10/2026-05-10'),
    (error: unknown) => {
      assert.ok(error instanceof SearchRouteError)
      assert.equal(error.code, 'invalid_date')
      assert.equal(error.field, 'returnDate')
      return true
    },
  )

  assert.throws(
    () => parseSearchRoute('/hotels/search/las-vegas-nv-us/2026-05-15/2026-05-10'),
    (error: unknown) => {
      assert.ok(error instanceof SearchRouteError)
      assert.equal(error.code, 'invalid_date')
      assert.equal(error.field, 'checkOut')
      return true
    },
  )

  assert.throws(
    () => parseSearchRoute('/flights/search/ORL-LAX/2026-05-10/return/2026-05-09'),
    (error: unknown) => {
      assert.ok(error instanceof SearchRouteError)
      assert.equal(error.code, 'invalid_date')
      assert.equal(error.field, 'returnDate')
      return true
    },
  )
})

test('returns invalid location errors for malformed location tokens', () => {
  assert.throws(
    () => parseSearchRoute('/cars/search/lax-airport/2026-05-10/2026-05-12'),
    (error: unknown) => {
      assert.ok(error instanceof SearchRouteError)
      assert.equal(error.code, 'invalid_location_code')
      assert.equal(error.field, 'airport')
      return true
    },
  )

  assert.throws(
    () => parseSearchRoute('/flights/search/ORLL-LAX/2026-05-10'),
    (error: unknown) => {
      assert.ok(error instanceof SearchRouteError)
      assert.equal(error.code, 'invalid_location_code')
      assert.equal(error.field, 'origin')
      return true
    },
  )

  assert.throws(
    () => parseSearchRoute('/hotels/search/las_vegas/2026-05-10/2026-05-15'),
    (error: unknown) => {
      assert.ok(error instanceof SearchRouteError)
      assert.equal(error.code, 'invalid_location_code')
      assert.equal(error.field, 'city')
      return true
    },
  )

  assert.throws(
    () =>
      parseSearchRequestInput(
        new URLSearchParams({
          type: 'flight',
          origin: 'LAX',
          destination: 'LAX',
          departDate: '2026-05-10',
        }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof SearchRouteError)
      assert.equal(error.code, 'invalid_location_code')
      assert.equal(error.field, 'destination')
      return true
    },
  )
})

test('returns malformed route errors for invalid canonical flight route tokens', () => {
  assert.throws(
    () => parseSearchRoute('/flights/search/INVALID/2026-05-10'),
    (error: unknown) => {
      assert.ok(error instanceof SearchRouteError)
      assert.equal(error.code, 'malformed_route')
      assert.equal(error.field, 'route')
      return true
    },
  )
})
