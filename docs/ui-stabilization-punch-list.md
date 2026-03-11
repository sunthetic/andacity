# UI Stabilization Punch List

Residual issues observed during the March 11, 2026 stabilization sweep that were not practical to fully resolve in-task.

## 1. Client-only saved/compare state can still flip after a hard refresh

Scope:
- Search results
- Detail pages
- Compare-enabled cards

Repro:
1. Add one or more items to shortlist or compare.
2. Hard-refresh a results or detail page that renders those same items.
3. Watch shortlist/compare controls during first paint and client resume.

Current behavior:
- Large layout shifts were reduced by moving recently viewed below the primary result list and making compare trays fixed-position.
- The control state itself can still visually switch from the server baseline to the client storage state after resume.

Why it remains:
- The current source of truth is `localStorage` / `sessionStorage`, which is not available during SSR.
- Fully removing the remaining flicker requires a server-readable bootstrap path such as cookie-backed state or an injected serialized client snapshot.

## 2. Trip itinerary preview still depends on eager client tasks

Scope:
- `/trips`
- Preview open/scroll behavior
- Replacement panel auto-expansion

Repro:
1. Open a long itinerary in the trip builder.
2. Trigger several preview actions in sequence, especially reorder and replacement previews.
3. Observe main-thread work and auto-open behavior on slower devices.

Current behavior:
- Auto-scroll is now less jumpy and only triggers when the preview would land outside the visible viewport.
- The route still uses eager `useVisibleTask$` hooks for some preview/detail coordination.

Why it remains:
- The current logic works, but it is still implemented with client-visible tasks that lint warns about.
- Refactoring it cleanly would require separating preview state transitions from DOM measurement and auto-open side effects.
