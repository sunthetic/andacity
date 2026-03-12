# Async-State Follow-ups

Surfaces still using local or implicit async behavior after the shared booking-state pass:

- `src/components/hotels/search/HotelSearchCard.tsx`
  Search submission still relies on form navigation without shared pending or retry treatment.

- `src/components/flights/search/FlightsSearchCard.tsx`
  Search submission still uses route navigation only; no shared pending button or recoverable inline failure surface yet.

- `src/components/car-rentals/CarRentalSearchCard.tsx`
  Search submission matches the older form-driven pattern and should move onto the shared pending state model next.

- `src/components/save-compare/SaveButton.tsx`
  Save and unsave remain instantaneous local-storage interactions with no shared surface state if persistence fails.

- `src/components/save-compare/CompareDrawer.tsx`
  Compare tray and drawer interactions are still local-state driven and do not expose the shared async notice vocabulary.

- `src/routes/hotels/in/[citySlug]/index.tsx`
  The results body now inherits shared results-state treatment, but the city-page hero search card still uses the older implicit submit behavior.

- `src/routes/car-rentals/in/[citySlug]/index.tsx`
  The results body now inherits shared results-state treatment, but the city-page hero search card still uses the older implicit submit behavior.
