# Andacity PostgreSQL Architecture (Initial Layer)

## Stack Choice

Andacity now uses **Drizzle ORM + drizzle-kit + PostgreSQL (`pg`)** for the initial DB layer.

Why this stack:

- **Type-safe schema-first model** in TypeScript (`src/lib/db/schema.ts`)
- **SQL-first migration output** committed to the repo (`drizzle/*.sql`)
- **Lightweight runtime** with minimal abstraction overhead
- **Practical seeding path** from deterministic generators to relational tables

## Migration Workflow

Commands:

- `pnpm db:generate` -> generate SQL migration from schema
- `pnpm db:migrate` -> apply migrations
- `pnpm db:push` -> direct schema push for local experiments
- `pnpm db:studio` -> inspect data

Primary files:

- `drizzle.config.ts`
- `drizzle/0000_odd_domino.sql`
- `drizzle/meta/*`

## Domain Tables

### Geography

- `countries`
- `regions`
- `cities`
- `airports`

Key strategy:

- stable slugs and optional `seed_key`
- airport `iata_code` unique
- city popularity/featured rank fields for discovery ordering

### Hotels

- `hotel_brands`
- `hotels`
- `hotel_images`
- `hotel_amenities`
- `hotel_amenity_links`
- `hotel_offers`
- `hotel_availability_snapshots`

Design notes:

- hotel base record carries summary/search fields (`stars`, `rating`, `from_nightly_cents`)
- amenities are normalized via join table
- room/offer rows are separate from property row
- availability snapshot table supports date-window filtering without booking complexity

### Cars

- `car_providers`
- `car_vehicle_classes`
- `car_locations`
- `car_inventory`
- `car_inventory_images`
- `car_offers`

Design notes:

- inventory row holds supplier/location/policy context
- offer row holds rentable vehicle detail and price
- location supports airport vs city pickup

### Flights

- `airlines`
- `flight_routes`
- `flight_itineraries`
- `flight_segments`
- `flight_fares`

Design notes:

- route separates reusable origin/destination topology
- itinerary stores service date/time, stops, cabin class, and base fare
- segment table enables future route-shape detail expansion
- fare table allows multiple fare families per itinerary

### Trips (Planning Foundation)

- `trips`
- `trip_dates`
- `trip_items`

Design notes:

- `trips` stores planning metadata (`name`, `status`, `notes`, `metadata`) with no booking/payment coupling
- `trip_dates` holds overall trip date span with `auto` vs `manual` source for future planner controls
- `trip_items` normalizes hotel / flight / car segments with strict FK references to inventory entities
- item snapshots include lightweight render fields (title/subtitle/meta/image + price snapshot) without large blobs
- explicit item ordering (`position`) supports itinerary segment reorder flows

## Seed-to-DB Mapping

### Deterministic seed source

Current generators remain the source of truth:

- `src/seed/generators/generate-hotels.js`
- `src/seed/generators/generate-cars.js`
- `src/seed/generators/generate-flights.js`

### New mapping layer

- `src/seed/db/postgres-seed-payload.js`

This module converts generator output into table-targeted rows with stable natural keys (`slug`, `seed_key`, IATA, etc).

### Seed entrypoint

- `scripts/seed/postgres-seed.mjs`

Modes:

- `--mode plan` (default): preview row counts
- `--mode files`: write normalized table payload JSON files
- `--mode apply`: upsert into PostgreSQL in dependency order
- `--reset`: truncate seeded tables before apply (`truncate ... restart identity cascade`)
- `--schema andacity_app`: explicit target schema (defaults to `DB_SCHEMA` or `andacity_app`)

`--mode apply` now pins `search_path` to `<schema>,public` before writes and prints `persistedCounts` so seed output confirms actual DB row persistence.

Examples:

- `pnpm db:seed:plan`
- `node scripts/seed/postgres-seed.mjs --mode files --vertical hotels --city paris`
- `node scripts/seed/postgres-seed.mjs --mode apply --vertical flights --from denver --to tokyo --itinerary round-trip --depart 2026-06-12`

## Data Access Boundary

- DB client: `src/lib/db/client.server.ts`
- Schema contract: `src/lib/db/schema.ts`
- Repository boundary:
  - `src/lib/repos/hotels-repo.server.ts`
  - `src/lib/repos/car-rentals-repo.server.ts`
  - `src/lib/repos/flights-repo.server.ts`
  - `src/lib/repos/trips-repo.server.ts`
- Query mapping boundary:
  - `src/lib/queries/hotels-search.server.ts`
  - `src/lib/queries/car-rentals-search.server.ts`
  - `src/lib/queries/flights-search.server.ts`
  - `src/lib/queries/trips.server.ts`
- Runtime read switch:
  - `src/lib/db/read-switch.server.ts`

This keeps DB access out of route/components and creates a clean adapter path from current mock data.

## What Is Implemented vs Scaffolded

Implemented now:

- schema definitions for geography/hotels/cars/flights
- migration setup and first migration SQL
- DB seed payload mapping and apply pipeline
- DB client module and example repositories
- DB-backed Hotels path end-to-end (seed -> DB -> repos -> routes):
  - `/hotels`
  - `/hotels/in`
  - `/hotels/in/[citySlug]`
  - `/hotels/[slug]`
  - `/search/hotels/[query]/[pageNumber]`
  - `/sitemaps/hotels/[page].xml`
  - `/og/hotel/[slug].png`
  - destination top stays now read from DB (`/destinations/[slug]`)
- DB-backed Car Rentals path end-to-end (seed -> DB -> repos -> routes):
  - `/car-rentals`
  - `/car-rentals/in`
  - `/car-rentals/in/[citySlug]`
  - `/car-rentals/[slug]`
  - `/search/car-rentals/[query]/[pageNumber]`
  - search filters/sort/pagination are DB-backed via repository/query layer
- DB-backed Flights path end-to-end (seed -> DB -> repos -> routes):
  - `/flights`
  - `/search/flights/from/[fromLocationSlug]/to/[toLocationSlug]/[itineraryTypeSlug]/[pageNumber]`
  - search filters/sort/pagination are DB-backed via repository/query layer (no generator fallback)
  - seed coverage now defaults to broader route distribution (`--max-flight-routes` default: `1200`)

Scaffolded for next phase:

- richer multi-segment flight generation for stop-level realism
- query-level performance tuning after real data volume profiling

## Recommended Next Steps

1. Add integration tests for seeded DB parity against key route loaders (especially flight filters and paging).
2. Add follow-up query-plan tuning (`EXPLAIN ANALYZE`) for high-volume flight route/date searches.
3. Expand multi-segment flight realism (segment-level stop chains, layover windows, fare families).
4. If `public` schema permissions are restricted, keep `DATABASE_URL` search path set to your app schema (for example `andacity_app,public`).
