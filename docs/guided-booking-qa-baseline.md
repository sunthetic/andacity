# Guided Booking QA Suite

Generated: 2026-03-11T22:45:39.564Z
Env file: `.env.local`
Database schema: `andacity_app`
Resolved base URL: `http://localhost:5173`
Base URL resolution: Resolved from env/config.
Seed horizon observed: 2026-03-09 -> 2026-07-06

## How To Use

1. Start the Andacity app locally.
2. Run this harness to refresh live fixtures after a reseed.
3. Execute the six scenarios below against the generated URLs and prepared trip ids.
4. Append manual observations in the trust, ranking, broken-state, friction, and performance slots.

## Critical Follow-on Issues

- HIGH: Trip edit apply latency is too high for confidence-sensitive booking flows
  Evidence: /api/trips/13/items/34/apply took 4710ms in the prepared QA run.
  Follow-on: Reduce trip mutation round-trips or move expensive recomputation off the blocking path so apply/replace stays interactive.
  Scenarios: Multi-item itinerary with replacements, Smart bundle suggestion with manual override
- MEDIUM: Trip edits are consistently multi-second, not just the single slowest apply
  Evidence: Trip mutation endpoints averaged 2200ms across add, preview, and apply requests.
  Follow-on: Set an interaction budget for trip edits and instrument the slowest repository paths so future stabilization work has a measurable target.
  Scenarios: Weekend leisure trip, Business flight + hotel, Multi-item itinerary with replacements, Smart bundle suggestion with manual override

## Scenarios

### Weekend leisure trip

Coverage: Hotels, Cars, Trips

Fixture:
- city: Las Vegas
- citySlug: las-vegas
- checkIn: 2026-03-13
- checkOut: 2026-03-15
- hotel: {"id":"21","name":"Ember Suites","price":"$168"}
- car: {"id":"18","name":"Jetway Rentals at LAS Airport","price":"$39"}
- tripId: 10

URLs:
- hotelSearch: http://localhost:5173/search/hotels/las-vegas/1?checkIn=2026-03-13&checkOut=2026-03-15
- hotelDetail: http://localhost:5173/hotels/las-vegas-motel-05
- carSearch: http://localhost:5173/search/car-rentals/las-vegas/1?pickupDate=2026-03-13&dropoffDate=2026-03-15
- carDetail: http://localhost:5173/car-rentals/las-vegas-standard-06?pickupDate=2026-03-13&dropoffDate=2026-03-15
- trip: http://localhost:5173/trips?trip=10

Flow steps:
1. Open /search/hotels/las-vegas/1?checkIn=2026-03-13&checkOut=2026-03-15 and confirm the weekend dates survive search and pagination.
2. Inspect /hotels/las-vegas-motel-05 for cancellation, pay-later, and fee clarity before committing.
3. Open /search/car-rentals/las-vegas/1?pickupDate=2026-03-13&dropoffDate=2026-03-15 and compare airport versus city pickup options for the same stay window.
4. Open /trips?trip=10 and confirm the prepared trip keeps hotel and car dates aligned without gaps.

Expected outcomes:
- Hotel and car search pages return live results for the same weekend window.
- The prepared trip shows two items, coherent dates, and a stable total snapshot.
- Airport-versus-city pickup tradeoffs are visible without losing date context.

Observation prompts:
- Trust failures: Note any unclear fees, cancellation timing, or missing airport-vs-city context before a decision feels safe.
- Ranking weirdness: Check whether obviously stronger value options are buried below weaker weekend picks.
- Broken states: Look for empty trays, stale totals, or trip-date drift after opening the prepared trip.
- Friction points: Capture any extra clicks needed to compare hotel and car options for the same dates.
- Performance observations: Record whether the weekend search pages feel materially slower than home or trip pages.

Automated observations:
- /search/hotels/las-vegas/1?checkIn=2026-03-13&checkOut=2026-03-15: 200 in 464ms
- /hotels/las-vegas-motel-05: 200 in 673ms
- /search/car-rentals/las-vegas/1?pickupDate=2026-03-13&dropoffDate=2026-03-15: 200 in 2008ms
- /car-rentals/las-vegas-standard-06?pickupDate=2026-03-13&dropoffDate=2026-03-15: 200 in 450ms
- /trips?trip=10: 200 in 457ms
- /api/trips/10/items: 201 in 2299ms
- /api/trips/10/items: 201 in 1952ms
- /api/trips/10: 200 in 203ms

### Business flight + hotel

Coverage: Flights, Hotels, Trips

Fixture:
- origin: New York
- destination: Washington
- depart: 2026-03-16
- returnDate: 2026-03-18
- flight: {"id":"15170","airline":"Southwest","departure":"10:06","stops":"Nonstop","cabin":"Economy","price":"$361"}
- hotel: {"id":"60","name":"Atlas Suites","price":"$199"}
- tripId: 11

URLs:
- flightResults: http://localhost:5173/search/flights/from/new-york/to/washington-dc/round-trip/1?depart=2026-03-16&return=2026-03-18&travelers=1
- hotelSearch: http://localhost:5173/search/hotels/washington-dc/1?checkIn=2026-03-16&checkOut=2026-03-18
- trip: http://localhost:5173/trips?trip=11

