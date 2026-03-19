CREATE TYPE "andacity_app"."itinerary_status" AS ENUM (
	'active',
	'partial',
	'upcoming',
	'in_progress',
	'completed',
	'canceled',
	'archived'
);--> statement-breakpoint
CREATE TYPE "andacity_app"."itinerary_item_status" AS ENUM (
	'confirmed',
	'pending',
	'in_progress',
	'completed',
	'canceled',
	'failed'
);--> statement-breakpoint
CREATE TABLE "andacity_app"."itineraries" (
	"id" text PRIMARY KEY NOT NULL,
	"public_ref" varchar(32) NOT NULL,
	"trip_id" bigint,
	"checkout_session_id" text NOT NULL,
	"payment_session_id" text NOT NULL,
	"booking_run_id" text NOT NULL,
	"confirmation_id" text NOT NULL,
	"status" "andacity_app"."itinerary_status" DEFAULT 'active' NOT NULL,
	"currency" varchar(3),
	"summary_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"owner_user_id" text,
	"owner_session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "andacity_app"."itinerary_items" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" text NOT NULL,
	"confirmation_item_id" text NOT NULL,
	"booking_item_execution_id" text NOT NULL,
	"checkout_item_key" text NOT NULL,
	"vertical" "andacity_app"."trip_item_type" NOT NULL,
	"status" "andacity_app"."itinerary_item_status" DEFAULT 'confirmed' NOT NULL,
	"canonical_entity_id" bigint,
	"canonical_bookable_entity_id" bigint,
	"canonical_inventory_id" text,
	"provider" text,
	"provider_booking_reference" text,
	"provider_confirmation_code" text,
	"title" text NOT NULL,
	"subtitle" text,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"location_summary" text,
	"details_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "andacity_app"."itineraries" ADD CONSTRAINT "itineraries_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "andacity_app"."trips"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."itineraries" ADD CONSTRAINT "itineraries_checkout_session_id_checkout_sessions_id_fk" FOREIGN KEY ("checkout_session_id") REFERENCES "andacity_app"."checkout_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."itineraries" ADD CONSTRAINT "itineraries_payment_session_id_checkout_payment_sessions_id_fk" FOREIGN KEY ("payment_session_id") REFERENCES "andacity_app"."checkout_payment_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."itineraries" ADD CONSTRAINT "itineraries_booking_run_id_booking_runs_id_fk" FOREIGN KEY ("booking_run_id") REFERENCES "andacity_app"."booking_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."itineraries" ADD CONSTRAINT "itineraries_confirmation_id_booking_confirmations_id_fk" FOREIGN KEY ("confirmation_id") REFERENCES "andacity_app"."booking_confirmations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."itinerary_items" ADD CONSTRAINT "itinerary_items_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "andacity_app"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."itinerary_items" ADD CONSTRAINT "itinerary_items_confirmation_item_id_booking_confirmation_items_id_fk" FOREIGN KEY ("confirmation_item_id") REFERENCES "andacity_app"."booking_confirmation_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."itinerary_items" ADD CONSTRAINT "itinerary_items_booking_item_execution_id_booking_item_executions_id_fk" FOREIGN KEY ("booking_item_execution_id") REFERENCES "andacity_app"."booking_item_executions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "itineraries_public_ref_uq" ON "andacity_app"."itineraries" USING btree ("public_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "itineraries_confirmation_id_uq" ON "andacity_app"."itineraries" USING btree ("confirmation_id");--> statement-breakpoint
CREATE INDEX "itineraries_trip_idx" ON "andacity_app"."itineraries" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "itineraries_checkout_idx" ON "andacity_app"."itineraries" USING btree ("checkout_session_id");--> statement-breakpoint
CREATE INDEX "itineraries_payment_idx" ON "andacity_app"."itineraries" USING btree ("payment_session_id");--> statement-breakpoint
CREATE INDEX "itineraries_booking_run_idx" ON "andacity_app"."itineraries" USING btree ("booking_run_id");--> statement-breakpoint
CREATE INDEX "itineraries_status_idx" ON "andacity_app"."itineraries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "itineraries_owner_user_idx" ON "andacity_app"."itineraries" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "itineraries_owner_session_idx" ON "andacity_app"."itineraries" USING btree ("owner_session_id");--> statement-breakpoint
CREATE INDEX "itinerary_items_itinerary_idx" ON "andacity_app"."itinerary_items" USING btree ("itinerary_id");--> statement-breakpoint
CREATE UNIQUE INDEX "itinerary_items_confirmation_item_id_uq" ON "andacity_app"."itinerary_items" USING btree ("confirmation_item_id");--> statement-breakpoint
CREATE INDEX "itinerary_items_booking_item_execution_idx" ON "andacity_app"."itinerary_items" USING btree ("booking_item_execution_id");--> statement-breakpoint
CREATE INDEX "itinerary_items_checkout_item_key_idx" ON "andacity_app"."itinerary_items" USING btree ("checkout_item_key");--> statement-breakpoint
CREATE INDEX "itinerary_items_status_idx" ON "andacity_app"."itinerary_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "itinerary_items_canonical_inventory_idx" ON "andacity_app"."itinerary_items" USING btree ("canonical_inventory_id");--> statement-breakpoint

