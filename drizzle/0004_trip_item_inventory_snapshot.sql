ALTER TABLE "trip_items" ADD COLUMN "inventory_id" text;--> statement-breakpoint

UPDATE "trip_items"
SET "inventory_id" = btrim("metadata"->>'inventoryId')
WHERE "inventory_id" IS NULL
  AND (
    ("item_type" = 'hotel' AND btrim("metadata"->>'inventoryId') LIKE 'hotel:%')
    OR ("item_type" = 'flight' AND btrim("metadata"->>'inventoryId') LIKE 'flight:%')
    OR ("item_type" = 'car' AND btrim("metadata"->>'inventoryId') LIKE 'car:%')
  );--> statement-breakpoint

UPDATE "trip_items"
SET "inventory_id" = concat(
  'hotel:',
  "hotel_id",
  ':',
  COALESCE("start_date"::text, '1970-01-01'),
  ':',
  COALESCE("end_date"::text, "start_date"::text, '1970-01-02'),
  ':standard:2'
)
WHERE "inventory_id" IS NULL
  AND "item_type" = 'hotel';--> statement-breakpoint

UPDATE "trip_items"
SET "inventory_id" = concat(
  'car:',
  "car_inventory_id",
  ':',
  COALESCE("start_date"::text, '1970-01-01'),
  'T10-00:',
  COALESCE("end_date"::text, "start_date"::text, '1970-01-02'),
  'T10-00:standard'
)
WHERE "inventory_id" IS NULL
  AND "item_type" = 'car';--> statement-breakpoint

WITH "primary_segment" AS (
  SELECT DISTINCT ON ("itinerary_id")
    "itinerary_id",
    "airline_id",
    "operating_flight_number"
  FROM "flight_segments"
  ORDER BY "itinerary_id", "segment_order"
)
UPDATE "trip_items" AS "ti"
SET "inventory_id" = concat(
  'flight:',
  COALESCE(
    NULLIF(
      regexp_replace(
        upper(COALESCE("segment_airline"."iata_code", "itinerary_airline"."iata_code", 'UNKNOWN')),
        '[^A-Z0-9]',
        '',
        'g'
      ),
      ''
    ),
    'UNKNOWN'
  ),
  ':',
  COALESCE(
    NULLIF(
      regexp_replace(
        upper(COALESCE("segment"."operating_flight_number", "ti"."flight_itinerary_id"::text, 'UNKNOWN')),
        '[^A-Z0-9]',
        '',
        'g'
      ),
      ''
    ),
    'UNKNOWN'
  ),
  ':',
  COALESCE("itinerary"."service_date"::text, "ti"."start_date"::text, '1970-01-01'),
  ':',
  COALESCE(
    NULLIF(
      regexp_replace(upper(COALESCE("origin_airport"."iata_code", 'UNKNOWN')), '[^A-Z0-9]', '', 'g'),
      ''
    ),
    'UNKNOWN'
  ),
  ':',
  COALESCE(
    NULLIF(
      regexp_replace(
        upper(COALESCE("destination_airport"."iata_code", 'UNKNOWN')),
        '[^A-Z0-9]',
        '',
        'g'
      ),
      ''
    ),
    'UNKNOWN'
  )
)
FROM "flight_itineraries" AS "itinerary"
LEFT JOIN "primary_segment" AS "segment" ON "segment"."itinerary_id" = "itinerary"."id"
LEFT JOIN "airlines" AS "segment_airline" ON "segment_airline"."id" = "segment"."airline_id"
LEFT JOIN "airlines" AS "itinerary_airline" ON "itinerary_airline"."id" = "itinerary"."airline_id"
LEFT JOIN "flight_routes" AS "route" ON "route"."id" = "itinerary"."route_id"
LEFT JOIN "airports" AS "origin_airport" ON "origin_airport"."id" = "route"."origin_airport_id"
LEFT JOIN "airports" AS "destination_airport" ON "destination_airport"."id" = "route"."destination_airport_id"
WHERE "ti"."inventory_id" IS NULL
  AND "ti"."item_type" = 'flight'
  AND "itinerary"."id" = "ti"."flight_itinerary_id";--> statement-breakpoint

ALTER TABLE "trip_items" ALTER COLUMN "inventory_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_items" ADD CONSTRAINT "trip_items_inventory_id_ck" CHECK ((
      "trip_items"."item_type" = 'hotel'
      AND "trip_items"."inventory_id" LIKE 'hotel:%'
    ) OR (
      "trip_items"."item_type" = 'flight'
      AND "trip_items"."inventory_id" LIKE 'flight:%'
    ) OR (
      "trip_items"."item_type" = 'car'
      AND "trip_items"."inventory_id" LIKE 'car:%'
    ));--> statement-breakpoint
CREATE INDEX "trip_items_inventory_idx" ON "trip_items" USING btree ("inventory_id");--> statement-breakpoint
