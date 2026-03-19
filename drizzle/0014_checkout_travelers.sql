CREATE TYPE andacity_app.traveler_type AS ENUM ('adult', 'child', 'infant');
CREATE TYPE andacity_app.traveler_role AS ENUM ('passenger', 'guest', 'driver', 'primary_contact');
CREATE TYPE andacity_app.traveler_document_type AS ENUM ('passport', 'drivers_license', 'national_id');

CREATE TABLE andacity_app.checkout_traveler_profiles (
  id text PRIMARY KEY NOT NULL,
  checkout_session_id text NOT NULL REFERENCES andacity_app.checkout_sessions(id) ON DELETE CASCADE,
  type andacity_app.traveler_type NOT NULL DEFAULT 'adult',
  role andacity_app.traveler_role NOT NULL DEFAULT 'passenger',
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  date_of_birth date,
  email text,
  phone text,
  nationality varchar(2),
  document_type andacity_app.traveler_document_type,
  document_number text,
  document_expiry_date date,
  issuing_country varchar(2),
  known_traveler_number text,
  redress_number text,
  driver_age integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX checkout_traveler_profiles_checkout_idx
  ON andacity_app.checkout_traveler_profiles (checkout_session_id);
CREATE INDEX checkout_traveler_profiles_role_idx
  ON andacity_app.checkout_traveler_profiles (role);
CREATE INDEX checkout_traveler_profiles_checkout_role_idx
  ON andacity_app.checkout_traveler_profiles (checkout_session_id, role);
CREATE INDEX checkout_traveler_profiles_email_idx
  ON andacity_app.checkout_traveler_profiles (email);
CREATE INDEX checkout_traveler_profiles_document_idx
  ON andacity_app.checkout_traveler_profiles (document_type, document_number);

CREATE TABLE andacity_app.checkout_traveler_assignments (
  id text PRIMARY KEY NOT NULL,
  checkout_session_id text NOT NULL REFERENCES andacity_app.checkout_sessions(id) ON DELETE CASCADE,
  checkout_item_key text,
  traveler_profile_id text NOT NULL REFERENCES andacity_app.checkout_traveler_profiles(id) ON DELETE CASCADE,
  role andacity_app.traveler_role NOT NULL DEFAULT 'passenger',
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX checkout_traveler_assignments_checkout_idx
  ON andacity_app.checkout_traveler_assignments (checkout_session_id);
CREATE INDEX checkout_traveler_assignments_profile_idx
  ON andacity_app.checkout_traveler_assignments (traveler_profile_id);
CREATE INDEX checkout_traveler_assignments_checkout_item_role_idx
  ON andacity_app.checkout_traveler_assignments (checkout_session_id, checkout_item_key, role);
CREATE INDEX checkout_traveler_assignments_checkout_role_primary_idx
  ON andacity_app.checkout_traveler_assignments (checkout_session_id, role, is_primary);
CREATE UNIQUE INDEX checkout_traveler_assignments_identity_uq
  ON andacity_app.checkout_traveler_assignments (checkout_session_id, checkout_item_key, traveler_profile_id, role);
