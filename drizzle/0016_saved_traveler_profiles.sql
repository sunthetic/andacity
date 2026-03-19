CREATE TYPE andacity_app.saved_traveler_profile_status AS ENUM ('active', 'archived');

CREATE TABLE andacity_app.saved_traveler_profiles (
  id text PRIMARY KEY NOT NULL,
  owner_user_id text NOT NULL,
  status andacity_app.saved_traveler_profile_status NOT NULL DEFAULT 'active',
  type andacity_app.traveler_type NOT NULL DEFAULT 'adult',
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
  label text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX saved_traveler_profiles_owner_idx
  ON andacity_app.saved_traveler_profiles (owner_user_id);
CREATE INDEX saved_traveler_profiles_owner_status_idx
  ON andacity_app.saved_traveler_profiles (owner_user_id, status);
CREATE INDEX saved_traveler_profiles_owner_default_idx
  ON andacity_app.saved_traveler_profiles (owner_user_id, is_default, status);
CREATE INDEX saved_traveler_profiles_email_idx
  ON andacity_app.saved_traveler_profiles (email);
CREATE INDEX saved_traveler_profiles_updated_idx
  ON andacity_app.saved_traveler_profiles (updated_at);
CREATE INDEX saved_traveler_profiles_document_idx
  ON andacity_app.saved_traveler_profiles (document_type, document_number);
