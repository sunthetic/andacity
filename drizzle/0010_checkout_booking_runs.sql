CREATE TYPE "andacity_app"."booking_run_status" AS ENUM (
	'pending',
	'processing',
	'partial',
	'succeeded',
	'failed',
	'canceled'
);--> statement-breakpoint
CREATE TYPE "andacity_app"."booking_item_execution_status" AS ENUM (
	'pending',
	'processing',
	'succeeded',
	'failed',
	'requires_manual_review',
	'skipped'
);--> statement-breakpoint
CREATE TABLE "andacity_app"."booking_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"checkout_session_id" text NOT NULL,
	"payment_session_id" text NOT NULL,
	"status" "andacity_app"."booking_run_status" DEFAULT 'pending' NOT NULL,
	"execution_key" text NOT NULL,
	"summary_json" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "andacity_app"."booking_item_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_run_id" text NOT NULL,
	"checkout_item_key" text NOT NULL,
	"trip_item_id" bigint,
	"title" text NOT NULL,
	"vertical" "andacity_app"."trip_item_type" NOT NULL,
	"provider" text,
	"status" "andacity_app"."booking_item_execution_status" DEFAULT 'pending' NOT NULL,
	"provider_booking_reference" text,
	"provider_confirmation_code" text,
	"request_snapshot_json" jsonb DEFAULT '{}'::jsonb,
	"response_snapshot_json" jsonb DEFAULT '{}'::jsonb,
	"error_code" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "andacity_app"."booking_runs" ADD CONSTRAINT "booking_runs_checkout_session_id_checkout_sessions_id_fk" FOREIGN KEY ("checkout_session_id") REFERENCES "andacity_app"."checkout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."booking_runs" ADD CONSTRAINT "booking_runs_payment_session_id_checkout_payment_sessions_id_fk" FOREIGN KEY ("payment_session_id") REFERENCES "andacity_app"."checkout_payment_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andacity_app"."booking_item_executions" ADD CONSTRAINT "booking_item_executions_booking_run_id_booking_runs_id_fk" FOREIGN KEY ("booking_run_id") REFERENCES "andacity_app"."booking_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_runs_checkout_idx" ON "andacity_app"."booking_runs" USING btree ("checkout_session_id");--> statement-breakpoint
CREATE INDEX "booking_runs_payment_idx" ON "andacity_app"."booking_runs" USING btree ("payment_session_id");--> statement-breakpoint
CREATE INDEX "booking_runs_status_idx" ON "andacity_app"."booking_runs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_runs_execution_key_uq" ON "andacity_app"."booking_runs" USING btree ("execution_key");--> statement-breakpoint
CREATE INDEX "booking_runs_checkout_updated_idx" ON "andacity_app"."booking_runs" USING btree ("checkout_session_id","updated_at");--> statement-breakpoint
CREATE INDEX "booking_item_executions_booking_run_idx" ON "andacity_app"."booking_item_executions" USING btree ("booking_run_id");--> statement-breakpoint
CREATE INDEX "booking_item_executions_status_idx" ON "andacity_app"."booking_item_executions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_item_executions_run_checkout_item_key_uq" ON "andacity_app"."booking_item_executions" USING btree ("booking_run_id","checkout_item_key");--> statement-breakpoint
CREATE INDEX "booking_item_executions_trip_item_idx" ON "andacity_app"."booking_item_executions" USING btree ("trip_item_id");--> statement-breakpoint
