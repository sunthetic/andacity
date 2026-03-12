# Seed Generation

This project now uses a deterministic rolling dense horizon for local inventory generation.

## Defaults

- Seed key: `andacity-seed-v2-rolling-horizon`
- Canonical city catalog: `src/seed/cities/top-100.js` plus `src/seed/cities/additional-50.js`
- Total seeded cities: `150`
- Dense-city cutoff: top `100`
- Default horizon: `120 days`
- Supported presets: `90`, `120`, `180`

## Runtime Config

The dense horizon is centrally controlled in `src/seed/config/seed-config.js`.

Primary knobs:

- `HORIZON_DAYS`
- `HORIZON_START_DATE`
- `HOTELS_DENSE_CITY_COUNT`
- `HOTELS_SECONDARY_CITY_COUNT`
- `CARS_DENSE_CITY_COUNT`
- `CARS_SECONDARY_CITY_COUNT`
- `FLIGHT_TARGET_ROUTES_PER_CITY`
- `FLIGHT_BASE_DAILY_ITINERARIES`
- `FLIGHT_POPULAR_DAILY_ITINERARIES`

CLI overrides are available on the seed scripts with:

- `--horizon-days`
- `--anchor-date`

## Output Strategy

Partitioned output lives under `seed/output/`.

- `cities/catalog.json`
- `hotels/{city}.json`
- `cars/{city}.json`
- `flights/pairings/{origin}.json`
- `flights/routes/{from}/{to}-{itinerary}.json`

Flights are still exported as route-level files on demand. The full dense temporal horizon is materialized directly into PostgreSQL in batches instead of being written as a giant file dump.

## Commands

Generator outputs:

- `npm run seed:generate`
- `npm run seed:generate:90`
- `npm run seed:generate:120`
- `npm run seed:generate:180`
- `npm run seed:generate -- --vertical hotels --city paris --horizon-days 120`
- `npm run seed:generate -- --vertical flights --from denver --to new-york --itinerary round-trip --depart 2026-06-12`

PostgreSQL regeneration:

- `npm run db:seed`
- `npm run db:seed:90`
- `npm run db:seed:120`
- `npm run db:seed:180`
- `npm run db:seed:hotels`
- `npm run db:seed:cars`
- `npm run db:seed:flights`
- `npm run db:seed:plan`

Validation:

- `npm run db:validate:inventory`
- `node scripts/validate/inventory-density.mjs --horizon-days 120 --json`

## Notes

- Hotels and cars preserve dense continuous availability by storing compact date windows instead of nightly row explosions.
- Flights now seed a dense route/date schedule inside the configured horizon while keeping fare variants in a separate table.
- `db:seed` defaults to `--reset` so shrinking the horizon does not leave stale rows behind.
