CREATE TYPE "andacity_app"."checkout_session_status" AS ENUM (
	'draft',
	'blocked',
	'ready',
	'expired',
	'completed',
	'abandoned'
);--> statement-breakpoint

CREATE TABLE "checkout_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"trip_id" bigint NOT NULL,
	"status" "andacity_app"."checkout_session_status" DEFAULT 'draft' NOT NULL,
	"currency" varchar(3),
	"items_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"totals_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"abandoned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "andacity_app"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "checkout_sessions_trip_idx" ON "checkout_sessions" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_status_idx" ON "checkout_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "checkout_sessions_updated_idx" ON "checkout_sessions" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "checkout_sessions_trip_status_updated_idx" ON "checkout_sessions" USING btree ("trip_id","status","updated_at");--> statement-breakpoint
