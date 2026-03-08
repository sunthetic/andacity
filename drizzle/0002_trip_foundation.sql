CREATE TYPE "andacity_app"."trip_status" AS ENUM('draft', 'planning', 'ready', 'archived');--> statement-breakpoint
CREATE TYPE "andacity_app"."trip_date_source" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TYPE "andacity_app"."trip_item_type" AS ENUM('hotel', 'flight', 'car');--> statement-breakpoint
CREATE TABLE "trips" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(180) DEFAULT 'Untitled trip' NOT NULL,
	"status" "trip_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_dates" (
	"trip_id" bigint NOT NULL,
	"source" "trip_date_source" DEFAULT 'auto' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_dates_pk" PRIMARY KEY("trip_id"),
	CONSTRAINT "trip_dates_order_ck" CHECK ("trip_dates"."start_date" is null or "trip_dates"."end_date" is null or "trip_dates"."start_date" <= "trip_dates"."end_date")
);
--> statement-breakpoint
CREATE TABLE "trip_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"trip_id" bigint NOT NULL,
	"item_type" "trip_item_type" NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"hotel_id" bigint,
	"flight_itinerary_id" bigint,
	"car_inventory_id" bigint,
	"start_city_id" bigint,
	"end_city_id" bigint,
	"start_date" date,
	"end_date" date,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"title" varchar(220) NOT NULL,
	"subtitle" varchar(280),
	"image_url" text,
	"meta" text[] DEFAULT '{}'::text[] NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_items_position_ck" CHECK ("trip_items"."position" >= 0),
	CONSTRAINT "trip_items_dates_ck" CHECK ("trip_items"."start_date" is null or "trip_items"."end_date" is null or "trip_items"."start_date" <= "trip_items"."end_date"),
	CONSTRAINT "trip_items_inventory_ref_ck" CHECK ((
          "trip_items"."item_type" = 'hotel'
          and "trip_items"."hotel_id" is not null
          and "trip_items"."flight_itinerary_id" is null
          and "trip_items"."car_inventory_id" is null
        ) or (
          "trip_items"."item_type" = 'flight'
          and "trip_items"."hotel_id" is null
          and "trip_items"."flight_itinerary_id" is not null
          and "trip_items"."car_inventory_id" is null
        ) or (
          "trip_items"."item_type" = 'car'
          and "trip_items"."hotel_id" is null
          and "trip_items"."flight_itinerary_id" is null
          and "trip_items"."car_inventory_id" is not null
        ))
);
--> statement-breakpoint
ALTER TABLE "trip_dates" ADD CONSTRAINT "trip_dates_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "andacity_app"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_items" ADD CONSTRAINT "trip_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "andacity_app"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_items" ADD CONSTRAINT "trip_items_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "andacity_app"."hotels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_items" ADD CONSTRAINT "trip_items_flight_itinerary_id_flight_itineraries_id_fk" FOREIGN KEY ("flight_itinerary_id") REFERENCES "andacity_app"."flight_itineraries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_items" ADD CONSTRAINT "trip_items_car_inventory_id_car_inventory_id_fk" FOREIGN KEY ("car_inventory_id") REFERENCES "andacity_app"."car_inventory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_items" ADD CONSTRAINT "trip_items_start_city_id_cities_id_fk" FOREIGN KEY ("start_city_id") REFERENCES "andacity_app"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_items" ADD CONSTRAINT "trip_items_end_city_id_cities_id_fk" FOREIGN KEY ("end_city_id") REFERENCES "andacity_app"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trips_status_idx" ON "trips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trips_updated_idx" ON "trips" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "trip_items_trip_idx" ON "trip_items" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_items_trip_type_idx" ON "trip_items" USING btree ("trip_id","item_type");--> statement-breakpoint
CREATE INDEX "trip_items_hotel_idx" ON "trip_items" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "trip_items_flight_idx" ON "trip_items" USING btree ("flight_itinerary_id");--> statement-breakpoint
CREATE INDEX "trip_items_car_idx" ON "trip_items" USING btree ("car_inventory_id");--> statement-breakpoint
CREATE INDEX "trip_items_start_city_idx" ON "trip_items" USING btree ("start_city_id");--> statement-breakpoint
CREATE INDEX "trip_items_end_city_idx" ON "trip_items" USING btree ("end_city_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_items_trip_position_uq" ON "trip_items" USING btree ("trip_id","position");--> statement-breakpoint
