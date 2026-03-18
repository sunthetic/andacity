CREATE TYPE "andacity_app"."payment_provider" AS ENUM ('stripe');--> statement-breakpoint
CREATE TYPE "andacity_app"."checkout_payment_session_status" AS ENUM (
	'draft',
	'pending',
	'requires_action',
	'authorized',
	'succeeded',
	'canceled',
	'failed',
	'expired'
);--> statement-breakpoint
CREATE TABLE "andacity_app"."checkout_payment_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"checkout_session_id" text NOT NULL,
	"provider" "andacity_app"."payment_provider" NOT NULL,
	"status" "andacity_app"."checkout_payment_session_status" DEFAULT 'draft' NOT NULL,
	"currency" varchar(3) NOT NULL,
	"amount_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"revalidation_fingerprint" text NOT NULL,
	"provider_payment_intent_id" text NOT NULL,
	"provider_client_secret" text,
	"provider_metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"authorized_at" timestamp with time zone,
	"succeeded_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "andacity_app"."checkout_payment_sessions" ADD CONSTRAINT "checkout_payment_sessions_checkout_session_id_checkout_sessions_id_fk" FOREIGN KEY ("checkout_session_id") REFERENCES "andacity_app"."checkout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkout_payment_sessions_checkout_idx" ON "andacity_app"."checkout_payment_sessions" USING btree ("checkout_session_id");--> statement-breakpoint
CREATE INDEX "checkout_payment_sessions_status_idx" ON "andacity_app"."checkout_payment_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "checkout_payment_sessions_updated_idx" ON "andacity_app"."checkout_payment_sessions" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "checkout_payment_sessions_fingerprint_idx" ON "andacity_app"."checkout_payment_sessions" USING btree ("checkout_session_id","revalidation_fingerprint","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_payment_sessions_provider_intent_uq" ON "andacity_app"."checkout_payment_sessions" USING btree ("provider","provider_payment_intent_id");--> statement-breakpoint
