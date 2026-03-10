import { $, component$, useSignal, type QRL } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import { AsyncInlineSpinner } from "~/components/async/AsyncInlineSpinner";
import { AsyncPendingButton } from "~/components/async/AsyncPendingButton";
import { AsyncRetryControl } from "~/components/async/AsyncRetryControl";
import { AsyncStateNotice } from "~/components/async/AsyncStateNotice";
import { DetailSkeleton } from "~/components/async/AsyncSurfaceSkeleton";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import { InventoryRefreshControl } from "~/components/inventory/InventoryRefreshControl";
import { Page } from "~/components/site/Page";
import { TripSuggestionCard } from "~/components/trips/TripSuggestionCard";
import {
  resolveBookingAsyncState,
  type BookingAsyncState,
} from "~/lib/async/booking-async-state";
import {
  buildPriceDisplayFromMetadata,
  formatMoneyFromCents,
  formatPriceQualifier,
  readStoredPriceDisplayMetadata,
} from "~/lib/pricing/price-display";
import {
  getTripDetails,
  listTrips,
  TripRepoError,
} from "~/lib/repos/trips-repo.server";
import {
  addItemToTripApi,
  createTripApi,
  getTripDetailsApi,
  listTripsApi,
  removeTripItemApi,
  revalidateTripApi,
  reorderTripItemsApi,
  TripApiError,
  updateTripMetadataApi,
} from "~/lib/trips/trips-api";
import type {
  TripDetails,
  TripIntelligenceSummary,
  TripItem,
  TripItemCandidate,
  TripListItem,
  TripPriceDriftStatus,
  TripStatus,
  TripValidationIssue,
  TripVerticalPricing,
} from "~/types/trips/trip";

export const useTripsPage = routeLoader$(async ({ url }) => {
  try {
    const trips = await listTrips();
    const requestedTripId = parsePositiveInt(url.searchParams.get("trip"));
    const activeTripId =
      requestedTripId && trips.some((trip) => trip.id === requestedTripId)
        ? requestedTripId
        : (trips[0]?.id ?? null);

    const activeTrip = activeTripId ? await getTripDetails(activeTripId) : null;

    return {
      trips,
      activeTripId,
      activeTrip,
      setupError: null as string | null,
    };
  } catch (error) {
    const code = error instanceof TripRepoError ? ` (${error.code})` : "";
    const message =
      error instanceof Error ? error.message : "Failed to load trips.";

    return {
      trips: [],
      activeTripId: null,
      activeTrip: null,
      setupError: `${message}${code}`,
    };
  }
});

