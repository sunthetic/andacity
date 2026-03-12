import { $, component$, useSignal, type QRL } from "@builder.io/qwik";
import { AsyncPendingButton } from "~/components/async/AsyncPendingButton";
import { AsyncRetryControl } from "~/components/async/AsyncRetryControl";
import { ListSkeleton } from "~/components/async/AsyncSurfaceSkeleton";
import {
  markBookingStageProgress,
  trackBookingEvent,
} from "~/lib/analytics/booking-telemetry";
import { useOverlayBehavior } from "~/lib/ui/overlay";
import {
  addItemToTripApi,
  createTripApi,
  listTripsApi,
  TripApiError,
} from "~/lib/trips/trips-api";
import type { SavedItem } from "~/types/save-compare/saved-item";
import type { TripListItem } from "~/types/trips/trip";

export const AddToTripButton = component$((props: AddToTripButtonProps) => {
  const open = useSignal(false);
  const loading = useSignal(false);
  const saving = useSignal(false);
  const error = useSignal<string | null>(null);
  const success = useSignal<string | null>(null);
  const lastSaveAction = useSignal<"add" | "create" | null>(null);
  const trips = useSignal<TripListItem[]>([]);
  const selectedTripId = useSignal<number | null>(null);
  const newTripName = useSignal("");
  const onClose$ = $(() => {
    open.value = false;
  });
  const { overlayRef, initialFocusRef } = useOverlayBehavior({
    open,
    onClose$,
  });

  const canAdd = Boolean(props.item.tripCandidate);

  const refreshTrips$ = $(async () => {
    if (loading.value) return;
    loading.value = true;
    error.value = null;

    try {
      const nextTrips = await listTripsApi();
      trips.value = nextTrips;

      if (
        selectedTripId.value == null ||
        !nextTrips.some((trip) => trip.id === selectedTripId.value)
      ) {
        selectedTripId.value = nextTrips[0]?.id || null;
      }
    } catch (cause) {
      const message =
        cause instanceof TripApiError ? cause.message : "Failed to load trips.";
      error.value = message;
      trackBookingEvent("booking_error", {
        vertical: props.item.vertical,
        surface: props.telemetrySource || "unknown",
        action: "load_trips",
        item_id: props.item.id,
        error_message: message,
      });
    } finally {
      loading.value = false;
    }
  });

  const onOpen$ = $(async () => {
    if (!canAdd || loading.value || saving.value) return;
    trackBookingEvent("booking_add_to_trip_started", {
      vertical: props.item.vertical,
      surface: props.telemetrySource || "unknown",
      item_id: props.item.id,
      item_position: props.telemetryItemPosition ?? undefined,
    });
    open.value = true;
    await refreshTrips$();
  });

  const onAddToSelected$ = $(async () => {
    if (
      !canAdd ||
      !selectedTripId.value ||
      !props.item.tripCandidate ||
      saving.value
    )
      return;
    saving.value = true;
    error.value = null;
    success.value = null;
    lastSaveAction.value = "add";

    try {
      const trip = await addItemToTripApi(
        selectedTripId.value,
        props.item.tripCandidate,
      );
      success.value = `Added to ${trip.name}.`;
      open.value = false;
      await refreshTrips$();
      trackBookingEvent("booking_add_to_trip_completed", {
        vertical: props.item.vertical,
        surface: props.telemetrySource || "unknown",
        item_id: props.item.id,
        item_position: props.telemetryItemPosition ?? undefined,
        action: "add_existing_trip",
        trip_id: trip.id,
        outcome: "success",
      });
      if (props.telemetrySource === "detail") {
        markBookingStageProgress("detail");
      }
      if (props.onAdded$) {
        await props.onAdded$(trip.id);
      }
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to add item to trip.";
      error.value = message;
      trackBookingEvent("booking_add_to_trip_completed", {
        vertical: props.item.vertical,
        surface: props.telemetrySource || "unknown",
        item_id: props.item.id,
        item_position: props.telemetryItemPosition ?? undefined,
        action: "add_existing_trip",
        outcome: "failure",
        error_message: message,
      });
      trackBookingEvent("booking_error", {
        vertical: props.item.vertical,
        surface: props.telemetrySource || "unknown",
        action: "add_to_trip",
        item_id: props.item.id,
        error_message: message,
      });
    } finally {
      saving.value = false;
    }
  });

  const onCreateAndAdd$ = $(async () => {
    if (!canAdd || !props.item.tripCandidate || saving.value) return;
    saving.value = true;
    error.value = null;
    success.value = null;
    lastSaveAction.value = "create";

    try {
      const created = await createTripApi({
        name:
          String(newTripName.value || "").trim() ||
          `Trip for ${props.item.title}`,
      });

      const updated = await addItemToTripApi(
        created.id,
        props.item.tripCandidate,
      );
      selectedTripId.value = updated.id;
      success.value = `Created and added to ${updated.name}.`;
      newTripName.value = "";
      open.value = false;
      await refreshTrips$();
      trackBookingEvent("booking_add_to_trip_completed", {
        vertical: props.item.vertical,
        surface: props.telemetrySource || "unknown",
        item_id: props.item.id,
        item_position: props.telemetryItemPosition ?? undefined,
        action: "create_trip_and_add",
        trip_id: updated.id,
        outcome: "success",
      });
      if (props.telemetrySource === "detail") {
        markBookingStageProgress("detail");
      }
      if (props.onAdded$) {
        await props.onAdded$(updated.id);
      }
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : "Failed to create trip.";
      error.value = message;
      trackBookingEvent("booking_add_to_trip_completed", {
        vertical: props.item.vertical,
        surface: props.telemetrySource || "unknown",
        item_id: props.item.id,
        item_position: props.telemetryItemPosition ?? undefined,
        action: "create_trip_and_add",
        outcome: "failure",
        error_message: message,
      });
      trackBookingEvent("booking_error", {
        vertical: props.item.vertical,
        surface: props.telemetrySource || "unknown",
        action: "create_trip_and_add",
        item_id: props.item.id,
        error_message: message,
      });
    } finally {
      saving.value = false;
    }
  });

  return (
    <div class="inline-grid min-w-0 gap-1 align-top">
      <button
        type="button"
        onClick$={onOpen$}
        disabled={!canAdd}
        aria-haspopup="dialog"
        aria-expanded={open.value ? "true" : "false"}
        class={[
          props.class ||
            "rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-action)] hover:border-[color:var(--color-action)] disabled:cursor-not-allowed disabled:opacity-50",
        ]}
      >
        {props.label || "Add to trip"}
      </button>

      {success.value ? (
        <p
          class="min-h-4 text-[11px] leading-4 text-[color:var(--color-success,#0f766e)]"
          role="status"
          aria-live="polite"
        >
          {success.value}
        </p>
      ) : (
        <span class="min-h-4" aria-hidden="true" />
      )}

      {open.value ? (
        <div class="fixed inset-0 z-[95]">
          <button
            type="button"
            class="absolute inset-0 bg-black/35"
            aria-label="Close add-to-trip dialog"
            onClick$={onClose$}
          />

          <section
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-label="Add to trip"
            tabIndex={-1}
            class="absolute inset-x-3 top-1/2 max-h-[90vh] -translate-y-1/2 overflow-y-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-e3)] outline-none sm:inset-x-auto sm:left-1/2 sm:w-[560px] sm:-translate-x-1/2"
          >
            <header class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  Add to trip
                </h3>
                <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  {props.item.title}
                </p>
              </div>
              <button
                ref={initialFocusRef}
                type="button"
                class="rounded-lg border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-text-muted)]"
                onClick$={onClose$}
              >
                Close
              </button>
            </header>

            {loading.value && !trips.value.length ? (
              <div class="mt-4">
                <ListSkeleton count={2} />
              </div>
            ) : error.value && !trips.value.length ? (
              <div class="mt-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-4 py-4">
                <AsyncRetryControl
                  message={error.value}
                  label="Retry trips"
                  onRetry$={refreshTrips$}
                  telemetry={{
                    vertical: props.item.vertical,
                    surface: props.telemetrySource || "unknown",
                    retryType: "load_trips",
                    context: "add_to_trip_dialog",
                  }}
                />
              </div>
            ) : (
              <>
                <div class="mt-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    Existing trips
                  </p>
                  {trips.value.length ? (
                    <div class="mt-2 grid gap-2">
                      {trips.value.map((trip) => (
                        <label
                          key={trip.id}
                          class="flex items-center justify-between rounded-xl border border-[color:var(--color-border)] px-3 py-2"
                        >
                          <span class="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`trip-choice-${props.item.id}`}
                              checked={selectedTripId.value === trip.id}
                              onChange$={() => {
                                selectedTripId.value = trip.id;
                              }}
                            />
                            <span class="text-sm text-[color:var(--color-text-strong)]">
                              {trip.name}
                            </span>
                          </span>
                          <span class="text-xs text-[color:var(--color-text-muted)]">
                            {trip.itemCount} items
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                      No trips yet. Create one below to save this item.
                    </p>
                  )}

                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <AsyncPendingButton
                      class="t-btn-primary px-3 py-1.5 text-xs"
                      pending={saving.value && success.value == null}
                      pendingLabel="Adding..."
                      disabled={
                        !selectedTripId.value ||
                        (saving.value && success.value == null)
                      }
                      onClick$={onAddToSelected$}
                    >
                      Add to selected trip
                    </AsyncPendingButton>
                  </div>
                </div>

                <div class="mt-5 border-t border-[color:var(--color-divider)] pt-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    Create new trip
                  </p>
                  <div class="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      type="text"
                      value={newTripName.value}
                      onInput$={(event, target) => {
                        void event;
                        newTripName.value = target.value;
                      }}
                      placeholder="Summer planning"
                      class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm"
                    />
                    <AsyncPendingButton
                      class="t-btn-ghost px-3 py-2 text-sm"
                      pending={saving.value && success.value == null}
                      pendingLabel="Creating..."
                      disabled={saving.value && success.value == null}
                      onClick$={onCreateAndAdd$}
                    >
                      Create + add
                    </AsyncPendingButton>
                  </div>
                </div>

                {error.value ? (
                  <AsyncRetryControl
                    class="mt-3"
                    message={error.value}
                    label={
                      trips.value.length
                        ? lastSaveAction.value === "create"
                          ? "Retry create"
                          : "Retry add"
                        : "Retry trips"
                    }
                    onRetry$={
                      trips.value.length
                        ? lastSaveAction.value === "create"
                          ? onCreateAndAdd$
                          : onAddToSelected$
                        : refreshTrips$
                    }
                    telemetry={{
                      vertical: props.item.vertical,
                      surface: props.telemetrySource || "unknown",
                      retryType:
                        trips.value.length && lastSaveAction.value === "create"
                          ? "create_trip_and_add"
                          : trips.value.length
                            ? "add_to_trip"
                            : "load_trips",
                      context: "add_to_trip_dialog",
                    }}
                  />
                ) : null}
              </>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
});

type AddToTripButtonProps = {
  item: SavedItem;
  label?: string;
  class?: string;
  onAdded$?: QRL<(tripId: number) => void>;
  telemetrySource?: string;
  telemetryItemPosition?: number | null;
};
