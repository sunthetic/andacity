CREATE INDEX IF NOT EXISTS "flight_routes_origin_airport_idx" ON "flight_routes" USING btree ("origin_airport_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flight_routes_destination_airport_idx" ON "flight_routes" USING btree ("destination_airport_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flight_itineraries_route_date_departure_idx" ON "flight_itineraries" USING btree ("route_id","service_date","departure_minutes");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flight_itineraries_route_departure_idx" ON "flight_itineraries" USING btree ("route_id","departure_minutes");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flight_itineraries_airline_idx" ON "flight_itineraries" USING btree ("airline_id");--> statement-breakpoint