export default component$(() => {
  const data = useTripsPage().value;
  const trips = useSignal<TripListItem[]>(data.trips);
  const activeTripId = useSignal<number | null>(data.activeTripId);
  const activeTrip = useSignal<TripDetails | null>(data.activeTrip);
  const setupError = useSignal<string | null>(data.setupError);
  const loading = useSignal(false);
  const activeAction = useSignal<string | null>(null);
  const error = useSignal<string | null>(null);
  const createTripName = useSignal("");
  const editingName = useSignal(data.activeTrip?.name || "");
  const editingStatus = useSignal<TripStatus>(
    data.activeTrip?.status || "draft",
  );

  const refreshTrips$ = $(
    async (nextActiveTripId?: number | null, preserveCurrentActive = false) => {
      const nextTrips = await listTripsApi();
      trips.value = nextTrips;

      if (nextActiveTripId != null) {
        activeTripId.value = nextActiveTripId;
        return;
      }

      if (preserveCurrentActive && activeTripId.value != null) {
        const current = nextTrips.find(
          (trip) => trip.id === activeTripId.value,
        );
        if (current) {
          activeTripId.value = current.id;
          return;
        }
      }

      activeTripId.value = nextTrips[0]?.id || null;
    },
  );

  const loadTrip$ = $(
    async (tripId: number, options?: { refreshList?: boolean }) => {
      if (loading.value) return;
      loading.value = true;
      activeAction.value = `load-trip:${tripId}`;
      error.value = null;

      try {
        if (options?.refreshList) {
          await refreshTrips$(tripId, true);
        }
        const trip = await getTripDetailsApi(tripId);
        activeTripId.value = trip.id;
        activeTrip.value = trip;
        editingName.value = trip.name || "";
        editingStatus.value = trip.status || "draft";
      } catch (cause) {
        const message =
          cause instanceof TripApiError
            ? cause.message
            : "Failed to load trip.";
        error.value = message;
      } finally {
        loading.value = false;
        activeAction.value = null;
      }
    },
  );

  const onCreateTrip$ = $(async () => {
    if (loading.value) return;
    loading.value = true;
    activeAction.value = "create-trip";
    error.value = null;
    setupError.value = null;

    try {
      const trip = await createTripApi({
        name: String(createTripName.value || "").trim() || undefined,
      });
      createTripName.value = "";
      await refreshTrips$(trip.id);
      activeTrip.value = trip;
      editingName.value = trip.name || "";
      editingStatus.value = trip.status || "draft";
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to create trip.";
      error.value = message;
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const onUpdateTripMetadata$ = $(async () => {
    if (!activeTrip.value || loading.value) return;
    loading.value = true;
    activeAction.value = "update-trip";
    error.value = null;

    try {
      const trip = await updateTripMetadataApi(activeTrip.value.id, {
        name: String(editingName.value || "").trim() || activeTrip.value.name,
        status: editingStatus.value,
      });
      activeTrip.value = trip;
      await refreshTrips$(trip.id, true);
      editingName.value = trip.name || "";
      editingStatus.value = trip.status || "draft";
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to update trip metadata.";
      error.value = message;
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const onRevalidateTrip$ = $(async () => {
    if (!activeTrip.value || loading.value) return;
    loading.value = true;
    activeAction.value = "revalidate-trip";
    error.value = null;

    try {
      const trip = await revalidateTripApi(activeTrip.value.id);
      activeTrip.value = trip;
      await refreshTrips$(trip.id, true);
      editingName.value = trip.name || "";
      editingStatus.value = trip.status || "draft";
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to revalidate trip.";
      error.value = message;
      throw new Error(message);
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const onRemoveItem$ = $(async (itemId: number) => {
    if (!activeTrip.value || loading.value) return;
    loading.value = true;
    activeAction.value = `remove-item:${itemId}`;
    error.value = null;

    try {
      const trip = await removeTripItemApi(activeTrip.value.id, itemId);
      activeTrip.value = trip;
      await refreshTrips$(trip.id, true);
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to remove trip item.";
      error.value = message;
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const onMoveItem$ = $(async (itemId: number, direction: -1 | 1) => {
    if (!activeTrip.value || loading.value) return;
    const currentItems = [...activeTrip.value.items].sort(
      (a, b) => a.position - b.position,
    );
    const currentIndex = currentItems.findIndex((item) => item.id === itemId);
    if (currentIndex < 0) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= currentItems.length) return;

    const [moved] = currentItems.splice(currentIndex, 1);
    currentItems.splice(nextIndex, 0, moved);
    const orderedItemIds = currentItems.map((item) => item.id);

    loading.value = true;
    activeAction.value = `move-item:${itemId}`;
    error.value = null;
    try {
      const trip = await reorderTripItemsApi(
        activeTrip.value.id,
        orderedItemIds,
      );
      activeTrip.value = trip;
      await refreshTrips$(trip.id, true);
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to reorder trip items.";
      error.value = message;
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const onAddSuggestedItem$ = $(async (candidate: TripItemCandidate) => {
    if (!activeTrip.value || loading.value) return;

    loading.value = true;
    activeAction.value = `add-suggestion:${candidate.inventoryId}`;
    error.value = null;

    try {
      const trip = await addItemToTripApi(activeTrip.value.id, candidate);
      activeTrip.value = trip;
      await refreshTrips$(trip.id, true);
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to add suggested trip item.";
      error.value = message;
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const retrySetup$ = $(async () => {
    if (loading.value) return;
    loading.value = true;
    activeAction.value = "setup-retry";
    error.value = null;

    try {
      await refreshTrips$(activeTripId.value, true);
      setupError.value = null;

      const nextTripId = activeTripId.value ?? trips.value[0]?.id ?? null;
      if (!nextTripId) {
        activeTrip.value = null;
        editingName.value = "";
        editingStatus.value = "draft";
        return;
      }

      const trip = await getTripDetailsApi(nextTripId);
      activeTripId.value = trip.id;
      activeTrip.value = trip;
      editingName.value = trip.name || "";
      editingStatus.value = trip.status || "draft";
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to reload trips.";
      setupError.value = message;
      error.value = message;
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const tripSurfaceState = resolveBookingAsyncState({
    isFailed:
      Boolean(setupError.value) &&
      !trips.value.length &&
      activeTrip.value == null &&
      !loading.value,
    isLoading: loading.value && !trips.value.length && activeTrip.value == null,
    isRefreshing:
      loading.value && (trips.value.length > 0 || activeTrip.value != null),
    isEmpty:
      !setupError.value &&
      !loading.value &&
      !trips.value.length &&
      activeTrip.value == null,
    isPartial: Boolean(activeTrip.value?.pricing.hasPartialPricing),
    isStale: Boolean(activeTrip.value?.intelligence.itemStatusCounts.stale),
  });
  const tripStatusNotice = buildTripStatusNotice(
    tripSurfaceState,
    activeTrip.value,
    activeAction.value,
  );

  return (
    <Page
      breadcrumbs={[
        { label: "Andacity Travel", href: "/" },
        { label: "Trips", href: "/trips" },
      ]}
    >
      <div class="mt-4">
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          Trip builder
        </h1>
        <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
          Build trip plans across stays, flights, and car rentals. This phase
          stores planning data only, with no booking or payment flow.
        </p>
      </div>

      {tripStatusNotice ? (
        <AsyncStateNotice
          class="mt-4"
          state={tripSurfaceState}
          title={tripStatusNotice.title}
          message={tripStatusNotice.message}
        />
      ) : null}

      {setupError.value && tripSurfaceState === "failed" ? (
        <div class="mt-4 rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
          <AsyncStateNotice
            state="failed"
            title="Trips could not be loaded"
            message={setupError.value}
          />
          <AsyncRetryControl
            class="mt-4"
            message="Retry loading your trips without leaving the builder."
            label="Retry trips"
            onRetry$={retrySetup$}
          />
        </div>
      ) : null}

      {error.value && tripSurfaceState !== "failed" ? (
        <AsyncStateNotice
          class="mt-4"
          state="failed"
          title="Trip update failed"
          message={error.value}
        />
      ) : null}

      <section class="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside class="t-card p-4">
          <h2 class="text-sm font-semibold text-[color:var(--color-text-strong)]">
            Your trips
          </h2>

          <div class="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] lg:grid-cols-1">
            <input
              type="text"
              value={createTripName.value}
              onInput$={(event, target) => {
                void event;
                createTripName.value = target.value;
              }}
              placeholder="Trip name"
              class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm"
            />
            <AsyncPendingButton
              class="t-btn-primary px-3 py-2 text-sm"
              pending={activeAction.value === "create-trip"}
              pendingLabel="Creating trip..."
              disabled={loading.value && activeAction.value !== "create-trip"}
              onClick$={onCreateTrip$}
            >
              Create trip
            </AsyncPendingButton>
          </div>

          <div class="mt-4 grid gap-2">
            {trips.value.length ? (
              trips.value.map((trip) => (
                <button
                  key={trip.id}
                  type="button"
                  onClick$={() => loadTrip$(trip.id)}
                  class={[
                    "rounded-xl border px-3 py-2 text-left",
                    activeTripId.value === trip.id
                      ? "border-[color:var(--color-action)] bg-[color:var(--color-primary-50)]"
                      : "border-[color:var(--color-border)]",
                    loading.value ? "cursor-not-allowed opacity-75" : null,
                  ]}
                  disabled={loading.value}
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                      {trip.name}
                    </div>
                    {activeAction.value === `load-trip:${trip.id}` ? (
                      <AsyncInlineSpinner compact={true} />
                    ) : null}
                  </div>
                  <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    {trip.itemCount} items
                  </div>
                  <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    Stored price sum: {formatTripListEstimate(trip)}
                  </div>
                </button>
              ))
            ) : (
              <p class="text-sm text-[color:var(--color-text-muted)]">
                No trips yet. Create one to start planning.
              </p>
            )}
          </div>
        </aside>

        <main class="grid gap-4">
          {tripSurfaceState === "initial_loading" ? (
            <section class="t-card p-6">
              <DetailSkeleton />
            </section>
          ) : activeTrip.value ? (
            <>
              <section class="t-card p-4">
                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryBlock
                    label="Trip dates"
                    value={formatTripDateRange(
                      activeTrip.value.startDate,
                      activeTrip.value.endDate,
                    )}
                  />
                  <SummaryBlock
                    label="Cities involved"
                    value={
                      activeTrip.value.citiesInvolved.length
                        ? activeTrip.value.citiesInvolved.join(", ")
                        : "Not set"
                    }
                  />
                  <SummaryBlock
                    label={
                      activeTrip.value.pricing.hasPartialPricing
                        ? "Partial bundle base total"
                        : "Snapshot bundle base total"
                    }
                    value={formatSnapshotEstimate(activeTrip.value)}
                  />
                  <SummaryBlock
                    label={
                      activeTrip.value.pricing.hasPartialPricing
                        ? "Live partial base total"
                        : "Live bundle base total"
                    }
                    value={formatLiveEstimate(activeTrip.value)}
                  />
                </div>

                <div class="mt-4 rounded-xl border border-[color:var(--color-border)] px-3 py-3">
                  <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    Bundle pricing note
                  </p>
                  <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                    {formatTripPricingSupport(activeTrip.value)}
                  </p>
                </div>

                {activeTrip.value.pricing.verticals.length ? (
                  <div class="mt-4 grid gap-3 border-t border-[color:var(--color-divider)] pt-4 md:grid-cols-2 xl:grid-cols-3">
                    {activeTrip.value.pricing.verticals.map((vertical) => (
                      <VerticalSubtotalCard
                        key={vertical.itemType}
                        vertical={vertical}
                      />
                    ))}
                  </div>
                ) : null}

                <div class="mt-4 rounded-xl border border-[color:var(--color-border)] px-3 py-3">
                  <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    Price drift summary
                  </p>
                  <p class="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">
                    {formatDriftSummary(activeTrip.value)}
                  </p>
                  <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    Prices are snapshotted when items are added. Indicators
                    compare that snapshot against current pricing in the
                    database.
                  </p>
                </div>

                <div class="mt-4 rounded-xl border border-[color:var(--color-border)] px-3 py-3">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                        Trip intelligence
                      </p>
                      <p
                        class={[
                          "mt-1 text-sm font-semibold",
                          intelligenceToneClass(activeTrip.value.intelligence),
                        ]}
                      >
                        {formatTripIntelligenceStatus(
                          activeTrip.value.intelligence,
                        )}
                      </p>
                      <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                        {formatTripIntelligenceMeta(
                          activeTrip.value.intelligence,
                        )}
                      </p>
                      <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                        Revalidate here to refresh trip item and bundle
                        inventory freshness.
                      </p>
                    </div>

                    <InventoryRefreshControl
                      id={`trip:${activeTrip.value.id}`}
                      mode="action"
                      onRefresh$={onRevalidateTrip$}
                      label="Revalidate trip"
                      refreshingLabel="Revalidating..."
                      refreshedLabel="Trip revalidated"
                      failedLabel="Retry revalidation"
                      successMessage="Trip availability was revalidated. Bundle price changes remain highlighted against the stored trip snapshot below."
                      failureMessage="Failed to revalidate trip."
                      align="right"
                      disabled={loading.value}
                    />
                  </div>

                  <div class="mt-4 grid gap-3 md:grid-cols-3">
                    <IntelligenceStatCard
                      label="Availability"
                      value={formatTripAvailabilitySummary(
                        activeTrip.value.intelligence,
                      )}
                    />
                    <IntelligenceStatCard
                      label="Issues"
                      value={formatTripIssueSummary(
                        activeTrip.value.intelligence,
                      )}
                    />
                    <IntelligenceStatCard
                      label="Freshness"
                      value={formatTripFreshnessSummary(
                        activeTrip.value.intelligence,
                      )}
                    />
                  </div>

                  {activeTrip.value.intelligence.issues.length ? (
                    <div class="mt-4 grid gap-2 border-t border-[color:var(--color-divider)] pt-4">
                      {activeTrip.value.intelligence.issues
                        .slice(0, 5)
                        .map((issue) => (
                          <div
                            key={`${issue.code}-${issue.itemId || "trip"}-${(issue.relatedItemIds || []).join("-")}`}
                            class={[
                              "rounded-lg border px-3 py-2 text-sm",
                              issue.severity === "blocking"
                                ? "border-[color:var(--color-error,#b91c1c)] bg-[color:rgba(185,28,28,0.06)] text-[color:var(--color-error,#b91c1c)]"
                                : "border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)] text-[color:var(--color-warning,#92400e)]",
                            ]}
                          >
                            {issue.message}
                          </div>
                        ))}
                    </div>
                  ) : null}
                </div>

                <div class="mt-4 grid gap-3 border-t border-[color:var(--color-divider)] pt-4 sm:grid-cols-[1fr_160px_auto]">
                  <input
                    type="text"
                    value={editingName.value}
                    onInput$={(event, target) => {
                      void event;
                      editingName.value = target.value;
                    }}
                    class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm"
                    aria-label="Trip name"
                  />

                  <select
                    value={editingStatus.value}
                    onChange$={(event, target) => {
                      void event;
                      const value = String(target.value || "draft")
                        .trim()
                        .toLowerCase();
                      if (
                        value === "draft" ||
                        value === "planning" ||
                        value === "ready" ||
                        value === "archived"
                      ) {
                        editingStatus.value = value;
                      }
                    }}
                    class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm"
                    aria-label="Trip status"
                  >
                    <option value="draft">Draft</option>
                    <option value="planning">Planning</option>
                    <option value="ready">Ready</option>
                    <option value="archived">Archived</option>
                  </select>

                  <AsyncPendingButton
                    onClick$={onUpdateTripMetadata$}
                    pending={activeAction.value === "update-trip"}
                    pendingLabel="Saving trip..."
                    disabled={
                      loading.value && activeAction.value !== "update-trip"
                    }
                    class="t-btn-ghost px-3 py-2 text-sm"
                  >
                    Update
                  </AsyncPendingButton>
                </div>
              </section>

              {activeTrip.value.bundling.gaps.length ? (
                <section class="t-card p-4">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                        Suggested additions
                      </h2>
                      <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                        {formatTripBundlingSummary(activeTrip.value)}
                      </p>
                    </div>
                  </div>

                  {activeTrip.value.bundling.suggestions.length ? (
                    <div class="mt-4 grid gap-3">
                      {activeTrip.value.bundling.suggestions.map(
                        (suggestion) => (
                          <TripSuggestionCard
                            key={suggestion.id}
                            suggestion={suggestion}
                            loading={
                              activeAction.value ===
                              `add-suggestion:${suggestion.tripCandidate.inventoryId}`
                            }
                            disabled={loading.value}
                            onAdd$={onAddSuggestedItem$}
                          />
                        ),
                      )}
                    </div>
                  ) : (
                    <p class="mt-4 text-sm text-[color:var(--color-text-muted)]">
                      Live inventory was not available for the detected trip
                      gaps yet.
                    </p>
                  )}
                </section>
              ) : null}

              <section class="t-card p-4">
                <h2 class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  Trip items
                </h2>

                {activeTrip.value.items.length ? (
                  <div class="mt-3 grid gap-3">
                    {activeTrip.value.items
                      .slice()
                      .sort((a, b) => a.position - b.position)
                      .map((item, index) => (
                        <TripItemRow
                          key={item.id}
                          item={item}
                          index={index}
                          total={activeTrip.value?.items.length || 0}
                          loading={loading.value}
                          pendingActionId={activeAction.value}
                          onRemove$={onRemoveItem$}
                          onMove$={onMoveItem$}
                        />
                      ))}
                  </div>
                ) : (
                  <p class="mt-3 text-sm text-[color:var(--color-text-muted)]">
                    This trip has no items yet. Use “Add to trip” on hotel,
                    flight, or car results.
                  </p>
                )}
              </section>
            </>
          ) : tripSurfaceState === "failed" ? (
            <section class="t-card p-6">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
                Trips are unavailable right now
              </h2>
              <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                Retry loading your trips or start from a fresh search once the
                trip APIs respond again.
              </p>
              <div class="mt-4 flex flex-wrap gap-2">
                <AsyncPendingButton
                  class="t-btn-primary px-4 py-2 text-sm"
                  pending={activeAction.value === "setup-retry"}
                  pendingLabel="Reloading trips..."
                  disabled={
                    loading.value && activeAction.value !== "setup-retry"
                  }
                  onClick$={retrySetup$}
                >
                  Retry trips
                </AsyncPendingButton>
                <a class="t-btn-ghost px-4 py-2 text-sm" href="/search/hotels">
                  Search hotels
                </a>
              </div>
            </section>
          ) : tripSurfaceState === "empty" ? (
            <section class="t-card p-6">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
                Start your first trip
              </h2>
              <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                Create a trip from the left panel, or jump into hotel, flight,
                or car search and add items directly from results.
              </p>
              <div class="mt-4 flex flex-wrap gap-2">
                <a
                  class="t-btn-primary px-4 py-2 text-sm"
                  href="/search/hotels"
                >
                  Search hotels
                </a>
                <a class="t-btn-ghost px-4 py-2 text-sm" href="/search/flights">
                  Search flights
                </a>
                <a
                  class="t-btn-ghost px-4 py-2 text-sm"
                  href="/search/car-rentals"
                >
                  Search car rentals
                </a>
              </div>
            </section>
          ) : (
            <section class="t-card p-6">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
                No trip selected
              </h2>
              <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                Create a trip from the left panel, then add saved or search
                items into it.
              </p>
            </section>
          )}
        </main>
      </section>
    </Page>
  );
});

const buildTripStatusNotice = (
  state: BookingAsyncState,
  trip: TripDetails | null,
  actionId: string | null,
) => {
  if (state === "refreshing") {
    if (actionId === "create-trip") {
      return {
        title: "Creating trip",
        message:
          "Your new trip is being created. Existing trip details stay on screen until the save finishes.",
      };
    }

    if (actionId?.startsWith("load-trip:")) {
      return {
        title: "Loading trip details",
        message:
          "The selected itinerary is loading. Current trip details stay visible until the next trip is ready.",
      };
    }

    if (actionId === "update-trip") {
      return {
        title: "Saving trip updates",
        message:
          "Trip metadata changes are being saved. Current bundle pricing stays visible until the update completes.",
      };
    }

    if (actionId === "revalidate-trip") {
      return {
        title: "Revalidating trip",
        message:
          "Fresh availability and bundle signals are loading. Current pricing stays visible until revalidation completes.",
      };
    }

    if (actionId?.startsWith("remove-item:")) {
      return {
        title: "Removing trip item",
        message:
          "The selected trip item is being removed. Current trip totals stay visible until the update completes.",
      };
    }

    if (actionId?.startsWith("move-item:")) {
      return {
        title: "Reordering trip items",
        message:
          "Your itinerary order is updating. Current trip details stay visible until the new order is saved.",
      };
    }

    if (actionId?.startsWith("add-suggestion:")) {
      return {
        title: "Adding suggested item",
        message:
          "The suggested inventory is being added. Current trip details stay visible until the update completes.",
      };
    }

    if (actionId === "setup-retry") {
      return {
        title: "Reloading trips",
        message:
          "Trip builder data is being reloaded. Existing trip details stay visible until the retry finishes.",
      };
    }
  }

  if (state === "partial" && trip) {
    return {
      title: "Bundle pricing is partial",
      message: formatTripPricingSupport(trip),
    };
  }

  if (state === "stale" && trip) {
    const staleCount = trip.intelligence.itemStatusCounts.stale;
    return {
      title: "Some trip items need recheck",
      message: `${staleCount.toLocaleString("en-US")} item${staleCount === 1 ? "" : "s"} in this itinerary need refreshed availability. Revalidate the trip before trusting bundle totals.`,
    };
  }

  return undefined;
};

const SummaryBlock = component$((props: { label: string; value: string }) => {
  return (
    <div class="rounded-xl border border-[color:var(--color-border)] px-3 py-2">
      <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
        {props.label}
      </p>
      <p class="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">
        {props.value}
      </p>
    </div>
  );
});

const IntelligenceStatCard = component$(
  (props: { label: string; value: string }) => {
    return (
      <div class="rounded-xl border border-[color:var(--color-border)] px-3 py-2">
        <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          {props.label}
        </p>
        <p class="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">
          {props.value}
        </p>
      </div>
    );
  },
);

const VerticalSubtotalCard = component$(
  (props: { vertical: TripVerticalPricing }) => {
    return (
      <div class="rounded-xl border border-[color:var(--color-border)] px-3 py-3">
        <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          {formatVerticalLabel(props.vertical.itemType)}{" "}
          {props.vertical.hasPartialPricing
            ? "partial base subtotal"
            : "base subtotal"}
        </p>
        <p class="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">
          Snapshot {formatVerticalSnapshot(props.vertical)}
        </p>
        <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
          Live {formatVerticalCurrent(props.vertical)}
        </p>
        {props.vertical.hasPartialPricing ? (
          <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
            Some items in this vertical still use unit pricing because trip
            dates were not saved.
          </p>
        ) : null}
        <p
          class={[
            "mt-2 text-xs font-medium",
            driftToneClass(verticalDriftStatus(props.vertical)),
          ]}
        >
          {formatVerticalDrift(props.vertical)}
        </p>
      </div>
    );
  },
);

const TripItemRow = component$(
  (props: {
    item: TripItem;
    index: number;
    total: number;
    loading: boolean;
    pendingActionId: string | null;
    onRemove$: QRL<(itemId: number) => Promise<void>>;
    onMove$: QRL<(itemId: number, direction: -1 | 1) => Promise<void>>;
  }) => {
    const storedPrice = readStoredPriceDisplayMetadata(props.item.metadata);
    const priceDisplay = buildPriceDisplayFromMetadata(
      props.item.metadata,
      props.item.snapshotCurrencyCode,
    );

    return (
      <article class="rounded-xl border border-[color:var(--color-border)] p-3">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="t-badge">{props.item.itemType.toUpperCase()}</span>
              {props.item.issues.length ? (
                <span class={issueBadgeClass(props.item.issues)}>
                  {formatItemIssueBadge(props.item.issues)}
                </span>
              ) : null}
              <span class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                {props.item.title}
              </span>
            </div>
            {props.item.subtitle ? (
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {props.item.subtitle}
              </p>
            ) : null}
            <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              {formatTripDateRange(props.item.startDate, props.item.endDate)}
              {(props.item.startCityName || props.item.endCityName) &&
              props.item.startCityName !== props.item.endCityName
                ? ` · ${props.item.startCityName || "Unknown"} → ${props.item.endCityName || "Unknown"}`
                : props.item.startCityName
                  ? ` · ${props.item.startCityName}`
                  : ""}
            </p>
            {props.item.meta.length ? (
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {props.item.meta.join(" · ")}
              </p>
            ) : null}
            <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
              Snapshotted {formatDateTime(props.item.snapshotTimestamp)}
            </p>
            <div class="mt-2">
              <AvailabilityConfidence
                confidence={props.item.availabilityConfidence}
                compact={false}
                showSupport={Boolean(
                  props.item.availabilityConfidence.supportText,
                )}
              />
            </div>
            {props.item.issues.length ? (
              <div class="mt-2 grid gap-1">
                {props.item.issues.slice(0, 2).map((issue) => (
                  <p
                    key={`${issue.code}-${issue.message}`}
                    class={[
                      "text-xs",
                      issue.severity === "blocking"
                        ? "text-[color:var(--color-error,#b91c1c)]"
                        : "text-[color:var(--color-warning,#92400e)]",
                    ]}
                  >
                    {issue.message}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          <div class="min-w-[200px] text-right">
            <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              {formatTripItemSnapshotLabel(props.item)}
            </p>
            <p class="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">
              {formatMoneyFromCents(
                props.item.snapshotPriceCents,
                props.item.snapshotCurrencyCode,
              )}
            </p>
            {priceDisplay?.baseTotalAmount != null ? (
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {priceDisplay.baseLabel}{" "}
                <span class="font-medium text-[color:var(--color-text)]">
                  {formatMoneyFromCents(
                    storedPrice?.baseAmountCents,
                    props.item.snapshotCurrencyCode,
                  )}
                </span>{" "}
                {formatPriceQualifier(priceDisplay.baseQualifier)}
              </p>
            ) : null}
            {priceDisplay?.totalAmount != null &&
            priceDisplay?.estimatedFeesAmount != null ? (
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {priceDisplay.totalLabel}{" "}
                <span class="font-medium text-[color:var(--color-text)]">
                  {formatMoneyFromCents(
                    storedPrice?.totalAmountCents,
                    props.item.snapshotCurrencyCode,
                  )}
                </span>
                <span class="ml-1">
                  incl.{" "}
                  {formatMoneyFromCents(
                    storedPrice?.estimatedFeesAmountCents,
                    props.item.snapshotCurrencyCode,
                  )}{" "}
                  est.
                </span>
              </p>
            ) : null}
            {priceDisplay?.supportText ? (
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {priceDisplay.supportText}
              </p>
            ) : null}
            <p
              class={[
                "mt-1 text-xs font-medium",
                driftToneClass(props.item.priceDriftStatus),
              ]}
            >
              {formatItemDrift(props.item)}
            </p>
            <div class="mt-3 flex flex-wrap justify-end gap-2">
              <AsyncPendingButton
                class="rounded-lg border border-[color:var(--color-border)] px-2 py-1 text-xs"
                pending={props.pendingActionId === `move-item:${props.item.id}`}
                pendingLabel="Moving..."
                disabled={
                  (props.loading &&
                    props.pendingActionId !== `move-item:${props.item.id}`) ||
                  props.index === 0
                }
                onClick$={() => props.onMove$(props.item.id, -1)}
              >
                Up
              </AsyncPendingButton>
              <AsyncPendingButton
                class="rounded-lg border border-[color:var(--color-border)] px-2 py-1 text-xs"
                pending={props.pendingActionId === `move-item:${props.item.id}`}
                pendingLabel="Moving..."
                disabled={
                  (props.loading &&
                    props.pendingActionId !== `move-item:${props.item.id}`) ||
                  props.index >= props.total - 1
                }
                onClick$={() => props.onMove$(props.item.id, 1)}
              >
                Down
              </AsyncPendingButton>
              <AsyncPendingButton
                class="rounded-lg border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-error,#b91c1c)]"
                pending={
                  props.pendingActionId === `remove-item:${props.item.id}`
                }
                pendingLabel="Removing..."
                disabled={
                  props.loading &&
                  props.pendingActionId !== `remove-item:${props.item.id}`
                }
                onClick$={() => props.onRemove$(props.item.id)}
              >
                Remove
              </AsyncPendingButton>
            </div>
          </div>
        </div>
      </article>
    );
  },
);

const formatTripDateRange = (
  startDate: string | null,
  endDate: string | null,
) => {
  if (startDate && endDate && startDate !== endDate) {
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  }
  if (startDate) return formatDate(startDate);
  if (endDate) return formatDate(endDate);
  return "Not set";
};

const formatTripListEstimate = (trip: TripListItem) => {
  if (!trip.itemCount) return "No priced items";
  if (trip.hasMixedCurrencies) return "Mixed currencies";
  return formatMoneyFromCents(trip.estimatedTotalCents, trip.currencyCode);
};

const formatSnapshotEstimate = (trip: TripDetails) => {
  if (trip.pricing.hasMixedCurrencies) return "Mixed currencies";
  return formatMoneyFromCents(
    trip.pricing.snapshotTotalCents ?? trip.estimatedTotalCents,
    trip.pricing.currencyCode || trip.currencyCode,
  );
};

const formatLiveEstimate = (trip: TripDetails) => {
  if (trip.pricing.hasMixedCurrencies) return "Mixed currencies";
  if (trip.pricing.currentTotalCents == null)
    return "Current price unavailable";
  return formatMoneyFromCents(
    trip.pricing.currentTotalCents,
    trip.pricing.currencyCode || trip.currencyCode,
  );
};

const formatDriftSummary = (trip: TripDetails) => {
  const counts = trip.pricing.driftCounts;
  const parts: string[] = [];

  if (counts.increased) parts.push(`${counts.increased} increased`);
  if (counts.decreased) parts.push(`${counts.decreased} decreased`);
  if (counts.unchanged) parts.push(`${counts.unchanged} unchanged`);
  if (counts.unavailable) parts.push(`${counts.unavailable} unavailable`);

  return parts.length ? parts.join(" · ") : "No priced items yet";
};

const formatTripIntelligenceStatus = (
  intelligence: TripIntelligenceSummary,
) => {
  if (intelligence.status === "blocking_issues_present")
    return "Blocking issues present";
  if (intelligence.status === "warnings_present") return "Warnings present";
  return "Valid itinerary";
};

const formatTripIntelligenceMeta = (intelligence: TripIntelligenceSummary) => {
  if (!intelligence.checkedAt) {
    return "Availability checks run automatically when trip details are loaded.";
  }

  const checked = formatDateTime(intelligence.checkedAt);
  const expires = intelligence.expiresAt
    ? formatDateTime(intelligence.expiresAt)
    : null;
  return expires
    ? `Checked ${checked} · refresh by ${expires}`
    : `Checked ${checked}`;
};

const formatTripAvailabilitySummary = (
  intelligence: TripIntelligenceSummary,
) => {
  const counts = intelligence.itemStatusCounts;
  const parts: string[] = [];

  const availableCount = counts.valid + counts.price_only_changed;
  if (availableCount) parts.push(`${availableCount} available`);
  if (counts.stale) parts.push(`${counts.stale} need recheck`);
  if (counts.unavailable) parts.push(`${counts.unavailable} unavailable`);

  return parts.length ? parts.join(" · ") : "No items yet";
};

const formatTripIssueSummary = (intelligence: TripIntelligenceSummary) => {
  const parts: string[] = [];
  if (intelligence.issueCounts.blocking) {
    parts.push(`${intelligence.issueCounts.blocking} blocking`);
  }
  if (intelligence.issueCounts.warning) {
    parts.push(`${intelligence.issueCounts.warning} warnings`);
  }

  return parts.length ? parts.join(" · ") : "No itinerary issues";
};

const formatTripFreshnessSummary = (intelligence: TripIntelligenceSummary) => {
  if (!intelligence.expiresAt) return "Revalidate to refresh live availability";
  return `Next refresh by ${formatDateTime(intelligence.expiresAt)}`;
};

const formatTripBundlingSummary = (trip: TripDetails) => {
  const gapCount = trip.bundling.gaps.length;
  const suggestionCount = trip.bundling.suggestions.length;

  if (!gapCount) return "No missing components detected.";
  if (!suggestionCount) {
    return `${gapCount} trip gap${gapCount === 1 ? "" : "s"} detected, but no matching live inventory is available right now.`;
  }

  if (gapCount === suggestionCount) {
    return `${suggestionCount} contextual suggestion${suggestionCount === 1 ? "" : "s"} based on the current itinerary.`;
  }

  return `${suggestionCount} suggestion${suggestionCount === 1 ? "" : "s"} for ${gapCount} detected trip gap${gapCount === 1 ? "" : "s"}.`;
};

const formatTripPricingSupport = (trip: TripDetails) => {
  const base =
    "Bundle totals add each item's stored displayed base amount so the total can reconcile with the cards below.";
  const partial = trip.pricing.hasPartialPricing
    ? " Some hotel or car items were added without dates, so those entries still use unit pricing."
    : "";
  return `${base}${partial} Estimated taxes and fees stay on the item when supplier data is incomplete.`;
};

const intelligenceToneClass = (intelligence: TripIntelligenceSummary) => {
  if (intelligence.status === "blocking_issues_present") {
    return "text-[color:var(--color-error,#b91c1c)]";
  }
  if (intelligence.status === "warnings_present") {
    return "text-[color:var(--color-warning,#92400e)]";
  }
  return "text-[color:var(--color-success,#0f766e)]";
};

const getHighestIssueSeverity = (issues: TripValidationIssue[]) => {
  return issues.some((issue) => issue.severity === "blocking")
    ? "blocking"
    : "warning";
};

const issueBadgeClass = (issues: TripValidationIssue[]) => {
  return getHighestIssueSeverity(issues) === "blocking"
    ? "rounded-full border border-[color:var(--color-error,#b91c1c)] bg-[color:rgba(185,28,28,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-error,#b91c1c)]"
    : "rounded-full border border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-warning,#92400e)]";
};

const formatItemIssueBadge = (issues: TripValidationIssue[]) => {
  const blockingCount = issues.filter(
    (issue) => issue.severity === "blocking",
  ).length;
  if (blockingCount) {
    return `${blockingCount} blocking`;
  }
  return `${issues.length} warning${issues.length === 1 ? "" : "s"}`;
};

const formatVerticalLabel = (value: TripVerticalPricing["itemType"]) => {
  if (value === "hotel") return "Hotels";
  if (value === "flight") return "Flights";
  return "Cars";
};

const formatTripItemSnapshotLabel = (item: TripItem) => {
  const storedPrice = readStoredPriceDisplayMetadata(item.metadata);
  if (storedPrice?.baseTotalLabel) {
    return `Snapshot ${storedPrice.baseTotalLabel.toLowerCase()}`;
  }
  if (storedPrice?.baseLabel) {
    return `Snapshot ${storedPrice.baseLabel.toLowerCase()}`;
  }
  return "Snapshot base price";
};

const formatVerticalSnapshot = (vertical: TripVerticalPricing) => {
  if (vertical.hasMixedCurrencies) return "Mixed currencies";
  if (vertical.snapshotSubtotalCents == null || !vertical.currencyCode)
    return "Unavailable";
  return formatMoneyFromCents(
    vertical.snapshotSubtotalCents,
    vertical.currencyCode,
  );
};

const formatVerticalCurrent = (vertical: TripVerticalPricing) => {
  if (vertical.hasMixedCurrencies) return "Mixed currencies";
  if (vertical.currentSubtotalCents == null || !vertical.currencyCode) {
    return "Current price unavailable";
  }
  return formatMoneyFromCents(
    vertical.currentSubtotalCents,
    vertical.currencyCode,
  );
};

const verticalDriftStatus = (
  vertical: TripVerticalPricing,
): TripPriceDriftStatus => {
  if (
    vertical.hasMixedCurrencies ||
    vertical.currentSubtotalCents == null ||
    vertical.priceDeltaCents == null
  ) {
    return "unavailable";
  }
  if (vertical.priceDeltaCents > 0) return "increased";
  if (vertical.priceDeltaCents < 0) return "decreased";
  return "unchanged";
};

const formatVerticalDrift = (vertical: TripVerticalPricing) => {
  const status = verticalDriftStatus(vertical);
  if (status === "unavailable") return "Live comparison unavailable";
  if (!vertical.currencyCode) return "Live comparison unavailable";
  if (status === "unchanged") return "No change";

  return `${status === "increased" ? "↑" : "↓"} ${formatSignedMoneyFromCents(
    vertical.priceDeltaCents || 0,
    vertical.currencyCode,
  )}`;
};

const formatItemDrift = (item: TripItem) => {
  const storedPrice = readStoredPriceDisplayMetadata(item.metadata);
  const liveLabel =
    storedPrice?.baseTotalLabel || storedPrice?.baseLabel || "Live base price";

  if (
    item.priceDriftStatus === "unavailable" ||
    item.currentPriceCents == null ||
    !item.currentCurrencyCode
  ) {
    return `${liveLabel} unavailable`;
  }

  const currentPrice = formatMoneyFromCents(
    item.currentPriceCents,
    item.currentCurrencyCode,
  );
  if (item.priceDriftStatus === "unchanged") {
    return `${liveLabel} unchanged · ${currentPrice}`;
  }

  return `${item.priceDriftStatus === "increased" ? "↑" : "↓"} ${liveLabel} ${currentPrice} (${formatSignedMoneyFromCents(
    item.priceDriftCents || 0,
    item.currentCurrencyCode,
  )})`;
};

const driftToneClass = (status: TripPriceDriftStatus) => {
  if (status === "increased") return "text-[color:var(--color-error,#b91c1c)]";
  if (status === "decreased")
    return "text-[color:var(--color-success,#0f766e)]";
  return "text-[color:var(--color-text-muted)]";
};

const formatDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatSignedMoneyFromCents = (cents: number, currency: string) => {
  const absolute = formatMoneyFromCents(Math.abs(cents), currency);
  if (cents > 0) return `+${absolute}`;
  if (cents < 0) return `-${absolute}`;
  return absolute;
};

const parsePositiveInt = (value: string | null) => {
  const n = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
};

export const head: DocumentHead = {
  title: "Trips | Andacity Travel",
  meta: [
    {
      name: "description",
      content:
        "Create and manage trip itineraries with hotels, flights, and car rentals.",
    },
  ],
};
