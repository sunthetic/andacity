ALTER TABLE "trip_items" ADD COLUMN "booking_session_id" text;--> statement-breakpoint

UPDATE "trip_items"
SET "booking_session_id" = nullif(btrim("metadata"->>'bookingSessionId'), '')
WHERE "booking_session_id" IS NULL;--> statement-breakpoint

CREATE INDEX "trip_items_booking_session_idx" ON "trip_items" USING btree ("booking_session_id");--> statement-breakpoint

CREATE TABLE "trip_item_inventory_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"trip_item_id" bigint NOT NULL,
	"item_type" "andacity_app"."trip_item_type" NOT NULL,
	"inventory_id" text NOT NULL,
	"provider_inventory_id" bigint,
	"hotel_availability_snapshot_id" bigint,
	"bookable_entity" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"availability_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_item_inventory_snapshots_inventory_id_ck" CHECK ((
      "trip_item_inventory_snapshots"."item_type" = 'hotel'
      AND "trip_item_inventory_snapshots"."inventory_id" LIKE 'hotel:%'
    ) OR (
      "trip_item_inventory_snapshots"."item_type" = 'flight'
      AND "trip_item_inventory_snapshots"."inventory_id" LIKE 'flight:%'
    ) OR (
      "trip_item_inventory_snapshots"."item_type" = 'car'
      AND "trip_item_inventory_snapshots"."inventory_id" LIKE 'car:%'
    ))
);--> statement-breakpoint

ALTER TABLE "trip_item_inventory_snapshots" ADD CONSTRAINT "trip_item_inventory_snapshots_trip_item_id_trip_items_id_fk" FOREIGN KEY ("trip_item_id") REFERENCES "andacity_app"."trip_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_item_inventory_snapshots" ADD CONSTRAINT "trip_item_inventory_snapshots_hotel_availability_snapshot_id_hotel_availability_snapshots_id_fk" FOREIGN KEY ("hotel_availability_snapshot_id") REFERENCES "andacity_app"."hotel_availability_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE UNIQUE INDEX "trip_item_inventory_snapshots_trip_item_uq" ON "trip_item_inventory_snapshots" USING btree ("trip_item_id");--> statement-breakpoint
CREATE INDEX "trip_item_inventory_snapshots_inventory_idx" ON "trip_item_inventory_snapshots" USING btree ("inventory_id");--> statement-breakpoint
CREATE INDEX "trip_item_inventory_snapshots_provider_inventory_idx" ON "trip_item_inventory_snapshots" USING btree ("provider_inventory_id");--> statement-breakpoint
CREATE INDEX "trip_item_inventory_snapshots_hotel_snapshot_idx" ON "trip_item_inventory_snapshots" USING btree ("hotel_availability_snapshot_id");--> statement-breakpoint

INSERT INTO "trip_item_inventory_snapshots" (
	"trip_item_id",
	"item_type",
	"inventory_id",
	"provider_inventory_id",
	"bookable_entity",
	"availability_snapshot"
)
SELECT
	"ti"."id",
	"ti"."item_type",
	"ti"."inventory_id",
	COALESCE(
		"ti"."hotel_id",
		"ti"."flight_itinerary_id",
		"ti"."car_inventory_id",
		CASE
			WHEN nullif(btrim("ti"."metadata"->>'providerInventoryId'), '') ~ '^[0-9]+$'
				THEN (nullif(btrim("ti"."metadata"->>'providerInventoryId'), ''))::bigint
			ELSE NULL
		END
	),
	'{}'::jsonb,
	'{}'::jsonb
FROM "trip_items" AS "ti"
ON CONFLICT ("trip_item_id") DO NOTHING;--> statement-breakpoint
