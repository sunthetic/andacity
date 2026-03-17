# Andacity v0.6.0 — Search UX, Routing & Trip Assembly

Release Date: 2026-03-17

---

## Overview

v0.6.0 transforms Andacity from a backend-complete system into a **usable product flow**.

This release introduces the full user journey:

**global entry → search → results → entity → add to trip → persisted trip → revalidation**

All flows are built on top of the canonical, provider-agnostic architecture established in v0.5.0.

---

## Added

### Global Search Entry
- Unified search entry components for:
  - Flights
  - Hotels
  - Car Rentals
- Canonical route emission from all entry points
- Integration with:
  - canonical date input system
  - location autosuggest + normalization

---

### Canonical Search Routing
- Deterministic, shareable, cacheable route structure:
  - `/flights/search/...`
  - `/hotels/search/...`
  - `/car-rentals/search/...`
- Route parsing into canonical `SearchRequest` objects

---

### Search Results System
- Unified `/api/search` endpoint
- Provider-agnostic normalized results
- Results rendering for:
  - Flights
  - Hotels
  - Car Rentals
- Loading, empty, and error states
- Incremental provider loading support

---

### Entity Pages (Bookable Entities)
- Dedicated entity pages for:
  - Flights (itineraries)
  - Hotels (stay options)
  - Car Rentals (vehicle offers)
- Entity resolution via Inventory Resolver
- Canonical entity identity preserved across flows

---

### Trip System (Core Feature)
- Trip Assembly Engine
- Add-to-Trip flow across all verticals
- Persisted trip storage layer
- Trip Page UI displaying aggregated items

---

### Trip Revalidation System
- Trip Item Revalidation Loop
- Inventory re-check using canonical identifiers
- Status classification:
  - valid
  - price_changed
  - unavailable
  - error
- Price drift detection integration
- Revalidation surfaced in trip UI

---

## Improved

### UX & Flow Consistency
- Single-click search submission across all entry points
- Removal of invalid/blank default form states
- Consistent default values:
  - Flights: 1 passenger, Economy
  - Hotels: 2 guests, 1 room
  - Cars: 1 driver
- Canonical route consistency across navigation

---

### Entity Page Hierarchy
- Corrected information priority for:
  - Flights
  - Hotels
  - Car Rentals
- Improved readability and layout density on desktop
- Reduced redundant metadata and status duplication

---

### Add-to-Trip Feedback
- Clear success behavior when adding items to trip
- Removal of silent reload states
- Improved flow continuity

---

### Navigation & Flow Recovery
- Ability to return to search and modify inputs from entity pages
- Elimination of "book-or-bail" dead-end flows

---

### Location Handling
- Integration groundwork for geolocation-based origin defaults
- Improved alignment with canonical location normalization system

---

## Fixed

### Search & Routing
- Fixed multi-click search submission bug
- Ensured deterministic canonical route emission
- Resolved inconsistent route patterns

---

### Form State Issues
- Removed blank dropdown states across all verticals
- Fixed inconsistent date input UI across pages
- Corrected z-index issues affecting dropdown usability

---

### Entity Pages
- Fixed missing or incorrect hierarchy
- Removed redundant availability/status displays
- Improved layout density for large screens

---

### Trip Flow
- Fixed lack of feedback when adding items to trip
- Ensured trip persistence integrity across navigation
- Stabilized revalidation result rendering

---

## Architecture Notes

This release fully operationalizes the architecture introduced in v0.5.0:

- canonical search requests and routes
- provider adapter abstraction
- normalized result pipeline
- canonical bookable entities
- inventory resolver integration
- trip snapshot and revalidation model

All UI surfaces in v0.6.0 consume **normalized, provider-agnostic data contracts**.

---

## Known Limitations / Deferred

The following are intentionally deferred beyond v0.6.0:

- Advanced sorting/filtering UX improvements
- Full UI polish and design-system unification
- User preference system (e.g., time format settings)
- Advanced loading optimizations
- Checkout and payment flow
- Booking execution with providers

---

## Next Milestone

### v0.7.0 — Booking & Checkout

Planned areas:

- Checkout flow
- Payment handling
- Booking confirmation
- Provider booking execution
- Expanded session and identity handling

---

## Summary

v0.6.0 establishes Andacity as a **functional travel product**, not just an architecture.

The system now supports:

- canonical search
- real results rendering
- entity inspection
- persistent trip building
- live inventory validation

This forms the foundation for moving into **transactional booking flows in v0.7.0**.