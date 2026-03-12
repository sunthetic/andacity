# Booking Telemetry Taxonomy

Normalized stabilization telemetry for Hotels, Cars, Flights, Trips, and Bundles.

## Transport

- Client events dispatch a DOM event: `andacity:booking-telemetry`
- Client events append to `window.__andacityTelemetryQueue`
- Client events post JSON to `/api/analytics/events`
- Page views post to `/api/analytics/pageview`
- Server routes currently write structured JSON to app logs for review

## Event Contract

All booking events share:

- `name`
- `occurredAt`
- `path`
- `payload`

Common payload fields used by this pass:

- `vertical`: `hotels` | `cars` | `flights` | `trips` | `bundles`
- `surface`: high-level UI source such as `search_results`, `detail`, `compare_sheet`, `trip_builder`
- `item_id`: saved item id or trip item id when practical
- `item_position`: visible result position when emitted from result lists
- `trip_id`: trip id for trip-builder and add-to-trip success cases
- `action`: normalized action such as `add`, `remove`, `set`, `refresh`, `apply_edit`
- `outcome`: `success` | `failure` when an action can complete asynchronously
- `error_message`: concise failure text when available

## Core Events

### `booking_search_result_opened`

Emitted from hotel, car, and flight result cards.

- Purpose: measure search-to-detail or search-to-select click-through
- Notable payload: `vertical`, `surface`, `item_id`, `item_position`, `target`
- `target` is `detail` for hotels and cars, `select` for flights

### `booking_add_to_trip_started`

Emitted when the add-to-trip dialog opens.

- Purpose: measure intent before trip save completion
- Notable payload: `vertical`, `surface`, `item_id`, `item_position`

### `booking_add_to_trip_completed`

Emitted when add-to-trip succeeds or fails.

- Purpose: measure detail-to-add-to-trip and other trip-save conversions
- Notable payload: `vertical`, `surface`, `item_id`, `action`, `trip_id`, `outcome`, `error_message`
- `action` is `add_existing_trip` or `create_trip_and_add`

### `booking_bundle_decision`

Emitted for bundle acceptance or rejection in the trip builder.

- Purpose: measure bundle override acceptance, cancellation, and suggested-addition acceptance
- Notable payload: `vertical`, `surface`, `trip_id`, `item_id`, `decision`, `reason`, `action_type`, `selection_mode`
- `decision` is `accept` or `reject`

### `booking_filter_toggled`

Emitted from shared result filters, sort changes, and the legacy hotel SERP filter handlers.

- Purpose: measure filter usage without tying analytics to control internals
- Notable payload: `vertical`, `surface`, `filter_group`, `filter_value`, `action`

### `booking_filters_cleared`

Emitted when active filters are cleared.

- Purpose: measure friction recovery and reset behavior
- Notable payload: `vertical`, `surface`, `active_filter_count`

### `booking_filter_panel_toggled`

Emitted from results filter toggles.

- Purpose: measure filter-panel engagement on mobile and desktop
- Notable payload: `vertical`, `surface`, `action`, `active_filter_count`

### `booking_refresh_requested`

Emitted when a refresh/revalidate control is used.

- Purpose: measure explicit refresh usage after stabilization work
- Notable payload: `vertical`, `surface`, `refresh_type`, `item_count`

### `booking_refresh_completed`

Emitted when refresh/revalidate succeeds or fails.

- Purpose: measure friction, failed refreshes, and refresh completion rate
- Notable payload: `vertical`, `surface`, `refresh_type`, `item_count`, `outcome`, `error_message`

### `booking_compare_toggled`

Emitted when compare is added or removed from a result/detail/recently-viewed surface.

- Purpose: measure compare usage consistently across verticals
- Notable payload: `vertical`, `surface`, `item_id`, `item_position`, `action`

### `booking_compare_opened`

Emitted when a compare workspace opens.

- Purpose: measure compare intent beyond item selection
- Notable payload: `vertical`, `surface`, `compare_count`

### `booking_compare_cleared`

Emitted when compare selections are cleared.

- Purpose: measure compare drop-off and workspace reset behavior
- Notable payload: `vertical`, `surface`, `compare_count`

### `booking_compare_removed`

Emitted when an item is removed from compare inside the compare sheet.

- Purpose: measure compare trimming behavior
- Notable payload: `vertical`, `surface`, `item_id`

### `booking_compare_closed`

Emitted when the compare sheet closes.

- Purpose: measure compare workspace exits
- Notable payload: `vertical`, `surface`, `compare_count`

### `booking_shortlist_toggled`

Emitted when shortlist is added or removed.

- Purpose: measure shortlist usage consistently across surfaces
- Notable payload: `vertical`, `surface`, `item_id`, `item_position`, `action`

### `booking_retry_requested`

Emitted from retry controls and explicit trip reload buttons.

- Purpose: measure retry usage during load or stabilization failures
- Notable payload: `vertical`, `surface`, `retry_type`, `context`

### `booking_abandonment`

Emitted when a tracked stage is left without progress.

- Purpose: measure funnel drop-off and unfinished trip-edit flows
- Notable payload: `vertical`, `surface`, `stage`, `trip_id`, `item_id`, `action_type`
- Current tracked stages: `search_results`, `detail`, `trip_edit_preview`, `bundle_review`, `replacement_options`

### `booking_error`

Emitted for key async booking failures.

- Purpose: give stabilization work explicit failure counters
- Notable payload: `vertical`, `surface`, `trip_id`, `action`, `item_id`, `error_message`

### `booking_trip_action`

Emitted for notable non-error trip-builder actions.

- Purpose: cover preview, rollback, replacement-panel, and other trip-edit behavior without inventing per-button event names
- Notable payload: `vertical`, `surface`, `trip_id`, `action`, `item_id`, `action_type`, `option_count`

## Coverage Notes

- Hotels, Cars, and Flights now emit normalized result-open, filter, refresh, shortlist, compare, and retry signals.
- Hotel and car detail pages now expose `Add to trip`, which allows actual detail-to-add-to-trip measurement instead of an inferred proxy.
- Trips and Bundles now emit bundle accept/reject, trip-edit preview/apply failures, retry usage, refresh usage, and preview abandonment.

## Audit Notes

- Event names are action-oriented and cross-vertical rather than component-oriented.
- Shared controls emit telemetry in one place to reduce duplicate instrumentation.
- Result click-through is emitted only from clickable result CTAs/links, not from container wrappers, to avoid double counting.
- Refresh emits request plus completion, not multiple intermediate state events.

## Current Gaps

- Flights still do not have a first-party detail page, so the measurable flight funnel is `search result -> select` rather than `search result -> detail -> add to trip`.
- Bundle suggestion rejection is only captured when a user cancels a preview or abandons an open trip-edit surface. Passive non-action against suggestion cards is still a product-gap rather than a telemetry-only gap.
- Search-result and detail abandonment are currently strongest for page unload/pagehide exits. Same-document route transitions are intentionally not overcounted as abandonment on those surfaces.
- Events are log-backed and transport-agnostic in this pass. Production aggregation still requires downstream log ingestion or a provider adapter.
