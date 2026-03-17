import assert from 'node:assert/strict'
import { Client } from 'pg'

const DEFAULT_DATABASE_URL = 'postgresql://andacity:andacity@localhost:5432/andacity'
const DEFAULT_DB_SCHEMA = 'andacity_app'
const HOTEL_SMOKE_CHECK_IN = '2026-04-01'
const HOTEL_SMOKE_CHECK_OUT = '2026-04-03'
const CAR_SMOKE_PICKUP = '2026-04-01T10-00'
const CAR_SMOKE_DROPOFF = '2026-04-03T10-00'

const resolveDbSchema = () => {
  const value = String(process.env.DB_SCHEMA || DEFAULT_DB_SCHEMA)
    .trim()
    .toLowerCase()

  return /^[a-z_][a-z0-9_]*$/.test(value) ? value : DEFAULT_DB_SCHEMA
}

const quoteIdent = (value) => {
  return `"${String(value).replaceAll('"', '""')}"`
}

const schemaName = resolveDbSchema()
const tableName = (name) => `${quoteIdent(schemaName)}.${quoteIdent(name)}`

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || DEFAULT_DATABASE_URL

const client = new Client({
  connectionString,
})

const log = (message) => {
  process.stdout.write(`${message}\n`)
}

const normalizeToken = (value, fallback) => {
  const text = String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return text ? text.toLowerCase() : fallback
}

const normalizeCarrierToken = (value, fallback) => {
  const text = String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '')
    .toUpperCase()

  return text || fallback
}

const buildHotelInventoryId = (inventory) =>
  `hotel:${inventory.id}:${inventory.startDate}:${inventory.endDate}:${normalizeToken(inventory.roomType, 'smoke-room')}:${inventory.occupancy}`

const buildCarInventoryId = (inventory) =>
  `car:${inventory.id}:${CAR_SMOKE_PICKUP}:${CAR_SMOKE_DROPOFF}:${normalizeToken(inventory.vehicleClass, 'economy')}`

const buildFlightInventoryId = (inventory) =>
  `flight:${inventory.carrier}:${inventory.flightNumber}:${inventory.startDate}:${inventory.originCode}:${inventory.destinationCode}`

const toIsoDateLiteral = (value) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  const text = String(value || '').trim()
  const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoMatch) return isoMatch[1]

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return text
}

const queryOne = async (text, params = []) => {
  const result = await client.query(text, params)
  return result.rows[0] || null
}

const queryRows = async (text, params = []) => {
  const result = await client.query(text, params)
  return result.rows
}

const findHotelInventory = async () => {
  return queryOne(
    `
      select
        h.id,
        h.city_id as "startCityId",
        h.city_id as "endCityId",
        h.from_nightly_cents as "snapshotPriceCents",
        h.currency_code as "snapshotCurrencyCode",
        h.name as title,
        c.name as "cityName"
      from ${tableName('hotels')} h
      inner join ${tableName('cities')} c on c.id = h.city_id
      order by h.id
      limit 1
    `,
  )
}

const findCarInventory = async () => {
  return queryOne(
    `
      select
        ci.id,
        ci.city_id as "startCityId",
        ci.city_id as "endCityId",
        ci.from_daily_cents as "snapshotPriceCents",
        ci.currency_code as "snapshotCurrencyCode",
        cp.name as title,
        c.name as "cityName"
      from ${tableName('car_inventory')} ci
      inner join ${tableName('car_providers')} cp on cp.id = ci.provider_id
      inner join ${tableName('cities')} c on c.id = ci.city_id
      order by ci.id
      limit 1
    `,
  )
}

