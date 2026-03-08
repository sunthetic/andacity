# Seed Generation

This project uses deterministic seed generators for hotels, cars, and flights.

## Deterministic Seed

- Seed key: `andacity-seed-v1`
- Canonical cities: `src/seed/cities/top-100.js` (100 cities)
- Runtime generators:
  - `src/seed/generators/generate-hotels.js`
  - `src/seed/generators/generate-cars.js`
  - `src/seed/generators/generate-flights.js`

## Output Strategy

Partitioned output lives under `seed/output/`.

- `cities/top-100.json`
- `hotels/{city}.json`
- `cars/{city}.json`
- `flights/pairings/{origin}.json`
- `flights/routes/{from}/{to}-{itinerary}.json` (optional route materialization)

Flights are generated on demand per route pairing to avoid storing millions of static rows.

## Commands

- Full generation:
  - `npm run seed:generate`
- Regenerate only one vertical:
  - `npm run seed:generate -- --vertical hotels`
  - `npm run seed:generate -- --vertical cars`
  - `npm run seed:generate -- --vertical flights`
- Generate one city partition:
  - `npm run seed:generate -- --vertical hotels --city paris`
  - `npm run seed:generate -- --vertical cars --city tokyo`
- Generate one concrete flight route payload:
  - `npm run seed:generate -- --vertical flights --from denver --to new-york --itinerary round-trip --depart 2026-06-12`

## PostgreSQL Seed Target

This repo now includes a deterministic generator-to-Postgres mapping path.

- Mapping module:
  - `src/seed/db/postgres-seed-payload.js`
- Entry script:
  - `scripts/seed/postgres-seed.mjs`

Useful commands:

- Preview table row counts without writing:
  - `npm run db:seed:plan`
- Write normalized table JSON payloads:
  - `node scripts/seed/postgres-seed.mjs --mode files --vertical all`
- Apply/upsert into PostgreSQL (requires `DATABASE_URL`):
  - `npm run db:seed`
