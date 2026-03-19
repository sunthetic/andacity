CREATE TYPE "andacity_app"."itinerary_ownership_mode" AS ENUM (
	'anonymous',
	'user'
);--> statement-breakpoint
CREATE TYPE "andacity_app"."itinerary_ownership_source" AS ENUM (
	'checkout_session',
	'confirmation_flow',
	'manual_claim',
	'auto_attach_on_signin'
);--> statement-breakpoint
CREATE TABLE "andacity_app"."itinerary_ownerships" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" text NOT NULL,
	"ownership_mode" "andacity_app"."itinerary_ownership_mode" DEFAULT 'anonymous' NOT NULL,
	"owner_user_id" text,
	"owner_session_id" text,
	"owner_claim_token_hash" text,
	"source" "andacity_app"."itinerary_ownership_source" DEFAULT 'confirmation_flow' NOT NULL,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "andacity_app"."itinerary_ownerships" ADD CONSTRAINT "itinerary_ownerships_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "andacity_app"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "itinerary_ownerships_itinerary_id_uq" ON "andacity_app"."itinerary_ownerships" USING btree ("itinerary_id");--> statement-breakpoint
CREATE INDEX "itinerary_ownerships_mode_idx" ON "andacity_app"."itinerary_ownerships" USING btree ("ownership_mode");--> statement-breakpoint
CREATE INDEX "itinerary_ownerships_owner_user_idx" ON "andacity_app"."itinerary_ownerships" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "itinerary_ownerships_owner_session_idx" ON "andacity_app"."itinerary_ownerships" USING btree ("owner_session_id");--> statement-breakpoint
CREATE INDEX "itinerary_ownerships_claim_token_hash_idx" ON "andacity_app"."itinerary_ownerships" USING btree ("owner_claim_token_hash");--> statement-breakpoint
CREATE INDEX "itinerary_ownerships_source_idx" ON "andacity_app"."itinerary_ownerships" USING btree ("source");--> statement-breakpoint

INSERT INTO "andacity_app"."itinerary_ownerships" (
	"id",
	"itinerary_id",
	"ownership_mode",
	"owner_user_id",
	"owner_session_id",
	"source",
	"created_at",
	"updated_at"
)
SELECT
	'ito_' || md5("itineraries"."id"),
	"itineraries"."id",
	CASE
		WHEN "itineraries"."owner_user_id" IS NOT NULL THEN 'user'::"andacity_app"."itinerary_ownership_mode"
		ELSE 'anonymous'::"andacity_app"."itinerary_ownership_mode"
	END,
	"itineraries"."owner_user_id",
	"itineraries"."owner_session_id",
	'confirmation_flow'::"andacity_app"."itinerary_ownership_source",
	"itineraries"."created_at",
	"itineraries"."updated_at"
FROM "andacity_app"."itineraries"
ON CONFLICT ("itinerary_id") DO NOTHING;--> statement-breakpoint
