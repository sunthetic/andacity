CREATE TYPE andacity_app.notification_channel AS ENUM ('email', 'sms', 'push');
CREATE TYPE andacity_app.notification_provider AS ENUM ('resend', 'sendgrid');
CREATE TYPE andacity_app.notification_event_type AS ENUM (
  'booking_confirmation',
  'booking_partial_confirmation',
  'booking_manual_review',
  'itinerary_ready',
  'itinerary_claim_available'
);
CREATE TYPE andacity_app.notification_status AS ENUM (
  'draft',
  'queued',
  'sent',
  'delivered',
  'failed',
  'skipped',
  'canceled'
);

CREATE TABLE andacity_app.notifications (
  id text PRIMARY KEY NOT NULL,
  event_type andacity_app.notification_event_type NOT NULL,
  channel andacity_app.notification_channel NOT NULL DEFAULT 'email',
  provider andacity_app.notification_provider NOT NULL DEFAULT 'resend',
  status andacity_app.notification_status NOT NULL DEFAULT 'draft',
  recipient_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  subject text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_message_id text,
  provider_metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text,
  related_confirmation_id text REFERENCES andacity_app.booking_confirmations(id) ON DELETE SET NULL,
  related_itinerary_id text REFERENCES andacity_app.itineraries(id) ON DELETE SET NULL,
  related_checkout_session_id text REFERENCES andacity_app.checkout_sessions(id) ON DELETE SET NULL,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  failed_at timestamp with time zone,
  failure_message text,
  skip_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX notifications_event_type_idx
  ON andacity_app.notifications (event_type);
CREATE INDEX notifications_status_idx
  ON andacity_app.notifications (status);
CREATE INDEX notifications_provider_idx
  ON andacity_app.notifications (provider);
CREATE UNIQUE INDEX notifications_dedupe_key_uq
  ON andacity_app.notifications (dedupe_key);
CREATE INDEX notifications_confirmation_idx
  ON andacity_app.notifications (related_confirmation_id);
CREATE INDEX notifications_itinerary_idx
  ON andacity_app.notifications (related_itinerary_id);
CREATE INDEX notifications_checkout_idx
  ON andacity_app.notifications (related_checkout_session_id);
CREATE INDEX notifications_sent_idx
  ON andacity_app.notifications (sent_at);
CREATE INDEX notifications_created_idx
  ON andacity_app.notifications (created_at);
