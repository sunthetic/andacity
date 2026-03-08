CREATE TYPE "public"."car_location_type" AS ENUM('airport', 'city');--> statement-breakpoint
CREATE TYPE "public"."car_transmission" AS ENUM('automatic', 'manual');--> statement-breakpoint
CREATE TYPE "public"."flight_cabin_class" AS ENUM('economy', 'premium-economy', 'business', 'first');--> statement-breakpoint
CREATE TYPE "public"."flight_itinerary_type" AS ENUM('one-way', 'round-trip');--> statement-breakpoint
CREATE TYPE "public"."flight_time_window" AS ENUM('morning', 'afternoon', 'evening', 'overnight');--> statement-breakpoint
CREATE TABLE "airlines" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"iata_code" varchar(2),
	"name" varchar(140) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "airports" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"seed_key" varchar(120),
	"city_id" bigint NOT NULL,
	"iata_code" varchar(3) NOT NULL,
	"name" varchar(180) NOT NULL,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"timezone" varchar(80),
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_inventory" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"seed_key" varchar(96),
	"slug" varchar(180) NOT NULL,
	"provider_id" bigint NOT NULL,
	"city_id" bigint NOT NULL,
	"location_id" bigint NOT NULL,
	"rating" numeric(3, 1) NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"summary" text NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"from_daily_cents" integer NOT NULL,
	"free_cancellation" boolean DEFAULT false NOT NULL,
	"pay_at_counter" boolean DEFAULT false NOT NULL,
	"security_deposit_required" boolean DEFAULT false NOT NULL,
	"min_driver_age" smallint NOT NULL,
	"fuel_policy" varchar(64) NOT NULL,
	"cancellation_blurb" text,
	"payment_blurb" text,
	"fees_blurb" text,
	"deposit_blurb" text,
	"inclusions" text[] DEFAULT '{}'::text[] NOT NULL,
	"availability_start" date NOT NULL,
	"availability_end" date NOT NULL,
	"min_days" smallint NOT NULL,
	"max_days" smallint NOT NULL,
	"blocked_weekdays" smallint[] DEFAULT '{}'::smallint[] NOT NULL,
	"score" numeric(8, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "car_inventory_days_ck" CHECK ("car_inventory"."min_days" <= "car_inventory"."max_days")
);
--> statement-breakpoint
CREATE TABLE "car_inventory_images" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"inventory_id" bigint NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_locations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"seed_key" varchar(120),
	"city_id" bigint NOT NULL,
	"airport_id" bigint,
	"location_type" "car_location_type" NOT NULL,
	"name" varchar(160) NOT NULL,
	"address_line" text NOT NULL,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_offers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"inventory_id" bigint NOT NULL,
	"offer_code" varchar(80) NOT NULL,
	"name" varchar(140) NOT NULL,
	"vehicle_class_id" bigint NOT NULL,
	"transmission" "car_transmission" NOT NULL,
	"seats" smallint NOT NULL,
	"doors" smallint NOT NULL,
	"bags_label" varchar(80) NOT NULL,
	"air_conditioning" boolean DEFAULT true NOT NULL,
	"price_daily_cents" integer NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"free_cancellation" boolean DEFAULT false NOT NULL,
	"pay_at_counter" boolean DEFAULT false NOT NULL,
	"badges" text[] DEFAULT '{}'::text[] NOT NULL,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_providers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(140) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_vehicle_classes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"key" varchar(60) NOT NULL,
	"category" varchar(80) NOT NULL,
	"seats" smallint NOT NULL,
	"doors" smallint NOT NULL,
	"bags_label" varchar(80) NOT NULL,
	"base_daily_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"seed_key" varchar(96),
	"slug" varchar(140) NOT NULL,
	"name" varchar(140) NOT NULL,
	"country_id" bigint NOT NULL,
	"region_id" bigint,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"popularity_rank" integer,
	"featured_rank" integer,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"iso2" varchar(2),
	"iso3" varchar(3),
	"slug" varchar(120) NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flight_fares" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"itinerary_id" bigint NOT NULL,
	"fare_code" varchar(64) DEFAULT 'standard' NOT NULL,
	"cabin_class" "flight_cabin_class" NOT NULL,
	"price_cents" integer NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"refundable" boolean DEFAULT false NOT NULL,
	"changeable" boolean DEFAULT true NOT NULL,
	"checked_bags_included" smallint DEFAULT 0 NOT NULL,
	"seats_remaining" smallint DEFAULT 9 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flight_itineraries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"seed_key" varchar(120) NOT NULL,
	"route_id" bigint NOT NULL,
	"airline_id" bigint NOT NULL,
	"itinerary_type" "flight_itinerary_type" NOT NULL,
	"service_date" date NOT NULL,
	"season_bucket" smallint DEFAULT 0 NOT NULL,
	"departure_at_utc" timestamp with time zone NOT NULL,
	"arrival_at_utc" timestamp with time zone NOT NULL,
	"departure_minutes" smallint NOT NULL,
	"arrival_minutes" smallint NOT NULL,
	"departure_window" "flight_time_window" NOT NULL,
	"arrival_window" "flight_time_window" NOT NULL,
	"stops" smallint NOT NULL,
	"duration_minutes" smallint NOT NULL,
	"stops_label" varchar(24) NOT NULL,
	"cabin_class" "flight_cabin_class" NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"base_price_cents" integer NOT NULL,
	"seats_remaining" smallint DEFAULT 9 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flight_itineraries_stops_ck" CHECK ("flight_itineraries"."stops" >= 0 and "flight_itineraries"."stops" <= 2),
	CONSTRAINT "flight_itineraries_duration_ck" CHECK ("flight_itineraries"."duration_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "flight_routes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"seed_key" varchar(140),
	"origin_city_id" bigint NOT NULL,
	"destination_city_id" bigint NOT NULL,
	"origin_airport_id" bigint NOT NULL,
	"destination_airport_id" bigint NOT NULL,
	"distance_km" numeric(8, 2) NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flight_segments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"itinerary_id" bigint NOT NULL,
	"segment_order" smallint NOT NULL,
	"origin_airport_id" bigint NOT NULL,
	"destination_airport_id" bigint NOT NULL,
	"airline_id" bigint NOT NULL,
	"operating_flight_number" varchar(16),
	"departure_at_utc" timestamp with time zone NOT NULL,
	"arrival_at_utc" timestamp with time zone NOT NULL,
	"duration_minutes" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flight_segments_duration_ck" CHECK ("flight_segments"."duration_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "hotel_amenities" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"label" varchar(140) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_amenity_links" (
	"hotel_id" bigint NOT NULL,
	"amenity_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotel_amenity_links_pk" PRIMARY KEY("hotel_id","amenity_id")
);
--> statement-breakpoint
CREATE TABLE "hotel_availability_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"hotel_id" bigint NOT NULL,
	"snapshot_source" varchar(32) DEFAULT 'seed' NOT NULL,
	"check_in_start" date NOT NULL,
	"check_in_end" date NOT NULL,
	"min_nights" smallint NOT NULL,
	"max_nights" smallint NOT NULL,
	"blocked_weekdays" smallint[] DEFAULT '{}'::smallint[] NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotel_availability_nights_ck" CHECK ("hotel_availability_snapshots"."min_nights" <= "hotel_availability_snapshots"."max_nights")
);
--> statement-breakpoint
CREATE TABLE "hotel_brands" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_images" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"hotel_id" bigint NOT NULL,
	"url" text NOT NULL,
	"alt_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_offers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"hotel_id" bigint NOT NULL,
	"external_offer_id" varchar(80) NOT NULL,
	"name" varchar(140) NOT NULL,
	"sleeps" smallint NOT NULL,
	"beds" varchar(80) NOT NULL,
	"size_sqft" integer NOT NULL,
	"price_nightly_cents" integer NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"refundable" boolean DEFAULT false NOT NULL,
	"pay_later" boolean DEFAULT false NOT NULL,
	"badges" text[] DEFAULT '{}'::text[] NOT NULL,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"seed_key" varchar(96),
	"slug" varchar(160) NOT NULL,
	"city_id" bigint NOT NULL,
	"brand_id" bigint,
	"name" varchar(180) NOT NULL,
	"neighborhood" varchar(120) NOT NULL,
	"property_type" varchar(32) NOT NULL,
	"address_line" text NOT NULL,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"stars" smallint NOT NULL,
	"rating" numeric(3, 1) NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"summary" text NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"from_nightly_cents" integer NOT NULL,
	"free_cancellation" boolean DEFAULT false NOT NULL,
	"pay_later" boolean DEFAULT false NOT NULL,
	"no_resort_fees" boolean DEFAULT false NOT NULL,
	"check_in_time" varchar(16),
	"check_out_time" varchar(16),
	"cancellation_blurb" text,
	"payment_blurb" text,
	"fees_blurb" text,
	"featured_rank" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotels_stars_ck" CHECK ("hotels"."stars" >= 1 and "hotels"."stars" <= 5)
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"country_id" bigint NOT NULL,
	"slug" varchar(140) NOT NULL,
	"code" varchar(40),
	"name" varchar(140) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "airports" ADD CONSTRAINT "airports_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_inventory" ADD CONSTRAINT "car_inventory_provider_id_car_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."car_providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_inventory" ADD CONSTRAINT "car_inventory_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_inventory" ADD CONSTRAINT "car_inventory_location_id_car_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."car_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_inventory_images" ADD CONSTRAINT "car_inventory_images_inventory_id_car_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."car_inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_locations" ADD CONSTRAINT "car_locations_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_locations" ADD CONSTRAINT "car_locations_airport_id_airports_id_fk" FOREIGN KEY ("airport_id") REFERENCES "public"."airports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_offers" ADD CONSTRAINT "car_offers_inventory_id_car_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."car_inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_offers" ADD CONSTRAINT "car_offers_vehicle_class_id_car_vehicle_classes_id_fk" FOREIGN KEY ("vehicle_class_id") REFERENCES "public"."car_vehicle_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_fares" ADD CONSTRAINT "flight_fares_itinerary_id_flight_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."flight_itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_itineraries" ADD CONSTRAINT "flight_itineraries_route_id_flight_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."flight_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_itineraries" ADD CONSTRAINT "flight_itineraries_airline_id_airlines_id_fk" FOREIGN KEY ("airline_id") REFERENCES "public"."airlines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_routes" ADD CONSTRAINT "flight_routes_origin_city_id_cities_id_fk" FOREIGN KEY ("origin_city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_routes" ADD CONSTRAINT "flight_routes_destination_city_id_cities_id_fk" FOREIGN KEY ("destination_city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_routes" ADD CONSTRAINT "flight_routes_origin_airport_id_airports_id_fk" FOREIGN KEY ("origin_airport_id") REFERENCES "public"."airports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_routes" ADD CONSTRAINT "flight_routes_destination_airport_id_airports_id_fk" FOREIGN KEY ("destination_airport_id") REFERENCES "public"."airports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_segments" ADD CONSTRAINT "flight_segments_itinerary_id_flight_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."flight_itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_segments" ADD CONSTRAINT "flight_segments_origin_airport_id_airports_id_fk" FOREIGN KEY ("origin_airport_id") REFERENCES "public"."airports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_segments" ADD CONSTRAINT "flight_segments_destination_airport_id_airports_id_fk" FOREIGN KEY ("destination_airport_id") REFERENCES "public"."airports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_segments" ADD CONSTRAINT "flight_segments_airline_id_airlines_id_fk" FOREIGN KEY ("airline_id") REFERENCES "public"."airlines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_amenity_links" ADD CONSTRAINT "hotel_amenity_links_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_amenity_links" ADD CONSTRAINT "hotel_amenity_links_amenity_id_hotel_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."hotel_amenities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_availability_snapshots" ADD CONSTRAINT "hotel_availability_snapshots_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_images" ADD CONSTRAINT "hotel_images_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_offers" ADD CONSTRAINT "hotel_offers_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_brand_id_hotel_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."hotel_brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "airlines_slug_uq" ON "airlines" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "airlines_iata_uq" ON "airlines" USING btree ("iata_code");--> statement-breakpoint
CREATE UNIQUE INDEX "airlines_name_uq" ON "airlines" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "airports_seed_key_uq" ON "airports" USING btree ("seed_key");--> statement-breakpoint
CREATE UNIQUE INDEX "airports_iata_uq" ON "airports" USING btree ("iata_code");--> statement-breakpoint
CREATE INDEX "airports_city_idx" ON "airports" USING btree ("city_id");--> statement-breakpoint
CREATE UNIQUE INDEX "car_inventory_seed_key_uq" ON "car_inventory" USING btree ("seed_key");--> statement-breakpoint
CREATE UNIQUE INDEX "car_inventory_slug_uq" ON "car_inventory" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "car_inventory_city_idx" ON "car_inventory" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "car_inventory_provider_idx" ON "car_inventory" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "car_inventory_location_idx" ON "car_inventory" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "car_inventory_city_price_idx" ON "car_inventory" USING btree ("city_id","from_daily_cents");--> statement-breakpoint
CREATE INDEX "car_inventory_city_rating_idx" ON "car_inventory" USING btree ("city_id","rating");--> statement-breakpoint
CREATE INDEX "car_inventory_images_inventory_idx" ON "car_inventory_images" USING btree ("inventory_id");--> statement-breakpoint
CREATE UNIQUE INDEX "car_inventory_images_inventory_sort_uq" ON "car_inventory_images" USING btree ("inventory_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "car_locations_seed_key_uq" ON "car_locations" USING btree ("seed_key");--> statement-breakpoint
CREATE INDEX "car_locations_city_idx" ON "car_locations" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "car_locations_airport_idx" ON "car_locations" USING btree ("airport_id");--> statement-breakpoint
CREATE INDEX "car_locations_type_idx" ON "car_locations" USING btree ("location_type");--> statement-breakpoint
CREATE UNIQUE INDEX "car_locations_city_name_type_uq" ON "car_locations" USING btree ("city_id","name","location_type");--> statement-breakpoint
CREATE INDEX "car_offers_inventory_idx" ON "car_offers" USING btree ("inventory_id");--> statement-breakpoint
CREATE INDEX "car_offers_vehicle_class_idx" ON "car_offers" USING btree ("vehicle_class_id");--> statement-breakpoint
CREATE INDEX "car_offers_inventory_price_idx" ON "car_offers" USING btree ("inventory_id","price_daily_cents");--> statement-breakpoint
CREATE UNIQUE INDEX "car_offers_inventory_offer_uq" ON "car_offers" USING btree ("inventory_id","offer_code");--> statement-breakpoint
CREATE UNIQUE INDEX "car_providers_slug_uq" ON "car_providers" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "car_providers_name_uq" ON "car_providers" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "car_vehicle_classes_key_uq" ON "car_vehicle_classes" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "car_vehicle_classes_category_uq" ON "car_vehicle_classes" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_seed_key_uq" ON "cities" USING btree ("seed_key");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_slug_uq" ON "cities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cities_country_idx" ON "cities" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "cities_region_idx" ON "cities" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "cities_popularity_idx" ON "cities" USING btree ("popularity_rank");--> statement-breakpoint
CREATE UNIQUE INDEX "countries_slug_uq" ON "countries" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "countries_name_uq" ON "countries" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "countries_iso2_uq" ON "countries" USING btree ("iso2");--> statement-breakpoint
CREATE INDEX "flight_fares_itinerary_idx" ON "flight_fares" USING btree ("itinerary_id");--> statement-breakpoint
CREATE INDEX "flight_fares_itinerary_cabin_idx" ON "flight_fares" USING btree ("itinerary_id","cabin_class");--> statement-breakpoint
CREATE UNIQUE INDEX "flight_fares_itinerary_fare_uq" ON "flight_fares" USING btree ("itinerary_id","fare_code");--> statement-breakpoint
CREATE UNIQUE INDEX "flight_itineraries_seed_service_date_uq" ON "flight_itineraries" USING btree ("seed_key","service_date");--> statement-breakpoint
CREATE INDEX "flight_itineraries_route_date_idx" ON "flight_itineraries" USING btree ("route_id","service_date");--> statement-breakpoint
CREATE INDEX "flight_itineraries_route_price_idx" ON "flight_itineraries" USING btree ("route_id","base_price_cents");--> statement-breakpoint
CREATE INDEX "flight_itineraries_route_stops_idx" ON "flight_itineraries" USING btree ("route_id","stops");--> statement-breakpoint
CREATE INDEX "flight_itineraries_route_window_idx" ON "flight_itineraries" USING btree ("route_id","departure_window");--> statement-breakpoint
CREATE INDEX "flight_itineraries_cabin_idx" ON "flight_itineraries" USING btree ("cabin_class");--> statement-breakpoint
CREATE UNIQUE INDEX "flight_routes_seed_key_uq" ON "flight_routes" USING btree ("seed_key");--> statement-breakpoint
CREATE UNIQUE INDEX "flight_routes_route_uq" ON "flight_routes" USING btree ("origin_airport_id","destination_airport_id");--> statement-breakpoint
CREATE INDEX "flight_routes_city_pair_idx" ON "flight_routes" USING btree ("origin_city_id","destination_city_id");--> statement-breakpoint
CREATE INDEX "flight_routes_origin_city_idx" ON "flight_routes" USING btree ("origin_city_id");--> statement-breakpoint
CREATE INDEX "flight_routes_destination_city_idx" ON "flight_routes" USING btree ("destination_city_id");--> statement-breakpoint
CREATE INDEX "flight_segments_itinerary_idx" ON "flight_segments" USING btree ("itinerary_id");--> statement-breakpoint
CREATE UNIQUE INDEX "flight_segments_itinerary_segment_uq" ON "flight_segments" USING btree ("itinerary_id","segment_order");--> statement-breakpoint
CREATE UNIQUE INDEX "hotel_amenities_slug_uq" ON "hotel_amenities" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "hotel_amenities_label_uq" ON "hotel_amenities" USING btree ("label");--> statement-breakpoint
CREATE INDEX "hotel_amenity_links_amenity_idx" ON "hotel_amenity_links" USING btree ("amenity_id");--> statement-breakpoint
CREATE INDEX "hotel_availability_hotel_idx" ON "hotel_availability_snapshots" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "hotel_availability_window_idx" ON "hotel_availability_snapshots" USING btree ("check_in_start","check_in_end");--> statement-breakpoint
CREATE UNIQUE INDEX "hotel_availability_hotel_source_uq" ON "hotel_availability_snapshots" USING btree ("hotel_id","snapshot_source");--> statement-breakpoint
CREATE UNIQUE INDEX "hotel_brands_slug_uq" ON "hotel_brands" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "hotel_brands_name_uq" ON "hotel_brands" USING btree ("name");--> statement-breakpoint
CREATE INDEX "hotel_images_hotel_idx" ON "hotel_images" USING btree ("hotel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hotel_images_hotel_sort_uq" ON "hotel_images" USING btree ("hotel_id","sort_order");--> statement-breakpoint
CREATE INDEX "hotel_offers_hotel_idx" ON "hotel_offers" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "hotel_offers_hotel_price_idx" ON "hotel_offers" USING btree ("hotel_id","price_nightly_cents");--> statement-breakpoint
CREATE UNIQUE INDEX "hotel_offers_hotel_external_uq" ON "hotel_offers" USING btree ("hotel_id","external_offer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hotels_seed_key_uq" ON "hotels" USING btree ("seed_key");--> statement-breakpoint
CREATE UNIQUE INDEX "hotels_slug_uq" ON "hotels" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "hotels_city_idx" ON "hotels" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "hotels_city_price_idx" ON "hotels" USING btree ("city_id","from_nightly_cents");--> statement-breakpoint
CREATE INDEX "hotels_city_rating_idx" ON "hotels" USING btree ("city_id","rating");--> statement-breakpoint
CREATE INDEX "hotels_stars_idx" ON "hotels" USING btree ("stars");--> statement-breakpoint
CREATE INDEX "hotels_property_type_idx" ON "hotels" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "regions_country_idx" ON "regions" USING btree ("country_id");--> statement-breakpoint
CREATE UNIQUE INDEX "regions_country_slug_uq" ON "regions" USING btree ("country_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "regions_country_name_uq" ON "regions" USING btree ("country_id","name");