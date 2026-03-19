CREATE TYPE "andacity_app"."booking_confirmation_status" AS ENUM (
	'pending',
	'partial',
	'confirmed',
	'requires_manual_review',
	'failed'
);--> statement-breakpoint
CREATE TYPE "andacity_app"."confirmation_item_status" AS ENUM (
	'confirmed',
	'pending',
	'failed',
	'requires_manual_review'
);--> statement-breakpoint
CREATE TABLE "andacity_app"."booking_confirmations" (
	"id" text PRIMARY KEY NOT NULL,
	"public_ref" varchar(32) NOT NULL,
	"trip_id" bigint NOT NULL,
	"checkout_session_id" text NOT NULL,
	"payment_session_id" text NOT NULL,
	"booking_run_id" text NOT NULL,
	"status" "andacity_app"."booking_confirmation_status" DEFAULT 'pending' NOT NULL,
	"currency" varchar(3),
	"totals_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary_json" jsonb,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "andacity_app"."booking_confirmation_items" (
	"id" text PRIMARY KEY NOT NULL,
	"confirmation_id" text NOT NULL,
	"booking_item_execution_id" text NOT NULL,
	"checkout_item_key" text NOT NULL,
	"vertical" "andacity_app"."trip_item_type" NOT NULL,
	"status" "andacity_app"."confirmation_item_status" DEFAULT 'pending' NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"location_summary" text,
	"provider" text,
	"provider_booking_reference" text,
	"provider_confirmation_code" text,
	"details_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "andacity_app"."booking_confirmations" ADD CONSTRAINT "booking_confirmations_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "andacity_app"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."booking_confirmations" ADD CONSTRAINT "booking_confirmations_checkout_session_id_checkout_sessions_id_fk" FOREIGN KEY ("checkout_session_id") REFERENCES "andacity_app"."checkout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."booking_confirmations" ADD CONSTRAINT "booking_confirmations_payment_session_id_checkout_payment_sessions_id_fk" FOREIGN KEY ("payment_session_id") REFERENCES "andacity_app"."checkout_payment_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."booking_confirmations" ADD CONSTRAINT "booking_confirmations_booking_run_id_booking_runs_id_fk" FOREIGN KEY ("booking_run_id") REFERENCES "andacity_app"."booking_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."booking_confirmation_items" ADD CONSTRAINT "booking_confirmation_items_confirmation_id_booking_confirmations_id_fk" FOREIGN KEY ("confirmation_id") REFERENCES "andacity_app"."booking_confirmations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."booking_confirmation_items" ADD CONSTRAINT "booking_confirmation_items_booking_item_execution_id_booking_item_executions_id_fk" FOREIGN KEY ("booking_item_execution_id") REFERENCES "andacity_app"."booking_item_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_confirmations_public_ref_uq" ON "andacity_app"."booking_confirmations" USING btree ("public_ref");--> statement-breakpoint
CREATE INDEX "booking_confirmations_trip_idx" ON "andacity_app"."booking_confirmations" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "booking_confirmations_checkout_idx" ON "andacity_app"."booking_confirmations" USING btree ("checkout_session_id");--> statement-breakpoint
CREATE INDEX "booking_confirmations_payment_idx" ON "andacity_app"."booking_confirmations" USING btree ("payment_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_confirmations_booking_run_id_uq" ON "andacity_app"."booking_confirmations" USING btree ("booking_run_id");--> statement-breakpoint
CREATE INDEX "booking_confirmations_status_idx" ON "andacity_app"."booking_confirmations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "booking_confirmation_items_confirmation_idx" ON "andacity_app"."booking_confirmation_items" USING btree ("confirmation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_confirmation_items_booking_item_execution_id_uq" ON "andacity_app"."booking_confirmation_items" USING btree ("booking_item_execution_id");--> statement-breakpoint
CREATE INDEX "booking_confirmation_items_checkout_item_key_idx" ON "andacity_app"."booking_confirmation_items" USING btree ("checkout_item_key");--> statement-breakpoint
CREATE INDEX "booking_confirmation_items_status_idx" ON "andacity_app"."booking_confirmation_items" USING btree ("status");--> statement-breakpoint