Flow steps:
1. Open /search/flights/from/new-york/to/washington-dc/round-trip/1?depart=2026-03-16&return=2026-03-18&travelers=1 and verify the round-trip search preserves the chosen return date in the UI.
2. Open /search/hotels/washington-dc/1?checkIn=2026-03-16&checkOut=2026-03-18 and shortlist a hotel that feels credible for a short work stay.
3. Open /trips?trip=11 and confirm the flight-plus-hotel itinerary stays coherent after the manual date pin.
4. Change the return date once and re-check whether result ordering or price context changes in a believable way.

Expected outcomes:
- The route, departure date, and return date remain visible through the flight workflow.
- The prepared trip reflects a two-night work trip without date gaps.
- Changing the return date should affect result context when the itinerary is truly round-trip sensitive.

Observation prompts:
- Trust failures: Call out any place where the round-trip promise feels weaker than the visible UI state.
- Ranking weirdness: Check whether early, nonstop work-friendly options are ranked sensibly against longer or pricier itineraries.
- Broken states: Watch for trip dates collapsing back to one day or flight timing becoming inconsistent after edits.
- Friction points: Note every manual correction needed to keep dates aligned across flights, hotels, and the trip builder.
- Performance observations: Compare flight-results latency against hotels and note whether business edits feel sluggish.

Automated observations:
- /search/flights/from/new-york/to/washington-dc/round-trip/1?depart=2026-03-16&return=2026-03-18&travelers=1: 200 in 1314ms
- /search/flights/from/new-york/to/washington-dc/round-trip/1?depart=2026-03-16&return=2026-03-19&travelers=1: 200 in 391ms
- /search/hotels/washington-dc/1?checkIn=2026-03-16&checkOut=2026-03-18: 200 in 383ms
- /trips?trip=11: 200 in 1146ms
- /api/trips/11: 200 in 1126ms
- /api/trips/11/items: 201 in 2046ms
- /api/trips/11/items: 201 in 2965ms
- returnDateFingerprint: 128e18353a7f9fd7c2a7853f8920341925c37e92
- alternateReturnDateFingerprint: 92c0731997435a9bbc69eac787c5f06e93fb56c7
- identicalAfterReturnShift: false

### Budget-constrained trip

Coverage: Flights, Hotels

Fixture:
- origin: New York
- destination: Washington
- depart: 2026-03-19
- returnDate: 2026-03-21
- cheapestFlight: $158
- cheapestHotel: $199
- betterRatedHotel: Bluebird Hotel at $319

URLs:
- flightResults: http://localhost:5173/search/flights/from/new-york/to/washington-dc/round-trip/1?depart=2026-03-19&return=2026-03-21&travelers=1
- hotelSearch: http://localhost:5173/search/hotels/washington-dc/1?checkIn=2026-03-19&checkOut=2026-03-21&sort=price-asc

Flow steps:
1. Start with the cheapest flight result and verify whether a slightly pricier nonstop or earlier option is surfaced clearly enough to compare.
2. Open the hotel results sorted by price and compare the cheapest property against the best-rated visible alternative.
3. Decide whether the budget choice still feels trustworthy once fees, cancellation, and location context are considered.

Expected outcomes:
- Price-sorted searches expose the cheapest credible options without hiding obvious tradeoffs.
- A budget traveler can compare the cheapest hotel against a better-rated alternative without losing context.
- Low-price options still disclose enough trust information to avoid false value signals.

Observation prompts:
- Trust failures: Capture any cheap option that looks attractive until hidden fees, weak cancellation detail, or vague policies appear.
- Ranking weirdness: Note if clearly worse-value hotels or flights float above better low-cost choices.
- Broken states: Watch for empty filter states or totals that stop matching visible price cards when sorting by price.
- Friction points: List any extra comparison work needed to understand whether the cheapest result is actually bookable.
- Performance observations: Compare the price-sort load time against recommended-sort behavior.

Automated observations:
- /search/flights/from/new-york/to/washington-dc/round-trip/1?depart=2026-03-19&return=2026-03-21&travelers=1: 200 in 347ms
- /search/hotels/washington-dc/1?checkIn=2026-03-19&checkOut=2026-03-21&sort=price-asc: 200 in 517ms

### Last-minute booking

Coverage: Flights, Hotels

Fixture:
- origin: Denver
- destination: Chicago
- depart: 2026-03-12
- returnDate: 2026-03-13
- flightPrice: $414
- hotelPrice: $154

URLs:
- flightResults: http://localhost:5173/search/flights/from/denver/to/chicago/round-trip/1?depart=2026-03-12&return=2026-03-13&travelers=1
- hotelSearch: http://localhost:5173/search/hotels/chicago/1?checkIn=2026-03-12&checkOut=2026-03-13

Flow steps:
1. Open the last-minute flight results and verify whether urgency increases trust detail instead of removing it.
2. Open the matching hotel search for the same dates and look for stale availability or price mismatch signals.
3. Revisit both surfaces after one manual refresh and note whether prices, availability, and totals stay coherent.

