CREATE TYPE "andacity_app"."checkout_revalidation_status" AS ENUM (
	'idle',
	'pending',
	'passed',
	'failed'
);--> statement-breakpoint

ALTER TABLE "checkout_sessions" ADD COLUMN "revalidation_status" "andacity_app"."checkout_revalidation_status" DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD COLUMN "revalidation_summary_json" jsonb;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD COLUMN "last_revalidated_at" timestamp with time zone;--> statement-breakpoint
