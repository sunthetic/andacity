import {
  $,
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import { AsyncInlineSpinner } from "~/components/async/AsyncInlineSpinner";
import { AsyncPendingButton } from "~/components/async/AsyncPendingButton";
import { AsyncRetryControl } from "~/components/async/AsyncRetryControl";
import { AsyncStateNotice } from "~/components/async/AsyncStateNotice";
import { DetailSkeleton } from "~/components/async/AsyncSurfaceSkeleton";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import { InventoryRefreshControl } from "~/components/inventory/InventoryRefreshControl";
import { Page } from "~/components/site/Page";
import { TripBundleExplanation } from "~/components/trips/TripBundleExplanation";
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
  applyTripItemEditApi,
  createTripApi,
  getTripDetailsApi,
  listTripItemReplacementOptionsApi,
  listTripsApi,
  previewTripItemEditApi,
  revalidateTripApi,
  restoreTripRollbackDraftApi,
  TripApiError,
  updateTripItemApi,
  updateTripMetadataApi,
} from "~/lib/trips/trips-api";
import {
  readTripBundlingState,
} from "~/lib/trips/bundle-explainability";
import { compareIsoDate, differenceInDays } from "~/lib/trips/date-utils";
import type {
  TripAppliedChange,
  TripDetails,
  TripEditPreview,
  TripIntelligenceSummary,
  TripItem,
  TripItemCandidate,
  TripItemReplacementOption,
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

type TripEditDraft =
  | {
      actionType: "reorder";
      itemId: number;
      orderedItemIds: number[];
    }
  | {
      actionType: "remove";
      itemId: number;
      removedTitle: string;
    }
  | {
      actionType: "replace";
      itemId: number;
      candidate: TripItemCandidate;
      replacementTitle: string;
    };

type TripActionFeedback = {
  tone: "success" | "info";
  title: string;
  message: string;
};

type AppliedTripChangeState = {
  tripId: number;
  change: TripAppliedChange;
};

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
  const actionFeedback = useSignal<TripActionFeedback | null>(null);
  const replacementPanelError = useSignal<{
    itemId: number;
    message: string;
  } | null>(null);
  const editPreview = useSignal<TripEditPreview | null>(null);
  const editDraft = useSignal<TripEditDraft | null>(null);
  const previewItemId = useSignal<number | null>(null);
  const appliedTripChange = useSignal<AppliedTripChangeState | null>(null);
  const replacementPanelItemId = useSignal<number | null>(null);
  const replacementOptions = useSignal<
    Record<number, TripItemReplacementOption[]>
  >({});
  const lastPreviewScrollKey = useSignal<string | null>(null);

  useVisibleTask$(({ track, cleanup }) => {
    const previewKey = track(() => {
      const itemId = previewItemId.value;
      const actionType = editPreview.value?.actionType || null;
      return itemId != null && actionType ? `${actionType}:${itemId}` : null;
    });

    if (!previewKey) {
      lastPreviewScrollKey.value = null;
      return;
    }

    if (lastPreviewScrollKey.value === previewKey) return;

    const itemId = previewItemId.value;
    if (itemId == null) return;

    const frameId = window.requestAnimationFrame(() => {
      const element = document.getElementById(`trip-edit-preview-${itemId}`);
      if (!(element instanceof HTMLElement)) return;

      const stickyOffset = Number.parseFloat(
        window
          .getComputedStyle(document.documentElement)
          .getPropertyValue("--sticky-top-offset"),
      );
      const topBoundary = (Number.isFinite(stickyOffset) ? stickyOffset : 80) + 12;
      const bottomBoundary = window.innerHeight - 24;
      const rect = element.getBoundingClientRect();

      if (rect.top < topBoundary || rect.bottom > bottomBoundary) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }

      element.focus({ preventScroll: true });
      lastPreviewScrollKey.value = previewKey;
    });

    cleanup(() => {
      window.cancelAnimationFrame(frameId);
    });
  });

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

  const resetEditingSurface$ = $(() => {
    actionFeedback.value = null;
    replacementPanelError.value = null;
    editPreview.value = null;
    editDraft.value = null;
    previewItemId.value = null;
    appliedTripChange.value = null;
    replacementPanelItemId.value = null;
    replacementOptions.value = {};
  });

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
        await resetEditingSurface$();
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
      await resetEditingSurface$();
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
      actionFeedback.value = {
        tone: "success",
        title: "Trip settings saved",
        message:
          "Trip metadata and itinerary editing preferences were updated.",
      };
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
    appliedTripChange.value = null;

    try {
      const trip = await revalidateTripApi(activeTrip.value.id);
      activeTrip.value = trip;
      await refreshTrips$(trip.id, true);
      editingName.value = trip.name || "";
      editingStatus.value = trip.status || "draft";
      actionFeedback.value = {
        tone: "success",
        title: "Trip revalidated",
        message:
          "Fresh availability and bundle signals were applied to the current itinerary.",
      };
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

  const onPreviewRemoveItem$ = $(async (item: TripItem) => {
    if (!activeTrip.value || loading.value) return;
    loading.value = true;
    activeAction.value = `preview-remove:${item.id}`;
    error.value = null;
    actionFeedback.value = null;

    try {
      const preview = await previewTripItemEditApi(
        activeTrip.value.id,
        item.id,
        {
          actionType: "remove",
        },
      );
      editDraft.value = {
        actionType: "remove",
        itemId: item.id,
        removedTitle: item.title,
      };
      editPreview.value = preview;
      previewItemId.value = item.id;
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to preview trip item removal.";
      error.value = message;
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const onPreviewMoveItem$ = $(async (itemId: number, direction: -1 | 1) => {
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
    activeAction.value = `preview-move:${itemId}`;
    error.value = null;
    actionFeedback.value = null;

    try {
      const preview = await previewTripItemEditApi(
        activeTrip.value.id,
        itemId,
        {
          actionType: "reorder",
          orderedItemIds,
        },
      );
      editDraft.value = {
        actionType: "reorder",
        itemId,
        orderedItemIds,
      };
      editPreview.value = preview;
      previewItemId.value = itemId;
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to preview itinerary reorder.";
      error.value = message;
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const onLoadReplacementOptions$ = $(async (itemId: number) => {
    if (!activeTrip.value || loading.value) return;

    if (replacementPanelItemId.value === itemId) {
      replacementPanelItemId.value = null;
      if (replacementPanelError.value?.itemId === itemId) {
        replacementPanelError.value = null;
      }
      return;
    }

    const cached = replacementOptions.value[itemId];
    if (cached?.length) {
      replacementPanelItemId.value = itemId;
      if (replacementPanelError.value?.itemId === itemId) {
        replacementPanelError.value = null;
      }
      return;
    }

    loading.value = true;
    activeAction.value = `load-replacements:${itemId}`;
    error.value = null;
    actionFeedback.value = null;
    replacementPanelError.value = null;

    try {
      const options = await listTripItemReplacementOptionsApi(
        activeTrip.value.id,
        itemId,
      );
      replacementOptions.value = {
        ...replacementOptions.value,
        [itemId]: options,
      };
      replacementPanelItemId.value = itemId;
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to load replacement options.";
      error.value = message;
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const onPreviewReplacement$ = $(
    async (itemId: number, option: TripItemReplacementOption) => {
      if (!activeTrip.value || loading.value) return;

      loading.value = true;
      activeAction.value = `preview-replace:${itemId}:${option.inventoryId}`;
      error.value = null;
      actionFeedback.value = null;
      replacementPanelError.value = null;

      try {
        const preview = await previewTripItemEditApi(
          activeTrip.value.id,
          itemId,
          {
            actionType: "replace",
            candidate: option.candidate,
          },
        );
        editDraft.value = {
          actionType: "replace",
          itemId,
          candidate: option.candidate,
          replacementTitle: option.title,
        };
        editPreview.value = preview;
        previewItemId.value = itemId;
      } catch (cause) {
        const message =
          cause instanceof TripApiError
            ? cause.message
            : "Failed to preview trip item replacement.";
        error.value = message;
        replacementPanelError.value = {
          itemId,
          message,
        };
      } finally {
        loading.value = false;
        activeAction.value = null;
      }
    },
  );

  const onCancelEditPreview$ = $(() => {
    editDraft.value = null;
    editPreview.value = null;
    previewItemId.value = null;
    lastPreviewScrollKey.value = null;
  });

  const onApplyEditPreview$ = $(async () => {
    if (!activeTrip.value || !editDraft.value || loading.value) return;

    const draft = editDraft.value;
    const preview = editPreview.value;
    loading.value = true;
    activeAction.value = `apply-edit:${draft.actionType}:${draft.itemId}`;
    error.value = null;
    actionFeedback.value = null;

    try {
      const result =
        draft.actionType === "reorder"
          ? await applyTripItemEditApi(activeTrip.value.id, draft.itemId, {
              actionType: "reorder",
              orderedItemIds: draft.orderedItemIds,
            })
          : draft.actionType === "remove"
            ? await applyTripItemEditApi(activeTrip.value.id, draft.itemId, {
                actionType: "remove",
              })
            : await applyTripItemEditApi(activeTrip.value.id, draft.itemId, {
                actionType: "replace",
                candidate: draft.candidate,
              });
      const trip = await getTripDetailsApi(result.trip.id);

      activeTrip.value = trip;
      await refreshTrips$(trip.id, true);
      editDraft.value = null;
      editPreview.value = null;
      previewItemId.value = null;
      replacementPanelItemId.value = null;
      replacementPanelError.value = null;
      appliedTripChange.value = result.appliedChange
        ? {
            tripId: trip.id,
            change: result.appliedChange,
          }
        : null;
      actionFeedback.value = result.appliedChange
        ? preview?.bundleImpact
          ? {
              tone: "success",
              title: "Major bundle swap applied",
              message:
                "Review the recalculated bundle fit and use rollback if the override does not hold up.",
            }
          : {
              tone: "success",
              title: "Major itinerary change applied",
              message:
                "Review the change summary and use rollback if the recomputed trip feels off.",
            }
        : draft.actionType === "reorder"
          ? {
              tone: "success",
              title: "Itinerary order updated",
              message: "The item move was applied to the trip timeline.",
            }
          : draft.actionType === "remove"
            ? {
                tone: "success",
                title: "Item removed",
                message: `${draft.removedTitle} was removed from the itinerary.`,
              }
            : preview?.bundleImpact
              ? {
                  tone: "success",
                  title: "Bundle swap applied",
                  message:
                    preview.bundleImpact.selectionMode === "manual_override"
                      ? "This component is now a manual override. Rollback restores the previous bundle pick."
                      : `${draft.replacementTitle} replaced the current bundle component.`,
                }
            : {
                tone: "success",
                title: "Item replaced",
                message: `${draft.replacementTitle} is now in the itinerary.`,
              };
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to apply itinerary edit.";
      error.value = message;
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const onToggleItemLock$ = $(async (item: TripItem) => {
    if (!activeTrip.value || loading.value) return;
    loading.value = true;
    activeAction.value = `toggle-lock:${item.id}`;
    error.value = null;
    actionFeedback.value = null;
    appliedTripChange.value = null;

    try {
      const trip = await updateTripItemApi(activeTrip.value.id, item.id, {
        locked: !item.locked,
      });
      activeTrip.value = trip;
      await refreshTrips$(trip.id, true);
      if (previewItemId.value === item.id) {
        editDraft.value = null;
        editPreview.value = null;
        previewItemId.value = null;
      }
      actionFeedback.value = {
        tone: "success",
        title: item.locked ? "Item unlocked" : "Item locked",
        message: item.locked
          ? "Auto-rebalance can move this item again when enabled."
          : "Smart logic will preserve this item during auto-rebalance.",
      };
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to update item lock state.";
      error.value = message;
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const onToggleAutoRebalance$ = $(async () => {
    if (!activeTrip.value || loading.value) return;
    loading.value = true;
    activeAction.value = "toggle-auto-rebalance";
    error.value = null;
    actionFeedback.value = null;
    appliedTripChange.value = null;

    try {
      const trip = await updateTripMetadataApi(activeTrip.value.id, {
        metadata: {
          autoRebalance: !activeTrip.value.editing.autoRebalance,
        },
      });
      activeTrip.value = trip;
      await refreshTrips$(trip.id, true);
      actionFeedback.value = {
        tone: "success",
        title: trip.editing.autoRebalance
          ? "Auto-rebalance enabled"
          : "Auto-rebalance disabled",
        message: trip.editing.autoRebalance
          ? "Replacement previews can reflow unlocked items around locked itinerary anchors."
          : "Replacements will keep their current positions unless you move them explicitly.",
      };
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to update auto-rebalance.";
      error.value = message;
    } finally {
      loading.value = false;
      activeAction.value = null;
    }
  });

  const onDismissAppliedChange$ = $(() => {
    appliedTripChange.value = null;
  });

  const onRollbackAppliedChange$ = $(async () => {
    if (
      !appliedTripChange.value ||
      !appliedTripChange.value.change.rollbackDraft ||
      loading.value
    ) {
      return;
    }

    loading.value = true;
    activeAction.value = "rollback-change";
    error.value = null;

    try {
      const rollbackDraft = appliedTripChange.value.change.rollbackDraft;
      const trip = await restoreTripRollbackDraftApi(
        appliedTripChange.value.tripId,
        rollbackDraft,
      );
      activeTrip.value = trip;
      await refreshTrips$(trip.id, true);
      appliedTripChange.value = null;
      actionFeedback.value = {
        tone: "success",
        title: "Change rolled back",
        message: "The prior itinerary draft was restored.",
      };
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to roll back itinerary change.";
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
    appliedTripChange.value = null;

    try {
      const trip = await addItemToTripApi(activeTrip.value.id, candidate);
      activeTrip.value = trip;
      await refreshTrips$(trip.id, true);
      actionFeedback.value = {
        tone: "success",
        title: "Suggestion added",
        message: "The suggested inventory was added to the itinerary.",
      };
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
      await resetEditingSurface$();
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

      {actionFeedback.value ? (
        <ActionFeedbackNotice
          class="mt-4"
          feedback={actionFeedback.value}
          onDismiss$={$(() => {
            actionFeedback.value = null;
          })}
        />
      ) : null}

      {appliedTripChange.value ? (
        <RecentTripChangeNotice
          class="mt-4"
          change={appliedTripChange.value.change}
          loading={loading.value}
          pendingActionId={activeAction.value}
          onRollback$={onRollbackAppliedChange$}
          onDismiss$={onDismissAppliedChange$}
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
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                      Itinerary timeline
                    </h2>
                    <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                      Day-grouped scheduling with clear sequencing, transfer
                      windows, and conflict states.
                    </p>
                  </div>

                  <div class="min-w-[240px] rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 py-3">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                          Auto-rebalance
                        </p>
                        <p class="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">
                          {activeTrip.value.editing.autoRebalance
                            ? "Enabled"
                            : "Disabled"}
                        </p>
                        <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                          {activeTrip.value.editing.autoRebalance
                            ? `${activeTrip.value.editing.lockedItemCount} locked item${activeTrip.value.editing.lockedItemCount === 1 ? "" : "s"} will stay anchored during replacement reflow.`
                            : "Replacements stay in place unless you move them explicitly."}
                        </p>
                      </div>

                      <AsyncPendingButton
                        class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs"
                        pending={activeAction.value === "toggle-auto-rebalance"}
                        pendingLabel="Saving..."
                        disabled={
                          loading.value &&
                          activeAction.value !== "toggle-auto-rebalance"
                        }
                        onClick$={onToggleAutoRebalance$}
                      >
                        {activeTrip.value.editing.autoRebalance
                          ? "Turn off"
                          : "Turn on"}
                      </AsyncPendingButton>
                    </div>
                  </div>
                </div>

                {activeTrip.value.items.length ? (
                  <TripTimeline
                    trip={activeTrip.value}
                    loading={loading.value}
                    pendingActionId={activeAction.value}
                    preview={editPreview.value}
                    previewItemId={previewItemId.value}
                    replacementPanelItemId={replacementPanelItemId.value}
                    replacementOptions={replacementOptions.value}
                    replacementPanelError={replacementPanelError.value}
                    onPreviewRemove$={onPreviewRemoveItem$}
                    onPreviewMove$={onPreviewMoveItem$}
                    onLoadReplacementOptions$={onLoadReplacementOptions$}
                    onPreviewReplacement$={onPreviewReplacement$}
                    onToggleLock$={onToggleItemLock$}
                    onApplyPreview$={onApplyEditPreview$}
                    onCancelPreview$={onCancelEditPreview$}
                  />
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

    if (actionId?.startsWith("preview-remove:")) {
      return {
        title: "Previewing removal",
        message:
          "Trip impact is being recalculated before this item is removed.",
      };
    }

    if (actionId?.startsWith("preview-move:")) {
      return {
        title: "Previewing item move",
        message:
          "Order, timing, and coherence changes are being previewed before the move is applied.",
      };
    }

    if (actionId?.startsWith("preview-replace:")) {
      return {
        title: "Previewing replacement",
        message:
          "Downstream itinerary impact is being recalculated for the proposed replacement.",
      };
    }

    if (actionId?.startsWith("apply-edit:")) {
      return {
        title: "Applying itinerary edit",
        message:
          "The selected edit is being saved. Existing itinerary details stay visible until the update completes.",
      };
    }

    if (actionId?.startsWith("load-replacements:")) {
      return {
        title: "Loading replacements",
        message:
          "Relevant alternatives are being loaded for this itinerary item.",
      };
    }

    if (actionId?.startsWith("toggle-lock:")) {
      return {
        title: "Saving item lock",
        message: "Lock preferences are being updated for this itinerary item.",
      };
    }

    if (actionId === "toggle-auto-rebalance") {
      return {
        title: "Saving auto-rebalance",
        message:
          "Trip editing preferences are being updated for future replacements.",
      };
    }

    if (actionId === "rollback-change") {
      return {
        title: "Rolling back itinerary change",
        message:
          "The prior itinerary draft is being restored before the current trip view updates.",
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

type TimelineTransitionTone = "neutral" | "warning" | "blocking";

type TimelineTransition = {
  id: string;
  label: string;
  detail: string;
  tone: TimelineTransitionTone;
};

type TimelineEntry = {
  item: TripItem;
  transitionToNext: TimelineTransition | null;
};

type TimelineDayGroup = {
  key: string;
  label: string;
  shortLabel: string;
  dayNumber: number | null;
  issueCounts: {
    blocking: number;
    warning: number;
  };
  items: TimelineEntry[];
};

const isTripTimelineDetailActionPending = (
  actionId: string | null,
  itemId: number,
) => {
  if (!actionId) return false;

  return (
    actionId === `preview-move:${itemId}` ||
    actionId === `preview-remove:${itemId}` ||
    actionId === `load-replacements:${itemId}` ||
    actionId === `toggle-lock:${itemId}` ||
    actionId === `apply-edit:reorder:${itemId}` ||
    actionId === `apply-edit:remove:${itemId}` ||
    actionId === `apply-edit:replace:${itemId}` ||
    actionId.startsWith(`preview-replace:${itemId}:`)
  );
};

const TripTimeline = component$(
  (props: {
    trip: TripDetails;
    loading: boolean;
    pendingActionId: string | null;
    preview: TripEditPreview | null;
    previewItemId: number | null;
    replacementPanelItemId: number | null;
    replacementOptions: Record<number, TripItemReplacementOption[]>;
    replacementPanelError: { itemId: number; message: string } | null;
    onPreviewRemove$: QRL<(item: TripItem) => Promise<void>>;
    onPreviewMove$: QRL<(itemId: number, direction: -1 | 1) => Promise<void>>;
    onLoadReplacementOptions$: QRL<(itemId: number) => Promise<void>>;
    onPreviewReplacement$: QRL<
      (itemId: number, option: TripItemReplacementOption) => Promise<void>
    >;
    onToggleLock$: QRL<(item: TripItem) => Promise<void>>;
    onApplyPreview$: QRL<() => Promise<void>>;
    onCancelPreview$: QRL<() => void>;
  }) => {
    const timeline = buildTripTimeline(props.trip);

    return (
      <div class="mt-4">
        <div class="flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-text-muted)]">
          <span class="rounded-full bg-[color:var(--color-surface-1)] px-2.5 py-1">
            {props.trip.items.length} item
            {props.trip.items.length === 1 ? "" : "s"}
          </span>
          <span class="rounded-full bg-[color:var(--color-surface-1)] px-2.5 py-1">
            {timeline.length} day{timeline.length === 1 ? "" : "s"} on the
            timeline
          </span>
          <span class="rounded-full bg-[color:var(--color-surface-1)] px-2.5 py-1">
            {formatTripIssueSummary(props.trip.intelligence)}
          </span>
        </div>

        <div class="mt-4 grid gap-4">
          {timeline.map((group) => (
            <section
              key={group.key}
              aria-labelledby={`timeline-day-${group.key}`}
              class="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]/60 p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--color-divider)] pb-3">
                <div>
                  <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    {group.dayNumber != null
                      ? `Day ${group.dayNumber}`
                      : "Unscheduled"}
                  </p>
                  <h3
                    id={`timeline-day-${group.key}`}
                    class="mt-1 text-lg font-semibold text-[color:var(--color-text-strong)]"
                  >
                    {group.label}
                  </h3>
                  <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                    {group.items.length} scheduled item
                    {group.items.length === 1 ? "" : "s"} for {group.shortLabel}
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-2 text-xs">
                  {group.issueCounts.blocking ? (
                    <span class={timelineCountBadgeClass("blocking")}>
                      {group.issueCounts.blocking} blocking
                    </span>
                  ) : null}
                  {group.issueCounts.warning ? (
                    <span class={timelineCountBadgeClass("warning")}>
                      {group.issueCounts.warning} warning
                      {group.issueCounts.warning === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  {!group.issueCounts.blocking && !group.issueCounts.warning ? (
                    <span class={timelineCountBadgeClass("neutral")}>
                      No conflicts surfaced
                    </span>
                  ) : null}
                </div>
              </div>

              <div class="mt-4 grid gap-4">
                {group.items.map((entry) => (
                  <div
                    key={entry.item.id}
                    class="grid gap-3 md:grid-cols-[112px_1fr]"
                  >
                    <div class="rounded-[1.25rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
                      <p class="text-[10px] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                        {formatTimelineTimeEyebrow(entry.item)}
                      </p>
                      <p class="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">
                        {formatTimelinePrimaryTime(entry.item)}
                      </p>
                      {formatTimelineSecondaryTime(entry.item) ? (
                        <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                          {formatTimelineSecondaryTime(entry.item)}
                        </p>
                      ) : null}
                      {formatTimelineSpanBadge(entry.item) ? (
                        <p class="mt-3 inline-flex rounded-full bg-[color:var(--color-primary-50)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-primary-700,#1d4ed8)]">
                          {formatTimelineSpanBadge(entry.item)}
                        </p>
                      ) : null}
                    </div>

                    <div class="grid gap-3">
                      <TripTimelineItemCard
                        item={entry.item}
                        total={props.trip.items.length}
                        loading={props.loading}
                        pendingActionId={props.pendingActionId}
                        preview={
                          props.previewItemId === entry.item.id
                            ? props.preview
                            : null
                        }
                        replacementOptions={
                          props.replacementOptions[entry.item.id] || []
                        }
                        replacementPanelError={
                          props.replacementPanelError?.itemId === entry.item.id
                            ? props.replacementPanelError.message
                            : null
                        }
                        replacementPanelOpen={
                          props.replacementPanelItemId === entry.item.id
                        }
                        onPreviewRemove$={props.onPreviewRemove$}
                        onPreviewMove$={props.onPreviewMove$}
                        onLoadReplacementOptions$={
                          props.onLoadReplacementOptions$
                        }
                        onPreviewReplacement$={props.onPreviewReplacement$}
                        onToggleLock$={props.onToggleLock$}
                        onApplyPreview$={props.onApplyPreview$}
                        onCancelPreview$={props.onCancelPreview$}
                      />
                      {entry.transitionToNext ? (
                        <TripTimelineTransitionCard
                          transition={entry.transitionToNext}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  },
);

const TripTimelineItemCard = component$(
  (props: {
    item: TripItem;
    total: number;
    loading: boolean;
    pendingActionId: string | null;
    preview: TripEditPreview | null;
    replacementOptions: TripItemReplacementOption[];
    replacementPanelError: string | null;
    replacementPanelOpen: boolean;
    onPreviewRemove$: QRL<(item: TripItem) => Promise<void>>;
    onPreviewMove$: QRL<(itemId: number, direction: -1 | 1) => Promise<void>>;
    onLoadReplacementOptions$: QRL<(itemId: number) => Promise<void>>;
    onPreviewReplacement$: QRL<
      (itemId: number, option: TripItemReplacementOption) => Promise<void>
    >;
    onToggleLock$: QRL<(item: TripItem) => Promise<void>>;
    onApplyPreview$: QRL<() => Promise<void>>;
    onCancelPreview$: QRL<() => void>;
  }) => {
    const storedPrice = readStoredPriceDisplayMetadata(props.item.metadata);
    const priceDisplay = buildPriceDisplayFromMetadata(
      props.item.metadata,
      props.item.snapshotCurrencyCode,
    );
    const bundleState = readTripBundlingState(props.item.metadata);
    const bundleExplanation = bundleState?.explanation || null;
    const detailSummary = buildTimelineDisclosureSummary(props.item);
    const isBlockingItem = props.item.issues.some(
      (issue) => issue.severity === "blocking",
    );
    const detailsOpen = useSignal(
      isBlockingItem ||
        props.replacementPanelOpen ||
        Boolean(props.preview) ||
        isTripTimelineDetailActionPending(props.pendingActionId, props.item.id),
    );

    useVisibleTask$(({ track }) => {
      const replacementPanelOpen = track(() => props.replacementPanelOpen);
      const hasPreview = track(() => Boolean(props.preview));
      const pendingActionId = track(() => props.pendingActionId);
      const blockingIssue = track(() =>
        props.item.issues.some((issue) => issue.severity === "blocking"),
      );

      if (
        replacementPanelOpen ||
        hasPreview ||
        blockingIssue ||
        isTripTimelineDetailActionPending(pendingActionId, props.item.id)
      ) {
        detailsOpen.value = true;
      }
    });

    return (
      <article
        class={[
          "rounded-[1.25rem] border bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)]",
          tripTimelineCardClass(props.item),
        ]}
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="t-badge">{formatTimelineItemType(props.item)}</span>
              <span
                class={availabilityBadgeClass(props.item.availabilityStatus)}
              >
                {formatAvailabilityBadge(props.item.availabilityStatus)}
              </span>
              {props.item.locked ? (
                <span class={timelineCountBadgeClass("neutral")}>Locked</span>
              ) : null}
              {bundleState ? (
                <span class={bundleSelectionBadgeClass(bundleState.selectionMode)}>
                  {bundleState.selectionMode === "manual_override"
                    ? "Manual override"
                    : "Bundle-backed"}
                </span>
              ) : null}
              {formatTimelineContextBadge(props.item) ? (
                <span class={timelineCountBadgeClass("neutral")}>
                  {formatTimelineContextBadge(props.item)}
                </span>
              ) : null}
              {props.item.issues.length ? (
                <span class={issueBadgeClass(props.item.issues)}>
                  {formatItemIssueBadge(props.item.issues)}
                </span>
              ) : null}
            </div>

            <h3 class="mt-3 text-base font-semibold text-[color:var(--color-text-strong)]">
              {props.item.title}
            </h3>

            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {formatTimelineRouteDisplay(props.item)}
            </p>

            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {formatTimelineScheduleSummary(props.item)}
            </p>

            {shouldShowTimelineSubtitle(props.item) ? (
              <p class="mt-2 text-sm text-[color:var(--color-text)]">
                {props.item.subtitle}
              </p>
            ) : null}

            {formatTimelineMetaSummary(props.item) ? (
              <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                {formatTimelineMetaSummary(props.item)}
              </p>
            ) : null}

            {props.item.issues.length ? (
              <div class="mt-3 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-3 py-2">
                <p
                  class={[
                    "text-xs font-medium",
                    props.item.issues.some(
                      (issue) => issue.severity === "blocking",
                    )
                      ? "text-[color:var(--color-error,#b91c1c)]"
                      : "text-[color:var(--color-warning,#92400e)]",
                  ]}
                >
                  {props.item.issues[0]?.message}
                </p>
              </div>
            ) : null}
          </div>

          <div class="min-w-[200px] rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 py-3 text-left md:text-right">
            <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              {formatTripItemSnapshotLabel(props.item)}
            </p>
            <p class="mt-1 text-lg font-semibold text-[color:var(--color-text-strong)]">
              {formatMoneyFromCents(
                props.item.snapshotPriceCents,
                props.item.snapshotCurrencyCode,
              )}
            </p>
            <p
              class={[
                "mt-2 text-xs font-medium",
                driftToneClass(props.item.priceDriftStatus),
              ]}
            >
              {formatItemDrift(props.item)}
            </p>
          </div>
        </div>

        <details
          class="mt-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]"
          open={detailsOpen.value}
          onToggle$={(_, currentTarget) => {
            detailsOpen.value = (currentTarget as HTMLDetailsElement).open;
          }}
        >
          <summary class="cursor-pointer list-none px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] [&::-webkit-details-marker]:hidden">
            <span class="flex flex-wrap items-center justify-between gap-2">
              <span>{detailSummary}</span>
              <span class="text-xs text-[color:var(--color-text-muted)]">
                {detailsOpen.value ? "Collapse details" : "Expand details"}
              </span>
            </span>
          </summary>

          <div class="border-t border-[color:var(--color-divider)] px-3 py-3">
            <div class="grid gap-3 lg:grid-cols-[1fr_220px]">
              <div>
                <div class="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
                  <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    Availability
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
                  <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                    Snapshotted {formatDateTime(props.item.snapshotTimestamp)}
                  </p>
                </div>

                {props.item.issues.length ? (
                  <div class="mt-3 grid gap-2">
                    {props.item.issues.map((issue) => (
                      <div
                        key={`${issue.code}-${issue.message}-${issue.itemId || "trip"}`}
                        class={[
                          "rounded-xl border px-3 py-2 text-sm",
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

              <div class="grid gap-3">
                <div class="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
                  <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    Price detail
                  </p>
                  <p class="mt-2 text-sm font-semibold text-[color:var(--color-text-strong)]">
                    {formatMoneyFromCents(
                      props.item.snapshotPriceCents,
                      props.item.snapshotCurrencyCode,
                    )}
                  </p>
                  {priceDisplay?.baseTotalAmount != null ? (
                    <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
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
                    <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                      {priceDisplay.supportText}
                    </p>
                  ) : null}
                </div>

                <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <AsyncPendingButton
                    class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs"
                    pending={
                      props.pendingActionId === `preview-move:${props.item.id}`
                    }
                    pendingLabel="Previewing..."
                    disabled={
                      (props.loading &&
                        props.pendingActionId !==
                          `preview-move:${props.item.id}`) ||
                      props.item.position === 0
                    }
                    onClick$={() => props.onPreviewMove$(props.item.id, -1)}
                  >
                    Move earlier
                  </AsyncPendingButton>
                  <AsyncPendingButton
                    class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs"
                    pending={
                      props.pendingActionId === `preview-move:${props.item.id}`
                    }
                    pendingLabel="Previewing..."
                    disabled={
                      (props.loading &&
                        props.pendingActionId !==
                          `preview-move:${props.item.id}`) ||
                      props.item.position >= props.total - 1
                    }
                    onClick$={() => props.onPreviewMove$(props.item.id, 1)}
                  >
                    Move later
                  </AsyncPendingButton>
                  <AsyncPendingButton
                    class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs"
                    pending={
                      props.pendingActionId ===
                      `load-replacements:${props.item.id}`
                    }
                    pendingLabel="Loading..."
                    disabled={
                      props.loading &&
                      props.pendingActionId !==
                        `load-replacements:${props.item.id}`
                    }
                    onClick$={() =>
                      props.onLoadReplacementOptions$(props.item.id)
                    }
                  >
                    {props.replacementPanelOpen
                      ? "Hide replacements"
                      : bundleState
                        ? "Swap component"
                        : "Replace item"}
                  </AsyncPendingButton>
                  <AsyncPendingButton
                    class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs"
                    pending={
                      props.pendingActionId === `toggle-lock:${props.item.id}`
                    }
                    pendingLabel="Saving..."
                    disabled={
                      props.loading &&
                      props.pendingActionId !== `toggle-lock:${props.item.id}`
                    }
                    onClick$={() => props.onToggleLock$(props.item)}
                  >
                    {props.item.locked ? "Unlock item" : "Lock item"}
                  </AsyncPendingButton>
                  <AsyncPendingButton
                    class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-error,#b91c1c)] sm:col-span-2 lg:col-span-1"
                    pending={
                      props.pendingActionId ===
                      `preview-remove:${props.item.id}`
                    }
                    pendingLabel="Previewing..."
                    disabled={
                      props.loading &&
                      props.pendingActionId !==
                        `preview-remove:${props.item.id}`
                    }
                    onClick$={() => props.onPreviewRemove$(props.item)}
                  >
                    Remove item
                  </AsyncPendingButton>
                </div>
              </div>
            </div>

            {bundleExplanation ? (
              <div class="mt-3">
                {bundleState?.selectionMode === "manual_override" ? (
                  <div class="mb-3 rounded-xl border border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)] px-3 py-2">
                    <p class="text-xs font-medium text-[color:var(--color-warning,#92400e)]">
                      Manual override is active. Preview another swap or use
                      rollback after apply to restore the previous bundle pick.
                    </p>
                  </div>
                ) : null}
                <TripBundleExplanation
                  explanation={bundleExplanation}
                  dense={false}
                />
              </div>
            ) : null}

            {props.preview ? (
              <TripEditPreviewPanel
                preview={props.preview}
                item={props.item}
                loading={props.loading}
                pendingActionId={props.pendingActionId}
                onApplyPreview$={props.onApplyPreview$}
                onCancelPreview$={props.onCancelPreview$}
              />
            ) : null}

            {props.replacementPanelOpen ? (
              <TripReplacementOptionsPanel
                item={props.item}
                options={props.replacementOptions}
                errorMessage={props.replacementPanelError}
                loading={props.loading}
                pendingActionId={props.pendingActionId}
                onPreviewReplacement$={props.onPreviewReplacement$}
              />
            ) : null}
          </div>
        </details>
      </article>
    );
  },
);

const TripReplacementOptionsPanel = component$(
  (props: {
    item: TripItem;
    options: TripItemReplacementOption[];
    errorMessage: string | null;
    loading: boolean;
    pendingActionId: string | null;
    onPreviewReplacement$: QRL<
      (itemId: number, option: TripItemReplacementOption) => Promise<void>
    >;
  }) => {
    const bundleState = readTripBundlingState(props.item.metadata);
    return (
      <div class="mt-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              {bundleState ? "Swap component" : "Replace item"}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {bundleState
                ? "Preview price, timing, coherence, and updated bundle strength before saving a manual override."
                : "Alternatives keep this itinerary controlled by previewing impact before saving."}
            </p>
          </div>
        </div>

        {props.errorMessage ? (
          <AsyncStateNotice
            class="mt-3"
            state="failed"
            title="Swap preview failed"
            message={props.errorMessage}
          />
        ) : null}

        {props.options.length ? (
          <div class="mt-3 grid gap-3">
            {props.options.map((option) => {
              const optionBundleState = readTripBundlingState(
                option.candidate.metadata,
              );

              return (
                <div
                  key={`${props.item.id}-${option.inventoryId}`}
                  class="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 py-3"
                >
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                          {option.title}
                        </p>
                        {optionBundleState ? (
                          <span
                            class={bundleStrengthBadgeClass(
                              optionBundleState.explanation.strength.level,
                            )}
                          >
                            {optionBundleState.explanation.strength.label}
                          </span>
                        ) : null}
                      </div>
                      {option.subtitle ? (
                        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                          {option.subtitle}
                        </p>
                      ) : null}
                      {option.meta.length ? (
                        <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                          {option.meta.join(" · ")}
                        </p>
                      ) : null}
                      {option.reasons.length ? (
                        <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                          {option.reasons.join(" · ")}
                        </p>
                      ) : null}
                    </div>

                    <div class="text-right">
                      <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                        {formatMoneyFromCents(
                          option.priceCents,
                          option.currencyCode,
                        )}
                      </p>
                      <AsyncPendingButton
                        class="mt-2 rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs"
                        pending={
                          props.pendingActionId ===
                          `preview-replace:${props.item.id}:${option.inventoryId}`
                        }
                        pendingLabel="Previewing..."
                        disabled={
                          props.loading &&
                          props.pendingActionId !==
                            `preview-replace:${props.item.id}:${option.inventoryId}`
                        }
                        onClick$={() =>
                          props.onPreviewReplacement$(props.item.id, option)
                        }
                      >
                        Preview swap
                      </AsyncPendingButton>
                    </div>
                  </div>

                  {optionBundleState ? (
                    <div class="mt-3">
                      <TripBundleExplanation
                        explanation={optionBundleState.explanation}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p class="mt-3 text-sm text-[color:var(--color-text-muted)]">
            {bundleState
              ? "No coherent swap options are available for this component right now."
              : "No close alternatives are available for this item right now."}
          </p>
        )}
      </div>
    );
  },
);

const TripEditPreviewPanel = component$(
  (props: {
    preview: TripEditPreview;
    item: TripItem;
    loading: boolean;
    pendingActionId: string | null;
    onApplyPreview$: QRL<() => Promise<void>>;
    onCancelPreview$: QRL<() => void>;
  }) => {
    return (
      <div
        id={`trip-edit-preview-${props.item.id}`}
        tabIndex={-1}
        style={{ scrollMarginTop: "calc(var(--sticky-top-offset) + 12px)" }}
        class="mt-3 rounded-xl border border-[color:var(--color-primary-150)] bg-[color:var(--color-primary-25)] px-3 py-3 outline-none"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              {props.preview.changeSummary.safetyLevel === "major"
                ? "Major edit draft"
                : "Edit preview"}
            </p>
            <p class="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">
              {props.preview.changeSummary.headline}
            </p>
            <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              {props.preview.changeSummary.whatChanged}
            </p>
            {props.preview.autoRebalanced ? (
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                Auto-rebalance kept locked items in place while reflowing the
                rest of the itinerary.
              </p>
            ) : null}
          </div>

          <div class="flex flex-wrap gap-2">
            <AsyncPendingButton
              class="rounded-lg bg-[color:var(--color-action)] px-3 py-2 text-xs font-semibold text-white"
              pending={
                props.pendingActionId ===
                `apply-edit:${props.preview.actionType}:${props.item.id}`
              }
              pendingLabel="Applying..."
              disabled={
                props.loading &&
                props.pendingActionId !==
                  `apply-edit:${props.preview.actionType}:${props.item.id}`
              }
              onClick$={props.onApplyPreview$}
            >
              {props.preview.bundleImpact?.selectionMode === "manual_override"
                ? props.preview.changeSummary.safetyLevel === "major"
                  ? "Apply override"
                  : "Apply override"
                : props.preview.changeSummary.safetyLevel === "major"
                  ? "Apply major change"
                  : "Apply change"}
            </AsyncPendingButton>
            <button
              type="button"
              class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs"
              onClick$={props.onCancelPreview$}
            >
              Cancel
            </button>
          </div>
        </div>

        <div
          class={[
            "mt-3 grid gap-3",
            props.preview.bundleImpact ? "md:grid-cols-4" : "md:grid-cols-3",
          ]}
        >
          <PreviewStatCard
            label="Why"
            summary={props.preview.changeSummary.whyChanged}
          />
          <PreviewStatCard
            label="Total price"
            summary={props.preview.priceImpact.summary}
          />
          <PreviewStatCard
            label="Timing"
            summary={props.preview.timingImpact.summary}
          />
          {props.preview.bundleImpact ? (
            <PreviewStatCard
              label="Bundle fit"
              summary={props.preview.bundleImpact.strengthSummary}
            />
          ) : null}
        </div>

        <div class="mt-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
          <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Impact
          </p>
          <p class="mt-2 text-sm text-[color:var(--color-text-strong)]">
            {props.preview.changeSummary.impactSummary}
          </p>
          <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
            {props.preview.coherenceImpact.summary}
          </p>
        </div>

        {props.preview.bundleImpact ? (
          <div class="mt-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
            <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Bundle override
            </p>
            <p class="mt-2 text-sm text-[color:var(--color-text-strong)]">
              {props.preview.bundleImpact.summary}
            </p>
            <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
              {props.preview.bundleImpact.savingsSummary}
            </p>
            {props.preview.bundleImpact.explanation ? (
              <div class="mt-3">
                <TripBundleExplanation
                  explanation={props.preview.bundleImpact.explanation}
                  dense={false}
                />
              </div>
            ) : null}
            {props.preview.bundleImpact.limitations.length ? (
              <div class="mt-3 grid gap-2">
                {props.preview.bundleImpact.limitations.map((entry) => (
                  <p
                    key={entry}
                    class="text-xs text-[color:var(--color-warning,#92400e)]"
                  >
                    {entry}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {props.preview.timingImpact.changedItems.length ? (
          <div class="mt-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
            <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Timing shifts
            </p>
            <div class="mt-2 grid gap-2">
              {props.preview.timingImpact.changedItems.map((change) => (
                <div
                  key={`${change.itemId}-${change.previousLabel}-${change.nextLabel}`}
                  class="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 py-2"
                >
                  <p class="text-sm font-medium text-[color:var(--color-text-strong)]">
                    {change.title}
                  </p>
                  <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    {change.previousLabel} → {change.nextLabel}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {props.preview.limitations.length ? (
          <div class="mt-3 rounded-xl border border-[color:var(--color-warning,#b45309)] bg-[color:var(--color-warning-soft)] px-3 py-3">
            <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Preview limits
            </p>
            <div class="mt-2 grid gap-2">
              {props.preview.limitations.map((entry) => (
                <p
                  key={entry}
                  class="text-xs text-[color:var(--color-warning,#92400e)]"
                >
                  {entry}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);

const PreviewStatCard = component$(
  (props: { label: string; summary: string }) => {
    return (
      <div class="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
        <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          {props.label}
        </p>
        <p class="mt-2 text-sm text-[color:var(--color-text-strong)]">
          {props.summary}
        </p>
      </div>
    );
  },
);

const RecentTripChangeNotice = component$(
  (props: {
    change: TripAppliedChange;
    loading: boolean;
    pendingActionId: string | null;
    class?: string;
    onRollback$: QRL<() => Promise<void>>;
    onDismiss$: QRL<() => void>;
  }) => {
    return (
      <section
        class={[
          "rounded-[var(--radius-xl)] border border-[color:var(--color-primary-150)] bg-[color:var(--color-primary-25)] px-4 py-4 shadow-[var(--shadow-sm)]",
          props.class,
        ]}
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Recent itinerary change
            </p>
            <h2 class="mt-1 text-base font-semibold text-[color:var(--color-text-strong)]">
              {props.change.summary.headline}
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.change.summary.whatChanged}
            </p>
            <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
              {props.change.summary.whyChanged}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            {props.change.rollbackDraft ? (
              <AsyncPendingButton
                class="rounded-lg bg-[color:var(--color-action)] px-3 py-2 text-xs font-semibold text-white"
                pending={props.pendingActionId === "rollback-change"}
                pendingLabel="Rolling back..."
                disabled={
                  props.loading && props.pendingActionId !== "rollback-change"
                }
                onClick$={props.onRollback$}
              >
                Roll back
              </AsyncPendingButton>
            ) : null}
            <button
              type="button"
              class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs"
              onClick$={props.onDismiss$}
            >
              Dismiss
            </button>
          </div>
        </div>

        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <PreviewStatCard
            label="Impact"
            summary={props.change.summary.impactSummary}
          />
          <PreviewStatCard
            label="Coherence"
            summary={props.change.preview.coherenceImpact.summary}
          />
        </div>
      </section>
    );
  },
);

const ActionFeedbackNotice = component$(
  (props: {
    feedback: TripActionFeedback;
    class?: string;
    onDismiss$: QRL<() => void>;
  }) => {
    return (
      <div
        class={[
          "rounded-[var(--radius-xl)] border px-4 py-3 shadow-[var(--shadow-sm)]",
          props.feedback.tone === "success"
            ? "border-[color:var(--color-success,#0f766e)] bg-[color:rgba(15,118,110,0.08)]"
            : "border-[color:var(--color-primary-150)] bg-[color:var(--color-primary-25)]",
          props.class,
        ]}
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {props.feedback.title}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {props.feedback.message}
            </p>
          </div>
          <button
            type="button"
            class="text-xs text-[color:var(--color-text-muted)]"
            onClick$={props.onDismiss$}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  },
);

const TripTimelineTransitionCard = component$(
  (props: { transition: TimelineTransition }) => {
    return (
      <div
        class={[
          "rounded-xl border px-3 py-2 text-sm",
          timelineTransitionClass(props.transition.tone),
        ]}
      >
        <p class="font-medium">{props.transition.label}</p>
        <p class="mt-1 text-xs opacity-80">{props.transition.detail}</p>
      </div>
    );
  },
);

const buildTripTimeline = (trip: TripDetails): TimelineDayGroup[] => {
  const sortedItems = trip.items.slice().sort(compareTimelineItems);
  const groups = new Map<string, TimelineDayGroup>();

  for (const [index, item] of sortedItems.entries()) {
    const next = sortedItems[index + 1] || null;
    const dayKey = resolveTimelineDayKey(item) || `unscheduled-${item.id}`;
    const dayLabel = resolveTimelineDayKey(item)
      ? formatTimelineDayLabel(dayKey)
      : "Unscheduled item";
    const shortLabel = resolveTimelineDayKey(item)
      ? formatTimelineDayShortLabel(dayKey)
      : "no assigned day";

    if (!groups.has(dayKey)) {
      const dayIssues = dedupeTimelineIssues(
        sortedItems
          .filter(
            (candidate) =>
              (resolveTimelineDayKey(candidate) ||
                `unscheduled-${candidate.id}`) === dayKey,
          )
          .flatMap((candidate) => candidate.issues),
      );

      groups.set(dayKey, {
        key: dayKey,
        label: dayLabel,
        shortLabel,
        dayNumber: resolveTimelineDayNumber(
          trip.startDate,
          resolveTimelineDayKey(item),
        ),
        issueCounts: {
          blocking: dayIssues.filter((issue) => issue.severity === "blocking")
            .length,
          warning: dayIssues.filter((issue) => issue.severity === "warning")
            .length,
        },
        items: [],
      });
    }

    groups.get(dayKey)?.items.push({
      item,
      transitionToNext: next ? buildTimelineTransition(item, next) : null,
    });
  }

  return [...groups.values()];
};

const compareTimelineItems = (left: TripItem, right: TripItem) => {
  const dayOrder = compareIsoDate(
    resolveTimelineDayKey(left),
    resolveTimelineDayKey(right),
  );
  if (dayOrder != null) return dayOrder;

  const leftStart = resolveTimelineSortTimestamp(left);
  const rightStart = resolveTimelineSortTimestamp(right);
  if (leftStart && rightStart && leftStart !== rightStart) {
    return leftStart < rightStart ? -1 : 1;
  }

  return left.position - right.position || left.id - right.id;
};

const resolveTimelineDayKey = (item: TripItem) => {
  return item.liveFlightServiceDate || item.startDate || item.endDate || null;
};

const resolveTimelineSortTimestamp = (item: TripItem) => {
  if (item.itemType === "flight") {
    return (
      item.liveFlightDepartureAt ||
      item.liveFlightArrivalAt ||
      (item.liveFlightServiceDate
        ? `${item.liveFlightServiceDate}T00:00:00.000Z`
        : null)
    );
  }

  return item.startDate ? `${item.startDate}T00:00:00.000Z` : null;
};

const resolveTimelineDayNumber = (
  tripStartDate: string | null,
  dayKey: string | null,
) => {
  const offset = differenceInDays(tripStartDate, dayKey);
  return offset == null || offset < 0 ? null : offset + 1;
};

const dedupeTimelineIssues = (issues: TripValidationIssue[]) => {
  const seen = new Set<string>();
  const next: TripValidationIssue[] = [];

  for (const issue of issues) {
    const key = [
      issue.code,
      issue.severity,
      issue.message,
      issue.itemId || "",
      (issue.relatedItemIds || []).join(","),
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    next.push(issue);
  }

  return next;
};

const buildTimelineTransition = (
  current: TripItem,
  next: TripItem,
): TimelineTransition => {
  const pairIssues = dedupeTimelineIssues(
    [...current.issues, ...next.issues].filter((issue) =>
      issueReferencesPair(issue, current.id, next.id),
    ),
  );
  const primaryIssue = pairIssues[0] || null;
  const tone: TimelineTransitionTone = primaryIssue
    ? primaryIssue.severity === "blocking"
      ? "blocking"
      : "warning"
    : "neutral";

  if (primaryIssue) {
    return {
      id: `${current.id}-${next.id}-${primaryIssue.code}`,
      label: formatTimelineIssueLabel(primaryIssue.code),
      detail: primaryIssue.message,
      tone,
    };
  }

  const currentCity =
    current.endCityName || current.startCityName || "this stop";
  const nextCity = next.startCityName || next.endCityName || "the next stop";
  const sameCity =
    normalizeTimelineCityKey(current.endCityName || current.startCityName) ===
    normalizeTimelineCityKey(next.startCityName || next.endCityName);
  const dayGap = differenceInDays(
    current.endDate || current.startDate,
    next.startDate || next.endDate,
  );

  if (dayGap != null && dayGap > 0) {
    return {
      id: `${current.id}-${next.id}-gap`,
      label: sameCity
        ? `${formatTimelineGap(dayGap)} buffer`
        : `${formatTimelineGap(dayGap)} to change cities`,
      detail: sameCity
        ? `${current.title} ends before ${next.title} begins in ${nextCity}.`
        : `${currentCity} → ${nextCity} before ${next.title}.`,
      tone,
    };
  }

  if (!sameCity) {
    return {
      id: `${current.id}-${next.id}-transfer`,
      label: "City transfer",
      detail: `${currentCity} → ${nextCity}`,
      tone,
    };
  }

  return {
    id: `${current.id}-${next.id}-handoff`,
    label: "Same-day handoff",
    detail: `${next.title} continues in ${nextCity}.`,
    tone,
  };
};

const issueReferencesPair = (
  issue: TripValidationIssue,
  currentId: number,
  nextId: number,
) => {
  return (
    (issue.itemId === currentId && issue.relatedItemIds?.includes(nextId)) ||
    (issue.itemId === nextId && issue.relatedItemIds?.includes(currentId))
  );
};

const normalizeTimelineCityKey = (value: string | null) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized || null;
};

const formatTimelineIssueLabel = (code: string) => {
  if (code === "overlapping_hotels" || code === "overlapping_cars") {
    return "Overlap detected";
  }
  if (
    code === "arrival_city_hotel_mismatch" ||
    code === "arrival_city_car_mismatch"
  ) {
    return "Arrival city mismatch";
  }
  if (code === "car_pickup_before_arrival") {
    return "Pickup starts before arrival";
  }
  if (code === "tight_same_day_car_pickup") {
    return "Tight transfer window";
  }
  if (code === "same_day_city_transition") {
    return "Missing transfer segment";
  }
  if (code === "flight_hotel_timing_conflict") {
    return "Timing conflict";
  }
  return "Timing needs review";
};

const formatTimelineGap = (days: number) => {
  return `${days}-day`;
};

const tripTimelineCardClass = (item: TripItem) => {
  if (item.issues.some((issue) => issue.severity === "blocking")) {
    return "border-[color:var(--color-error,#b91c1c)]";
  }
  if (item.issues.length) {
    return "border-[color:var(--color-warning,#b45309)]";
  }
  return "border-[color:var(--color-border)]";
};

const timelineTransitionClass = (tone: TimelineTransitionTone) => {
  if (tone === "blocking") {
    return "border-[color:var(--color-error,#b91c1c)] bg-[color:rgba(185,28,28,0.06)] text-[color:var(--color-error,#b91c1c)]";
  }
  if (tone === "warning") {
    return "border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)] text-[color:var(--color-warning,#92400e)]";
  }
  return "border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] text-[color:var(--color-text-muted)]";
};

const timelineCountBadgeClass = (tone: TimelineTransitionTone | "neutral") => {
  if (tone === "blocking") {
    return "rounded-full border border-[color:var(--color-error,#b91c1c)] bg-[color:rgba(185,28,28,0.08)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-error,#b91c1c)]";
  }
  if (tone === "warning") {
    return "rounded-full border border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-warning,#92400e)]";
  }
  return "rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]";
};

const availabilityBadgeClass = (status: TripItem["availabilityStatus"]) => {
  if (status === "unavailable") {
    return timelineCountBadgeClass("blocking");
  }
  if (status === "stale") {
    return timelineCountBadgeClass("warning");
  }
  return timelineCountBadgeClass("neutral");
};

const bundleSelectionBadgeClass = (
  selectionMode: "recommended" | "manual_override",
) => {
  if (selectionMode === "manual_override") {
    return "rounded-full border border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-warning,#92400e)]";
  }

  return "rounded-full border border-[color:var(--color-success,#0f766e)] bg-[color:rgba(15,118,110,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-success,#0f766e)]";
};

const bundleStrengthBadgeClass = (
  level: "strong" | "moderate" | "tentative",
) => {
  if (level === "strong") {
    return "rounded-full border border-[color:var(--color-success,#0f766e)] bg-[color:rgba(15,118,110,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-success,#0f766e)]";
  }

  if (level === "moderate") {
    return "rounded-full border border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-warning,#92400e)]";
  }

  return "rounded-full border border-[color:var(--color-text-muted)] bg-[color:rgba(100,116,139,0.12)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-text-muted)]";
};

const formatAvailabilityBadge = (status: TripItem["availabilityStatus"]) => {
  if (status === "unavailable") return "Unavailable";
  if (status === "stale") return "Needs recheck";
  if (status === "price_only_changed") return "Price changed";
  return "Available";
};

const formatTimelineItemType = (item: TripItem) => {
  if (item.itemType === "hotel") return "HOTEL";
  if (item.itemType === "flight") return "FLIGHT";
  return "CAR";
};

const formatTimelineContextBadge = (item: TripItem) => {
  if (item.itemType === "flight" && item.liveFlightItineraryType) {
    return item.liveFlightItineraryType === "round-trip"
      ? "Round trip fare"
      : "One-way fare";
  }
  if (item.itemType === "car" && item.liveCarLocationType) {
    return item.liveCarLocationType === "airport"
      ? "Airport pickup"
      : "City pickup";
  }
  return null;
};

const readFlightAirportRoute = (item: TripItem) => {
  if (item.itemType !== "flight" || !item.subtitle) return null;
  const normalized = item.subtitle.replace(/\s*->\s*/g, " → ").trim();
  return /\([A-Z]{3}\)/.test(normalized) && normalized.includes("→")
    ? normalized
    : null;
};

const formatTimelineRoute = (item: TripItem) => {
  const start = item.startCityName || "Unknown";
  const end = item.endCityName || item.startCityName || "Unknown";
  if (start === end) return start;
  return `${start} → ${end}`;
};

const formatTimelineRouteDisplay = (item: TripItem) => {
  return readFlightAirportRoute(item) || formatTimelineRoute(item);
};

const extractFlightStopLabel = (item: TripItem) => {
  return (
    item.meta.find((entry) => {
      const normalized = entry.trim().toLowerCase();
      return normalized === "nonstop" || normalized.includes("stop");
    }) || null
  );
};

const formatTimelineScheduleSummary = (item: TripItem) => {
  if (
    item.itemType === "flight" &&
    item.liveFlightDepartureAt &&
    item.liveFlightArrivalAt
  ) {
    const arrivalDay = item.liveFlightArrivalAt.slice(0, 10);
    const crossesDay =
      item.liveFlightServiceDate && arrivalDay !== item.liveFlightServiceDate;
    const stopLabel = extractFlightStopLabel(item);

    return [
      `${formatTimeUtcCompact(item.liveFlightDepartureAt)} → ${formatTimeUtcCompact(item.liveFlightArrivalAt)} UTC`,
      stopLabel,
      crossesDay ? `arrives ${formatDate(arrivalDay)}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  if (item.itemType === "hotel") {
    return `${formatTripDateRange(item.startDate, item.endDate)} stay`;
  }

  if (item.itemType === "car") {
    return `${formatTripDateRange(item.startDate, item.endDate)} rental`;
  }

  return formatTripDateRange(item.startDate, item.endDate);
};

const shouldShowTimelineSubtitle = (item: TripItem) => {
  if (!item.subtitle) return false;
  if (item.itemType === "flight" && readFlightAirportRoute(item)) return false;
  return item.subtitle.trim() !== formatTimelineRoute(item);
};

const formatTimelineMetaSummary = (item: TripItem) => {
  if (item.itemType === "flight") {
    const freshnessParts = [
      formatAvailabilityBadge(item.availabilityStatus),
      item.freshness?.checkedLabel || null,
      item.freshness?.relativeLabel || null,
    ].filter(Boolean);

    if (freshnessParts.length) {
      return freshnessParts.join(" · ");
    }
  }

  if (!item.meta.length) return null;

  if (item.itemType === "flight") {
    const stopLabel = extractFlightStopLabel(item);
    const filtered = item.meta.filter((entry) => entry !== stopLabel);
    return filtered.length ? filtered.join(" · ") : null;
  }

  return item.meta.join(" · ");
};

const formatTimelineTimeEyebrow = (item: TripItem) => {
  if (item.itemType === "flight") return "Departure";
  if (item.itemType === "hotel") return "Stay";
  return "Pickup";
};

const formatTimelinePrimaryTime = (item: TripItem) => {
  if (item.itemType === "flight" && item.liveFlightDepartureAt) {
    return formatTimeUtc(item.liveFlightDepartureAt);
  }
  return "Date only";
};

const formatTimelineSecondaryTime = (item: TripItem) => {
  if (item.itemType === "flight" && item.liveFlightArrivalAt) {
    const arrivalDay = item.liveFlightArrivalAt.slice(0, 10);
    const arrivalLabel = formatTimeUtc(item.liveFlightArrivalAt);
    const crossesDay =
      item.liveFlightServiceDate && arrivalDay !== item.liveFlightServiceDate;
    return crossesDay
      ? `Arrives ${arrivalLabel} on ${formatDate(arrivalDay)}`
      : `Arrives ${arrivalLabel}`;
  }
  if (item.itemType === "hotel") return "Check-in and checkout dates only";
  if (item.itemType === "car") return "Pickup and drop-off dates only";
  return null;
};

const formatTimelineSpanBadge = (item: TripItem) => {
  if (
    item.itemType === "flight" &&
    item.liveFlightDepartureAt &&
    item.liveFlightArrivalAt
  ) {
    return formatDurationBetween(
      item.liveFlightDepartureAt,
      item.liveFlightArrivalAt,
    );
  }

  const spanDays = differenceInDays(item.startDate, item.endDate);
  if (spanDays == null || spanDays <= 0) return null;

  if (item.itemType === "hotel") {
    return `${spanDays} night${spanDays === 1 ? "" : "s"}`;
  }
  if (item.itemType === "car") {
    return `${spanDays} day${spanDays === 1 ? "" : "s"}`;
  }

  return null;
};

const buildTimelineDisclosureSummary = (item: TripItem) => {
  if (item.issues.length) {
    return "Pricing, availability, conflicts, and controls";
  }
  return "Pricing, availability, and controls";
};

const formatTimelineDayLabel = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const formatTimelineDayShortLabel = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const formatTimeUtc = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date)} UTC`;
};

const formatTimeUtcCompact = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
};

const formatDurationBetween = (start: string, end: string) => {
  const from = new Date(start);
  const to = new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;

  const minutes = Math.max(
    0,
    Math.round((to.getTime() - from.getTime()) / 60000),
  );
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (!hours) return `${remainder}m travel`;
  if (!remainder) return `${hours}h travel`;
  return `${hours}h ${remainder}m travel`;
};

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
