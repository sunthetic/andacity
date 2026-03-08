ALTER TABLE "trip_items" RENAME COLUMN "price_cents" TO "snapshot_price_cents";--> statement-breakpoint
ALTER TABLE "trip_items" RENAME COLUMN "currency_code" TO "snapshot_currency_code";--> statement-breakpoint
ALTER TABLE "trip_items" RENAME COLUMN "snapshot_at" TO "snapshot_timestamp";--> statement-breakpoint

CREATE OR REPLACE FUNCTION "andacity_app"."prevent_trip_item_snapshot_updates"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.snapshot_price_cents IS DISTINCT FROM OLD.snapshot_price_cents THEN
    RAISE EXCEPTION 'trip item snapshot price is immutable';
  END IF;

  IF NEW.snapshot_currency_code IS DISTINCT FROM OLD.snapshot_currency_code THEN
    RAISE EXCEPTION 'trip item snapshot currency is immutable';
  END IF;

  IF NEW.snapshot_timestamp IS DISTINCT FROM OLD.snapshot_timestamp THEN
    RAISE EXCEPTION 'trip item snapshot timestamp is immutable';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS "trip_item_snapshot_immutable" ON "trip_items";--> statement-breakpoint
CREATE TRIGGER "trip_item_snapshot_immutable"
BEFORE UPDATE ON "trip_items"
FOR EACH ROW
EXECUTE FUNCTION "andacity_app"."prevent_trip_item_snapshot_updates"();