Expected outcomes:
- Last-minute routes still surface clear price, timing, and availability context.
- Hotel availability remains believable for the same near-term window.
- Refresh actions do not push the journey into broken or contradictory states.

Observation prompts:
- Trust failures: Capture any place where urgency makes prices look fragile, incomplete, or misleading.
- Ranking weirdness: Note if stale-looking or multi-stop flights outrank stronger short-notice choices without explanation.
- Broken states: Watch for refresh loops, empty-state flashes, or contradictory availability labels.
- Friction points: List manual retries or context switches needed to confirm the booking is still viable.
- Performance observations: Record whether near-term searches are materially slower than medium-horizon searches.

Automated observations:
- /search/flights/from/denver/to/chicago/round-trip/1?depart=2026-03-12&return=2026-03-13&travelers=1: 200 in 277ms
- /search/hotels/chicago/1?checkIn=2026-03-12&checkOut=2026-03-13: 200 in 491ms

### Multi-item itinerary with replacements

Coverage: Flights, Hotels, Cars, Trips

Fixture:
- origin: New York
- destination: Las Vegas
- depart: 2026-03-13
- returnDate: 2026-03-15
- flightId: 1711
- hotelId: 21
- carId: 18
- tripId: 12
- hotelReplacementCount: 4
- carReplacementCount: 4

URLs:
- trip: http://localhost:5173/trips?trip=12

Flow steps:
1. Open /trips?trip=12 and confirm the prepared trip contains flight, hotel, and car items in one itinerary.
2. Open hotel replacement options, preview a swap, and verify the price/coherence impact is understandable before apply.
3. Repeat the replacement flow for the car item and compare whether airport-versus-city tradeoffs stay explicit.
4. Check that the itinerary remains coherent after one replacement preview and one applied change.

Expected outcomes:
- Replacement options are available for hotel and car items.
- Preview explains price, timing, and coherence impact before the change is applied.
- After a swap, the trip remains readable and the rollback context stays intact.

Observation prompts:
- Trust failures: Capture any preview that hides cost or schedule consequences until after apply.
- Ranking weirdness: Check whether replacement options are ordered sensibly for price, quality, and location tradeoffs.
- Broken states: Watch for preview drawers that fail to open, stale items after apply, or rollback gaps.
- Friction points: List any manual steps needed to understand why one replacement is recommended over another.
- Performance observations: Record preview/apply latency and whether the itinerary UI blocks during swaps.

Automated observations:
- /trips?trip=12: 200 in 745ms
- /api/trips/12: 200 in 1432ms
- /api/trips/12/items: 201 in 2665ms
- /api/trips/12/items: 201 in 3784ms
- /api/trips/12/items: 201 in 2453ms
- /api/trips/12: 200 in 612ms
- /api/trips/12/items/31/replace-options: 200 in 514ms
- /api/trips/12/items/32/replace-options: 200 in 509ms
- /api/trips/12/items/31/preview: 200 in 1746ms
- /api/trips/12/items/32/preview: 200 in 1749ms

### Smart bundle suggestion with manual override

Coverage: Flights, Trips, Bundles, Hotels

Fixture:
- origin: New York
- destination: Washington
- depart: 2026-03-16
- manualEndDate: 2026-03-18
- tripId: 13
- preManualSuggestionCount: 1
- postManualSuggestionCount: 2
- manualOverrideSelectionMode: manual_override

URLs:
- trip: http://localhost:5173/trips?trip=13

Flow steps:
1. Open /trips?trip=13 and review the flight-only trip before manual dates are pinned.
2. Confirm whether the bundling rail is empty or weak before the trip has an explicit end date.
3. After manual dates are applied, review the suggested hotel and read the explanation before accepting it.
4. Use replacement options on the bundled hotel and preview a manual override before applying it.

Expected outcomes:
- The trip surfaces a credible hotel suggestion once the stay window is explicit.
- Bundle explanations describe price position and tradeoffs before add.
- Manual override preview clearly states that the selection moved away from the recommended bundle.

Observation prompts:
- Trust failures: Call out any place where the bundle suggestion or override hides why it was chosen.
- Ranking weirdness: Check whether the recommended bundle looks weaker than obvious alternatives without explanation.
- Broken states: Watch for bundle cards disappearing after add, replacement previews not loading, or trip totals desyncing.
- Friction points: List the steps required to go from a recommendation to a confident override decision.
- Performance observations: Note the time from opening the trip to seeing suggestions, replacement options, and preview impact.

Automated observations:
- /trips?trip=13: 200 in 1490ms
- /api/trips/13/items: 201 in 2254ms
- /api/trips/13: 200 in 618ms
- /api/trips/13: 200 in 1634ms
- /api/trips/13: 200 in 894ms
- /api/trips/13/items: 201 in 2899ms
- /api/trips/13: 200 in 915ms
- /api/trips/13/items/34/replace-options: 200 in 627ms
- /api/trips/13/items/34/preview: 200 in 2030ms
- /api/trips/13/items/34/apply: 200 in 4710ms

