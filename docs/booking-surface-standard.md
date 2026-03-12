# Booking Surface Standard

Implementation standard for Hotels, Cars, Flights, Trips, and bundle decision surfaces.

## Purpose

Use shared primitives so adjacent booking flows feel like one product, while still allowing vertical-specific detail where the task genuinely differs.

## Shared standard

### Search bars

- Use [SearchFormPrimitives.tsx](/home/alden/a/andacity/src/components/booking-surface/SearchFormPrimitives.tsx) for search-card framing, field shells, and validation treatment.
- Search fields use one container shape: elevated surface, `3.25rem` minimum height, uppercase micro-label, and inline transparent controls.
- Validation uses one pattern: grouped summary in a danger surface below the form, not one-off inline text blocks per vertical.

### Filter layouts

- Use [ResultsFilters.tsx](/home/alden/a/andacity/src/components/results/ResultsFilters.tsx) as the canonical filter container.
- Route-specific filter panels should wrap shared filter sections inside that container instead of introducing new shells.
- Clear/reset belongs in the filter header action slot.

### Control bars

- Use [ResultsControlBar.tsx](/home/alden/a/andacity/src/components/results/ResultsControlBar.tsx) for result count, sort, active filters, and filter toggle.
- Sticky offset should come from `--sticky-top-offset`, not per-page hardcoded values.

### Result cards

- Use [ResultCardScaffold.tsx](/home/alden/a/andacity/src/components/results/ResultCardScaffold.tsx) as the default cross-vertical card layout.
- Facts should use `ResultFactGrid` or `ResultFactList`.
- Price blocks should use `ResultPricePanel`.
- Trust and freshness should use `ResultTrustBar` unless the vertical truly needs denser trust detail.

### Price blocks

- Primary price is always the strongest number in the aside.
- Supporting totals, qualifiers, and price-change deltas belong in the shared price panel.
- Missing-total messaging should stay inside the price block rather than moving into ad hoc helper copy.

### Status badges

- Availability/system state uses the availability confidence badge system.
- Generic metadata uses `t-badge`.
- Avoid inventing new badge weights or mixed uppercase/title-case treatments inside a single surface.

### CTA placement

- Primary booking/navigation CTA stays in the right-side aside or bottom action slot of the shared card scaffold.
- Secondary actions such as shortlist, compare, and add-to-trip belong above the primary CTA in the shared aside.

### Empty states

- Use [ResultsEmpty.tsx](/home/alden/a/andacity/src/components/results/ResultsEmpty.tsx) for booking/search empty states.
- Search-specific empty states should wrap the shared component rather than fork their own markup.

### Error treatments

- Use [AsyncStateNotice.tsx](/home/alden/a/andacity/src/components/async/AsyncStateNotice.tsx) for refresh/load failures.
- Use [AsyncRetryControl.tsx](/home/alden/a/andacity/src/components/async/AsyncRetryControl.tsx) where retry is available.
- Validation errors inside search bars use the shared search validation summary, not async notices.

## Current implementation anchors

- Search cards: [HotelSearchCard.tsx](/home/alden/a/andacity/src/components/hotels/search/HotelSearchCard.tsx), [CarRentalSearchCard.tsx](/home/alden/a/andacity/src/components/car-rentals/CarRentalSearchCard.tsx), [FlightsSearchCard.tsx](/home/alden/a/andacity/src/components/flights/search/FlightsSearchCard.tsx)
- Results shell and chrome: [ResultsShell.tsx](/home/alden/a/andacity/src/components/results/ResultsShell.tsx), [ResultsControlBar.tsx](/home/alden/a/andacity/src/components/results/ResultsControlBar.tsx), [ResultsFilters.tsx](/home/alden/a/andacity/src/components/results/ResultsFilters.tsx)
- Result cards: [HotelCard.tsx](/home/alden/a/andacity/src/components/hotels/HotelCard.tsx), [CarRentalCard.tsx](/home/alden/a/andacity/src/components/car-rentals/CarRentalCard.tsx), [FlightCard.tsx](/home/alden/a/andacity/src/components/flights/FlightCard.tsx), [HotelResultCard.tsx](/home/alden/a/andacity/src/components/hotels/search/HotelResultCard.tsx), [CarRentalResultCard.tsx](/home/alden/a/andacity/src/components/car-rentals/search/CarRentalResultCard.tsx), [FlightResultCard.tsx](/home/alden/a/andacity/src/components/flights/search/FlightResultCard.tsx)
- Empty/error handling: [ResultsEmpty.tsx](/home/alden/a/andacity/src/components/results/ResultsEmpty.tsx), [SearchEmptyState.tsx](/home/alden/a/andacity/src/components/search/SearchEmptyState.tsx), [AsyncStateNotice.tsx](/home/alden/a/andacity/src/components/async/AsyncStateNotice.tsx)

## Intentional exceptions

- Flights may expose denser schedule/trust detail than hotels or cars when fare freshness, cabin, and service-date fidelity materially affect choice.
- Trips use timeline and edit-preview surfaces instead of result-card scaffolds because sequencing and rollback are the primary tasks, not side-by-side shopping.
- Compare sheets and bundle review can use full-screen or drawer layouts because they are decision workspaces rather than browse surfaces.

## Audit result from this pass

- Search-card framing, field styling, and validation treatment are now shared across hotels, cars, and flights.
- Search empty states now resolve through the shared results empty-state primitive.
- Legacy route filter panels now render through the shared results filter container.
- Standalone car and flight search result cards now use the same scaffold and price/trust structure as the broader platform.

## Follow-on cleanup

- Migrate any remaining one-off result summaries onto shared summary primitives when the older hotel SERP route is folded deeper into `ResultsShell`.
- Continue preferring shared scaffold slots over bespoke card markup for future vertical additions.