const findFlightInventory = async () => {
  return queryOne(
    `
      select
        fi.id,
        fr.origin_city_id as "startCityId",
        fr.destination_city_id as "endCityId",
        coalesce(ff.price_cents, fi.base_price_cents) as "snapshotPriceCents",
        coalesce(ff.currency_code, fi.currency_code) as "snapshotCurrencyCode",
        a.name as title,
        a.iata_code as "airlineCode",
        fi.id::text as "flightNumber",
        fi.service_date as "serviceDate",
        origin_airport.iata_code as "originCode",
        destination_airport.iata_code as "destinationCode",
        origin_city.name as "originCityName",
        destination_city.name as "destinationCityName"
      from ${tableName('flight_itineraries')} fi
      inner join ${tableName('flight_routes')} fr on fr.id = fi.route_id
      inner join ${tableName('airlines')} a on a.id = fi.airline_id
      inner join ${tableName('airports')} origin_airport on origin_airport.id = fr.origin_airport_id
      inner join ${tableName('airports')} destination_airport on destination_airport.id = fr.destination_airport_id
      inner join ${tableName('cities')} origin_city on origin_city.id = fr.origin_city_id
      inner join ${tableName('cities')} destination_city on destination_city.id = fr.destination_city_id
      left join ${tableName('flight_fares')} ff
        on ff.itinerary_id = fi.id
       and ff.fare_code = 'standard'
       and ff.cabin_class = fi.cabin_class
      order by fi.id
      limit 1
    `,
  )
}

const verifySnapshotColumns = async () => {
  const rows = await queryRows(
    `
      select column_name
      from information_schema.columns
      where table_schema = $1
        and table_name = 'trip_items'
      order by ordinal_position
    `,
    [schemaName],
  )

  const columns = rows.map((row) => row.column_name)

  assert(columns.includes('inventory_id'), 'trip_items.inventory_id is missing')
  assert(columns.includes('snapshot_price_cents'), 'trip_items.snapshot_price_cents is missing')
  assert(columns.includes('snapshot_currency_code'), 'trip_items.snapshot_currency_code is missing')
  assert(columns.includes('snapshot_timestamp'), 'trip_items.snapshot_timestamp is missing')
}

const insertTrip = async () => {
  const trip = await queryOne(
    `
      insert into ${tableName('trips')} (name, status, metadata)
      values ($1, 'draft', $2::jsonb)
      returning id
    `,
    ['Trip pricing smoke check', '{}'],
  )

  assert(trip?.id, 'failed to insert smoke trip')

  await client.query(
    `
      insert into ${tableName('trip_dates')} (trip_id, source, start_date, end_date)
      values ($1, 'auto', null, null)
    `,
    [trip.id],
  )

  return trip.id
}

const insertTripItem = async (tripId, itemType, inventory) => {
  const result = await queryOne(
    `
      insert into ${tableName('trip_items')} (
        trip_id,
        item_type,
        inventory_id,
        position,
        hotel_id,
        flight_itinerary_id,
        car_inventory_id,
        start_city_id,
        end_city_id,
        start_date,
        end_date,
        snapshot_price_cents,
        snapshot_currency_code,
        title,
        subtitle,
        meta,
        metadata
      )
      values (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16::text[],
        $17::jsonb
      )
      returning id, snapshot_price_cents as "snapshotPriceCents", snapshot_currency_code as "snapshotCurrencyCode"
    `,
    [
      tripId,
      itemType,
      inventory.inventoryId,
      inventory.position,
      itemType === 'hotel' ? inventory.id : null,
      itemType === 'flight' ? inventory.id : null,
      itemType === 'car' ? inventory.id : null,
      inventory.startCityId,
      inventory.endCityId,
      inventory.startDate,
      inventory.endDate,
      inventory.snapshotPriceCents,
      inventory.snapshotCurrencyCode,
      inventory.title,
      inventory.subtitle,
      inventory.meta,
      JSON.stringify({ smoke: true, itemType }),
    ],
  )

  assert(result?.id, `failed to insert ${itemType} trip item`)
  return result
}

