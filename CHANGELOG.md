# 🪐 Andacity Travel — CHANGELOG

## v0.6.0

Released `2026-03-17`

### Added
- Global search entry (Flights, Hotels, Car Rentals)
- Canonical search routing (`/{vertical}/search/...`)
- Unified `/api/search` with normalized results
- Results renderers for all verticals
- Entity pages for flights, hotels, and car rentals
- Trip system (add-to-trip, persistence, trip page)
- Trip revalidation loop (valid / price_changed / unavailable / error)
- Incremental provider loading

### Improved
- Consistent search UX and default form states
- Entity page information hierarchy and layout density
- Add-to-trip feedback and flow continuity
- Navigation (return to search / modify inputs)
- Canonical route consistency across entry points

### Fixed
- Multi-click search submission bug
- Blank dropdown/default form states
- Date input inconsistencies
- Z-index issues affecting dropdowns
- Entity page redundancy and layout issues
- Silent add-to-trip behavior

### Notes
- UI polish and advanced filtering deferred
- Checkout and booking flows deferred to v0.7.0

## v0.5.0

Released `2026-03-13`

```
v0.5.0 — Core Booking Architecture & Canonical Input Systems

Highlights
- Finalized canonical inventory and booking infrastructure across flights, hotels, and cars
- Standardized core user input systems for dates and locations
- Hardened search, revalidation, and booking handoff flows

Added
- Canonical inventory ID system for deterministic cross-provider inventory identity
- Canonical SearchEntity model for normalized search results
- Search cache layer keyed by canonical search parameters
- Trip inventory snapshot persistence for stable saved-item state
- Trip item revalidation engine for live inventory verification
- Canonical BookableEntity abstraction spanning flight, hotel, and car inventory
- Inventory resolver to translate canonical inventory IDs into live provider-backed entities
- Provider adapter interface to standardize search, resolution, and pricing flows
- Flight provider adapter
- Hotel provider adapter
- Car provider adapter
- Central search result normalization pipeline
- Inventory price drift detection
- Booking session engine for validated booking handoff state
- Canonical date entry UX with shared picker/typed-entry behavior
- Canonical location autosuggest and normalized location persistence

Changed
- Standardized search and inventory flows around canonical entities instead of raw provider payloads
- Unified provider integration behind adapter contracts and registry-based resolution
- Centralized search normalization to ensure deterministic inventory identity generation
- Standardized date inputs across surfaces using shared interaction and formatting rules
- Standardized location inputs across surfaces using autosuggest and canonical structured location records
- Normalized location formatting to:
  City or Airport Name (Airport Code if applicable), State/Province, Country
- Standardized state/province display to official abbreviations and country display to full names

Improved
- Reduced provider-specific noise in app-facing models
- Improved stability of cached search results and repeated-query consistency
- Improved trip-item integrity through snapshot comparison and live revalidation
- Improved booking safety by requiring validated booking session creation before handoff
- Improved UX consistency across flights, hotels, and cars for date and location entry
- Improved extensibility for future provider integrations and routing/canonical URL work

Internal
- Established canonical foundations required for next-phase routing, URL identity, and public canonicalization work
- Completed milestone task set TASK-001 through TASK-014B under the corrected v0.5.0 milestone designation
```

Contributors: [Alden Gillespy](https://aldengillespy.com)

## v0.4.0

Released `2026-03-12`

```
Andacity v0.4.0 — Search & Inventory Hardening Roadmap

TASK-001 inventory IDs
TASK-002 normalize search entities
TASK-003 search cache
TASK-004 trip inventory snapshot
TASK-005 revalidation engine
TASK-006 booking entity
TASK-007 inventory resolver
TASK-008 result card header
TASK-009 search metrics
TASK-010 version bump
```

## v0.3.1

Released `2026-03-12`

## v0.3.0

Released `2026-03-12`

## v0.2.0

Released `2026-03-08`

## v0.1.0

Released `2026-03-07`
