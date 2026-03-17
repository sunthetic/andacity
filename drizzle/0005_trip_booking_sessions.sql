ALTER TABLE "trips" ADD COLUMN "booking_session_id" text;--> statement-breakpoint
CREATE INDEX "trips_booking_session_idx" ON "trips" USING btree ("booking_session_id");--> statement-breakpoint