const verifyTripListAggregate = async (
  tripId,
  expectedItemCount,
  expectedTotalCents,
  expectedCurrencyCount,
) => {
  const row = await queryOne(
    `
      with trip_item_agg as (
        select
          trip_id,
          count(id)::int as item_count,
          coalesce(sum(snapshot_price_cents), 0)::int as estimated_total_cents,
          coalesce(max(snapshot_currency_code), 'USD') as currency_code,
          count(distinct snapshot_currency_code)::int as currency_count
        from ${tableName('trip_items')}
        group by trip_id
      )
      select
        t.id,
        coalesce(agg.item_count, 0)::int as item_count,
        coalesce(agg.estimated_total_cents, 0)::int as estimated_total_cents,
        coalesce(agg.currency_code, 'USD') as currency_code,
        coalesce(agg.currency_count, 0)::int as currency_count
      from ${tableName('trips')} t
      left join trip_item_agg agg on agg.trip_id = t.id
      where t.id = $1
    `,
    [tripId],
  )

  assert(row, 'trip list aggregate did not return the smoke trip')
  assert.equal(Number(row.item_count), expectedItemCount)
  assert.equal(Number(row.estimated_total_cents), expectedTotalCents)
  assert.equal(Number(row.currency_count), expectedCurrencyCount)
}

const verifyTripDetailJoin = async (tripId, expectedIds) => {
  const rows = await queryRows(
    `
      select
        ti.id,
        ti.item_type,
        ti.snapshot_price_cents,
        ti.snapshot_currency_code,
        ti.snapshot_timestamp,
        case
          when ti.item_type = 'hotel' then h.from_nightly_cents
          when ti.item_type = 'car' then ci.from_daily_cents
          else coalesce(ff.price_cents, fi.base_price_cents)
        end as current_price_cents,
        case
          when ti.item_type = 'hotel' then h.currency_code
          when ti.item_type = 'car' then ci.currency_code
          else coalesce(ff.currency_code, fi.currency_code)
        end as current_currency_code
      from ${tableName('trip_items')} ti
      left join ${tableName('hotels')} h on h.id = ti.hotel_id
      left join ${tableName('car_inventory')} ci on ci.id = ti.car_inventory_id
      left join ${tableName('flight_itineraries')} fi on fi.id = ti.flight_itinerary_id
      left join ${tableName('flight_fares')} ff
        on ff.itinerary_id = fi.id
       and ff.fare_code = 'standard'
       and ff.cabin_class = fi.cabin_class
      where ti.trip_id = $1
      order by ti.position, ti.id
    `,
    [tripId],
  )

  assert.equal(rows.length, expectedIds.length, 'trip detail join returned the wrong number of items')

  for (const row of rows) {
    assert(expectedIds.includes(Number(row.id)), `unexpected trip item ${row.id} returned`)
    assert.notEqual(row.snapshot_timestamp, null, `trip item ${row.id} is missing snapshot_timestamp`)
    assert.notEqual(row.current_price_cents, null, `trip item ${row.id} is missing current_price_cents`)
    assert.notEqual(row.current_currency_code, null, `trip item ${row.id} is missing current_currency_code`)
  }
}

const verifySnapshotImmutability = async (itemId) => {
  await client.query('savepoint trip_snapshot_immutable')

  let blocked = false
  try {
    await client.query(
      `
        update ${tableName('trip_items')}
        set snapshot_price_cents = snapshot_price_cents + 1
        where id = $1
      `,
      [itemId],
    )
  } catch (error) {
    blocked = /immutable/i.test(String(error?.message || ''))
    await client.query('rollback to savepoint trip_snapshot_immutable')
  } finally {
    await client.query('release savepoint trip_snapshot_immutable')
  }

  assert(blocked, 'snapshot immutability trigger did not block a snapshot update')
}

const buildInventoryCandidates = async () => {
  const candidates = []

  const hotel = await findHotelInventory()
  if (hotel) {
    const candidate = {
      itemType: 'hotel',
      position: candidates.length,
      id: Number(hotel.id),
      startCityId: Number(hotel.startCityId),
      endCityId: Number(hotel.endCityId),
      snapshotPriceCents: Number(hotel.snapshotPriceCents),
      snapshotCurrencyCode: String(hotel.snapshotCurrencyCode),
      title: String(hotel.title),
      subtitle: String(hotel.cityName),
      startDate: HOTEL_SMOKE_CHECK_IN,
      endDate: HOTEL_SMOKE_CHECK_OUT,
      roomType: 'smoke-room',
      occupancy: 2,
      meta: ['Smoke', 'Hotel'],
    }
    candidate.inventoryId = buildHotelInventoryId(candidate)
    candidates.push(candidate)
  }

  const car = await findCarInventory()
  if (car) {
    const candidate = {
      itemType: 'car',
      position: candidates.length,
      id: Number(car.id),
      startCityId: Number(car.startCityId),
      endCityId: Number(car.endCityId),
      snapshotPriceCents: Number(car.snapshotPriceCents),
      snapshotCurrencyCode: String(car.snapshotCurrencyCode),
      title: String(car.title),
      subtitle: String(car.cityName),
      startDate: CAR_SMOKE_PICKUP.slice(0, 10),
      endDate: CAR_SMOKE_DROPOFF.slice(0, 10),
      vehicleClass: 'economy',
      meta: ['Smoke', 'Car'],
    }
    candidate.inventoryId = buildCarInventoryId(candidate)
    candidates.push(candidate)
  }

  const flight = await findFlightInventory()
  if (flight) {
    const candidate = {
      itemType: 'flight',
      position: candidates.length,
      id: Number(flight.id),
      startCityId: Number(flight.startCityId),
      endCityId: Number(flight.endCityId),
      snapshotPriceCents: Number(flight.snapshotPriceCents),
      snapshotCurrencyCode: String(flight.snapshotCurrencyCode),
      title: String(flight.title),
      subtitle: `${flight.originCityName} -> ${flight.destinationCityName}`,
      startDate: toIsoDateLiteral(flight.serviceDate),
      endDate: toIsoDateLiteral(flight.serviceDate),
      carrier: normalizeCarrierToken(flight.airlineCode, normalizeCarrierToken(flight.title, 'FLIGHT')),
      flightNumber: normalizeCarrierToken(flight.flightNumber, String(flight.id)),
      originCode: String(flight.originCode),
      destinationCode: String(flight.destinationCode),
      meta: ['Smoke', 'Flight'],
    }
    candidate.inventoryId = buildFlightInventoryId(candidate)
    candidates.push(candidate)
  }

  assert(candidates.length > 0, 'no hotel, car, or flight inventory is available for the trip pricing smoke test')

  return candidates
}

const main = async () => {
  await client.connect()
  await client.query(`set search_path to ${quoteIdent(schemaName)}, public`)

  log(`Using schema ${schemaName}`)
  log('1. Verifying snapshot columns')
  await verifySnapshotColumns()

  log('2. Preparing smoke trip inventory')
  const inventoryCandidates = await buildInventoryCandidates()

  let inTransaction = false

  try {
    await client.query('begin')
    inTransaction = true

    const tripId = await insertTrip()
    const insertedItems = []

    for (const inventory of inventoryCandidates) {
      insertedItems.push(await insertTripItem(tripId, inventory.itemType, inventory))
    }

    const expectedTotalCents = insertedItems.reduce(
      (sum, item) => sum + Number(item.snapshotPriceCents),
      0,
    )
    const expectedCurrencyCount = new Set(
      insertedItems.map((item) => String(item.snapshotCurrencyCode)),
    ).size

    log('3. Verifying trip list aggregate query')
    await verifyTripListAggregate(
      tripId,
      insertedItems.length,
      expectedTotalCents,
      expectedCurrencyCount,
    )

    log('4. Verifying trip detail pricing join')
    await verifyTripDetailJoin(
      tripId,
      insertedItems.map((item) => Number(item.id)),
    )

    log('5. Verifying snapshot immutability trigger')
    await verifySnapshotImmutability(Number(insertedItems[0].id))

    await client.query('rollback')
    inTransaction = false
    log('Trip pricing smoke test passed')
  } finally {
    if (inTransaction) {
      await client.query('rollback')
    }

    await client.end()
  }
}

await main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`)
  process.exitCode = 1
})
